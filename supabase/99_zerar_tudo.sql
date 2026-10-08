-- =====================================================================
-- CUIDADO: apaga TODO o Gestor de Entrega do banco (tabelas, funções,
-- regras e anexos). Os logins (auth.users) continuam existindo.
-- Use só se precisar recomeçar do zero; depois rode 01_estrutura.sql
-- e a importação de novo. Para refazer o perfil das pessoas, apague os
-- usuários em Authentication > Users e peça para se cadastrarem de novo.
-- =====================================================================
drop trigger if exists ao_criar_usuario on auth.users;
drop policy if exists "anexos ler" on storage.objects;
drop policy if exists "anexos enviar" on storage.objects;
drop policy if exists "fotos obras admin" on storage.objects;
drop policy if exists "fotos do proprio perfil" on storage.objects;
drop view if exists public.tarefas_lista, public.perfis_publicos;
drop table if exists public.laudos, public.tarefas, public.tarefas_ac, public.unidades, public.areas, public.horarios, public.locais,
  public.obra_acessos, public.clientes, public.obras, public.funcoes_antigas, public.perfis, public.funcoes, public.admins_iniciais cascade;
drop function if exists public.novo_usuario(), public.eu_aprovado(), public.meu_login(), public.tenho_funcao(text[]), public.sou_admin(),
  public.acesso_obra(bigint), public.pode_acao(text,text,text), public.registrar_acao(text,bigint,text,text,jsonb,jsonb,jsonb),
  public.reservar_ids(text,int), public.admin_aprovar(uuid,text[],bigint[]), public.admin_status(uuid,text),
  public.admin_redefinir_senha(uuid,text), public.pedir_nova_senha(text), public.senha_trocada(), public.salvar_prefs(jsonb), public.salvar_foto(text), public.laudo_recebido(bigint,text,jsonb);
-- os arquivos do bucket "anexos" precisam ser apagados pelo painel (Storage) antes de excluir o bucket
