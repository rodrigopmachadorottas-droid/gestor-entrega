-- =====================================================================
-- GESTOR DE ENTREGA · 03_usuarios_antigos.sql
-- Rode DEPOIS da importação (02_dados_*). Cria o login de cada pessoa do
-- ge_usuarios (SharePoint) já APROVADA, com as mesmas funções e as mesmas
-- obras do app antigo, e senha inicial Rottas@2026.
-- No primeiro login o app obriga a pessoa a criar uma senha própria.
-- Quem já tem conta no Supabase é pulado (nada muda para essa pessoa).
-- Pode rodar de novo sem duplicar.
-- =====================================================================

-- (garante as peças novas, caso o 01_estrutura.sql tenha sido rodado na versão anterior)
alter table public.perfis add column if not exists trocar_senha boolean not null default false;
create or replace function public.senha_trocada() returns void
language sql security definer set search_path = public as $$
  update perfis set trocar_senha = false where id = auth.uid();
$$;
revoke execute on function public.senha_trocada() from public, anon;
grant execute on function public.senha_trocada() to authenticated;
create or replace function public.admin_redefinir_senha(p_id uuid, p_senha text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not sou_admin() then raise exception 'sem_permissao'; end if;
  if length(coalesce(p_senha,'')) < 6 then raise exception 'a senha precisa ter pelo menos 6 caracteres'; end if;
  update auth.users set encrypted_password = extensions.crypt(p_senha, extensions.gen_salt('bf')), updated_at = now()
   where id = p_id;
  update perfis set pedido_senha = null, trocar_senha = true where id = p_id;
end $$;

do $$
declare
  c_senha constant text := 'Rottas@2026';
  r record; v_id uuid; v_email text; v_criados uuid[] := '{}'; col text;
begin
  for r in select login, funcoes from public.funcoes_antigas order by login loop
    v_email := lower(case when r.login like '%@%' then r.login else r.login || '@rottasconstrutora.com.br' end);
    if exists(select 1 from auth.users where lower(email) = v_email) then
      raise notice 'já existe, pulado: %', v_email;
      continue;
    end if;
    v_id := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                            raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
            extensions.crypt(c_senha, extensions.gen_salt('bf')), now(),
            '{"provider":"email","providers":["email"]}', '{}', now(), now());
    insert into auth.identities (user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (v_id, v_id::text, jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
            'email', now(), now(), now());
    -- o gatilho já criou o perfil; aqui ele vira aprovado com as funções antigas
    update public.perfis
       set status = 'aprovado',
           funcoes = case when status = 'aprovado' then funcoes else r.funcoes end,   -- admins_iniciais mantém todas
           aprovado_em = now(), aprovado_por = 'importação SharePoint', trocar_senha = true
     where id = v_id;
    v_criados := v_criados || v_id;
  end loop;

  -- o login do Supabase não aceita campos de token vazios (NULL) nas contas criadas por SQL
  for col in select column_name from information_schema.columns
             where table_schema = 'auth' and table_name = 'users' and data_type in ('character varying','text')
               and (column_name like '%token%' or column_name in ('email_change','phone_change'))
               and is_generated = 'NEVER' loop
    execute format('update auth.users set %I = coalesce(%I, '''') where id = any($1)', col, col) using v_criados;
  end loop;

  raise notice '% login(s) criado(s) com a senha inicial', coalesce(array_length(v_criados,1),0);
end $$;

-- conferência: quem ficou aprovado, funções e quantas obras
select p.nome, p.email, p.status, array_to_string(p.funcoes, ', ') as funcoes,
       (select count(*) from public.obra_acessos a where a.login = p.login) as obras,
       p.trocar_senha as vai_trocar_senha
from public.perfis p order by p.nome;
