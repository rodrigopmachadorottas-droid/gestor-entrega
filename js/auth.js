/* =====================================================================
   LOGIN, PEDIDO DE ACESSO E TELA "USUÁRIOS" (admin)
   Fluxo: a pessoa cria a conta (e-mail + senha) → fica "pendente" →
   o admin aprova na tela Usuários escolhendo funções e obras.
   ===================================================================== */

/* ---------- tela de abertura (carregando) ---------- */
function telaBoot(msg){ return `<div class="boot"><img class="boot-ic" src="img/icone.png" alt="Gestor de Entrega"><span class="spin" aria-hidden="true"></span><span class="boot-msg" id="boot-msg">${esc(msg||"Abrindo o app...")}</span></div>`; }
function passo(msg){ if(S.auth.tela!=="carregando") return; S.auth.passo=msg; const el=document.getElementById("boot-msg"); if(el) el.textContent=msg; else render(); }

/* ---------- telas de entrada ---------- */
function authShell(corpo){
  return `<div class="auth"><div class="home-top"><div class="wrap"><b>Controle das Unidades | Excelência Operacional</b><b class="ht-v">${VERSAO}</b></div></div>
    <main class="auth-main"><div class="auth-card">
      <img class="auth-logo" src="${isDark()?LOGOS.branca:LOGOS.preta}" alt="Gestor de Entrega">${corpo}</div></main>
    <div class="rottas-tab" aria-hidden="true"><img src="${LOGOS.rottas}" alt=""></div></div>`;
}
function authMsg(){ const A=S.auth;
  return (A.erro?`<div class="auth-msg bad" role="alert">${esc(A.erro)}</div>`:"")+(A.msg?`<div class="auth-msg ok" role="status">${esc(A.msg)}</div>`:""); }
function campo(id,rotulo,tipo,extra=""){ return `<div class="field"><label for="${id}">${rotulo}</label><input class="inp" id="${id}" name="${id}" type="${tipo}" ${extra}></div>`; }
const btnEnviar=(txt)=>`<button class="btn primary auth-go" type="submit" ${S.auth.enviando?"disabled":""}>${S.auth.enviando?"Aguarde...":txt}</button>`;

function telaAuth(){
  const A=S.auth, P=S.perfil||{};
  if(A.tela==="carregando") return telaBoot(A.passo);
  if(A.tela==="entrar") return authShell(`<h1>Entrar</h1>${authMsg()}
    <form data-form="login" class="auth-form" novalidate>${campo("a-email","E-mail","email",`autocomplete="username" value="${esc(A.email||"")}" required`)}${campo("a-senha","Senha","password",'autocomplete="current-password" required')}
    ${btnEnviar("Entrar")}</form>
    <div class="auth-links"><button class="linkbtn" data-act="authtela" data-v="esqueci">Esqueci minha senha</button><span>Não tem acesso? <button class="linkbtn" data-act="authtela" data-v="criar">Pedir acesso</button></span></div>`);
  if(A.tela==="criar") return authShell(`<h1>Pedir acesso</h1><p class="muted">Crie sua senha. O pedido vai para o administrador, que libera as funções e as obras que você vai usar.</p>${authMsg()}
    <form data-form="criar" class="auth-form" novalidate>${campo("c-nome","Nome completo","text",'autocomplete="name" required')}${campo("c-email","E-mail","email",`autocomplete="email" value="${esc(A.email||"")}" required`)}
    ${campo("c-senha","Senha (mínimo 8 caracteres)","password",'autocomplete="new-password" minlength="8" required')}${campo("c-senha2","Repita a senha","password",'autocomplete="new-password" required')}
    ${btnEnviar("Enviar pedido de acesso")}</form>
    <div class="auth-links"><span>Já tem acesso? <button class="linkbtn" data-act="authtela" data-v="entrar">Entrar</button></span></div>`);
  if(A.tela==="esqueci") return authShell(`<h1>Esqueci minha senha</h1><p class="muted">Informe seu e-mail. O administrador recebe o aviso no app, define uma senha provisória e te passa.</p>${authMsg()}
    ${A.msg?"":`<form data-form="esqueci" class="auth-form" novalidate>${campo("e-email","E-mail","email",`autocomplete="email" value="${esc(A.email||"")}" required`)}${btnEnviar("Avisar o administrador")}</form>`}
    <div class="auth-links"><button class="linkbtn" data-act="authtela" data-v="entrar">Voltar para o login</button></div>`);
  if(A.tela==="pendente") return authShell(`<h1>Pedido enviado</h1>
    <p>Olá, <b>${esc((P.nome||"").split(" ")[0])}</b>! Seu pedido de acesso com o e-mail <b>${esc(P.email||"")}</b> está aguardando aprovação do administrador.</p>
    <p class="muted">Quando ele aprovar, toque em "Verificar de novo" ou entre mais tarde.</p>${authMsg()}
    <button class="btn primary auth-go" data-act="authverificar">Verificar de novo</button><div class="auth-links"><button class="linkbtn" data-act="sair">Sair</button></div>`);
  if(A.tela==="trocarsenha") return authShell(`<h1>Crie a sua senha</h1>
    <p>Olá, <b>${esc((P.nome||"").split(" ")[0])}</b>! Você entrou com uma senha provisória. Antes de continuar, crie uma senha só sua.</p>${authMsg()}
    <form data-form="primeirasenha" class="auth-form" novalidate>${campo("p-senha","Nova senha (mínimo 8 caracteres)","password",'autocomplete="new-password" required')}${campo("p-senha2","Repita a nova senha","password",'autocomplete="new-password" required')}
    ${btnEnviar("Salvar e entrar")}</form><div class="auth-links"><button class="linkbtn" data-act="sair">Sair</button></div>`);
  if(A.tela==="bloqueado") return authShell(`<h1>Acesso bloqueado</h1><p>O acesso de <b>${esc(P.email||"")}</b> está bloqueado. Fale com o administrador do Gestor de Entrega.</p>
    <div class="auth-links"><button class="linkbtn" data-act="sair">Sair</button></div>`);
  return authShell(`<h1>Algo deu errado</h1>${authMsg()}<button class="btn primary auth-go" data-act="authverificar">Tentar de novo</button><div class="auth-links"><button class="linkbtn" data-act="sair">Sair</button></div>`);
}

function traduzAuth(e){
  const m=String(e&&e.message||e||"");
  if(/Invalid login credentials/i.test(m)) return "E-mail ou senha incorretos.";
  if(/already registered|already exists/i.test(m)) return "Este e-mail já tem cadastro. Use \"Entrar\" ou \"Esqueci minha senha\".";
  if(/different from the old/i.test(m)) return "A nova senha precisa ser diferente da provisória.";
  if(/Password should be|weak/i.test(m)) return "Senha fraca: use pelo menos 8 caracteres, misturando letras e números.";
  if(/Email not confirmed/i.test(m)) return "E-mail ainda não confirmado. Peça ao administrador para desligar a confirmação de e-mail no Supabase (veja o tutorial).";
  if(/rate limit|too many/i.test(m)) return "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.";
  if(/valid email|invalid email/i.test(m)) return "E-mail inválido.";
  return msgErro(e);
}

async function posLogin(){
  S.auth={tela:"carregando",passo:"Verificando o login..."}; render();
  const { data:{ user } } = await sb.auth.getUser();
  if(!user){ S.auth={tela:"entrar"}; render(); return; }
  passo("Buscando o seu perfil e as suas permissões...");
  let p=null;
  for(let i=0;i<4&&!p;i++){ const { data } = await sb.from("perfis").select("*").eq("id",user.id).maybeSingle(); p=data; if(!p) await esperar(700); }
  if(!p){ S.auth={tela:"erro",erro:"Não encontramos o seu perfil. Fale com o administrador (o script 01_estrutura.sql foi rodado?)."}; render(); return; }
  S.perfil=p;
  if(p.status==="pendente"){ S.auth={tela:"pendente"}; render(); return; }
  if(p.status==="bloqueado"){ S.auth={tela:"bloqueado"}; render(); return; }
  if(p.trocar_senha){ S.auth={tela:"trocarsenha"}; render(); return; }
  REAL_USER=p.login; S.user=p.login;
  aplicarPrefs(p.prefs);
  try{ await API.carregar(true); }
  catch(e){ S.auth={tela:"erro",erro:"Não foi possível carregar os dados: "+msgErro(e)}; render(); return; }
  S.auth={tela:null}; S.screen="home"; S.obraId=null; resetFiltros(); render();
  if((p.funcoes||[]).includes("admin")){ API.carregarUsuarios().then(()=>{ render(); const n=API.usrPendentes(); if(n) toast("Info",`${n} pedido(s) aguardando você`,"Abra Usuários para aprovar."); }).catch(()=>{}); }
}

async function sair(){ S.saindo=true; try{ await sb.auth.signOut(); }catch(_){} location.reload(); }

/* ---------- pedaços usados nas telas do app ---------- */
function topoAcoes(){
  if(MODO_DEMO) return `<span class="hpill">Demonstração</span>`;
  return "";
}
function itemUsuarios(u){
  if(MODO_DEMO||!can(userByLogin(REAL_USER)||{perms:[]},"admin")) return "";
  const n=API.usrPendentes();
  return `<button class="sb-item ${S.screen==="usuarios"?"on":""}" data-act="usuarios">${IC.users}Usuários${n?`<span class="sb-badge">${n}</span>`:""}</button>`;
}
function acoesPerfil(u){
  if(MODO_DEMO||u.login!==REAL_USER) return "";
  return "";
}
function extrasAuth(){
  let h="";
  if(S.senhaModal) h+=`<div class="modal" role="dialog" aria-modal="true" aria-label="Alterar senha"><div class="scrim" data-act="senhafechar"></div><div class="box sm2">
    <div class="mhead"><div class="t"><b class="conf-t">Alterar senha</b></div><button class="iconbtn" data-act="senhafechar" aria-label="Fechar">${IC.close}</button></div>
    <form data-form="novasenha" class="mbody auth-form" novalidate>${S.senhaModal.erro?`<div class="auth-msg bad" role="alert">${esc(S.senhaModal.erro)}</div>`:""}
      ${campo("n-senha","Nova senha (mínimo 8 caracteres)","password",'autocomplete="new-password" required')}${campo("n-senha2","Repita a nova senha","password",'autocomplete="new-password" required')}
      <button class="btn primary" type="submit">Salvar nova senha</button></form></div></div>`;
  if(S.carregando) h+=`<div class="loading" role="status"><span class="spin" aria-hidden="true"></span>${esc(S.carregando)}</div>`;
  return h;
}

/* ---------- tela Usuários (admin) ---------- */
const STATUS_USR={pendente:["warn","Pendente"],aprovado:["ok","Ativo"],bloqueado:["bad","Bloqueado"]};
function usrSel(){ return S.usrData&&S.usr.sel?S.usrData.perfis.find(p=>p.id===S.usr.sel):null; }
function usrSugestao(p){ const a=S.usrData.antigas.find(x=>x.login===p.login); return a&&a.funcoes.length?a.funcoes:null; }
function usrIniciarForm(p){
  const obras=S.usrData.acessos.filter(a=>a.login===p.login).map(a=>a.obra_id);
  const fn=p.funcoes&&p.funcoes.length?[...p.funcoes]:(usrSugestao(p)||[]);
  S.usr.form={funcoes:fn,obras,senha:""};
}
function telaUsuarios(){
  const D=S.usrData, U=S.usr;
  const head=`<header class="topbar"><button class="iconbtn" data-act="usrvoltar" aria-label="Voltar">${IC.back}</button><h1>Usuários</h1><button class="iconbtn" data-act="usrrecarregar" aria-label="Atualizar lista">${io("sync")}</button></header><div class="topspace"></div>`;
  if(!D) return head+`<main class="screen"><div class="panel empty"><span class="spin" aria-hidden="true"></span><b>Carregando usuários...</b></div></main>`;
  const grupos={pendentes:D.perfis.filter(p=>p.status==="pendente"),ativos:D.perfis.filter(p=>p.status==="aprovado"),bloqueados:D.perfis.filter(p=>p.status==="bloqueado")};
  const q=U.busca.trim().toLowerCase();
  const lista=grupos[U.aba].filter(p=>!q||(p.nome+" "+p.email).toLowerCase().includes(q))
    .sort((a,b)=>(b.pedido_senha?1:0)-(a.pedido_senha?1:0)||a.nome.localeCompare(b.nome));
  const pedidosSenha=D.perfis.filter(p=>p.pedido_senha&&p.status!=="pendente").length;
  const left=`<section class="panel cli-left">
    <div class="seg tabs" role="tablist">${[["pendentes","Pendentes"],["ativos","Ativos"],["bloqueados","Bloqueados"]].map(([k,l])=>`<button class="${U.aba===k?"on":""}" role="tab" aria-selected="${U.aba===k}" data-act="usraba" data-v="${k}">${l} <span class="tnum">(${grupos[k].length})</span></button>`).join("")}</div>
    ${pedidosSenha&&U.aba!=="ativos"?`<button class="auth-msg warn" data-act="usraba" data-v="ativos" style="text-align:left;border:0;cursor:pointer">${pedidosSenha} pessoa(s) ativas pediram nova senha. Ver em Ativos.</button>`:""}
    <label class="search in">${IC.search}<input id="usr-busca" data-ubind="busca" value="${esc(U.busca)}" placeholder="Buscar nome ou e-mail" autocomplete="off"></label>
    <div class="cli-units" id="usr-list" data-keep-scroll>${lista.length?lista.map(p=>`<button class="cli-row ${U.sel===p.id?"on":""}" data-act="usrsel" data-uid="${p.id}">${avatar(p.nome,p.foto)}<span class="usr-txt"><b>${esc(p.nome)}</b><span class="muted small">${esc(p.email)}</span></span><span class="spacer"></span>
      ${p.pedido_senha?`<span class="pill s-warn">Nova senha</span>`:""}${U.aba==="pendentes"?`<span class="muted small tnum">${fmtData(new Date(p.criado_em))}</span>`:""}</button>`).join("")
      :`<div class="empty"><b>${U.aba==="pendentes"?"Nenhum pedido aguardando":"Ninguém por aqui"}</b><span>${U.aba==="pendentes"?"Quando alguém pedir acesso, aparece nesta lista.":"Mude a aba ou a busca."}</span></div>`}</div></section>`;
  return head+`<main class="screen"><div class="split cli-split">${left}${usrDetalhe()}</div></main>`;
}
function usrDetalhe(){
  const p=usrSel();
  if(!p) return `<section class="panel cli-detail"><div class="empty"><b>Selecione uma pessoa</b><span>Escolha alguém na lista para aprovar o acesso, mudar funções e obras ou redefinir a senha.</span></div></section>`;
  const F=S.usr.form, eu=p.login===REAL_USER, [cls,stl]=STATUS_USR[p.status], sug=usrSugestao(p);
  const funcoes=PERMS.filter(f=>f!=="admin").map(f=>`<button class="fck-row usr-fn" data-act="usrfn" data-v="${f}" aria-pressed="${F.funcoes.includes(f)}"><span class="fck ${F.funcoes.includes(f)?"on":""}">${IC.check}</span><span><b>${esc(PERM_NOME[f])}</b><small class="muted">${esc(PERM_DESC[f]||"")}</small></span></button>`).join("");
  const obras=[...DB.obras].sort((a,b)=>a.ordem-b.ordem).map(o=>`<button class="fck-row" data-act="usrob" data-id="${o.id}" aria-pressed="${F.obras.includes(o.id)}"><span class="fck ${F.obras.includes(o.id)?"on":""}">${IC.check}</span><span>${esc(o.nome)}${o.ativa===false?` <span class="muted small">(inativa)</span>`:""}</span></button>`).join("");
  const adminMarcado=F.funcoes.includes("admin");
  return `<section class="panel cli-detail open usr-detail">
    <div class="row"><span class="pill s-${cls}">${stl}</span>${p.pedido_senha?`<span class="pill s-warn">Pediu nova senha em ${fmtDTL(new Date(p.pedido_senha))}</span>`:""}<span class="spacer"></span><button class="iconbtn" data-act="usrfechar" aria-label="Fechar">${IC.close}</button></div>
    <div class="perfil-head">${avatar(p.nome,p.foto,"big")}<div><h2 class="h2" style="font-size:1.35rem;margin:0">${esc(p.nome)}</h2><div class="muted">${esc(p.email)}</div>
      <div class="small muted">Login: <b>${esc(p.login)}</b> · pediu acesso em ${fmtDTL(new Date(p.criado_em))}${p.aprovado_em?` · aprovado em ${fmtData(new Date(p.aprovado_em))}${p.aprovado_por?` por ${esc(p.aprovado_por)}`:""}`:""}</div></div></div>
    <div><div class="row"><h3 class="h3" style="margin:0">Funções</h3><span class="spacer"></span>${sug?`<span class="small muted">No app antigo: <b>${esc(sug.map(f=>PERM_NOME[f]||f).join(", "))}</b></span><button class="btn sm ghost" data-act="usrsug">Usar</button>`:""}</div>
      <div class="usr-grid">${funcoes}</div></div>
    <div><div class="row"><h3 class="h3" style="margin:0">Obras</h3><span class="small muted">${adminMarcado?"Admin vê todas as obras.":`${F.obras.length} marcada(s)`}</span><span class="spacer"></span><button class="btn sm ghost" data-act="usrtodas">${F.obras.length===DB.obras.length?"Desmarcar todas":"Marcar todas"}</button></div>
      <div class="usr-grid obras">${obras}</div></div>
    <div class="usr-acts">${eu?`<span class="small muted">Este é o seu acesso. Para mudar as suas funções, peça a outro admin.</span>`:
      p.status==="pendente"?`<button class="btn bad" data-act="usrstatus" data-v="bloqueado">Recusar</button><button class="btn primary" data-act="usrsalvar">Aprovar acesso</button>`
      :p.status==="aprovado"?`<button class="btn dark" data-act="usrstatus" data-v="bloqueado">Bloquear</button><button class="btn primary" data-act="usrsalvar">Salvar alterações</button>`
      :`<button class="btn primary" data-act="usrsalvar">Desbloquear e salvar</button>`}</div>
    ${p.status!=="pendente"&&!eu?`<div class="usr-senha"><h3 class="h3" style="margin:0">Senha provisória</h3><span class="small muted">Defina uma senha e passe para a pessoa. No primeiro login com ela, o app pede para a pessoa criar uma senha própria.</span>
      ${S.usr.ultima&&S.usr.ultima.id===p.id?`<div class="auth-msg ok">Senha provisória definida: <b class="tnum" style="user-select:all">${esc(S.usr.ultima.senha)}</b> <button class="linkbtn" data-act="usrcopiar">Copiar</button><br><span style="font-weight:400">Passe para ${esc(p.nome.split(" ")[0])} por um canal seguro (WhatsApp, pessoalmente).</span></div>`:""}
      <div class="row"><input class="inp" id="usr-senha" value="${esc(F.senha)}" placeholder="Nova senha" autocomplete="off" style="flex:1;min-width:144px"><button class="btn ghost" data-act="usrgerar">Gerar</button><button class="btn info" data-act="usrsenha">Definir senha</button></div></div>`:""}
  </section>`;
}
function gerarSenha(){ const L="abcdefghjkmnpqrstuvwxyz", N="23456789"; let s="Rottas-"; for(let i=0;i<3;i++) s+=L[Math.floor(Math.random()*L.length)]; for(let i=0;i<3;i++) s+=N[Math.floor(Math.random()*N.length)]; return s; }

/* ---------- eventos ---------- */
document.addEventListener("click",async e=>{
  const el=e.target.closest("[data-act]"); if(!el) return;
  const act=el.dataset.act, U=S.usr;
  const run={
    authtela(){ S.auth={tela:el.dataset.v,email:(document.querySelector('input[type="email"]')||{}).value||""}; },
    async authverificar(){ await posLogin(); },
    async sair(){ await sair(); },
    senhamodal(){ S.senhaModal={erro:""}; },
    senhafechar(){ S.senhaModal=null; },
    async verass(){ await API.verAssinatura(+el.dataset.id); },
    async anexo(){ await API.abrirAnexo(el.dataset.path); },
    async usuarios(){ S.adminPanel=false; if(S.screen!=="usuarios") U.voltar=S.obraId?S.screen:"home"; S.screen="usuarios"; S.nav=false; S.navObras=false; S.popup=null; U.sel=null; render();
      try{ await API.carregarUsuarios(); }catch(err){ toast("Erro","Não foi possível carregar os usuários",msgErro(err)); } },
    usrvoltar(){ S.screen=U.voltar&&S.obraId?U.voltar:"home"; U.sel=null; },
    async usrrecarregar(){ try{ await API.carregarUsuarios(); toast("Sucesso","Lista atualizada"); }catch(err){ toast("Erro","Não foi possível atualizar",msgErro(err)); } },
    usraba(){ U.aba=el.dataset.v; U.sel=null; },
    usrsel(){ U.sel=el.dataset.uid; U.ultima=null; usrIniciarForm(usrSel()); },
    usrfechar(){ U.sel=null; },
    usrfn(){ const f=el.dataset.v, L=U.form.funcoes; U.form.funcoes=L.includes(f)?L.filter(x=>x!==f):[...L,f]; },
    usrob(){ const id=+el.dataset.id, L=U.form.obras; U.form.obras=L.includes(id)?L.filter(x=>x!==id):[...L,id]; },
    usrtodas(){ U.form.obras=U.form.obras.length===DB.obras.length?[]:DB.obras.map(o=>o.id); },
    usrsug(){ U.form.funcoes=[...usrSugestao(usrSel())]; },
    usrgerar(){ U.form.senha=gerarSenha(); },
    async usrcopiar(){ try{ await navigator.clipboard.writeText(U.ultima.senha); toast("Sucesso","Senha copiada"); }catch(_){ toast("Aviso","Não deu para copiar","Selecione a senha e copie manualmente."); } },
    async usrsalvar(){ const p=usrSel(); if(!U.form.funcoes.length){ toast("Erro","Marque pelo menos uma função"); return; }
      if(!U.form.funcoes.includes("admin")&&!U.form.obras.length){ toast("Erro","Marque pelo menos uma obra"); return; }
      const era=p.status;
      try{ await API.admin("admin_aprovar",{p_id:p.id,p_funcoes:U.form.funcoes,p_obras:U.form.obras});
        toast("Sucesso",era==="pendente"?"Acesso aprovado":"Acesso salvo",p.nome); if(era==="pendente") U.sel=null; }
      catch(err){ toast("Erro","Não foi possível salvar",msgErro(err)); } },
    async usrstatus(){ const p=usrSel(), v=el.dataset.v;
      try{ await API.admin("admin_status",{p_id:p.id,p_status:v}); toast("Sucesso",v==="bloqueado"?(p.status==="pendente"?"Pedido recusado":"Acesso bloqueado"):"Status alterado",p.nome); U.sel=null; }
      catch(err){ toast("Erro","Não foi possível alterar",msgErro(err)); } },
    async usrsenha(){ const p=usrSel(), s=(document.getElementById("usr-senha")||{}).value||"";
      if(s.length<8){ toast("Erro","A senha precisa ter pelo menos 8 caracteres"); return; }
      try{ await API.admin("admin_redefinir_senha",{p_id:p.id,p_senha:s}); U.form.senha=""; U.ultima={id:p.id,senha:s}; toast("Sucesso","Senha provisória definida",p.nome); }
      catch(err){ toast("Erro","Não foi possível definir a senha",msgErro(err)); } }
  }[act];
  if(!run) return;
  e.preventDefault(); e.stopImmediatePropagation();
  await run(); render();
},true);

document.addEventListener("input",e=>{
  const t=e.target;
  if(t.dataset.ubind==="busca"){ S.usr.busca=t.value; render(); }
  if(t.id==="usr-senha"&&S.usr.form) S.usr.form.senha=t.value;
});

document.addEventListener("submit",async e=>{
  const f=e.target.dataset.form; if(!["login","criar","esqueci","novasenha","primeirasenha"].includes(f)) return;
  e.preventDefault();
  const vals={}; e.target.querySelectorAll("input").forEach(i=>vals[i.id]=i.value);   // lê tudo antes de redesenhar a tela
  const v=id=>vals[id]||"";
  const A=S.auth, falha=m=>{ S.auth={...S.auth,erro:m,msg:"",enviando:false}; render(); };
  if(f==="novasenha"){
    const s=v("n-senha"); if(s.length<8){ S.senhaModal.erro="A senha precisa ter pelo menos 8 caracteres."; render(); return; }
    if(s!==v("n-senha2")){ S.senhaModal.erro="As duas senhas não são iguais."; render(); return; }
    const { error } = await sb.auth.updateUser({ password:s });
    if(error){ S.senhaModal.erro=traduzAuth(error); render(); return; }
    S.senhaModal=null; toast("Sucesso","Senha alterada"); render(); return;
  }
  if(f==="primeirasenha"){
    const s=v("p-senha"), falhaP=m=>{ S.auth={tela:"trocarsenha",erro:m}; render(); };
    if(s.length<8) return falhaP("A senha precisa ter pelo menos 8 caracteres.");
    if(s!==v("p-senha2")) return falhaP("As duas senhas não são iguais.");
    if(s==="Rottas@2026") return falhaP("Escolha uma senha diferente da senha inicial.");
    S.auth={tela:"trocarsenha",enviando:true}; render();
    const { error } = await sb.auth.updateUser({ password:s });
    if(error) return falhaP(traduzAuth(error));
    const r = await sb.rpc("senha_trocada");
    if(r.error) return falhaP(msgErro(r.error));
    toast("Sucesso","Senha criada"); await posLogin(); return;
  }
  const email=v(f==="login"?"a-email":f==="criar"?"c-email":"e-email").trim().toLowerCase();
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return falha("Informe um e-mail válido.");
  S.auth={...A,email,erro:"",msg:"",enviando:true}; render();
  if(f==="login"){
    const { error } = await sb.auth.signInWithPassword({ email, password:v("a-senha") });
    if(error) return falha(traduzAuth(error));
    await posLogin(); return;
  }
  if(f==="criar"){
    const nome=v("c-nome").trim().replace(/\s+/g," "), s=v("c-senha");
    if(nome.split(" ").length<2) return falha("Informe o nome e o sobrenome.");
    if(s.length<8) return falha("A senha precisa ter pelo menos 8 caracteres.");
    if(s!==v("c-senha2")) return falha("As duas senhas não são iguais.");
    const { data, error } = await sb.auth.signUp({ email, password:s, options:{ data:{ nome } } });
    if(error) return falha(traduzAuth(error));
    if(!data.session){ S.auth={tela:"entrar",email,msg:"Pedido criado. Se chegou um e-mail de confirmação, confirme e depois entre aqui."}; render(); return; }
    await posLogin(); return;
  }
  if(f==="esqueci"){
    const { error } = await sb.rpc("pedir_nova_senha",{ p_email:email });
    if(error) return falha(msgErro(error));
    S.auth={tela:"esqueci",email,msg:"Pronto! O administrador foi avisado. Ele vai definir uma senha provisória e te passar."}; render();
  }
});
