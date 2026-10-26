-- =====================================================================
-- Gestor de Entrega · Teste Gás do Porto Aurora (rodar 1x, depois da 15)
-- Unidades que passaram dos testes antes do gás ser exigido nesta obra:
-- o teste fica "Aprovado 1°" sem criar tarefa (como foi feito no Neoville).
-- Só mexe em quem já saiu da Validação Técnica, está com o gás vazio e
-- não tem nenhuma tarefa de gás.
-- =====================================================================
begin;
with alvo as (
  select u.id from public.unidades u join public.obras o on o.id = u.id_obra
  where o.nome ilike 'Porto Aurora' and u.sub_etapa >= 3 and u.unidade not ilike 'HALL%'
    and coalesce(u.rep_teste_gas, '') = ''
    and not exists (select 1 from public.tarefas t where t.id_unidade = u.id and t.coluna = 'rep_teste_gas'))
, feito as (update public.unidades set rep_teste_gas = 'Aprovado 1°' where id in (select id from alvo) returning unidade)
select count(*) as unidades_atualizadas, string_agg(unidade, ', ' order by unidade) as quais from feito;
commit;
