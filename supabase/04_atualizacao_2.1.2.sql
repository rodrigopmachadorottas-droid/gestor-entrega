-- =====================================================================
-- GESTOR DE ENTREGA · 04_atualizacao_2.1.2.sql
-- Rode UMA vez no SQL Editor do projeto que já está no ar (pode rodar de
-- novo sem problema). Acrescenta: foto do usuário, preferências (tela
-- inicial da obra e tema) e o espaço público "fotos" (usuários e capas
-- das obras). Não mexe nos dados.
-- =====================================================================

alter table public.perfis add column if not exists foto  text;
alter table public.perfis add column if not exists prefs jsonb not null default '{}';

-- nomes + fotos para o histórico e o menu
create or replace view public.perfis_publicos as
  select login, nome, funcoes, foto from public.perfis where status <> 'pendente' and public.eu_aprovado();
grant select on public.perfis_publicos to authenticated;

-- preferências da própria pessoa (junta com as que já existem)
create or replace function public.salvar_prefs(p jsonb) returns void
language sql security definer set search_path = public as $$
  update perfis set prefs = coalesce(prefs,'{}') || coalesce(p,'{}') where id = auth.uid();
$$;

-- foto da própria pessoa (endereço da imagem no Storage, ou null para remover)
create or replace function public.salvar_foto(p_url text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_url is not null and (p_url not like 'https://%' or length(p_url) > 600) then raise exception 'endereço de foto inválido'; end if;
  update perfis set foto = p_url where id = auth.uid();
end $$;

revoke execute on function public.salvar_prefs(jsonb), public.salvar_foto(text) from public, anon;
grant execute on function public.salvar_prefs(jsonb), public.salvar_foto(text) to authenticated;

-- espaço "fotos": leitura pública (são fotos de obra e de perfil), envio controlado
insert into storage.buckets(id, name, public) values ('fotos','fotos', true)
on conflict (id) do update set public = true;

drop policy if exists "fotos obras admin" on storage.objects;
create policy "fotos obras admin" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = 'obras' and public.sou_admin());

drop policy if exists "fotos do proprio perfil" on storage.objects;
create policy "fotos do proprio perfil" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = 'perfis'
              and (storage.foldername(name))[2] = auth.uid()::text and public.eu_aprovado());
