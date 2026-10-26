-- =====================================================================
-- Gestor de Entrega · correção dos dados do Teste Gás (rodar 1x)
-- Bug do Power Apps: depois de aprovado, o teste de gás era apagado
-- (por exemplo na Vistoria Qualidade) e a obra liberava/aprovava de novo,
-- deixando o histórico com liberações e aprovações repetidas e a unidade
-- com o gás vazio. Não existe nenhuma reprova de gás nos dados, então:
--   1. em cada unidade fica só a 1ª liberação e a aprovação "válida"
--      (a que passou a unidade para Finalizando, ou a 1ª aprovação);
--      as outras tarefas de gás são apagadas;
--   2. o teste de gás da unidade volta para "Aprovado 1°";
--   3. se com isso todos os testes ficaram aprovados e a unidade ainda
--      estava em Validação Técnica, ela passa para Finalizando Unidade.
-- Mostra no fim o que foi feito. Tudo numa transação.
-- =====================================================================
begin;
create temp table _gas on commit drop as
with t as (select t.*, row_number() over (partition by id_unidade order by data, id) n
           from public.tarefas t where coluna = 'rep_teste_gas'),
ap as (  -- aprovação válida de cada unidade
  select distinct on (id_unidade) id_unidade, id from t where acao = 'aprovar'
  order by id_unidade, (etapa_antiga = 2 and etapa_nova = 3) desc, data, id),
lib as ( -- 1ª liberação antes dela
  select distinct on (t.id_unidade) t.id_unidade, t.id from t join ap using (id_unidade)
  where t.acao = 'liberar' and t.data <= (select data from public.tarefas where id = ap.id)
  order by t.id_unidade, t.data, t.id)
select t.id, t.id_unidade, t.acao, t.etapa_antiga, t.etapa_nova,
       case when t.id = ap.id or t.id = lib.id then 'manter' else 'apagar' end destino
from t join ap using (id_unidade) left join lib using (id_unidade)
where not exists (select 1 from public.tarefas r where r.id_unidade = t.id_unidade and r.coluna = 'rep_teste_gas' and r.acao = 'reprovar');

-- segurança: não apaga tarefa que mudou a etapa da unidade
do $$ begin if exists (select 1 from _gas where destino = 'apagar' and etapa_antiga <> etapa_nova) then
  raise exception 'Há tarefa de gás a apagar que mudou a etapa; nada foi alterado'; end if; end $$;

select 'tarefas de gás apagadas' o, count(*) from _gas where destino = 'apagar'
union all select 'unidades corrigidas', count(distinct id_unidade) from _gas
union all select 'unidades que estavam com o gás vazio/pendente', count(*) from public.unidades u
  where u.id in (select id_unidade from _gas) and coalesce(u.rep_teste_gas, '') not like 'Aprovado%';

delete from public.tarefas where id in (select id from _gas where destino = 'apagar');
update public.tarefas set repeticao = 1 where id in (select id from _gas where destino = 'manter');
update public.unidades set rep_teste_gas = 'Aprovado 1°' where id in (select id_unidade from _gas) and rep_teste_gas is distinct from 'Aprovado 1°';

-- unidades em Validação Técnica com todos os testes aprovados → Finalizando Unidade
create temp table _fin on commit drop as
select u.id from public.unidades u join public.obras o on o.id = u.id_obra
where u.id in (select id_unidade from _gas) and u.sub_etapa = 2
  and not exists (select 1 from jsonb_array_elements_text(o.config->'testes') k
    where coalesce(case k when 'esgoto' then u.rep_teste_esgoto when 'aguafria' then u.rep_teste_aguafria when 'dreno' then u.rep_teste_dreno
                          when 'gas' then u.rep_teste_gas when 'eletrico' then u.rep_teste_eletrico end, '') not like 'Aprovado%');
update public.tarefas t set etapa_nova = 3   -- a última aprovação de teste é a que passa para Finalizando
from (select distinct on (id_unidade) id from public.tarefas where id_unidade in (select id from _fin) and coluna like 'rep_teste_%' and acao = 'aprovar'
      order by id_unidade, data desc, id desc) x where t.id = x.id;
update public.unidades set sub_etapa = 3 where id in (select id from _fin);
select 'unidades que passaram para Finalizando' o, count(*) from _fin;
commit;
