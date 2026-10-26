-- =====================================================================
-- Gestor de Entrega · atualização 2.1.27 (rodar 1x, depois da 16)
-- Áreas comuns ganham TIPO: geral (salão, piscina...), hall, cobertura e
-- entorno. Hall fica num bloco e pavimento; cobertura e entorno, num bloco.
-- Hall/cobertura/entorno só passam por Liberação, Vistoria Qualidade e
-- Correções (Arquitetura e Síndico não se aplicam).
-- Os halls que estavam cadastrados como unidades viram áreas comuns.
-- =====================================================================
begin;
alter table public.areas add column if not exists tipo    text   not null default 'geral';
alter table public.areas add column if not exists nivel_1 bigint references public.locais(id) on delete cascade;
alter table public.areas add column if not exists nivel_2 int;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'areas_tipo_ok') then
    alter table public.areas add constraint areas_tipo_ok check (tipo in ('geral','hall','cobertura','entorno'));
  end if;
end $$;
create index if not exists areas_nivel_1_idx on public.areas(nivel_1);
grant update (descricao, tipo, nivel_1, nivel_2) on public.areas to authenticated;

-- halls que estavam em unidades → áreas comuns tipo hall (nome: "Bloco A · 3° Pav · Hall")
with h as (
  select u.id, u.id_obra, u.nivel_1, u.nivel_2,
         l.nivel1 || coalesce(' · ' || replace(nullif(split_part(l.niveis2, ', ', u.nivel_2), ''), ' Pavimento', ' Pav'), '') || ' · Hall' as nome
  from public.unidades u join public.locais l on l.id = u.nivel_1
  where u.unidade ilike 'HALL%'
)
, novos as (
  insert into public.areas (id_obra, descricao, tipo, nivel_1, nivel_2)
  select distinct on (id_obra, nome) id_obra, nome, 'hall', nivel_1, nivel_2 from h
  where not exists (select 1 from public.areas a where a.id_obra = h.id_obra and a.descricao = h.nome)
  order by id_obra, nome
  returning id
)
select (select count(*) from novos) as halls_criados_em_areas_comuns,
       (select count(*) from h)     as halls_que_estavam_em_unidades;
delete from public.unidades where unidade ilike 'HALL%';
select setval(pg_get_serial_sequence('public.areas', 'id'), greatest((select max(id) from public.areas), 1));
commit;
