# Gestor de Entrega · Rottas Construtora

App web do controle de entrega das unidades (antes em Power Apps + SharePoint).
Site estático (HTML + JS, sem build) hospedado na **Vercel**, com banco, login e arquivos no **Supabase**.

O passo a passo completo para colocar no ar está no documento
"Gestor de Entrega: passo a passo para colocar no ar" (Claude Docs).

## Estrutura

| Caminho | O que é |
|---|---|
| `index.html` | página única do app |
| `css/style.css` | visual (tema claro/escuro) — é o que vale no celular |
| `css/style-desktop.css` | o mesmo visual 10% menor para o computador (zoom de 90%). **Gerado** por `ferramentas/escala_css.py`: depois de mexer no style.css, rode `python3 ferramentas/escala_css.py` |
| `js/config.js` | **URL e chave anon do Supabase** (vazio = modo demonstração) |
| `js/api.js` | leitura e gravação no Supabase |
| `js/auth.js` | login, pedido de acesso e tela Usuários |
| `js/engine.js` | regras do fluxo (etapas, testes, vistorias) |
| `js/ui*.js`, `js/events.js` | telas e cliques |
| `js/demo.js` | gerador de dados fictícios do modo demonstração |
| `js/vendor/` | bibliotecas: supabase-js 2.117.2, jsPDF 2.5.2 e html2canvas 1.4.1 (PDF), SheetJS 0.18.5 (planilhas) — licenças ao lado |
| `img/` | logos e fotos das obras |
| `supabase/01_estrutura.sql` | cria tabelas, regras de acesso e funções (rodar 1x) |
| `supabase/converter_sharepoint.py` | converte os CSV do SharePoint em SQL de importação |
| `supabase/03_usuarios_antigos.sql` | cria os logins de quem já usava o app (senha inicial Rottas@2026, troca obrigatória) |
| `supabase/04_atualizacao_2.1.2.sql` | fotos (usuário e obra) e preferências — rodar 1x no projeto que já está no ar |
| `supabase/05_atualizacao_2.1.3.sql` | funções novas (Qualidade no lugar de Excelência, sem Gerente, Admin exclusivo) e casas sem pavimento — rodar 1x depois da 04 |
| `supabase/06_atualizacao_2.1.4.sql` | laudos de engenheiro e regra das 24 h de antecedência no agendamento — rodar 1x depois da 05 |
| `supabase/07_atualizacao_2.1.5.sql` | função Líder de área, clientes por obra e exceções de horário — rodar 1x depois da 06 |
| `supabase/99_zerar_tudo.sql` | apaga tudo para recomeçar (cuidado) |

## Rodar no computador

Qualquer servidor estático serve, por exemplo: `python3 -m http.server 8000` dentro da pasta e abrir http://localhost:8000.
Com `js/config.js` vazio, abre em modo demonstração.

## Login e permissões

- A pessoa cria a conta em **Pedir acesso** (e-mail + senha). Ela fica **pendente** e não vê nada.
- O admin abre **Usuários** (botão no topo da tela inicial ou no menu), marca as **funções** e as **obras** e clica em **Aprovar acesso**.
- O login é a parte antes do @ para e-mails @rottasconstrutora.com.br (igual ao app antigo). Por isso as obras e as funções do SharePoint aparecem já marcadas como sugestão.
- Quem esquece a senha clica em **Esqueci minha senha**: o admin vê o aviso em Usuários e define uma **senha provisória**. No login seguinte o app obriga a pessoa a criar uma senha própria.
- O e-mail em `admins_iniciais` (no `01_estrutura.sql`) vira admin automaticamente no primeiro cadastro.
- As regras valem no banco (RLS): mesmo quem abrir o console do navegador só lê as obras que tem acesso e só faz as ações das suas funções.

## Importar os dados do SharePoint

1. Exporte cada lista em **CSV com esquema** (ge_obras, ge_usuarios, ge_clientes, ge_obras_locais, ge_obras_horarios, ge_unidades, ge_tarefas, ge_areas_comuns, ge_tarefas_ac e, se der, ge_bases_json).
2. `python3 supabase/converter_sharepoint.py <pasta-dos-csv> <pasta-saida>`
3. Rode no SQL Editor, nesta ordem: `02_dados_1_cadastros.sql`, `02_dados_2_tarefas_*.sql`, `02_dados_3_final.sql`.
4. Rode `supabase/03_usuarios_antigos.sql`: cada pessoa do ge_usuarios ganha login aprovado (mesmas funções e obras) com a senha `Rottas@2026`, que o app obriga a trocar no primeiro acesso.

A importação **apaga e regrava** os dados do app (unidades, clientes, tarefas, laudos, horários, exceções, áreas). Mantém logins, funções, acessos às obras e a foto/configuração das obras que já existem. Obras que não estão nos CSV são apagadas. Serve também para **voltar ao estado dos CSV** depois que o app já está em uso.
Não rode o `03_usuarios_antigos.sql` de novo numa restauração (ele recoloca a senha provisória).
Os arquivos `02_dados_*.sql` e os CSV têm dados pessoais de clientes: **não suba no GitHub** (o `.gitignore` já bloqueia).

## Publicar uma nova versão

Altere os arquivos, troque `?v=2.1.6` no `index.html` pela nova versão (força o navegador a baixar de novo) e faça commit/push: a Vercel publica sozinha.
