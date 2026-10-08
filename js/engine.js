/* ================= MOTOR DE REGRAS (equivalente ao botão oculto "Ação Final") ================= */
function horariosDia(obraId,dk){
  const h=DB.horarios.find(x=>x.id_obra===obraId); if(!h) return [];
  try{ return JSON.parse(h[dk]||"[]").map(x=>({ID:+x.ID,Horas:String(x.Horas),Pessoas:+x.Pessoas})).sort((a,b)=>a.Horas.localeCompare(b.Horas)); }catch(e){ return []; }
}
function ocupacao(obraId,agStr,exceto){ return DB.unidades.filter(u=>u.id_obra===obraId&&u.agendamento===agStr&&u.id!==exceto).length; }

function recalcEtapa(old,u,cfg,explicita){
  let s = explicita ?? old;
  const testes=cfg.testes.map(k=>u["rep_teste_"+k]);
  switch(old){
    case 1: if(testes.every(x=>!blank(x))) s=2; break;
    case 2: if(testes.some(blank)) s=1; else if(testes.every(x=>has(x,"Aprovado"))) s=3; break;
    case 4: if(has(u.rep_vistoria_at,"Aprovado")) s=cfg.previa?41:5; else if(has(u.rep_vistoria_at,"Reprovado")) s=7; break;
    case 41: if(has(u.rep_vistoria_previa,"Aprovado")) s=5; else if(has(u.rep_vistoria_previa,"Reprovado")) s=7; break;
    case 6: if(has(u.rep_vistoria_cliente,"Aprovado")) s=8; else if(has(u.rep_vistoria_cliente,"Reprovado")) s=7; break;
  }
  return s;
}

/* Executa uma ação numa unidade: atualiza a unidade e registra a tarefa. */
function executarAcao(u,acao,col,o){
  const cfg=obraById(u.id_obra).config;
  const old=u.sub_etapa, p={}; let rep=null, tAg="", sub;
  const n=repN(u[col]);
  if(col.startsWith("rep_teste_")){
    if(acao==="liberar"){ rep=1; p[col]="Pendente 1°"; }
    else if(acao==="cancelar"){ p[col]=""; }
    else if(acao==="aprovar"){ rep=n; p[col]=`Aprovado ${n}°`; }
    else if(acao==="reprovar"){ rep=n; p[col]=`Reprovado ${n}°`; }
    else if(acao==="corrigir"){ rep=n+1; p[col]=`Pendente ${n+1}°`; }
  } else if(col===""){
    if(acao==="finalizar"){ sub=4; p.rep_vistoria_at="Pendente 1°"; }
    else if(acao==="aprovarDireto"){ sub=5; p.rep_vistoria_at="Aprovado 1°"; p.agendamento="Pendente"; }
    else if(acao==="cancelar"){ sub=3; p.rep_vistoria_at=""; }
  } else if(col==="rep_vistoria_at"){
    if(acao==="aprovar"){ rep=n; p[col]=`Aprovado ${n}°`; if(cfg.previa) p.rep_vistoria_previa="Pendente 1°"; else p.agendamento="Pendente"; }
    else if(acao==="reprovar"){ rep=n; p[col]=`Reprovado ${n}°`; }
    else if(acao==="corrigir"){ rep=n+1; p[col]=`Pendente ${n+1}°`; sub=4; p.agendamento=""; }
  } else if(col==="rep_vistoria_previa"){
    if(acao==="aprovar"){ rep=n; p[col]=`Aprovado ${n}°`; p.agendamento="Pendente"; }
    else if(acao==="reprovar"){ rep=n; p[col]=`Reprovado ${n}°`; }
    else if(acao==="corrigir"){ rep=n+1; p[col]=`Pendente ${n+1}°`; sub=41; p.agendamento=""; }
  } else if(col==="agendamento"){
    const m=repN(u.rep_vistoria_cliente)||1;
    if(acao==="agendar"){ rep=m; tAg=o.agendamento; sub=6; p.agendamento=o.agendamento; p.rep_vistoria_cliente=`Pendente ${m}°`; }
    else if(acao==="cancelar"){ sub=5; p.agendamento="Pendente"; p.rep_vistoria_cliente= m>1?`Pendente ${m}°`:""; }
  } else if(col==="rep_vistoria_cliente"){
    if(acao==="aprovar"){ rep=n; p[col]=`Aprovado ${n}°`; p.agendamento="Concluído"; }
    else if(acao==="reprovar"){ rep=n; p[col]=`Reprovado ${n}°`; }
    else if(acao==="corrigir"){ rep=n+1; p[col]=`Pendente ${n+1}°`; sub=5; p.agendamento="Pendente"; }
  }
  const antes={sub_etapa:old}; Object.keys(p).forEach(k=>antes[k]=u[k]??"");
  Object.assign(u,p);
  u.sub_etapa=recalcEtapa(old,u,cfg,sub);
  const t={id:nextId("tarefas"),id_obra:u.id_obra,id_unidade:u.id,acao:acao==="aprovarDireto"?"finalizar":acao,
    etapa_antiga:old,etapa_nova:u.sub_etapa,obs:o.obs||"",repeticao:rep,coluna:col,autor:o.autor,data:(o.data||new Date()).toISOString(),agendamento:tAg};
  if(o.anexos&&o.anexos.length) t.anexos=o.anexos; if(o.checklist) t.checklist=o.checklist; if(o.assinatura) t.assinatura=o.assinatura;
  DB.tarefas.push(t);
  let laudo=null;
  if(o.laudo&&col==="rep_vistoria_cliente"){ DB.laudos=DB.laudos||[]; laudo={id:nextId("laudos"),id_obra:u.id_obra,id_unidade:u.id,id_tarefa:t.id,engenheiro:o.laudo.engenheiro||"",status:"pendente",criado_em:t.data,criado_por:o.autor,recebido_em:null,recebido_por:null,obs:""}; DB.laudos.push(laudo); }
  aoAcao({tipo:"unidade",reg:u,acao,col,antes,depois:{...p,sub_etapa:u.sub_etapa},tarefa:t,laudo:laudo?{engenheiro:laudo.engenheiro}:null,laudoLocal:laudo});
  return t;
}

function executarAcaoAC(a,acao,col,o){
  const old=a.sub_etapa, p={}; let rep=null, tAg="", sub;
  const n=repN(a[col]);
  if(col===""){
    if(acao==="liberar"){ sub=2; p.rep_vistoria_qualidade="Pendente 1°"; rep=1; }
    else if(acao==="cancelar"){ sub=1; p.rep_vistoria_qualidade=""; }
  } else if(col==="rep_vistoria_qualidade"){
    if(acao==="aprovar"){ rep=n; p[col]=`Aprovado ${n}°`; p.rep_vistoria_arq="Pendente 1°"; }
    else if(acao==="reprovar"){ rep=n; p[col]=`Reprovado ${n}°`; }
    else if(acao==="corrigir"){ rep=n+1; p[col]=`Pendente ${n+1}°`; sub=2; }
  } else if(col==="rep_vistoria_arq"){
    if(acao==="aprovar"){ rep=n; p[col]=`Aprovado ${n}°`; p.agendamento="Pendente"; }
    else if(acao==="reprovar"){ rep=n; p[col]=`Reprovado ${n}°`; }
    else if(acao==="corrigir"){ rep=n+1; p[col]=`Pendente ${n+1}°`; sub=3; }
  } else if(col==="agendamento"){
    const m=repN(a.rep_vistoria_sindico)||1;
    if(acao==="agendar"){ rep=m; tAg=o.agendamento; sub=5; p.agendamento=o.agendamento; p.rep_vistoria_sindico=`Pendente ${m}°`; }
    else if(acao==="cancelar"){ sub=4; p.agendamento="Pendente"; p.rep_vistoria_sindico= m>1?`Pendente ${m}°`:""; }
  } else if(col==="rep_vistoria_sindico"){
    if(acao==="aprovar"){ rep=n; p[col]=`Aprovado ${n}°`; p.agendamento="Concluído"; }
    else if(acao==="reprovar"){ rep=n; p[col]=`Reprovado ${n}°`; }
    else if(acao==="corrigir"){ rep=n+1; p[col]=`Pendente ${n+1}°`; sub=4; p.agendamento="Pendente"; }
  }
  const antes={sub_etapa:old}; Object.keys(p).forEach(k=>antes[k]=a[k]??"");
  Object.assign(a,p);
  let s=sub??old;
  if(old===2){ if(has(a.rep_vistoria_qualidade,"Aprovado")) s=3; else if(has(a.rep_vistoria_qualidade,"Reprovado")) s=6; }
  if(old===3){ if(has(a.rep_vistoria_arq,"Aprovado")) s=4; else if(has(a.rep_vistoria_arq,"Reprovado")) s=6; }
  if(old===5){ if(has(a.rep_vistoria_sindico,"Aprovado")) s=7; else if(has(a.rep_vistoria_sindico,"Reprovado")) s=6; }
  a.sub_etapa=s;
  const t={id:nextId("tarefas_ac"),id_obra:a.id_obra,id_local:a.id,acao,etapa_antiga:old,etapa_nova:s,obs:o.obs||"",repeticao:rep,coluna:col,autor:o.autor,data:(o.data||new Date()).toISOString(),agendamento:tAg};
  if(o.anexos&&o.anexos.length) t.anexos=o.anexos;
  DB.tarefas_ac.push(t);
  aoAcao({tipo:"area",reg:a,acao,col,antes,depois:{...p,sub_etapa:a.sub_etapa},tarefa:t});
  return t;
}

const CHECKLIST_QUALIDADE=["Pintura (paredes e teto)","Revestimentos e rejuntes","Pisos e rodapés","Esquadrias e vidros","Portas e ferragens","Louças e metais","Instalações elétricas","Instalações hidráulicas","Impermeabilização (box e sacada)","Limpeza final"];
const CK_OPCOES=[["ok","Aprovado"],["construtivo","Construtivo"],["acabamento","Acabamento"]];
/* ================= SEÇÕES DO POPUP (visibilidade + botões por permissão) ================= */
const can = (user,...ps)=>ps.some(p=>user.perms.includes(p));
function secaoVisivel(user,...ps){ return can(user,"admin",...ps); }

function secoesUnidade(u,user,fases){
  const cfg=obraById(u.id_obra).config, T=DB.tarefas.filter(t=>t.id_unidade===u.id).sort((a,b)=>a.data.localeCompare(b.data));
  const S=[];
  if(fases.f1 && secaoVisivel(user,"obra","instalacoes","qualidade")){
    cfg.testes.forEach(k=>{
      const te=TESTES.find(x=>x.k===k), v=u[te.col], acts=[];
      if(blank(v)&&can(user,"obra")) acts.push({a:"liberar",l:"Liberar",k:"info"});
      if(v==="Pendente 1°"&&can(user,"obra")) acts.push({a:"cancelar",l:"Cancelar",k:"dark"});
      if(has(v,"Pendente")&&can(user,"instalacoes")){ acts.push({a:"aprovar",l:"Aprovar",k:"ok"}); acts.push({a:"reprovar",l:"Reprovar",k:"bad"}); }
      if(has(v,"Reprovado")&&can(user,"obra")) acts.push({a:"corrigir",l:"Corrigir",k:"primary"});
      S.push({key:te.col,col:te.col,titulo:te.nome,status:v,moves:T.filter(t=>t.coluna===te.col).map(t=>movTeste(t)),acts,motivos:MOTIVOS[k]&&acts.some(x=>x.a==="reprovar")?MOTIVOS[k]:null});
    });
  }
  if(fases.f1 && secaoVisivel(user,"obra") && u.sub_etapa>=3){
    const acts=[];
    if(u.sub_etapa===3&&can(user,"obra")){ acts.push({a:"finalizar",l:"Finalizar",k:"info"}); if(cfg.aprovarDireto) acts.push({a:"aprovarDireto",l:"Aprovar direto",k:"ok"}); }
    if(u.sub_etapa===4&&u.rep_vistoria_at==="Pendente 1°"&&can(user,"obra")) acts.push({a:"cancelar",l:"Cancelar",k:"dark"});
    const mv=T.filter(t=>(t.coluna===""&&["finalizar","cancelar"].includes(t.acao))||(t.etapa_antiga===2&&t.etapa_nova===3)).map(t=>{
      if(t.etapa_antiga===2) return mov(t,"ok","terminou de aprovar todos os testes da unidade.");
      if(t.acao==="finalizar"&&t.etapa_nova===5) return mov(t,"ok","liberou a unidade para agendamento (pulando a vistoria Qualidade).");
      if(t.acao==="finalizar") return mov(t,"info","indicou que a unidade está finalizada e pronta para vistoria da Qualidade.");
      return mov(t,"neutral","cancelou a finalização.");
    });
    S.push({key:"finalizando",col:"",titulo:"Finalizando Unidade",status:u.sub_etapa<=3?"Pendente":"Concluído",moves:mv,acts});
  }
  if(fases.f2 && secaoVisivel(user,"obra","qualidade") && !blank(u.rep_vistoria_at)){
    const v=u.rep_vistoria_at, acts=[];
    if(has(v,"Pendente")&&can(user,"qualidade")){ acts.push({a:"aprovar",l:"Aprovar",k:"ok"}); acts.push({a:"reprovar",l:"Reprovar",k:"bad"}); }
    if(has(v,"Reprovado")&&can(user,"obra")) acts.push({a:"corrigir",l:"Corrigir",k:"primary"});
    const mv=T.filter(t=>t.coluna==="rep_vistoria_at"||(t.coluna===""&&t.acao==="finalizar"&&t.etapa_nova===4)).map(t=>t.coluna===""?mov(t,"info","liberou a unidade para vistoria Qualidade."):movVist(t));
    S.push({key:"rep_vistoria_at",col:"rep_vistoria_at",titulo:"Vistoria Qualidade",status:v,moves:mv,acts});
  }
  if(fases.f2 && cfg.previa && secaoVisivel(user,"obra","qualidade") && !blank(u.rep_vistoria_previa)){
    const v=u.rep_vistoria_previa, acts=[];
    if(has(v,"Pendente")&&can(user,"qualidade")){ acts.push({a:"aprovar",l:"Aprovar",k:"ok"}); acts.push({a:"reprovar",l:"Reprovar",k:"bad"}); }
    if(has(v,"Reprovado")&&can(user,"obra")) acts.push({a:"corrigir",l:"Corrigir",k:"primary"});
    const mv=T.filter(t=>t.coluna==="rep_vistoria_previa"||(t.coluna==="rep_vistoria_at"&&t.acao==="aprovar"&&t.etapa_nova===41)).map(t=>t.coluna==="rep_vistoria_at"?mov(t,"info","liberou a unidade para vistoria Prévia."):movVist(t));
    S.push({key:"rep_vistoria_previa",col:"rep_vistoria_previa",titulo:"Vistoria Prévia",status:v,moves:mv,acts});
  }
  if(fases.f2 && secaoVisivel(user,"rc") && !blank(u.agendamento)){
    const acts=[];
    if(u.agendamento==="Pendente"&&can(user,"rc")) acts.push({a:"agendar",l:"Agendar",k:"info",abre:"agenda"});
    if(u.sub_etapa===6&&has(u.rep_vistoria_cliente,"Pendente")&&can(user,"rc")) acts.push({a:"cancelar",l:"Cancelar agendamento",k:"dark"});
    const mv=T.filter(t=>t.coluna==="agendamento"||(t.etapa_nova===5&&t.acao==="aprovar")||(t.coluna===""&&t.etapa_nova===5)||(t.coluna==="rep_vistoria_cliente"&&t.acao==="corrigir")).map(t=>{
      if(t.coluna==="agendamento") return t.acao==="agendar"?mov(t,"ok",`agendou a vistoria com o cliente para ${t.agendamento}.`):mov(t,"neutral","cancelou o agendamento.");
      if(t.acao==="corrigir") return mov(t,"primary","ajustou os apontamentos do cliente e liberou para agendamento novamente.");
      return mov(t,"info","liberou a unidade para agendamento.");
    });
    S.push({key:"agendamento",col:"agendamento",titulo:"Agendamento com Cliente",status:u.agendamento,moves:mv,acts});
  }
  if(fases.f2 && secaoVisivel(user,"obra","qualidade") && !blank(u.rep_vistoria_cliente)){
    const v=u.rep_vistoria_cliente, acts=[], agendado=has(u.agendamento,"/");
    if(has(v,"Pendente")&&agendado&&can(user,"qualidade","obra")){ acts.push({a:"aprovar",l:"Aprovar",k:"ok"}); acts.push({a:"reprovar",l:"Reprovar",k:"bad"}); }
    if(has(v,"Reprovado")&&can(user,"obra")) acts.push({a:"corrigir",l:"Corrigir",k:"primary"});
    const mv=T.filter(t=>t.coluna==="rep_vistoria_cliente"||(t.coluna==="agendamento"&&t.acao==="agendar")).map(t=>t.coluna==="agendamento"?mov(t,"info",`agendou a ${t.repeticao}ª vistoria com o cliente para ${t.agendamento}.`):movVist(t));
    S.push({key:"rep_vistoria_cliente",col:"rep_vistoria_cliente",titulo:"Vistoria do Cliente",status:v,moves:mv,acts,aviso:[has(v,"Pendente")&&!agendado?"Aguardando agendamento pelo RC.":"",...(DB.laudos||[]).filter(L=>L.id_unidade===u.id).map(L=>L.status==="pendente"?`Laudo do engenheiro (${L.engenheiro||"responsável do cliente"}) pendente de envio desde ${fmtData(new Date(L.criado_em))}.`:`Laudo do engenheiro recebido em ${fmtData(new Date(L.recebido_em))}.`)].filter(Boolean).join(" ")});
  }
  return S;
}
function mov(t,tipo,txt){ return {data:new Date(t.data),autor:t.autor,tipo,txt,obs:t.obs,anexos:t.anexos,checklist:t.checklist,assinatura:t.assinatura,temAss:t.tem_assinatura,tid:t.id}; }
function movTeste(t){
  const m={liberar:["info","liberou a unidade para teste."],aprovar:["ok",`aprovou a unidade no ${t.repeticao}° teste.`],reprovar:["bad",`reprovou a unidade no ${t.repeticao}° teste.`],cancelar:["neutral","cancelou a liberação."],corrigir:["primary",`corrigiu as pendências e liberou a unidade para fazer o ${t.repeticao}° teste.`]}[t.acao]||["neutral",t.acao];
  return mov(t,m[0],m[1]);
}
function movVist(t){
  const m={aprovar:["ok",`aprovou a unidade na ${t.repeticao}ª vistoria.`],reprovar:["bad",`reprovou a unidade na ${t.repeticao}ª vistoria.`],corrigir:["primary",`corrigiu as pendências e liberou a unidade para fazer a ${t.repeticao}ª vistoria.`]}[t.acao]||["neutral",t.acao];
  return mov(t,m[0],m[1]);
}

function secoesArea(a,user){
  const T=DB.tarefas_ac.filter(t=>t.id_local===a.id).sort((x,y)=>x.data.localeCompare(y.data));
  const S=[];
  { const acts=[];
    if(blank(a.rep_vistoria_qualidade)&&can(user,"obra")) acts.push({a:"liberar",l:"Liberar",k:"info"});
    if(a.rep_vistoria_qualidade==="Pendente 1°"&&a.sub_etapa===2&&can(user,"obra")) acts.push({a:"cancelar",l:"Cancelar",k:"dark"});
    S.push({key:"lib",col:"",titulo:"Liberação Local",status:blank(a.rep_vistoria_qualidade)?"Pendente":"Concluído",acts,
      moves:T.filter(t=>t.coluna==="").map(t=>t.acao==="liberar"?mov(t,"info","liberou o local para vistoria Qualidade."):mov(t,"neutral","cancelou a liberação."))}); }
  const vist=(col,titulo,quem)=>{ const v=a[col]; if(blank(v)) return; const acts=[];
    if(has(v,"Pendente")&&(col!=="rep_vistoria_sindico"||has(a.agendamento,"/"))&&can(user,quem)){ acts.push({a:"aprovar",l:"Aprovar",k:"ok"}); acts.push({a:"reprovar",l:"Reprovar",k:"bad"}); }
    if(has(v,"Reprovado")&&a.sub_etapa===6&&can(user,"obra")) acts.push({a:"corrigir",l:"Corrigir",k:"primary"});
    S.push({key:col,col,titulo,status:v,acts,moves:T.filter(t=>t.coluna===col).map(movVist)}); };
  vist("rep_vistoria_qualidade","Vistoria Qualidade","qualidade");
  vist("rep_vistoria_arq","Vistoria Arquitetura","arquitetura");
  if(!blank(a.agendamento)){ const acts=[];
    if(a.agendamento==="Pendente"&&can(user,"rc")) acts.push({a:"agendar",l:"Agendar",k:"info",data:true});
    if(has(a.agendamento,"/")&&has(a.rep_vistoria_sindico,"Pendente")&&can(user,"rc")) acts.push({a:"cancelar",l:"Cancelar agendamento",k:"dark"});
    S.push({key:"agendamento",col:"agendamento",titulo:"Agendamento com Síndico",status:a.agendamento,acts,
      moves:T.filter(t=>t.coluna==="agendamento"||(t.coluna==="rep_vistoria_arq"&&t.acao==="aprovar")).map(t=>t.coluna==="rep_vistoria_arq"?mov(t,"info","liberou o local para agendamento com o síndico."):t.acao==="agendar"?mov(t,"ok",`agendou a vistoria do síndico para ${t.agendamento}.`):mov(t,"neutral","cancelou o agendamento."))}); }
  vist("rep_vistoria_sindico","Vistoria do Síndico","qualidade");
  return S;
}

/* status → classe de cor */
function stClass(v){
  if(blank(v)) return "";
  if(has(v,"Reprovado")||v==="Bloqueado") return "bad";
  if(has(v,"Aprovado")||v==="Concluído"||v==="Liberado"||v==="Finalizado"||v==="Corrigido") return "ok";
  if(has(v,"/")||v==="Agendado") return "info";
  if(has(v,"Pendente")) return "warn";
  return "";
}
