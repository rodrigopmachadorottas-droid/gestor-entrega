-- =====================================================================
-- GESTOR DE ENTREGA · 05_atualizacao_2.1.3.sql
-- Rode UMA vez no SQL Editor (pode repetir sem problema), depois da 04.
--  1) Funções: "excelencia" vira "qualidade"; "gerente" deixa de existir;
--     "admin" fica só para quem está em admins_iniciais (o Rodrigo).
--  2) Obras de casas: deixam de ter "pavimentos/fileiras" dentro da quadra;
--     a Visão Unidades passa a usar "casas por linha" (padrão 8).
-- =====================================================================

-- 1) FUNÇÕES -------------------------------------------------------------
insert into public.funcoes values ('qualidade','Qualidade',4) on conflict (codigo) do update set nome = 'Qualidade', ordem = 4;
delete from public.funcoes where codigo in ('excelencia','gerente');

update public.perfis
   set funcoes = array_remove(array_remove(array_replace(funcoes,'excelencia','qualidade'),'gerente'), null)
 where funcoes && array['excelencia','gerente'];
update public.funcoes_antigas
   set funcoes = array_remove(array_replace(funcoes,'excelencia','qualidade'),'gerente')
 where funcoes && array['excelencia','gerente'];

-- quem tinha Admin e não está em admins_iniciais perde o Admin (as outras funções ficam)
select p.nome, p.email, array_to_string(p.funcoes, ', ') as funcoes_antes
  from public.perfis p
 where 'admin' = any(p.funcoes) and not exists(select 1 from public.admins_iniciais a where lower(a.email) = p.email);
update public.perfis p set funcoes = array_remove(p.funcoes,'admin')
 where 'admin' = any(p.funcoes) and not exists(select 1 from public.admins_iniciais a where lower(a.email) = p.email);
update public.funcoes_antigas f set funcoes = array_remove(f.funcoes,'admin')
 where 'admin' = any(f.funcoes) and not exists(select 1 from public.admins_iniciais a where split_part(lower(a.email),'@',1) = f.login);

-- regras do servidor com o nome novo
create or replace function public.pode_acao(p_tipo text, p_acao text, p_coluna text) returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  if p_tipo = 'unidade' then
    if p_coluna like 'rep_teste_%' then
      return case when p_acao in ('aprovar','reprovar') then tenho_funcao('instalacoes')
                  when p_acao in ('liberar','cancelar','corrigir') then tenho_funcao('obra') else false end;
    elsif p_coluna = '' then
      return p_acao in ('finalizar','aprovarDireto','cancelar') and tenho_funcao('obra');
    elsif p_coluna in ('rep_vistoria_at','rep_vistoria_previa') then
      return case when p_acao in ('aprovar','reprovar') then tenho_funcao('qualidade')
                  when p_acao = 'corrigir' then tenho_funcao('obra') else false end;
    elsif p_coluna = 'agendamento' then
      return p_acao in ('agendar','cancelar') and tenho_funcao('rc');
    elsif p_coluna = 'rep_vistoria_cliente' then
      return case when p_acao in ('aprovar','reprovar') then tenho_funcao('qualidade','obra')
                  when p_acao = 'corrigir' then tenho_funcao('obra') else false end;
    end if;
  elsif p_tipo = 'area' then
    if p_coluna = '' then
      return p_acao in ('liberar','cancelar') and tenho_funcao('obra');
    elsif p_coluna in ('rep_vistoria_qualidade','rep_vistoria_sindico') then
      return case when p_acao in ('aprovar','reprovar') then tenho_funcao('qualidade')
                  when p_acao = 'corrigir' then tenho_funcao('obra') else false end;
    elsif p_coluna = 'rep_vistoria_arq' then
      return case when p_acao in ('aprovar','reprovar') then tenho_funcao('arquitetura')
                  when p_acao = 'corrigir' then tenho_funcao('obra') else false end;
    elsif p_coluna = 'agendamento' then
      return p_acao in ('agendar','cancelar') and tenho_funcao('rc');
    end if;
  end if;
  return false;
end $$;

create or replace function public.admin_aprovar(p_id uuid, p_funcoes text[], p_obras bigint[]) returns void
language plpgsql security definer set search_path = public as $$
declare v_login text;
begin
  if not sou_admin() then raise exception 'sem_permissao'; end if;
  if exists(select 1 from unnest(p_funcoes) f where f not in (select codigo from funcoes)) then
    raise exception 'função inválida';
  end if;
  if coalesce(array_length(p_funcoes,1),0) = 0 then raise exception 'escolha pelo menos uma função'; end if;
  if 'admin' = any(p_funcoes) and not exists(select 1 from perfis p join admins_iniciais a on lower(a.email) = p.email where p.id = p_id) then
    raise exception 'a função Admin é exclusiva (só e-mails da lista admins_iniciais)';
  end if;
  update perfis set status = 'aprovado', funcoes = p_funcoes,
         aprovado_em = coalesce(aprovado_em, now()), aprovado_por = coalesce(aprovado_por, meu_login())
   where id = p_id returning login into v_login;
  if v_login is null then raise exception 'perfil não encontrado'; end if;
  delete from obra_acessos where login = v_login;
  insert into obra_acessos(obra_id, login) select distinct o, v_login from unnest(coalesce(p_obras,'{}')) o
    where exists(select 1 from obras where id = o);
end $$;

drop policy if exists "cria horarios" on public.horarios;
drop policy if exists "muda horarios" on public.horarios;
create policy "cria horarios" on public.horarios for insert to authenticated with check (public.tenho_funcao('obra','qualidade') and public.acesso_obra(id_obra));
create policy "muda horarios" on public.horarios for update to authenticated using (public.tenho_funcao('obra','qualidade') and public.acesso_obra(id_obra)) with check (public.acesso_obra(id_obra));

-- 2) OBRAS DE CASAS ----------------------------------------------------------
update public.obras set config = config || '{"casasPorLinha":8}'
 where config->>'tipo' = 'casa' and not (config ? 'casasPorLinha');
update public.unidades u set nivel_2 = null
  from public.obras o where o.id = u.id_obra and o.config->>'tipo' = 'casa' and u.nivel_2 is not null;
update public.locais l set niveis2 = ''
  from public.obras o where o.id = l.id_obra and o.config->>'tipo' = 'casa' and l.niveis2 <> '';

-- conferência
select login, array_to_string(funcoes, ', ') as funcoes from public.perfis order by login;
