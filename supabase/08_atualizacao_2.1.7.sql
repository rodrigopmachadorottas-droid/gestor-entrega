-- =====================================================================
-- GESTOR DE ENTREGA · 08_atualizacao_2.1.7.sql
-- Rode UMA vez no SQL Editor (pode repetir), depois da 07.
--  1) Configuração global (popups de ação): tabela config_global, só o
--     admin grava; todo usuário aprovado lê.
--  2) Tarefas guardam as respostas dos campos extras (coluna "campos").
--  3) Análise financeira: unidade com cliente fica "Pendente" (nunca em
--     branco) e a função salvar_financeiro grava status/motivo com
--     histórico (admin ou função Financeiro).
-- =====================================================================

-- 1) CONFIGURAÇÃO GLOBAL -------------------------------------------------
create table if not exists public.config_global (
  chave          text primary key,
  valor          jsonb not null default '{}'::jsonb,
  atualizado_em  timestamptz not null default now(),
  atualizado_por text
);
alter table public.config_global enable row level security;
revoke all on public.config_global from anon;
grant select, insert, update on public.config_global to authenticated;
drop policy if exists "config ler"    on public.config_global;
drop policy if exists "config criar"  on public.config_global;
drop policy if exists "config mudar"  on public.config_global;
create policy "config ler"   on public.config_global for select to authenticated using (public.eu_aprovado());
create policy "config criar" on public.config_global for insert to authenticated with check (public.sou_admin());
create policy "config mudar" on public.config_global for update to authenticated using (public.sou_admin()) with check (public.sou_admin());

-- 2) CAMPOS EXTRAS NAS TAREFAS -------------------------------------------
alter table public.tarefas add column if not exists campos jsonb;   -- [{r: título, v: resposta}]
create or replace view public.tarefas_lista with (security_invoker = true) as
  select id, id_obra, id_unidade, acao, etapa_antiga, etapa_nova, obs, repeticao, coluna, autor, data, agendamento,
         anexos, checklist, (assinatura is not null) as tem_assinatura, campos
  from public.tarefas;
grant select on public.tarefas_lista to authenticated;

create or replace function public.registrar_acao(
  p_tipo text,        -- 'unidade' | 'area'
  p_id bigint,        -- id da unidade ou da área
  p_acao text,
  p_coluna text,
  p_antes jsonb,      -- valores que a tela viu antes (para detectar conflito)
  p_depois jsonb,     -- novos valores de status/etapa
  p_tarefa jsonb      -- {id, etapa_antiga, etapa_nova, obs, repeticao, agendamento, anexos, checklist, assinatura, campos}
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_login text := meu_login();
  v_atual jsonb;
  v_obra  bigint;
  k text;
  v_permitidas text[];
  v_novo jsonb;
  v_tar jsonb;
  v_laudo jsonb;
  v_quando timestamptz;
begin
  if v_login is null then raise exception 'sem_acesso: usuário não aprovado'; end if;
  if not pode_acao(p_tipo, p_acao, coalesce(p_coluna,'')) then
    raise exception 'sem_permissao: você não tem a função necessária para esta ação';
  end if;

  if p_tipo = 'unidade' then
    select to_jsonb(u), u.id_obra into v_atual, v_obra from unidades u where u.id = p_id for update;
    v_permitidas := array['sub_etapa','rep_teste_esgoto','rep_teste_aguafria','rep_teste_dreno','rep_teste_eletrico','rep_teste_gas',
                          'rep_vistoria_at','rep_vistoria_previa','rep_vistoria_cliente','agendamento'];
  elsif p_tipo = 'area' then
    select to_jsonb(a), a.id_obra into v_atual, v_obra from areas a where a.id = p_id for update;
    v_permitidas := array['sub_etapa','rep_vistoria_qualidade','rep_vistoria_arq','agendamento','rep_vistoria_sindico'];
  else
    raise exception 'tipo inválido';
  end if;
  if v_atual is null then raise exception 'nao_encontrado: registro não existe mais'; end if;

  -- agendamento com o cliente: pelo menos 24 h de antecedência (admin pode registrar fora disso)
  if p_tipo = 'unidade' and coalesce(p_coluna,'') = 'agendamento' and p_acao = 'agendar' and not sou_admin() then
    begin
      v_quando := (to_timestamp(p_depois->>'agendamento', 'DD/MM/YYYY HH24:MI')::timestamp) at time zone 'America/Sao_Paulo';
    exception when others then raise exception 'data do agendamento inválida';
    end;
    if v_quando < now() + interval '24 hours' then
      raise exception 'antecedencia: o agendamento precisa ter pelo menos 24 horas de antecedência';
    end if;
  end if;
  if not acesso_obra(v_obra) then raise exception 'sem_acesso: você não tem acesso a esta obra'; end if;

  -- conflito: alguém mudou depois que a tela carregou
  for k in select jsonb_object_keys(coalesce(p_antes,'{}')) loop
    if coalesce(v_atual->>k,'') is distinct from coalesce(p_antes->>k,'') then
      raise exception 'conflito: % mudou de "%" para "%"', k, p_antes->>k, v_atual->>k;
    end if;
  end loop;
  for k in select jsonb_object_keys(coalesce(p_depois,'{}')) loop
    if not k = any(v_permitidas) then raise exception 'campo não permitido: %', k; end if;
  end loop;

  if p_tipo = 'unidade' then
    update unidades u set
      sub_etapa            = coalesce((p_depois->>'sub_etapa')::int, u.sub_etapa),
      rep_teste_esgoto     = coalesce(p_depois->>'rep_teste_esgoto',     u.rep_teste_esgoto),
      rep_teste_aguafria   = coalesce(p_depois->>'rep_teste_aguafria',   u.rep_teste_aguafria),
      rep_teste_dreno      = coalesce(p_depois->>'rep_teste_dreno',      u.rep_teste_dreno),
      rep_teste_eletrico   = coalesce(p_depois->>'rep_teste_eletrico',   u.rep_teste_eletrico),
      rep_teste_gas        = coalesce(p_depois->>'rep_teste_gas',        u.rep_teste_gas),
      rep_vistoria_at      = coalesce(p_depois->>'rep_vistoria_at',      u.rep_vistoria_at),
      rep_vistoria_previa  = coalesce(p_depois->>'rep_vistoria_previa',  u.rep_vistoria_previa),
      rep_vistoria_cliente = coalesce(p_depois->>'rep_vistoria_cliente', u.rep_vistoria_cliente),
      agendamento          = coalesce(p_depois->>'agendamento',          u.agendamento),
      atualizado_em        = now()
    where u.id = p_id returning to_jsonb(u) into v_novo;

    insert into tarefas(id,id_obra,id_unidade,acao,etapa_antiga,etapa_nova,obs,repeticao,coluna,autor,data,agendamento,anexos,checklist,assinatura,campos)
    values (coalesce((p_tarefa->>'id')::bigint, nextval(pg_get_serial_sequence('public.tarefas','id'))),
            v_obra, p_id, case when p_acao = 'aprovarDireto' then 'finalizar' else p_acao end,
            (p_tarefa->>'etapa_antiga')::int, (p_tarefa->>'etapa_nova')::int,
            coalesce(p_tarefa->>'obs',''), (p_tarefa->>'repeticao')::int, coalesce(p_coluna,''),
            v_login, now(), coalesce(p_tarefa->>'agendamento',''),
            p_tarefa->'anexos', p_tarefa->'checklist', p_tarefa->>'assinatura',
            case when jsonb_typeof(p_tarefa->'campos') = 'array' then p_tarefa->'campos' end)
    returning to_jsonb(tarefas.*) into v_tar;

    -- cliente veio com engenheiro: fica um laudo pendente de envio
    if p_coluna = 'rep_vistoria_cliente' and p_acao in ('aprovar','reprovar') and p_tarefa ? 'laudo' and jsonb_typeof(p_tarefa->'laudo') = 'object' then
      insert into laudos(id_obra, id_unidade, id_tarefa, engenheiro, criado_por)
      values (v_obra, p_id, (v_tar->>'id')::bigint, left(coalesce(p_tarefa->'laudo'->>'engenheiro',''),120), v_login)
      returning to_jsonb(laudos.*) into v_laudo;
    end if;
  else
    update areas a set
      sub_etapa              = coalesce((p_depois->>'sub_etapa')::int, a.sub_etapa),
      rep_vistoria_qualidade = coalesce(p_depois->>'rep_vistoria_qualidade', a.rep_vistoria_qualidade),
      rep_vistoria_arq       = coalesce(p_depois->>'rep_vistoria_arq',       a.rep_vistoria_arq),
      agendamento            = coalesce(p_depois->>'agendamento',            a.agendamento),
      rep_vistoria_sindico   = coalesce(p_depois->>'rep_vistoria_sindico',   a.rep_vistoria_sindico),
      atualizado_em          = now()
    where a.id = p_id returning to_jsonb(a) into v_novo;

    insert into tarefas_ac(id,id_obra,id_local,acao,etapa_antiga,etapa_nova,obs,repeticao,coluna,autor,data,agendamento,anexos)
    values (coalesce((p_tarefa->>'id')::bigint, nextval(pg_get_serial_sequence('public.tarefas_ac','id'))),
            v_obra, p_id, p_acao, (p_tarefa->>'etapa_antiga')::int, (p_tarefa->>'etapa_nova')::int,
            coalesce(p_tarefa->>'obs',''), (p_tarefa->>'repeticao')::int, coalesce(p_coluna,''),
            v_login, now(), coalesce(p_tarefa->>'agendamento',''), p_tarefa->'anexos')
    returning to_jsonb(tarefas_ac.*) into v_tar;
  end if;

  return jsonb_build_object('linha', v_novo, 'tarefa', v_tar, 'laudo', v_laudo);
end $$;

-- 3) ANÁLISE FINANCEIRA ----------------------------------------------------
-- unidade com cliente nunca fica com o financeiro em branco
create or replace function public.fin_padrao() returns trigger
language plpgsql as $$
begin
  if new.id_cliente is not null and coalesce(new.financeiro_status,'') = '' then
    new.financeiro_status := 'Pendente';
  end if;
  return new;
end $$;
drop trigger if exists unidades_fin_padrao on public.unidades;
create trigger unidades_fin_padrao before insert or update of id_cliente, financeiro_status on public.unidades
  for each row execute function public.fin_padrao();
update public.unidades set financeiro_status = 'Pendente' where id_cliente is not null and coalesce(financeiro_status,'') = '';
-- mesmo motivo escrito de outro jeito no SharePoint
update public.unidades set financeiro_motivo = 'Pendente assinatura do termo' where financeiro_motivo = 'Pendente assinatura termo';

-- grava o status/motivo de várias unidades de uma vez e registra no histórico
-- p_itens: [{id, status, motivo}]
create or replace function public.salvar_financeiro(p_itens jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_login text := meu_login();
  it jsonb; u record; v_st text; v_mot text; v_out jsonb := '[]'::jsonb; v_tar jsonb; v_lin jsonb;
begin
  if v_login is null then raise exception 'sem_acesso: usuário não aprovado'; end if;
  if not tenho_funcao('financeiro') then raise exception 'sem_permissao: só admin ou Financeiro'; end if;
  if jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) > 2000 then raise exception 'lista inválida'; end if;
  for it in select * from jsonb_array_elements(p_itens) loop
    v_st := it->>'status'; v_mot := left(coalesce(it->>'motivo',''), 200);
    if v_st not in ('Pendente','Liberado','Bloqueado') then raise exception 'status inválido: %', v_st; end if;
    if v_st <> 'Pendente' and v_mot = '' then raise exception 'falta o motivo (%)', v_st; end if;
    if v_st = 'Pendente' then v_mot := ''; end if;
    select * into u from unidades where id = (it->>'id')::bigint for update;
    if not found then raise exception 'nao_encontrado: unidade %', it->>'id'; end if;
    if not acesso_obra(u.id_obra) then raise exception 'sem_acesso: você não tem acesso a esta obra'; end if;
    if u.financeiro_status = v_st and u.financeiro_motivo = v_mot then continue; end if;
    update unidades set financeiro_status = v_st, financeiro_motivo = v_mot, atualizado_em = now()
     where id = u.id returning to_jsonb(unidades.*) into v_lin;
    insert into tarefas(id_obra, id_unidade, acao, etapa_antiga, etapa_nova, obs, repeticao, coluna, autor, data, agendamento)
    values (u.id_obra, u.id, 'financeiro', u.sub_etapa, u.sub_etapa, v_st || case when v_mot <> '' then ' · ' || v_mot else '' end,
            null, 'financeiro', v_login, now(), '')
    returning to_jsonb(tarefas.*) into v_tar;
    v_out := v_out || jsonb_build_object('linha', v_lin, 'tarefa', v_tar);
  end loop;
  return v_out;
end $$;
revoke execute on function public.salvar_financeiro(jsonb) from public, anon;
grant execute on function public.salvar_financeiro(jsonb) to authenticated;
