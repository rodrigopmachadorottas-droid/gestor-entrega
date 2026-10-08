/* ================= ÍCONES ================= */
const sv=(d,fill)=>`<svg viewBox="0 0 24 24" fill="${fill?"currentColor":"none"}" stroke="${fill?"none":"currentColor"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const IC={
  menu:sv('<path d="M3 6h18M3 12h18M3 18h18"/>'),
  filter:sv('<path d="M3 4h18l-7 8.5V19l-4 2v-8.5z"/>',1),
  search:sv('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  close:sv('<path d="M6 6l12 12M18 6L6 18"/>'),
  back:sv('<path d="M19 12H5M11 18l-6-6 6-6"/>'),
  key:sv('<circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3L20 3M16 7l3 3M14 9l2 2"/>'),
  hammer:sv('<path d="M14 6l4 4-9.5 9.5a2.1 2.1 0 01-3-3z"/><path d="M13 5l2-2 6 6-2 2"/>'),
  chart:sv('<path d="M5 20V12M10 20V8M15 20V4M20 20v-6"/>'),
  calendar:sv('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  building:sv('<path d="M4 21V5l8-2v18M12 21V9l8 2v10M2 21h20M7 8h2M7 12h2M7 16h2M15 13h2M15 17h2"/>'),
  users:sv('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14.5c2.6.2 4.4 1.9 5 5"/>'),
  clock:sv('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  sun:sv('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  moon:sv('<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>'),
  sync:sv('<path d="M20 11a8 8 0 00-14.3-4.3L4 9M4 4v5h5M4 13a8 8 0 0014.3 4.3L20 15M20 20v-5h-5"/>'),
  lock:sv('<path d="M7 10V7a5 5 0 0110 0v3h1.5a1 1 0 011 1v9a1 1 0 01-1 1h-13a1 1 0 01-1-1v-9a1 1 0 011-1zm2.5 0h5V7a2.5 2.5 0 00-5 0z"/>',1),
  check:sv('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  x:sv('<path d="M7 7l10 10M17 7L7 17"/>'),
  arrow:sv('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  undo:sv('<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 010 11H11"/>'),
  user:sv('<circle cx="12" cy="7.5" r="4"/><path d="M4 21c.8-4.3 4-6.5 8-6.5s7.2 2.2 8 6.5"/>',0),
  phone:sv('<path d="M5 3h4l2 5-2.5 1.5a11 11 0 005 5L15 12l5 2v4a2 2 0 01-2 2A16 16 0 013 5a2 2 0 012-2z"/>'),
  at:sv('<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-4 8"/>'),
  bookmark:sv('<path d="M6 3h12v18l-6-4-6 4z"/>',1),
  plus:sv('<path d="M12 5v14M5 12h14"/>'),
  trash:sv('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  edit:sv('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),
  chevL:sv('<path d="M15 18l-6-6 6-6"/>'), chevR:sv('<path d="M9 18l6-6-6-6"/>'), chevD:sv('<path d="M6 9l6 6 6-6"/>'), chevU:sv('<path d="M6 15l6-6 6 6"/>'),
  dots:sv('<circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>',1),
  clip:sv('<path d="M20 11.5l-8.2 8.2a5 5 0 01-7-7L13 4.4a3.3 3.3 0 014.7 4.7l-8.2 8.2a1.7 1.7 0 01-2.4-2.4l7.5-7.5"/>'),
  logout:sv('<path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3"/><path d="M10 17l-5-5 5-5"/><path d="M5 12h11"/>'),
  camera:sv('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
  info:sv('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'),
  pdf:sv('<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>'),
  upload:sv('<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"/>'),
  money:sv('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>')
};
const VERSAO="v2.1.5";
const MOV_IC={ok:["var(--ok)",IC.check],bad:["var(--bad)",IC.x],info:["var(--info)",IC.arrow],primary:["var(--primary)",IC.arrow],neutral:["var(--fg-3)",IC.undo]};

/* ================= ESTADO DE TELA ================= */
let REAL_USER="";
const S={conf:null,homeInd:null,adminPanel:false,simSel:"",menuAcoes:false,user:"",auth:{tela:null},usr:{aba:"pendentes",sel:null,busca:"",form:null,senha:""},usrData:null,carregando:"",senhaModal:null,obraId:null,screen:"home",nav:false,navObras:false,drawer:false,busca:"",popup:null,ag:null,lote:{on:false,q:[]},
  fil:null,acBusca:"",ind:{visao:"Visão Unidades",etapa:"lib",fil:null,ini:"",fim:"",fechado:{}},agd:null,loc:{localId:null,n2:null,modal:null,cfgAberta:false},
  cli:{aba:"vinc",ubusca:"",filtro:"todas",und:null,q:"",novo:false,nform:{nome:"",telefone:"",email:""},busca:"",edit:null,form:{nome:"",telefone:"",email:""},del:false},hor:null,toasts:[],confirmReset:false,dark:false,locAba:"und"};
const ME=()=>userByLogin(S.user);
const OBRA=()=>obraById(S.obraId);
function filtrosPadrao(u){ return {extras:false,f1:can(u,"admin","obra","instalacoes"),f2:can(u,"admin","obra","qualidade","rc"),f3:can(u,"admin","rc","financeiro"),blocos:[]}; }
function fasesVisiveis(u){ return {extras:can(u,"admin","lider"),f1:can(u,"admin","obra","instalacoes","qualidade"),f2:can(u,"admin","obra","qualidade","rc"),f3:can(u,"admin","obra","qualidade","rc","financeiro")}; }
function resetFiltros(){ const u=ME(); S.fil=filtrosPadrao(u); S.ind.fil=filtrosPadrao(u); S.ind.fil.blocos=[]; S.ind.ini=""; S.ind.fim=""; }

function toast(tipo,txt,sub){ const id=Math.random(); S.toasts.push({id,tipo,txt,sub}); if(S.toasts.length>4) S.toasts.shift(); renderToasts(); setTimeout(()=>{S.toasts=S.toasts.filter(t=>t.id!==id); renderToasts();},3800); }
function renderToasts(){ const el=document.getElementById("toasts"); if(!el) return; const cor={Sucesso:"var(--ok)",Erro:"var(--bad)",Aviso:"var(--warn)",Info:"var(--info)"};
  el.innerHTML=S.toasts.map(t=>`<div class="toast" role="status"><i style="background:${cor[t.tipo]||"var(--info)"}"></i><div><b>${esc(t.txt)}</b>${t.sub?`<span class="small muted">${esc(t.sub)}</span>`:""}</div></div>`).join(""); }

/* ================= COMPONENTES COMUNS ================= */
function topbar(titulo,right=""){
  return `<header class="topbar"><button class="iconbtn" data-act="nav" aria-label="Abrir menu">${IC.menu}</button><h1>${esc(titulo)}</h1>${right}</header><div class="topspace"></div>`;
}
function filtroBtn(n){ return `<button class="iconbtn" data-act="drawer" aria-label="Filtros">${IC.filter}${n?`<span class="badge">${n}</span>`:""}</button>`; }
function buscaBox(id,val,ph){ return `<label class="search">${IC.search}<input id="${id}" data-bind="${id}" value="${esc(val)}" placeholder="${esc(ph)}" autocomplete="off"></label>`; }
function pill(v,extra=""){ if(blank(v)) return ""; return `<span class="pill s-${stClass(v)||"neutral"} ${extra}">${esc(v)}</span>`; }
const AV_CORES=["#E8590C","#1971C2","#2B8A3E","#9C36B5","#C2255C","#0C8599","#5F3DC4","#B35C00","#3B5BDB","#5C940D","#A61E4D","#087F5B"];
function corAvatar(nome){ let h=0; for(const ch of String(nome||"")) h=(h*31+ch.charCodeAt(0))>>>0; return AV_CORES[h%AV_CORES.length]; }
function avatar(nome,foto,cls=""){ const p=String(nome||"?").trim().split(/\s+/);
  if(foto) return `<span class="avatar ${cls}"><img src="${esc(foto)}" alt=""></span>`;
  return `<span class="avatar ${cls}" style="background:${corAvatar(nome)}">${esc(((p[0]||"")[0]||"")+(p.length>1?p[p.length-1][0]:""))}</span>`; }
const avatarU=(u,cls="")=>avatar(u&&u.nome,u&&u.foto,cls);
function saudacao(){ const h=new Date().getHours(); return h<12?"Bom dia":h<18?"Boa tarde":"Boa noite"; }
const nomeCurto=n=>{const p=String(n).split(" "); return p.length<=2?n:p[0]+" "+p[p.length-1];};

/* ================= TELA: SELETOR DE OBRA ================= */
function telaHome(){
  const u=ME();
  const obras=[...DB.obras].filter(o=>o.ativa!==false||can(u,"admin")).sort((a,b)=>a.ordem-b.ordem);
  const acesso=o=>can(u,"admin")||(", "+o.usuarios+", ").includes(", "+u.login+", ");
  return `<div class="home-z"><div class="home-top"><div class="wrap"><b>Controle das Unidades | Excelência Operacional</b><span class="home-ola"><b>${saudacao()}, ${esc(u.nome.split(" ")[0])}!</b>${topoAcoes()}</span></div></div>
  <section class="home-hero">
    <button class="logo-btn" data-act="adminpanel" aria-label="Gestor de Entrega"><img class="logo" src="${isDark()?LOGOS.branca:LOGOS.preta}" alt="Gestor de Entrega"></button>
    ${podeIndGerais(u)?`<button class="iconbtn home-dash ${S.homeInd?"on":""}" data-act="homeind" aria-label="Indicadores gerais das obras" title="Indicadores gerais">${io("indicadores")}</button>`:""}
  </section>
  <main class="home-body wrap"><h2>Obras</h2><div class="obras">
  ${obras.map(o=>{const ok=acesso(o); return `<button class="obra" data-act="obra" data-id="${o.id}" ${ok?"":"disabled"} aria-label="${esc(o.nome)}">
    <div class="foto">${fotoObra(o)?`<img src="${fotoObra(o)}" alt="" loading="lazy">`:`<canvas data-foto="${o.id}" width="300" height="282"></canvas>`}${ok?"":`<span class="lock">${IC.lock}</span>`}</div>
    <div class="info"><b>${esc(o.nome)}</b><span>${esc(o.cidade)}</span></div></button>`;}).join("")}
  </div></main></div>
  <div class="rottas-tab" aria-hidden="true"><img src="${LOGOS.rottas}" alt=""></div>${painelAdmin()}${S.homeInd?popupIndGerais():""}`;
}
function desenharFotos(){
  document.querySelectorAll("canvas[data-foto]").forEach(cv=>{
    const o=obraById(+cv.dataset.foto), g=cv.getContext("2d"), W=cv.width,H=cv.height, R=rng(o.id*977), h=o.hue;
    const sky=g.createLinearGradient(0,0,0,H); sky.addColorStop(0,`hsl(${h+180},45%,78%)`); sky.addColorStop(1,`hsl(${h+200},40%,92%)`); g.fillStyle=sky; g.fillRect(0,0,W,H);
    g.fillStyle=`hsl(${h+60},28%,62%)`; g.beginPath(); g.moveTo(0,H*.62); for(let x=0;x<=W;x+=30) g.lineTo(x,H*.58+Math.sin(x/40+o.id)*8); g.lineTo(W,H); g.lineTo(0,H); g.fill();
    if(o.config.tipo==="predio"){
      const n=3+Math.floor(R()*2);
      for(let i=0;i<n;i++){ const bw=W/(n+.6), x=i*bw*1.05+10+R()*8, bh=H*(.42+R()*.25), y=H*.78-bh;
        g.fillStyle=`hsl(${h},${18+R()*10}%,${82-i*4}%)`; g.fillRect(x,y,bw*.86,bh);
        g.fillStyle=`hsl(${h},70%,55%)`; g.fillRect(x+bw*.36,y,bw*.12,bh);
        g.fillStyle=`hsl(${h+190},25%,40%)`; for(let r=y+10;r<y+bh-14;r+=16) for(let c=x+6;c<x+bw*.8-4;c+=14) if(Math.abs(c-(x+bw*.42))>9) g.fillRect(c,r,7,8); }
    } else {
      for(let row=0;row<3;row++) for(let i=0;i<6;i++){ const s=.55+row*.22, x=i*W/5.2-10+row*14, y=H*(.5+row*.12), w=46*s,hh=30*s;
        g.fillStyle=`hsl(${h+20},20%,${88-row*5}%)`; g.fillRect(x,y,w,hh);
        g.fillStyle=`hsl(${h},55%,${48+row*4}%)`; g.beginPath(); g.moveTo(x-4,y); g.lineTo(x+w/2,y-hh*.55); g.lineTo(x+w+4,y); g.fill(); }
    }
    g.fillStyle=`hsl(${h+70},30%,45%)`; g.fillRect(0,H*.86,W,H*.14);
  });
}

function obrasDoUsuario(u){ return DB.obras.filter(o=>can(u,"admin")||(", "+o.usuarios+", ").includes(", "+u.login+", ")); }
function podeIndGerais(u){ return obrasDoUsuario(u).length>1&&opcoesGerais(u).length>0; }
/* ================= MENU LATERAL ================= */
function menuLateral(){
  if(!S.nav) return "";
  const u=ME(), it=(id,ic,txt,ok=true)=>ok?`<button class="sb-item ${S.screen===id?"on":""}" data-act="ir" data-to="${id}">${io(id)}${txt}</button>`:"";
  const cfg=[it("locais","building","Locais",can(u,"admin")),it("clientes","users","Clientes",podeCadastrarClientes(u)),it("horarios","clock","Horários",can(u,"admin","obra","qualidade"))].join("");
  const obrasAcesso=DB.obras.filter(o=>can(u,"admin")||(", "+o.usuarios+", ").includes(", "+u.login+", "));
  return `<div class="scrim" data-act="navclose"></div><aside class="sidebar" aria-label="Menu">
    <div class="sb-head"><button class="logo-btn" data-act="home" aria-label="Voltar para as obras"><img src="${isDark()?LOGOS.branca:LOGOS.preta}" alt="Gestor de Entrega"></button><button data-act="ir" data-to="versoes">${VERSAO}</button></div>
    <nav class="sb-nav">
      <div class="sb-sec">EXECUÇÃO</div>${it("unidades","key","Unidades")}${it("areas","hammer","Áreas Comuns",DB.areas.some(a=>a.id_obra===S.obraId))}
      <div class="sb-sec">GESTÃO À VISTA</div>${it("indicadores","chart","Indicadores")}${it("agenda","calendar","Agenda",can(u,"admin","obra","qualidade","rc"))}${itemLaudos()}
      ${cfg?`<div class="sb-sec">CONFIGURAÇÕES</div>${cfg}`:""}
    </nav>
    <div class="sb-foot">
      <div class="seg temaseg" role="group" aria-label="Tema"><button class="${isDark()?"":"on"}" data-act="tema" data-v="light">${io("sun")}Light</button><button class="${isDark()?"on":""}" data-act="tema" data-v="dark">${io("moon")}Dark</button></div>
      <button class="btn dark" data-act="sync">${io("sync")}Sincronizar</button>
      <div class="sb-userrow"><button class="sb-user" data-act="ir" data-to="perfil" aria-label="Abrir meu perfil">${avatarU(u)}<div class="sb-user-t"><b>${esc(nomeCurto(u.nome))}</b><div class="small muted">${esc(u.login)}</div></div></button>
        ${MODO_DEMO?"":`<button class="iconbtn sb-sair" data-act="sair" aria-label="Sair do app" title="Sair">${IC.logout}</button>`}</div>
    </div>
    <button class="sb-obra" data-act="navobras">Obra: ${esc(OBRA().nome)} ${S.navObras?"▴":"▾"}</button>
  </aside>
  ${S.navObras?`<div class="obrapop" role="listbox" aria-label="Trocar de obra">${obrasAcesso.map(o=>`<button class="${o.id===S.obraId?"on":""}" role="option" aria-selected="${o.id===S.obraId}" data-act="trocaobra" data-id="${o.id}">${esc(o.nome)}</button>`).join("")}</div>`:""}`;
}
function painelAdmin(){
  if(!S.adminPanel) return "";
  const nU=MODO_DEMO?0:API.usrPendentes();
  return `<div class="scrim" data-act="adminpanel"></div><aside class="adminpanel" aria-label="Configurações Admin">
    <h2>Configurações Admin</h2>
    <h3 class="ap-sub">Simular acesso</h3>
    <select id="sim-user" class="inp" data-act-change="simsel" aria-label="Usuário"><option value="">Selecione o usuário</option>${DB.usuarios.map(x=>`<option value="${x.login}" ${x.login===S.simSel?"selected":""}>${esc(x.nome)} · ${x.perms.includes("admin")?"Admin":esc(x.perms.map(p=>PERM_NOME[p]).join(", "))}</option>`).join("")}</select>
    <button class="btn primary" data-act="simular">Simular Acesso</button>
    ${S.user!==REAL_USER?`<p class="small muted" style="margin:0">Simulando: <b>${esc(ME().nome)}</b></p><button class="btn ghost sm" data-act="simvoltar">Voltar para o meu acesso</button>`:""}
    ${MODO_DEMO?"":`<h3 class="ap-sub">Usuários</h3><button class="btn dark ap-usr" data-act="usuarios">${IC.users}Gerenciar usuários${nU?`<span class="sb-badge">${nU}</span>`:""}</button>`}
    <button class="iconbtn temabtn" data-act="tema" aria-label="${isDark()?"Usar tema claro":"Usar tema escuro"}">${isDark()?io("moon"):io("sun")}</button>
    <span class="spacer"></span>
    ${MODO_DEMO?`<div class="proto"><span class="eyebrow">Modo demonstração</span><span class="small muted">Dados fictícios. As alterações ficam só neste navegador.</span>
      <button class="btn sm ${S.confirmReset?"bad":"ghost"}" data-act="reset">${S.confirmReset?"Confirmar: apagar alterações":"Restaurar dados de teste"}</button></div>`
      :`<div class="proto"><span class="eyebrow">Simulação</span><span class="small muted">Mostra as telas e botões como a pessoa vê. As ações que você fizer simulando ficam registradas no seu nome.</span></div>`}
  </aside>`;
}

/* ================= TELA: UNIDADES ================= */
// "101" acha em todos os blocos; "A101", "a 101" ou "a-101" acha só no Bloco A
function bateBusca(x,q){
  if(!q) return true; if(x.unidade.toLowerCase().includes(q)) return true;
  const m=/^([a-z])\s*-?\s*(\d+)$/i.exec(q); if(!m) return false;
  const bloco=nivel1Nome(x).toLowerCase(); return (bloco.endsWith(" "+m[1].toLowerCase())||bloco===m[1].toLowerCase())&&x.unidade.toLowerCase().includes(m[2]);
}
function unidadesObra(){ return DB.unidades.filter(u=>u.id_obra===S.obraId); }
function ordenarUnidades(arr){ return arr.sort((a,b)=>nivel1Nome(a).localeCompare(nivel1Nome(b))||((a.nivel_2||0)-(b.nivel_2||0))||(numUnd(a.unidade)-numUnd(b.unidade))); }
function blocosObra(){ return DB.locais.filter(l=>l.id_obra===S.obraId).map(l=>l.nivel1).sort(); }
function colunasUnidades(){
  const u=ME(), cfg=OBRA().config, f=S.fil, C=[];
  if(f.extras){ C.push({h:"Fase",v:x=>FASES[(ETAPA[x.sub_etapa]||{}).f]||"",plain:1}); C.push({h:"Etapa",v:x=>(ETAPA[x.sub_etapa]||{}).n||"",plain:1}); C.push({h:"Cliente",v:x=>{const c=clienteById(x.id_cliente); return c?tituloCase(c.nome):"-";},plain:1,l:1}); }
  if(f.f1){ cfg.testes.forEach(k=>{const te=TESTES.find(t=>t.k===k); C.push({h:te.nome,col:te.col,v:x=>x[te.col],teste:1});});
    if(can(u,"admin","obra","qualidade")) C.push({h:"Finalizando Unidade",v:x=>x.sub_etapa===3?"Pendente":x.sub_etapa>=4?"Concluído":""}); }
  if(f.f2){ C.push({h:"Vistoria Qualidade",v:x=>x.rep_vistoria_at});
    if(cfg.previa) C.push({h:"Vistoria Prévia",v:x=>x.rep_vistoria_previa});
    C.push({h:"Agendamento RC",v:x=>x.agendamento}); C.push({h:"Vistoria Cliente",v:x=>x.rep_vistoria_cliente}); }
  if(f.f3){ C.push({h:"Análise Financeira",v:x=>x.sub_etapa>=8?x.financeiro_status||"Pendente":""}); C.push({h:"Entrega Chaves",v:x=>x.sub_etapa===10?"Pendente":x.sub_etapa===11?"Concluído":""}); }
  return C;
}
function telaUnidades(){
  const cfg=OBRA().config, f=S.fil, casa=cfg.tipo==="casa";
  const q=S.busca.trim().toLowerCase();
  const us=ordenarUnidades(unidadesObra().filter(x=>bateBusca(x,q)&&(!f.blocos.length||f.blocos.includes(nivel1Nome(x)))));
  const C=colunasUnidades(), podeLote=can(ME(),"obra")&&f.f1;
  const nFil=(f.extras?0:1)+(f.f1?0:1)+(f.f2?0:1)+(f.f3?0:1)+(f.blocos.length?1:0);
  const lote=S.lote.on?`<div class="lotebar"><b>Liberação em lote</b><span class="small">Toque nas células vazias de teste para marcar. ${S.lote.q.length} selecionada(s).</span><span class="spacer"></span>
      <button class="btn ghost sm" data-act="lotecancel">Cancelar</button><button class="btn primary sm" data-act="lotesalvar" ${S.lote.q.length?"":"disabled"}>Liberar ${S.lote.q.length||""}</button></div>`
    :"";
  const acoes=[podeLote?`<button data-act="loteon">${IC.key}<span><b>Liberar testes em lote</b><small>Marque várias células vazias e libere de uma vez</small></span></button>`:""].filter(Boolean);
  const menu=acoes.length?`<div class="dd-wrap"><button class="iconbtn" data-act="menuacoes" aria-label="Mais ações" aria-expanded="${!!S.menuAcoes}">${IC.dots}</button>${S.menuAcoes?`<div class="dd-scrim" data-act="menuacoes"></div><div class="dropdown" role="menu">${acoes.join("")}</div>`:""}</div>`:"";
  const fz=casa?["fz fz1","","fz fz3 fzl"]:["fz fz1","fz fz2","fz fz3 fzl"];
  const body=us.length?`<div class="tablewrap"><table class="grid ${casa?"casa":""}"><thead><tr><th class="${fz[0]}">${casa?"Quadra":"Bloco"}</th>${casa?"":`<th class="${fz[1]}">Pav</th>`}<th class="${fz[2]}">${casa?"Casa":"Und"}</th>${C.map(c=>`<th>${esc(c.h)}</th>`).join("")}</tr></thead><tbody>
    ${us.map(x=>`<tr data-act="${S.lote.on?"":"abrirund"}" data-id="${x.id}"><td class="${fz[0]}">${esc(nivel1Nome(x).replace(/^(Bloco|Quadra) /,""))}</td>${casa?"":`<td class="${fz[1]}">${esc(nivel2Nome(x).replace(" Pavimento",""))}</td>`}<td class="${fz[2]}"><b>${esc(x.unidade.replace(/^(AP|CASA) /,""))}</b></td>
      ${C.map(c=>{const v=c.v(x)||""; if(c.plain) return `<td class="${c.l?"l":""}">${esc(v)}</td>`;
        const q=S.lote.on&&c.teste&&S.lote.q.some(z=>z.id===x.id&&z.col===c.col);
        const clic=S.lote.on&&c.teste&&blank(v)?` data-act="lotecell" data-id="${x.id}" data-col="${c.col}" style="cursor:copy"`:"";
        return `<td class="c-st ${q?"queued":stClass(v)}"${clic}>${q?"Liberar":esc(v)}</td>`;}).join("")}</tr>`).join("")}
  </tbody></table></div>`:`<div class="panel empty"><b>Nenhuma unidade encontrada</b><span>Mude o filtro ou a busca e tente de novo.</span></div>`;
  return topbar("Unidades",buscaBox("busca",S.busca,OBRA().config.tipo==="casa"?"Pesquisar casa":"Pesquisar (ex.: 101 ou A101)")+menu+filtroBtn(nFil))+`<main class="screen unid">${lote}${body}</main>`+drawerUnidades();
}
function blocosDD(sel,act){
  const casa=OBRA().config.tipo==="casa", L=blocosObra(), txt=sel.length?sel.join(", "):"Selecione";
  return `<div class="fsec"><b class="flbl">${casa?"Quadras":"Blocos"}</b><div class="dd2"><button class="dd2-btn ${sel.length?"":"ph"}" data-act="ddbloco" aria-expanded="${!!S.ddBloco}"><span>${esc(txt)}</span>${IC.chevD}</button>
    ${S.ddBloco?`<div class="dd2-list">${L.map(b=>`<button data-act="${act}" data-b="${esc(b)}" class="fck-row"><span class="fck ${sel.includes(b)?"on":""}">${IC.check}</span>${esc(b)}</button>`).join("")}</div>`:""}</div></div>`;
}
function fck(id,attr,on,label){ return `<label class="fck-row" for="${id}"><input type="checkbox" id="${id}" ${attr} ${on?"checked":""} hidden><span class="fck ${on?"on":""}">${IC.check}</span>${label}</label>`; }
function drawerShell(body,limparAct){
  return `<div class="scrim" data-act="drawer"></div><aside class="drawer f2" aria-label="Filtros"><div class="row"><h2>Filtros</h2><span class="spacer"></span><button class="iconbtn" data-act="drawer" aria-label="Fechar">${IC.close}</button></div>
    <div class="body">${body}</div><button class="btn primary f2-go" data-act="drawer">${IC.filter}Filtrar</button><button class="f2-clear" data-act="${limparAct}">Limpar tudo</button></aside>`;
}
function drawerUnidades(){
  if(!S.drawer) return "";
  const v=fasesVisiveis(ME()), f=S.fil;
  const ck=(k,t)=>v[k]?fck("f-"+k,`data-fil="${k}"`,f[k],t):"";
  return drawerShell(`<div class="fsec"><b class="flbl">Fases</b>${ck("extras","Informações Extras")}${ck("f1","Produção")}${ck("f2","Vistorias")}${ck("f3","Entrega")}</div><hr>${blocosDD(f.blocos,"filbloco")}`,"limparfil");
}

/* ================= POPUP DA UNIDADE ================= */
function popupUnidade(){
  const x=DB.unidades.find(u=>u.id===S.popup.id), u=ME();
  const secs=secoesUnidade(x,u,S.fil);
  const fin=x.financeiro_status?`<div class="row" style="margin-top:7.2px">${pill("Financeiro "+x.financeiro_status).replace("s-neutral","s-"+(x.financeiro_status==="Liberado"?"ok":x.financeiro_status==="Bloqueado"?"bad":"warn"))}<span class="muted">${esc(x.financeiro_motivo)}</span></div>`:"";
  if(S.ag&&S.ag.id===x.id) return `<div class="modal" role="dialog" aria-modal="true" aria-label="Agendar vistoria"><div class="scrim" data-act="fecharpop"></div><div class="box tall">${agendaTab()}</div></div>`;
  return `<div class="modal" role="dialog" aria-modal="true" aria-label="Unidade ${esc(x.unidade)}"><div class="scrim" data-act="fecharpop"></div><div class="box tall">
    <div class="mhead"><div class="t"><div class="crumb">${esc(nivel1Nome(x))}${nivel2Nome(x)?" / "+esc(nivel2Nome(x)):""} / <b>${esc(x.unidade)}</b></div>${fin}</div>
      <span class="pill s-neutral">${esc(ETAPA[x.sub_etapa].n)}</span><button class="iconbtn" data-act="fecharpop" aria-label="Fechar">${IC.close}</button></div>
    <div class="mbody" id="mb-und" data-keep-scroll>${secs.length?secs.map(s=>secaoHTML(s,"und")).join(""):`<div class="empty"><b>Nada para mostrar nesta unidade</b><span>As fases liberadas no filtro não têm etapas iniciadas aqui.</span></div>`}</div></div></div>`;
}
function secaoHTML(s,ctx){
  const k=s.key, temRep=s.acts.some(a=>a.a==="reprovar");
  const moves=s.moves.length?`<ul class="moves">${s.moves.map(m=>{const [c,i]=MOV_IC[m.tipo]||MOV_IC.neutral; return `<li><span class="ic" style="background:${c}">${i}</span><div><b class="tnum">${fmtDT(m.data)}</b> - ${esc(nomeUsuario(m.autor))} ${esc(m.txt)}</div>${m.obs?`<div class="obs">${esc(m.obs)}</div>`:""}${m.checklist?ckResumo(m.checklist):""}${m.anexos&&m.anexos.length?`<div class="obs anx">${IC.clip}${m.anexos.map(a=>a.path?`<button class="linkbtn" data-act="anexo" data-path="${esc(a.path)}">${esc(a.nome)}</button>`:esc(a.nome)).join(", ")}</div>`:""}${m.assinatura?`<div class="obs"><img class="sigimg" src="${m.assinatura}" alt="Assinatura do cliente"></div>`:m.temAss?`<div class="obs"><button class="linkbtn" data-act="verass" data-id="${m.tid}">Ver assinatura do cliente</button></div>`:""}</li>`;}).join("")}</ul>`:"";
  let acts="";
  if(s.acts.length) acts=`<div class="acts">${s.acts.map(a=>`<button class="btn ${a.k} btn-ic" data-act="abrirconf" data-ctx="${ctx}" data-a="${a.a}" data-k="${k}">${ACAO_IC[a.a]||""}${esc(a.l)}</button>`).join("")}</div>`;
  return `<section class="stagebox"><div class="sh"><b>${esc(s.titulo)}</b>${pill(s.status)}</div>${moves}${s.aviso?`<div class="small muted" style="padding:0 12.6px 9px">${esc(s.aviso)}</div>`:""}${acts}</section>`;
}

/* ================= POPUP DE AGENDAMENTO ================= */
function agendaTab(){
  const x=DB.unidades.find(u=>u.id===S.ag.id), c=clienteById(x.id_cliente), A=S.ag, admin=can(ME(),"admin");
  const m=A.mes, first=new Date(m.getFullYear(),m.getMonth(),1), ini=new Date(first); ini.setDate(1-first.getDay());
  const hoje=startOfDay(new Date()); const dias=[];
  for(let i=0;i<42;i++){ const d=new Date(ini); d.setDate(ini.getDate()+i); if(i>=35&&d.getMonth()!==m.getMonth()) break; dias.push(d); }
  const nv=repN(x.rep_vistoria_cliente)||1;
  let slots="";
  if(A.dia){ const ex=excecaoNaData(S.obraId,isoData(A.dia)); const hs=horariosNaData(S.obraId,A.dia);
    slots=hs.length?hs.map(h=>{const oc=ocupacao(S.obraId,fmtData(A.dia)+" "+h.Horas,x.id), cheio=oc>=h.Pessoas, cedo=!admin&&!antecedenciaOk(fmtData(A.dia)+" "+h.Horas);
      return `<button class="${A.hora===h.Horas?"sel":""}" data-act="aghora" data-h="${h.Horas}" ${cheio||cedo?"disabled":""} title="${cedo?"Precisa de 24 horas de antecedência":""}" aria-label="${h.Horas}, ${oc} de ${h.Pessoas} vagas ocupadas">${h.Horas} - ${oc}/${h.Pessoas}</button>`;}).join("")
      :`<span class="small muted">${ex&&ex.fechado?`Sem vistorias neste dia${ex.motivo?` (${esc(ex.motivo)})`:""}.`:"A obra não tem horários neste dia. Configure em Horários."}</span>`; }
  else slots=`<span class="small muted">Escolha um dia no calendário.</span>`;
  const finCls=x.financeiro_status==="Liberado"?"ok":x.financeiro_status==="Bloqueado"?"bad":"warn";
  return `<div class="ag">
    <div class="ag-l"><button class="iconbtn" data-act="agfechar" aria-label="Voltar para as tarefas da unidade" style="margin-left:-7.2px">${IC.back}</button>
      <div class="muted" style="font-weight:700">${esc(nivel1Nome(x))}${nivel2Nome(x)?" / "+esc(nivel2Nome(x)):""}</div><div class="und">${esc(x.unidade)}</div>
      ${c?`<div class="line">${IC.user}${esc(tituloCase(c.nome))}</div><div class="line">${IC.phone}<span class="tnum">${esc(fmtTel(c.telefone))}</span></div><div class="line">${IC.at}${esc(c.email)}</div>`:""}
      ${x.prioridade?`<div class="line" style="color:var(--primary)">${IC.bookmark}<b>Prioridade: ${esc(x.prioridade)}</b></div>`:""}
      ${x.financeiro_status?`<div><span class="pill s-${finCls}">Financeiro ${esc(x.financeiro_status)}</span><div class="small muted" style="margin-top:5.4px">${esc(x.financeiro_motivo)}</div></div>`:""}
      <span class="spacer"></span><span class="pill s-neutral" style="align-self:flex-start;background:var(--surface)">${nv}ª Vistoria</span></div>
    <div class="ag-r"><div class="cal"><b style="font-size:1.1rem">Escolha uma data:</b>
        <div class="cal-head"><button class="iconbtn" data-act="agmes" data-d="-1" aria-label="Mês anterior">${IC.chevL}</button><b>${esc(mesNome(m))}</b><button class="iconbtn" data-act="agmes" data-d="1" aria-label="Próximo mês">${IC.chevR}</button></div>
        <div class="cal-grid"><span class="wd">dom</span><span class="wd">seg</span><span class="wd">ter</span><span class="wd">qua</span><span class="wd">qui</span><span class="wd">sex</span><span class="wd">sáb</span>
        ${dias.map(d=>{const fora=d.getMonth()!==m.getMonth(), passado=d<hoje&&!admin, sel=A.dia&&sameDay(d,A.dia);
          return fora?"<span></span>":`<button class="${sel?"sel":""} ${sameDay(d,hoje)?"today":""}" data-act="agdia" data-t="${d.getTime()}" ${passado||d.getDay()===0||(!admin&&new Date(d.getFullYear(),d.getMonth(),d.getDate()+1).getTime()<=Date.now()+864e5)?"disabled":""}>${d.getDate()}</button>`;}).join("")}</div></div>
      <div class="slots"><b class="muted">Horários disponíveis</b>${slots}${admin?"":`<span class="small muted">O agendamento precisa de pelo menos 24 horas de antecedência.</span>`}</div>
      <div class="row" style="grid-column:1/-1"><input class="inp" id="ag-obs" placeholder="Observações" style="flex:1"><button class="btn primary" data-act="agsalvar">Salvar</button></div>
    </div></div>`;
}
const antecedenciaOk=str=>{ const d=parseAg(str); return !!d&&d.getTime()>=Date.now()+864e5; };
const mesNome=d=>{const s=d.toLocaleDateString("pt-BR",{month:"long",year:"numeric"}).replace(" de "," "); return s.charAt(0).toUpperCase()+s.slice(1);};
