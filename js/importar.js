/* =====================================================================
   IMPORTAR CLIENTES (tela Clientes) · planilha (.xlsx/.xls/.csv) ou outra obra
   Passo 1: escolher o arquivo → o app lê e mostra linha a linha se está ok.
   Passo 2: "Importar" grava só as linhas válidas (e vincula a unidade, se veio).
   ===================================================================== */
const COLS_IMP = { nome:["nome","cliente","nomecliente","nomedocliente"], telefone:["telefone","celular","fone","whatsapp","tel"],
  email:["email"], bloco:["bloco","quadra","torre"], unidade:["unidade","apto","apartamento","casa","und"] };
const normCab = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");

function abrirImportar(){ S.imp = { aba:"planilha", arq:null, linhas:null, erro:"", origem:null, sel:[], lendo:false }; carregarScript("js/vendor/xlsx.full.min.js").catch(() => {}); }

async function lerPlanilha(file){
  Object.assign(S.imp, { lendo:true, arq:file.name, erro:"", linhas:null }); render();
  try{
    await carregarScript("js/vendor/xlsx.full.min.js");
    const wb = XLSX.read(await file.arrayBuffer(), { type:"array" }), ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header:1, defval:"", raw:false });
    const h = rows.findIndex(r => r.some(c => COLS_IMP.nome.includes(normCab(c))));
    if(h < 0) throw new Error('Não encontrei a coluna "Nome" na primeira aba da planilha. Use o modelo.');
    const cab = rows[h].map(normCab), idx = {};
    Object.entries(COLS_IMP).forEach(([k, al]) => { idx[k] = cab.findIndex(c => al.includes(c)); });
    const linhas = rows.slice(h + 1).map((r, i) => [r, h + i + 2]).filter(([r]) => r.some(c => String(c).trim())).map(([r, lin]) => validarLinha(r, idx, lin));
    if(!linhas.length) throw new Error("A planilha não tem nenhuma linha de cliente abaixo dos títulos.");
    S.imp.linhas = linhas; marcarDuplicados();
  }catch(e){ S.imp.erro = msgErro(e); }
  S.imp.lendo = false; render();
}
function acharUnidade(bloco, und){
  const n = String(und).toUpperCase().replace(/\s+/g, " ").trim(), num = (n.match(/\d+/) || [])[0];
  const cands = unidadesObra().filter(u => { const un = u.unidade.toUpperCase(); return un === n || un === "AP " + n || un === "CASA " + n || (num && /^(AP |CASA )?\d+$/.test(n) && numUnd(u.unidade) === +num && !/^HALL/.test(un)); });
  let L = cands;
  if(bloco){ const b = String(bloco).toLowerCase().trim().replace(/^(bloco|quadra|torre)\s*/, "");
    L = cands.filter(u => nivel1Nome(u).toLowerCase().replace(/^(bloco|quadra|torre)\s*/, "") === b); }
  return L.length === 1 ? L[0] : (L.length > 1 ? "varias" : null);
}
function validarLinha(r, idx, lin){
  const g = k => idx[k] >= 0 ? String(r[idx[k]] ?? "").trim() : "";
  const o = { lin, nome:g("nome").toUpperCase().replace(/\s+/g, " "), telefone:g("telefone").replace(/\D/g, ""), email:g("email").toLowerCase(), bloco:g("bloco"), unidade:g("unidade"), erros:[], avisos:[] };
  if(!o.nome) o.erros.push("sem nome");
  if(o.telefone){ if(o.telefone.length === 10 || o.telefone.length === 11) o.telefone = "55" + o.telefone;
    if(o.telefone.length < 12 || o.telefone.length > 13) o.erros.push("telefone inválido"); }
  if(o.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(o.email)) o.erros.push("e-mail inválido");
  if(o.unidade){ const u = acharUnidade(o.bloco, o.unidade);
    if(u === "varias") o.avisos.push("unidade existe em mais de um bloco: informe o bloco");
    else if(!u) o.avisos.push("unidade não encontrada");
    else if(u.id_cliente) o.avisos.push(`${u.unidade} já tem cliente (não vincula)`);
    else o.und = u; }
  return o;
}
function marcarDuplicados(){
  const ex = clientesObra(), vistos = new Set(), usadas = new Set();
  S.imp.linhas.forEach(o => { const k = o.nome + "|" + o.telefone;
    if(ex.some(c => c.nome === o.nome && (c.telefone === o.telefone || !o.telefone || !c.telefone)) || vistos.has(k)) o.dup = true; vistos.add(k);
    if(o.und && !o.erros.length && !o.dup){ if(usadas.has(o.und.id)){ o.avisos.push("unidade repetida na planilha (não vincula)"); o.und = null; } else usadas.add(o.und.id); } });
}
function clientesDeOutraObra(){
  const o = S.imp.origem; if(!o) return [];
  const ids = new Set(DB.unidades.filter(u => u.id_obra === o && u.id_cliente).map(u => u.id_cliente));
  return DB.clientes.filter(c => c.id_obra === o || (c.id_obra == null && ids.has(c.id))).sort((a, b) => a.nome.localeCompare(b.nome));
}
const jaNaObra = c => clientesObra().some(k => k.nome === c.nome && (k.telefone === c.telefone || !c.telefone));

function popupImportar(){
  const I = S.imp; let corpo = "", foot = "";
  const tabs = `<div class="seg tabs" role="tablist"><button class="${I.aba === "planilha" ? "on" : ""}" data-act="impaba" data-v="planilha">De uma planilha</button><button class="${I.aba === "obra" ? "on" : ""}" data-act="impaba" data-v="obra">De outra obra</button></div>`;
  if(I.aba === "planilha"){
    const L = I.linhas, ok = L ? L.filter(o => !o.erros.length && !o.dup) : [], err = L ? L.filter(o => o.erros.length) : [], dup = L ? L.filter(o => o.dup && !o.erros.length) : [], vinc = ok.filter(o => o.und);
    corpo = `<div class="imp-help"><b>Padrão da planilha</b> <span class="small muted">(primeira aba; a linha de títulos pode ser a primeira)</span>
        <table class="imp-tab"><thead><tr><th>Nome *</th><th>Telefone</th><th>E-mail</th><th>Bloco</th><th>Unidade</th></tr></thead><tbody><tr><td>MARIA DA SILVA</td><td>41999998888</td><td>maria@email.com</td><td>A</td><td>101</td></tr></tbody></table>
        <span class="small muted">Só o Nome é obrigatório. Telefone com DDD (o 55 entra sozinho). Se vierem Bloco e Unidade, o cliente já fica vinculado à unidade, quando ela ainda não tem cliente. Arquivos .xlsx, .xls ou .csv.</span>
        <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="impmodelo">Baixar modelo</button><label class="btn sm primary">${IC.upload}${I.arq ? "Trocar arquivo" : "Escolher arquivo"}<input type="file" id="imp-arq" accept=".xlsx,.xls,.csv" hidden></label>${I.arq ? `<span class="small">${esc(I.arq)}</span>` : ""}</div></div>
      ${I.lendo ? `<div class="row"><span class="spin" aria-hidden="true"></span>Lendo a planilha...</div>` : ""}${I.erro ? `<div class="auth-msg bad">${esc(I.erro)}</div>` : ""}
      ${L ? `<div class="imp-res"><span class="pill s-ok">${ok.length} pronto(s)</span>${vinc.length ? `<span class="pill s-info">${vinc.length} já com unidade</span>` : ""}${dup.length ? `<span class="pill s-neutral">${dup.length} já cadastrado(s)</span>` : ""}${err.length ? `<span class="pill s-bad">${err.length} com erro</span>` : ""}</div>
        <div class="imp-scroll"><table class="imp-tab"><thead><tr><th>Linha</th><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Unidade</th><th>Situação</th></tr></thead><tbody>
        ${L.map(o => `<tr class="${o.erros.length ? "err" : o.dup ? "dup" : ""}"><td>${o.lin}</td><td>${esc(o.nome)}</td><td class="tnum">${esc(fmtTel(o.telefone))}</td><td>${esc(o.email)}</td><td>${o.und ? esc(nivel1Nome(o.und) + " · " + o.und.unidade) : esc([o.bloco, o.unidade].filter(Boolean).join(" "))}</td>
          <td>${o.erros.length ? esc("Erro: " + o.erros.join(", ")) : o.dup ? "Já cadastrado (ignora)" : esc(["Ok", ...o.avisos].join(" · "))}</td></tr>`).join("")}</tbody></table></div>` : ""}`;
    foot = L && ok.length ? `<span class="small muted">As linhas com erro e as já cadastradas ficam de fora.</span><span class="spacer"></span><button class="btn primary" data-act="impok">Importar ${ok.length} cliente(s)</button>` : "";
  } else {
    const obras = obrasDoUsuario(ME()).filter(o => o.id !== S.obraId).sort((a, b) => a.ordem - b.ordem), L = clientesDeOutraObra(), novos = L.filter(c => !jaNaObra(c));
    corpo = `<div class="field"><label for="imp-obra">Copiar clientes da obra</label><select class="inp" id="imp-obra"><option value="">Escolha a obra</option>${obras.map(o => `<option value="${o.id}" ${o.id === I.origem ? "selected" : ""}>${esc(o.nome)}</option>`).join("")}</select></div>
      <span class="small muted">O cliente é copiado para esta obra (vira um cadastro independente). Os vínculos com unidades não vêm junto.</span>
      ${I.origem ? (L.length ? `<div class="row"><b>${L.length} cliente(s)</b><span class="spacer"></span><button class="linkbtn" data-act="impselall">${I.sel.length === novos.length ? "Desmarcar todos" : "Marcar todos"}</button></div>
        <div class="imp-scroll">${L.map(c => { const ja = jaNaObra(c); return `<button class="fck-row imp-cli" ${ja ? "disabled" : ""} data-act="impsel" data-id="${c.id}"><span class="fck ${I.sel.includes(c.id) ? "on" : ""}">${IC.check}</span><span><b>${esc(tituloCase(c.nome))}</b> <span class="small muted">${esc(fmtTel(c.telefone))}${ja ? " · já está nesta obra" : ""}</span></span></button>`; }).join("")}</div>`
        : `<div class="empty" style="padding:20px"><b>Essa obra não tem clientes</b></div>`) : ""}`;
    foot = I.sel.length ? `<span class="spacer"></span><button class="btn primary" data-act="impok">Copiar ${I.sel.length} cliente(s)</button>` : "";
  }
  return `<div class="modal" role="dialog" aria-modal="true" aria-label="Importar clientes"><div class="scrim" data-act="impfechar"></div><div class="box tall">
    <div class="mhead"><div class="t"><b class="conf-t">Importar clientes</b><div class="small muted">Para a obra ${esc(OBRA().nome)}</div></div><button class="iconbtn" data-act="impfechar" aria-label="Fechar">${IC.close}</button></div>
    <div class="mbody">${tabs}${corpo}</div>${foot ? `<div class="mfoot">${foot}</div>` : ""}</div></div>`;
}

function importarClientes(){
  const I = S.imp; let n = 0, v = 0;
  if(I.aba === "planilha"){
    I.linhas.filter(o => !o.erros.length && !o.dup).forEach(o => {
      const c = { id:nextId("clientes"), id_obra:S.obraId, nome:o.nome, telefone:o.telefone, email:o.email }; DB.clientes.push(c); n++;
      if(o.und && !o.und.id_cliente){ o.und.id_cliente = c.id; v++; } });
  } else {
    clientesDeOutraObra().filter(c => I.sel.includes(c.id) && !jaNaObra(c)).forEach(c => {
      DB.clientes.push({ id:nextId("clientes"), id_obra:S.obraId, nome:c.nome, telefone:c.telefone, email:c.email }); n++; });
  }
  saveDB(); S.imp = null;
  toast("Sucesso", `${n} cliente(s) importado(s)`, v ? `${v} já vinculado(s) às unidades` : "");
}

async function baixarModeloClientes(){
  try{
    await carregarScript("js/vendor/xlsx.full.min.js");
    const ws = XLSX.utils.aoa_to_sheet([["Nome","Telefone","E-mail","Bloco","Unidade"],["MARIA DA SILVA","41999998888","maria@email.com","A","101"],["JOÃO PEREIRA","41988887777","","B","204"]]);
    ws["!cols"] = [{ wch:32 },{ wch:16 },{ wch:28 },{ wch:8 },{ wch:10 }];
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Clientes");
    XLSX.writeFile(wb, "modelo-clientes-gestor-entrega.xlsx");
  }catch(e){ toast("Erro", "Não foi possível gerar o modelo", msgErro(e)); }
}
