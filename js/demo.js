/* ================= GERAÇÃO DE DADOS DE TESTE ================= */
function gerarDadosTeste(){
  const R=rng(20261005);
  const pick=a=>a[Math.floor(R()*a.length)];
  const d={v:1,seq:{},usuarios:USUARIOS_SEED.map((u,i)=>({id:i+1,...u})),obras:[],clientes:[],locais:[],horarios:[],unidades:[],tarefas:[],areas:[],tarefas_ac:[]};
  DB=d;
  const todos=USUARIOS_SEED.map(u=>u.login);
  const OBRAS=[
    {nome:"Meo Neoville",cidade:"Curitiba, PR",tipo:"predio",blocos:"ABCDEFG",pav:6,porPav:8,ini:"2026-03-05",passo:22,cfg:{aprovarDireto:true}},
    {nome:"Meo Hauer",cidade:"Curitiba, PR",tipo:"predio",blocos:"AB",pav:5,porPav:6,ini:"2026-05-05",passo:38},
    {nome:"Safira",cidade:"São José dos Pinhais, PR",tipo:"casa",blocos:"ABCD",pav:2,porPav:8,ini:"2026-04-10",passo:28,cfg:{testes:["esgoto","aguafria","eletrico"]}},
    {nome:"Porto Garten",cidade:"Joinville, SC",tipo:"predio",blocos:"ABC",pav:4,porPav:4,ini:"2026-05-20",passo:30,cfg:{previa:true}},
    {nome:"Porto Aurora",cidade:"Londrina, PR",tipo:"predio",blocos:"AB",pav:4,porPav:6,ini:"2026-07-10",passo:40},
    {nome:"Porto Bella Vista",cidade:"Ponta Grossa, PR",tipo:"casa",blocos:"AB",pav:2,porPav:6,ini:"2026-08-10",passo:25,cfg:{testes:["esgoto","aguafria","eletrico"]}},
    {nome:"Meo Anita",cidade:"Joinville, SC",tipo:"predio",blocos:"A",pav:8,porPav:6,ini:"2026-09-05",passo:0},
    {nome:"Door 7710",cidade:"Curitiba, PR",tipo:"predio",blocos:"A",pav:10,porPav:4,ini:null,restrita:true},
    {nome:"Porto Blumen",cidade:"Joinville, SC",tipo:"predio",blocos:"AB",pav:4,porPav:4,ini:null,restrita:true}
  ];
  const AC_NOMES=["Salão de Festas","Academia","Piscina Adulto","Playground","Portaria","Churrasqueira Gourmet","Brinquedoteca","Bicicletário"];
  const PN=["Ana","Bruno","Camila","Diego","Eduarda","Felipe","Gabriela","Henrique","Isabela","João","Karina","Lucas","Mariana","Nicolas","Olívia","Pedro","Rafaela","Samuel","Tatiane","Vinícius","Larissa","Gustavo","Letícia","Matheus","Priscila","Rodrigo","Sabrina","Thiago","Vanessa","William"];
  const SN=["Almeida","Barbosa","Cardoso","Dias","Esteves","Ferreira","Gomes","Hoffmann","Igarashi","Jardim","Klein","Lima","Moreira","Nogueira","Oliveira","Pereira","Queiroz","Rocha","Santos","Teixeira","Urbano","Vieira","Wolff","Zanella","Costa","Martins","Ramos","Souza"];
  const HSEED=JSON.stringify([{ID:1,Horas:"09:00",Pessoas:3},{ID:2,Horas:"11:00",Pessoas:3},{ID:3,Horas:"13:30",Pessoas:3},{ID:4,Horas:"15:30",Pessoas:3}]);
  const NOW=new Date(2026,9,5,10,0);

  OBRAS.forEach((O,oi)=>{
    const obra={id:oi+1,ordem:oi+1,nome:O.nome,cidade:O.cidade,ativa:true,
      usuarios:(O.restrita?["rodrigo.machado"]:todos).join(", "),
      config:{tipo:O.tipo,testes:(O.cfg&&O.cfg.testes)||["esgoto","aguafria","dreno","gas","eletrico"],previa:!!(O.cfg&&O.cfg.previa),aprovarDireto:!!(O.cfg&&O.cfg.aprovarDireto)},
      hue:[24,200,12,160,36,90,280,220,190][oi]};
    d.obras.push(obra);
    d.horarios.push({id:nextId("horarios"),id_obra:obra.id,segunda:HSEED,terca:HSEED,quarta:HSEED,quinta:HSEED,sexta:HSEED,sabado:"[]"});
    const pavNomes = O.tipo==="predio" ? Array.from({length:O.pav},(_,i)=>`${i+1}° Pavimento`) : Array.from({length:O.pav},(_,i)=>`${i+1}°`);
    O.blocos.split("").forEach((b,bi)=>{
      const loc={id:nextId("locais"),id_obra:obra.id,nivel1:(O.tipo==="predio"?"Bloco ":"Quadra ")+b,niveis2:pavNomes.join(", ")};
      d.locais.push(loc);
      for(let p=1;p<=O.pav;p++) for(let k=1;k<=O.porPav;k++){
        const nome = O.tipo==="predio" ? `AP ${p}${pad(k)}` : `CASA ${pad((p-1)*O.porPav+k)}`;
        const u={id:nextId("unidades"),id_obra:obra.id,nivel_1:loc.id,nivel_2:p,unidade:nome,modulo:"",id_cliente:null,sub_etapa:1,
          rep_teste_esgoto:"",rep_teste_aguafria:"",rep_teste_dreno:"",rep_teste_gas:"",rep_teste_eletrico:"",
          rep_vistoria_at:"",rep_vistoria_previa:"",rep_vistoria_cliente:"",agendamento:"",financeiro_status:"",financeiro_motivo:"",prioridade:""};
        d.unidades.push(u);
        const novoCliente=()=>{
            const c={id:nextId("clientes"),nome:`${pick(PN)} ${pick(SN)} ${pick(SN)}`.toUpperCase(),telefone:"55"+pick(["41","41","47","43","42"])+"9"+String(Math.floor(R()*1e8)).padStart(8,"0"),email:""};
            const pp=c.nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").split(" "); c.email=`${pp[0]}.${pp[2]}@exemplo.com`;
            d.clientes.push(c); return c.id;};
        if(!O.restrita && R()<0.82) u.id_cliente=novoCliente();
        if(O.ini){
          const t0=new Date(O.ini+"T08:00:00"); t0.setDate(t0.getDate()+bi*O.passo+Math.floor(R()*12)+(p-1)*5);
          simularUnidade(u,obra,t0,NOW,R,novoCliente);
        }
      }
    });
    if(O.tipo==="predio"&&!O.restrita){
      AC_NOMES.slice(0,O.blocos.length>3?8:5).forEach((n,i)=>{
        const a={id:nextId("areas"),id_obra:obra.id,descricao:n,sub_etapa:1,rep_vistoria_qualidade:"",rep_vistoria_arq:"",agendamento:"",rep_vistoria_sindico:""};
        d.areas.push(a);
        if(O.ini){ const t0=new Date(O.ini+"T08:00:00"); t0.setDate(t0.getDate()+60+i*9); simularArea(a,t0,NOW,R); }
      });
    }
  });
  // Financeiro (vem do Automate no app real) e prioridades
  const FIN=[["Liberado","Quitado, não necessita termo"],["Liberado","Financiamento aprovado pela Caixa"],["Liberado","Quitado, não necessita termo"],["Bloqueado","Saldo devedor em aberto"],["Bloqueado","Aguardando assinatura do contrato de financiamento"],["Pendente","Em análise pelo financeiro"]];
  d.unidades.forEach(u=>{
    if(u.id_cliente && R()<0.85){const f=pick(FIN); u.financeiro_status=f[0]; u.financeiro_motivo=f[1];}
    if(u.id_cliente && R()<0.06) u.prioridade=pick(["Investidor","Reclame Aqui","Jurídico"]);
  });
  return d;
}

/* Simula o histórico de uma unidade executando as próprias ações do app (engine.js). */
function simularUnidade(u,obra,t0,NOW,R,novoCliente){
  let t=new Date(t0);
  const user={obra:"carla.mendes",inst:"paulo.ribeiro",exc:"marina.lopes",rc:"julia.prado"};
  const adv=(min,max)=>{const prev=t.getTime(); const dd=(min+R()*(max-min)); t=new Date(prev+dd*864e5);
    if(dd>=1){ if(t.getDay()===0) t.setDate(t.getDate()+1); t.setHours(8+Math.floor(R()*9),Math.floor(R()*60)); }
    if(t.getTime()<=prev) t=new Date(prev+6e5);};
  const ok=()=>t<NOW;
  const run=(acao,col,autor,extra)=>{ if(!ok()) return false; executarAcao(u,acao,col,{autor,data:new Date(t),...(extra||{})}); return true; };
  const testes=obra.config.testes.map(k=>TESTES.find(x=>x.k===k));
  // liberação
  for(const te of testes){ if(!run("liberar",te.col,user.obra)) return; adv(0.002,0.01); }
  for(const te of testes){
    adv(2,9);
    let tent=0;
    while(true){
      tent++;
      if(R()<(tent===1?0.22:0.12) && tent<4){
        const m=MOTIVOS[te.k]; if(!run("reprovar",te.col,user.inst,{obs:m?m[Math.floor(R()*m.length)]:"Vazamento identificado no teste"})) return;
        adv(4,12); if(!run("corrigir",te.col,user.obra)) return; adv(2,6);
      } else { if(!run("aprovar",te.col,user.inst)) return; break; }
    }
  }
  adv(10,35);
  if(obra.config.aprovarDireto && R()<0.08){ if(!run("aprovarDireto","",user.obra)) return; }
  else{
    if(!run("finalizar","",user.obra)) return;
    let tent=0;
    while(true){ tent++; adv(3,12);
      if(R()<(tent===1?0.35:0.15)&&tent<4){ if(!run("reprovar","rep_vistoria_at",user.exc,{obs:["Rejunte com falhas no banheiro social","Pintura manchada na sala","Esquadria da sacada sem vedação","Piso com peça trincada na cozinha"][Math.floor(R()*4)]})) return; adv(8,20); if(!run("corrigir","rep_vistoria_at",user.obra)) return; }
      else { if(!run("aprovar","rep_vistoria_at",user.exc)) return; break; }
    }
    if(obra.config.previa){ let tp=0; while(true){ tp++; adv(2,6);
      if(R()<0.2&&tp<3){ if(!run("reprovar","rep_vistoria_previa",user.exc,{obs:"Ajustes de acabamento antes do cliente"})) return; adv(3,8); if(!run("corrigir","rep_vistoria_previa",user.obra)) return; }
      else { if(!run("aprovar","rep_vistoria_previa",user.exc)) return; break; } } }
  }
  // agendamentos com o cliente
  let rodada=0;
  while(rodada<4){
    rodada++; adv(2,12); if(!ok()) return;
    if(!u.id_cliente) u.id_cliente=novoCliente();
    // escolhe dia/horário futuro em relação a t
    let dia=new Date(t); dia.setDate(dia.getDate()+3+Math.floor(R()*12));
    let slot=null;
    for(let g=0; g<30 && !slot; g++){
      const dk=DIA_KEY[dia.getDay()];
      if(dk){ const hs=horariosDia(obra.id,dk); const livres=hs.filter(h=>ocupacao(obra.id,fmtData(dia)+" "+h.Horas,u.id)<h.Pessoas); if(livres.length) slot=livres[Math.floor(R()*livres.length)]; }
      if(!slot) dia.setDate(dia.getDate()+1);
    }
    if(!slot) return;
    const agStr=fmtData(dia)+" "+slot.Horas;
    if(!run("agendar","agendamento",user.rc,{agendamento:agStr})) return;
    if(R()<0.07){ adv(0.5,2); if(!run("cancelar","agendamento",user.rc,{obs:"Cliente pediu para remarcar"})) return; rodada--; continue; }
    const quando=parseAg(agStr); quando.setMinutes(quando.getMinutes()+50);
    if(quando>=NOW) return; // vistoria ainda vai acontecer
    t=quando;
    if(R()<(rodada===1?0.4:0.2)&&rodada<4){
      if(!run("reprovar","rep_vistoria_cliente",user.exc,{obs:["Cliente apontou risco no vidro da sacada","Porta do quarto raspando no piso","Tomada da cozinha sem espelho","Mancha no teto do banheiro"][Math.floor(R()*4)]})) return;
      adv(8,25); if(!run("corrigir","rep_vistoria_cliente",user.obra)) return;
    } else { run("aprovar","rep_vistoria_cliente",user.exc); return; }
  }
}
function simularArea(a,t0,NOW,R){
  let t=new Date(t0);
  const adv=(min,max)=>{t=new Date(t.getTime()+(min+R()*(max-min))*864e5); t.setHours(8+Math.floor(R()*9),Math.floor(R()*60));};
  const run=(acao,col,autor,extra)=>{ if(t>=NOW) return false; executarAcaoAC(a,acao,col,{autor,data:new Date(t),...(extra||{})}); return true; };
  if(!run("liberar","","carla.mendes")) return;
  for(const [col,who] of [["rep_vistoria_qualidade","marina.lopes"],["rep_vistoria_arq","beatriz.alves"]]){
    let k=0; while(true){ k++; adv(3,9);
      if(R()<0.3&&k<3){ if(!run("reprovar",col,who,{obs:"Ajustar acabamento do rodapé"})) return; adv(5,12); if(!run("corrigir",col,"carla.mendes")) return; }
      else { if(!run("aprovar",col,who)) return; break; } }
  }
  adv(2,6); const dia=new Date(t); dia.setDate(dia.getDate()+5);
  if(!run("agendar","agendamento","julia.prado",{agendamento:fmtData(dia)})) return;
  t=new Date(dia.getFullYear(),dia.getMonth(),dia.getDate(),10,0); if(t>=NOW) return;
  run("aprovar","rep_vistoria_sindico","marina.lopes");
}
