-- =====================================================================
-- Gestor de Entrega · atualização 2.1.23 (rodar 1x, depois da 12)
-- Ao apagar uma unidade (ou um bloco inteiro), apaga junto o histórico
-- (tarefas) e os laudos dela. Ao apagar uma área comum, apaga o histórico
-- dela. Também limpa o que já ficou "órfão" de exclusões anteriores.
-- (As fotos/anexos no Storage não são apagados.)
-- =====================================================================
create or replace function public.apagar_dependentes_unidade() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from laudos  where id_unidade = old.id;
  delete from tarefas where id_unidade = old.id;
  return old;
end $$;
drop trigger if exists unidades_apagar_dependentes on public.unidades;
create trigger unidades_apagar_dependentes after delete on public.unidades
  for each row execute function public.apagar_dependentes_unidade();

create or replace function public.apagar_dependentes_area() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from tarefas_ac where id_local = old.id;
  return old;
end $$;
drop trigger if exists areas_apagar_dependentes on public.areas;
create trigger areas_apagar_dependentes after delete on public.areas
  for each row execute function public.apagar_dependentes_area();

-- limpeza do que já ficou sem unidade/área
delete from public.laudos     l where not exists (select 1 from public.unidades u where u.id = l.id_unidade);
delete from public.tarefas    t where not exists (select 1 from public.unidades u where u.id = t.id_unidade);
delete from public.tarefas_ac t where not exists (select 1 from public.areas    a where a.id = t.id_local);
