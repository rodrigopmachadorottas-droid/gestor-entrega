-- =====================================================================
-- GESTOR DE ENTREGA · 12_atualizacao_2.1.18.sql
-- Rode UMA vez no SQL Editor (pode repetir), depois da 11.
--  1) Nova função "Visualizador": vê todas as etapas e não faz ações.
--     (Com Líder de área também, vê Informações Extras, Visão Ações e
--     Dados por usuário.)
-- =====================================================================
insert into public.funcoes values ('visualizador','Visualizador',3) on conflict (codigo) do update set nome = 'Visualizador';
