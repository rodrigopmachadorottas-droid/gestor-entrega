-- =====================================================================
-- GESTOR DE ENTREGA · 10_atualizacao_2.1.10.sql
-- Rode UMA vez no SQL Editor (pode repetir), depois da 09.
--  1) Análise financeira: quem é RC e Líder de área também pode gravar
--     (além de admin e Financeiro).
-- =====================================================================
create or replace function public.salvar_financeiro(p_itens jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_login text := meu_login();
  it jsonb; u record; v_st text; v_mot text; v_out jsonb := '[]'::jsonb; v_tar jsonb; v_lin jsonb;
begin
  if v_login is null then raise exception 'sem_acesso: usuário não aprovado'; end if;
  if not (tenho_funcao('financeiro') or (tenho_funcao('rc') and tenho_funcao('lider'))) then raise exception 'sem_permissao: só admin, Financeiro ou líder do RC'; end if;
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
