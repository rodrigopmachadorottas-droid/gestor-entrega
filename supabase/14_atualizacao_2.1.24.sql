-- =====================================================================
-- Gestor de Entrega · atualização 2.1.24 (rodar 1x, depois da 13)
-- Modo manutenção: o aviso fica em config_global (chave "manutencao").
-- Esta função deixa o app ler só esse aviso mesmo antes do login.
-- =====================================================================
create or replace function public.status_manutencao() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce((select valor from config_global where chave = 'manutencao'), '{}'::jsonb)
$$;
revoke all on function public.status_manutencao() from public;
grant execute on function public.status_manutencao() to anon, authenticated;
