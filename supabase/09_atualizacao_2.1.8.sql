-- =====================================================================
-- GESTOR DE ENTREGA · 09_atualizacao_2.1.8.sql
-- Rode UMA vez no SQL Editor (pode repetir), depois da 08.
--  1) Apelidos por pessoa (frase da tela inicial). A própria pessoa e o
--     admin podem mudar; precisa ter pelo menos um.
--  2) Motivo financeiro "Inapto" passa a se chamar "Inadimplente".
-- =====================================================================

-- 1) APELIDOS --------------------------------------------------------------
alter table public.perfis add column if not exists apelidos text[] not null default '{}';

create or replace function public.salvar_apelidos(p_id uuid, p_apelidos text[]) returns text[]
language plpgsql security definer set search_path = public as $$
declare v text[];
begin
  if not eu_aprovado() then raise exception 'sem_acesso'; end if;
  if p_id is distinct from auth.uid() and not sou_admin() then raise exception 'sem_permissao: só a própria pessoa ou o admin'; end if;
  select coalesce(array_agg(a order by ord), '{}') into v
    from (select distinct on (lower(t)) left(t, 30) as a, ord
            from (select btrim(x) as t, ord from unnest(coalesce(p_apelidos,'{}')) with ordinality as u(x, ord)) s
           where t <> '' order by lower(t), ord) d;
  if cardinality(v) = 0 then raise exception 'precisa ter pelo menos um apelido'; end if;
  if cardinality(v) > 10 then v := v[1:10]; end if;
  update perfis set apelidos = v where id = p_id;
  if not found then raise exception 'nao_encontrado'; end if;
  return v;
end $$;
revoke execute on function public.salvar_apelidos(uuid, text[]) from public, anon;
grant execute on function public.salvar_apelidos(uuid, text[]) to authenticated;

-- 2) MOTIVO FINANCEIRO -----------------------------------------------------
update public.unidades set financeiro_motivo = 'Inadimplente' where financeiro_motivo = 'Inapto';
