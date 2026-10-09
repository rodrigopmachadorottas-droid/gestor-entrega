#!/usr/bin/env python3
"""
Converte as listas do SharePoint (exportadas em "CSV com esquema") para SQL do Supabase.

Uso:  python3 converter_sharepoint.py <pasta_com_os_csv> [pasta_saida]

Arquivos esperados na pasta (o nome só precisa TERMINAR assim):
  ge_obras.csv, ge_usuarios.csv, ge_clientes.csv, ge_obras_locais.csv, ge_obras_horarios.csv,
  ge_unidades.csv, ge_tarefas.csv, ge_areas_comuns.csv, ge_tarefas_ac.csv
  opcional: ge_bases_json.csv  (histórico antigo das tarefas, coluna "dados")

Gera 02_dados_1_cadastros.sql, 02_dados_2_tarefas_*.sql e 02_dados_3_final.sql.
Rode no SQL Editor do Supabase nessa ordem. Os arquivos têm dados de clientes:
NÃO coloque no GitHub.
"""
import csv, glob, io, json, os, re, sys
from datetime import datetime, timezone

PASTA = sys.argv[1] if len(sys.argv) > 1 else "."
SAIDA = sys.argv[2] if len(sys.argv) > 2 else "."
TODOS_TESTES = ["esgoto", "aguafria", "dreno", "gas", "eletrico"]
FUNCOES_OK = {"admin", "obra", "instalacoes", "qualidade", "rc", "financeiro", "arquitetura"}
MAPA_FUNCAO = {"excelencia": "qualidade", "supervisor": None}   # supervisor deixou de existir
# regras que no Power Apps eram fixas por ID de obra
APROVAR_DIRETO = {1}
VISTORIA_PREVIA = {8}


def ler(nome, obrigatorio=True):
    achados = [f for f in glob.glob(os.path.join(PASTA, "*.csv")) if os.path.basename(f).lower().endswith(nome + ".csv")]
    if not achados:
        if obrigatorio:
            sys.exit(f"Arquivo {nome}.csv não encontrado em {PASTA}")
        return []
    txt = open(achados[0], encoding="utf-8-sig").read()
    if txt.startswith("ListSchema="):          # 1ª linha do "CSV com esquema"
        txt = txt.split("\n", 1)[1]
    return list(csv.DictReader(io.StringIO(txt)))


def num(v):
    """'1.056' (pt-BR) -> 1056 ; '' -> None"""
    v = (v or "").strip()
    if not v:
        return None
    v = v.replace(".", "").replace(",", ".")
    f = float(v)
    return int(f) if f.is_integer() else f


def bool_(v):
    return (v or "").strip().lower() in ("verdadeiro", "true", "sim", "yes", "1")


def data(v):
    v = (v or "").strip()
    if not v:
        return None
    for fmt in ("%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%S%z", "%d/%m/%Y %H:%M", "%d/%m/%Y %H:%M:%S"):
        try:
            d = datetime.strptime(v, fmt)
            if d.tzinfo is None:
                d = d.replace(tzinfo=timezone.utc)
            return d.isoformat()
        except ValueError:
            pass
    raise ValueError(f"data não reconhecida: {v}")


def q(v):
    """valor -> literal SQL"""
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, (list, dict)):
        v = json.dumps(v, ensure_ascii=False)
    return "'" + str(v).replace("'", "''") + "'"


def arr(lst):
    return "array[" + ",".join(q(x) for x in lst) + "]::text[]" if lst else "'{}'::text[]"


def lista(v):
    return [x.strip() for x in (v or "").split(",") if x.strip()]


def inserts(tabela, colunas, linhas, lote=200, fim=""):
    out = []
    for i in range(0, len(linhas), lote):
        vals = ",\n".join("(" + ",".join(q(r[c]) for c in colunas) + ")" for r in linhas[i:i + lote])
        out.append(f"insert into public.{tabela} ({','.join(colunas)}) values\n{vals}{fim};")
    return "\n".join(out)


# ------------------------------------------------------------------ leitura
obras_sp = ler("ge_obras")
usuarios_sp = ler("ge_usuarios")
clientes_sp = ler("ge_clientes")
locais_sp = ler("ge_obras_locais")
horarios_sp = ler("ge_obras_horarios")
unidades_sp = ler("ge_unidades")
tarefas_sp = ler("ge_tarefas")
areas_sp = ler("ge_areas_comuns")
tarefas_ac_sp = ler("ge_tarefas_ac")
bases_sp = ler("ge_bases_json", obrigatorio=False)
avisos = []

# ------------------------------------------------------------------ obras + config
unidades = [{
    "id": num(r["ID"]), "id_obra": num(r["id_obra"]), "nivel_1": num(r["nivel_1"]), "nivel_2": num(r["nivel_2"]),
    "unidade": (r["unidade"] or "").strip(), "modulo": (r.get("modulo") or "").strip(), "id_cliente": num(r["id_cliente"]),
    "sub_etapa": num(r["sub_etapa"]) or 1,
    **{c: (r.get(c) or "").strip() for c in ["rep_teste_esgoto", "rep_teste_aguafria", "rep_teste_dreno", "rep_teste_eletrico", "rep_teste_gas",
                                             "rep_vistoria_at", "rep_vistoria_previa", "rep_vistoria_cliente", "agendamento",
                                             "financeiro_status", "financeiro_motivo", "prioridade"]},
} for r in unidades_sp]
for u in unidades:
    if isinstance(u["modulo"], str) and re.fullmatch(r"\d+(\.0)?", u["modulo"]):
        u["modulo"] = u["modulo"].split(".")[0]

locais = [{"id": num(r["ID"]), "id_obra": num(r["id_obra"]), "nivel1": (r["nivel1"] or "").strip(),
           "niveis2": ", ".join(lista(r["niveis2"]))} for r in locais_sp]

obras, acessos = [], []
for r in obras_sp:
    oid = num(r["ID"])
    us = [u for u in unidades if u["id_obra"] == oid]
    usados = [t for t in TODOS_TESTES if any(u["rep_teste_" + t] for u in us)]
    testes = usados if usados else TODOS_TESTES[:]          # obra sem dados ainda: todos os testes
    casa = any(l["nivel1"].lower().startswith("quadra") for l in locais if l["id_obra"] == oid)
    cfg = {"tipo": "casa" if casa else "predio", "testes": testes, **({"casasPorLinha": 8} if casa else {}),
           "previa": oid in VISTORIA_PREVIA, "aprovarDireto": oid in APROVAR_DIRETO}
    obras.append({"id": oid, "ordem": num(r["ordem"]) or 0, "nome": r["nome"].strip(), "cidade": (r["cidade"] or "").strip(),
                  "ativa": bool_(r["ativa"]), "config": cfg})
    for login in dict.fromkeys(x.lower() for x in lista(r["usuarios"])):
        acessos.append({"obra_id": oid, "login": login})
    avisos.append(f"Obra {oid} {r['nome'].strip()}: testes {', '.join(testes)}"
                  + (" · casas" if casa else "") + (" · vistoria prévia" if cfg["previa"] else "")
                  + (" · aprovar direto" if cfg["aprovarDireto"] else ""))

# obras de casas: só quadra, sem "pavimentos/fileiras" (a Visão Unidades usa casas por linha)
obras_casa = {o["id"] for o in obras if o["config"]["tipo"] == "casa"}
for u in unidades:
    if u["id_obra"] in obras_casa:
        u["nivel_2"] = None
for l in locais:
    if l["id_obra"] in obras_casa:
        l["niveis2"] = ""

# ------------------------------------------------------------------ usuários antigos (sugestão de funções)
funcoes_antigas = []
for r in usuarios_sp:
    email = (r["usuario"] or "").strip().lower()
    if not email:
        continue
    login = email.split("@")[0] if email.endswith("@rottasconstrutora.com.br") else email
    fs = []
    for f in lista(r["permissoes"]):
        f = MAPA_FUNCAO.get(f.lower(), f.lower())
        if f in FUNCOES_OK and f not in fs:
            fs.append(f)
    funcoes_antigas.append({"login": login, "funcoes": fs})

# ------------------------------------------------------------------ clientes, horários
clientes = [{"id": num(r["ID"]), "nome": (r["nome"] or "").strip(), "email": (r["email"] or "").strip().lower(),
             "telefone": re.sub(r"\D", "", r["telefone"] or ""),
             "criado_por": ((r.get("Criado por") or "").split("@")[0] or None)} for r in clientes_sp]


def hor_json(v):
    try:
        L = json.loads(v or "[]")
    except json.JSONDecodeError:
        return "[]"
    return json.dumps([{"ID": int(x.get("ID", i + 1)), "Horas": str(x.get("Horas", "")), "Pessoas": int(x.get("Pessoas", 1))}
                       for i, x in enumerate(L)], ensure_ascii=False)


horarios, vistos = [], set()
for r in horarios_sp:
    oid = num(r["id_obra"])
    if oid in vistos:
        avisos.append(f"Horários duplicados para a obra {oid}: mantido o primeiro")
        continue
    vistos.add(oid)
    horarios.append({"id": num(r["ID"]), "id_obra": oid, **{d: hor_json(r.get(d)) for d in ["segunda", "terca", "quarta", "quinta", "sexta", "sabado"]}})

areas = [{"id": num(r["ID"]), "id_obra": num(r["id_obra"]), "descricao": (r["descricao"] or "").strip(),
          "sub_etapa": num(r["sub_etapa"]) or 1,
          **{c: (r.get(c) or "").strip() for c in ["rep_vistoria_qualidade", "rep_vistoria_arq", "agendamento", "rep_vistoria_sindico"]}}
         for r in areas_sp]


# ------------------------------------------------------------------ tarefas (histórico JSON + lista viva)
def tarefa(r, ac=False):
    g = lambda k: r.get(k, r.get(k.capitalize(), ""))
    t = {"id": num(str(g("ID") or g("id"))), "id_obra": num(str(g("id_obra"))),
         "acao": str(g("acao") or "").strip(), "etapa_antiga": num(str(g("etapa_antiga") or "")), "etapa_nova": num(str(g("etapa_nova") or "")),
         "obs": str(g("obs") or "").strip(), "repeticao": num(str(g("repeticao") or "")), "coluna": str(g("coluna") or "").strip(),
         "autor": str(g("autor") or "").strip().lower(), "data": data(str(g("data") or "")), "agendamento": str(g("agendamento") or "").strip()}
    if ac:
        t["id_local"] = num(str(g("id_local")))
    else:
        t["id_unidade"] = num(str(g("id_unidade")))
    return t


tarefas = {}
for r in bases_sp:                       # arquivo histórico (ge_bases_json, coluna "dados")
    try:
        itens = json.loads(r.get("dados") or "[]")
    except json.JSONDecodeError:
        avisos.append("ge_bases_json: coluna 'dados' não é um JSON válido; histórico antigo ignorado")
        continue
    for it in itens:
        try:
            t = tarefa({k: ("" if v is None else str(int(v)) if isinstance(v, float) and v.is_integer() else str(v))
                        for k, v in it.items()})
            if t["id"] is not None and t["data"]:
                tarefas[t["id"]] = t
        except Exception as e:  # noqa
            avisos.append(f"ge_bases_json: item ignorado ({e})")
n_hist = len(tarefas)
for r in tarefas_sp:                     # lista viva sempre vence
    t = tarefa(r)
    tarefas[t["id"]] = t
ids_obra = {o["id"] for o in obras}
tarefas = [t for t in sorted(tarefas.values(), key=lambda t: t["id"]) if t["id_obra"] in ids_obra and t["data"]]
tarefas_ac = [tarefa(r, ac=True) for r in tarefas_ac_sp]
tarefas_ac = [t for t in tarefas_ac if t["id_obra"] in ids_obra and t["data"]]

# ------------------------------------------------------------------ checagens de integridade
ids_loc = {l["id"] for l in locais}
ids_cli = {c["id"] for c in clientes}
for u in unidades:
    if u["nivel_1"] not in ids_loc:
        avisos.append(f"Unidade {u['id']} ({u['unidade']}) aponta para local {u['nivel_1']} inexistente: local removido da unidade")
        u["nivel_1"] = None
    if u["id_cliente"] is not None and u["id_cliente"] not in ids_cli:
        avisos.append(f"Unidade {u['id']} aponta para cliente {u['id_cliente']} inexistente: vínculo removido")
        u["id_cliente"] = None

# clientes por obra (v2.1.5): fica na obra da unidade; em mais de uma obra ganha uma cópia por obra extra
prox = max([c["id"] for c in clientes] + [0]) + 1
por_id = {c["id"]: c for c in clientes}
for c in clientes:
    c["id_obra"] = None
for u in sorted(unidades, key=lambda u: (u["id_obra"], u["id"])):
    c = por_id.get(u["id_cliente"])
    if c is None:
        continue
    if c["id_obra"] is None:
        c["id_obra"] = u["id_obra"]
    elif c["id_obra"] != u["id_obra"]:
        copia = next((x for x in clientes if x.get("copia_de") == c["id"] and x["id_obra"] == u["id_obra"]), None)
        if copia is None:
            copia = {**c, "id": prox, "id_obra": u["id_obra"], "copia_de": c["id"]}
            prox += 1
            clientes.append(copia)
            avisos.append(f"Cliente {c['id']} ({c['nome']}) está em mais de uma obra: cópia {copia['id']} criada")
        u["id_cliente"] = copia["id"]

# ------------------------------------------------------------------ escrita
os.makedirs(SAIDA, exist_ok=True)
CAB = "-- Gerado por converter_sharepoint.py em " + datetime.now().strftime("%d/%m/%Y %H:%M") + "\n-- CONTÉM DADOS PESSOAIS DE CLIENTES. Não publique este arquivo.\n"

ids_obras = ",".join(str(o["id"]) for o in obras)
p1 = [CAB, "-- PARTE 1/3 · apaga os dados do app e grava os da planilha.",
      "-- Mantém: logins, funções, acesso às obras, foto e configurações das obras que já existem.",
      "-- Obras que não estão na planilha são APAGADAS (com tudo o que é delas).", "begin;",
      # só as tabelas que existem (laudos e exceções só existem depois dos scripts 06 e 07)
      "do $$ declare lst text; begin",
      "  select string_agg('public.' || x, ', ') into lst from unnest(array['laudos','tarefas','tarefas_ac','unidades','areas',",
      "         'horarios_excecoes','horarios','locais','clientes']) x where to_regclass('public.' || x) is not null;",
      "  execute 'truncate ' || lst || ' restart identity cascade';",
      "end $$;",
      f"delete from public.obras where id not in ({ids_obras});",
      inserts("obras", ["id", "ordem", "nome", "cidade", "ativa", "config"], obras, fim="\non conflict (id) do nothing"),
      inserts("obra_acessos", ["obra_id", "login"], acessos, fim="\non conflict do nothing") if acessos else "",
      ("insert into public.funcoes_antigas (login, funcoes) values\n" + ",\n".join(f"({q(f['login'])},{arr(f['funcoes'])})" for f in funcoes_antigas)
       + "\non conflict (login) do nothing;") if funcoes_antigas else "",
      inserts("clientes", ["id", "nome", "email", "telefone", "criado_por"], clientes),
      inserts("locais", ["id", "id_obra", "nivel1", "niveis2"], locais),
      inserts("horarios", ["id", "id_obra", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"], horarios),
      inserts("unidades", ["id", "id_obra", "nivel_1", "nivel_2", "unidade", "modulo", "id_cliente", "sub_etapa",
                           "rep_teste_esgoto", "rep_teste_aguafria", "rep_teste_dreno", "rep_teste_eletrico", "rep_teste_gas",
                           "rep_vistoria_at", "rep_vistoria_previa", "rep_vistoria_cliente", "agendamento",
                           "financeiro_status", "financeiro_motivo", "prioridade"], unidades),
      inserts("areas", ["id", "id_obra", "descricao", "sub_etapa", "rep_vistoria_qualidade", "rep_vistoria_arq", "agendamento", "rep_vistoria_sindico"], areas),
      inserts("tarefas_ac", ["id", "id_obra", "id_local", "acao", "etapa_antiga", "etapa_nova", "obs", "repeticao", "coluna", "autor", "data", "agendamento"], tarefas_ac),
      # obra de cada cliente: só se a coluna já existe (script 07); senão o próprio 07 preenche depois
      ("do $$ begin\n  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clientes' and column_name = 'id_obra') then\n"
       "    execute 'update public.clientes c set id_obra = v.o from (values "
       + ",".join(f"({c['id']},{c['id_obra']})" for c in clientes if c["id_obra"] is not None)
       + ") v(id, o) where v.id = c.id';\n  end if;\nend $$;") if any(c["id_obra"] is not None for c in clientes) else "",
      "commit;"]
arquivos = {"02_dados_1_cadastros.sql": "\n".join(x for x in p1 if x)}

COLS_T = ["id", "id_obra", "id_unidade", "acao", "etapa_antiga", "etapa_nova", "obs", "repeticao", "coluna", "autor", "data", "agendamento"]
POR_ARQ = 2500
partes = [tarefas[i:i + POR_ARQ] for i in range(0, len(tarefas), POR_ARQ)] or [[]]
for i, parte in enumerate(partes, 1):
    arquivos[f"02_dados_2_tarefas_{i}.sql"] = "\n".join([CAB, f"-- PARTE 2/3 · tarefas (arquivo {i} de {len(partes)})", "begin;",
                                                         inserts("tarefas", COLS_T, parte) if parte else "", "commit;"])

seqs = ("do $$ declare t text; begin\n  foreach t in array array['obras','clientes','locais','horarios','unidades','areas','tarefas','tarefas_ac','laudos','horarios_excecoes'] loop\n"
        "    if to_regclass('public.' || t) is not null then\n"
        "      execute format('select setval(pg_get_serial_sequence(%L, ''id''), greatest((select max(id) from public.%I), 1))', 'public.' || t, t);\n"
        "    end if;\n  end loop;\nend $$;")
conf = """select 'obras' tabela, count(*) from public.obras union all select 'clientes', count(*) from public.clientes
union all select 'locais', count(*) from public.locais union all select 'horarios', count(*) from public.horarios
union all select 'unidades', count(*) from public.unidades union all select 'areas', count(*) from public.areas
union all select 'tarefas', count(*) from public.tarefas union all select 'tarefas_ac', count(*) from public.tarefas_ac
union all select 'obra_acessos', count(*) from public.obra_acessos union all select 'funcoes_antigas', count(*) from public.funcoes_antigas;"""
arquivos["02_dados_3_final.sql"] = "\n".join([CAB, "-- PARTE 3/3 · acerta os contadores de ID e mostra a conferência", seqs, conf])

for nome, txt in arquivos.items():
    with open(os.path.join(SAIDA, nome), "w", encoding="utf-8") as f:
        f.write(txt + "\n")

resumo = {"obras": len(obras), "acessos": len(acessos), "funcoes_antigas": len(funcoes_antigas), "clientes": len(clientes),
          "locais": len(locais), "horarios": len(horarios), "unidades": len(unidades), "areas": len(areas),
          "tarefas": len(tarefas), "tarefas_do_historico_json": n_hist, "tarefas_ac": len(tarefas_ac)}
print("Conferência (compare com a parte 3 no Supabase):")
for k, v in resumo.items():
    print(f"  {k:28s} {v}")
print("\nAvisos:")
for a in avisos:
    print("  - " + a)
if not bases_sp:
    print("  - ge_bases_json.csv não encontrado: só as tarefas da lista ge_tarefas foram convertidas")
