/* ================= CONSTANTES DO FLUXO ================= */
const FASES = {1:"Produção",2:"Vistorias",3:"Entrega"};
const ETAPAS = [
  {c:1,n:"Liberação de Testes",f:1},{c:2,n:"Validação Técnica",f:1},{c:3,n:"Finalizando Unidade",f:1},
  {c:4,n:"Vistoria Qualidade",f:2},{c:41,n:"Vistoria Prévia",f:2},{c:5,n:"Agendamento com Cliente",f:2},
  {c:6,n:"Vistoria do Cliente",f:2},{c:7,n:"Correções de Obra",f:2},
  {c:8,n:"Análise Financeira",f:3},{c:9,n:"Negociação Financeira",f:3},{c:10,n:"Entrega das Chaves",f:3},{c:11,n:"Concluída",f:3}
];
const ETAPA = Object.fromEntries(ETAPAS.map(e=>[e.c,e]));
const ETAPAS_AC = [
  {c:1,n:"Liberação Local"},{c:2,n:"Vistoria Qualidade"},{c:3,n:"Vistoria Arquitetura"},
  {c:4,n:"Agendamento com Síndico"},{c:5,n:"Vistoria do Síndico"},{c:6,n:"Correções de Obra"},{c:7,n:"Concluída"}
];
const ETAPA_AC = Object.fromEntries(ETAPAS_AC.map(e=>[e.c,e]));

const MOTIVOS = {
  esgoto:["Ponto de esgoto do tanque obstruído","Ponto de esgoto da máquina obstruído","Ponto de esgoto de gordura da pia da cozinha obstruído","Ponto de esgoto da pia do banheiro obstruído","Ponto de esgoto do vaso do banheiro obstruído","Ponto de esgoto caixa sifonada da área de serviço obstruído","Ponto de esgoto caixa sifonada do banheiro obstruído","Ponto de esgoto caixa sifonada da sacada obstruído","Prumada de esgoto do tanque/máquina de lavar roupa obstruída","Prumada de esgoto de gordura da pia da cozinha obstruída","Prumada de esgoto do banheiro obstruída","Prumada de esgoto do tanque/máquina de lavar roupa ligada na caixa errada na infra","Prumada de esgoto de gordura da pia da cozinha ligado na caixa errada na infra","Prumada de esgoto do banheiro ligado na caixa errada na infra","Prumada de água de chuva ligado na caixa errada na infra","Prumada de esgoto caixa sifonada da sacada obstruída","Prumada de esgoto caixa sifonada da sacada ligado na caixa errada na infra","Prumada de Dreno do ar condicionado do quarto obstruída","Prumada de Dreno do ar condicionado da suíte obstruída","Prumada de Dreno do ar condicionado da sala obstruída","Prumada de Dreno do ar condicionado do quarto ligado na caixa errada na infra","Prumada de Dreno do ar condicionado da suíte obstruída ligado na caixa errada na infra","Prumada de Dreno do ar condicionado da sala obstruída ligado na caixa errada na infra"],
  aguafria:["Ponto de água fria do tanque entupido","Ponto de água fria da máquina entupido","Ponto de água fria da pia da cozinha entupido","Ponto de água fria da pia do banheiro entupido","Ponto de água fria do vaso do banheiro entupido","Apartamento com vazamento sem segurar pressão"],
  eletrico:["Circuito de iluminação com defeito não funciona","Circuito de tomadas gerais com defeito não funciona","Circuito de tomadas da cozinha com defeito não funciona","Circuito de tomadas da área de serviço com defeito não funciona","IDR (Interruptor Diferencial Residual) com defeito","Quadro de distribuição montado fora de padrão","Circuitos misturados no quadro não funcionam"]
};
const TESTES = [
  {k:"esgoto",col:"rep_teste_esgoto",nome:"Teste Esgoto"},
  {k:"aguafria",col:"rep_teste_aguafria",nome:"Teste Água Fria"},
  {k:"dreno",col:"rep_teste_dreno",nome:"Teste Dreno Ar"},
  {k:"gas",col:"rep_teste_gas",nome:"Teste Gás"},
  {k:"eletrico",col:"rep_teste_eletrico",nome:"Teste Elétrico"}
];
const PERMS = ["admin","obra","instalacoes","excelencia","rc","financeiro","arquitetura","gerente"];
const PERM_NOME = {admin:"Admin",obra:"Obra",instalacoes:"Instalações",excelencia:"Excelência",rc:"Relacionamento (RC)",financeiro:"Financeiro",arquitetura:"Arquitetura",gerente:"Gerente"};
const HORAS = []; for(let h=7;h<=19;h++){HORAS.push(String(h).padStart(2,"0")+":00"); if(h<19) HORAS.push(String(h).padStart(2,"0")+":30");}
const DIAS = [["segunda","Segunda-Feira"],["terca","Terça-Feira"],["quarta","Quarta-Feira"],["quinta","Quinta-Feira"],["sexta","Sexta-Feira"],["sabado","Sábado"]];
const DIA_KEY = {1:"segunda",2:"terca",3:"quarta",4:"quinta",5:"sexta",6:"sabado"}; // getDay()

/* ================= UTILITÁRIOS ================= */
const pad = n=>String(n).padStart(2,"0");
const esc = s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmtData = d=>`${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
const fmtDT = d=>`${pad(d.getDate())}/${pad(d.getMonth()+1)}/${String(d.getFullYear()).slice(2)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fmtDTL = d=>`${fmtData(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
const parseAg = s=>{const m=/^(\d{2})\/(\d{2})\/(\d{4})(?:\s(\d{2}):(\d{2}))?/.exec(s||""); return m?new Date(+m[3],+m[2]-1,+m[1],+(m[4]||0),+(m[5]||0)):null;};
const sameDay=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
const startOfDay=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
const REP_RE=/^(Pendente|Aprovado|Reprovado)\s(\d+)°/;
const repN = s=>{const m=REP_RE.exec(s||""); return m?+m[2]:0;};
const has = (s,w)=>(s||"").includes(w);
const blank = s=>s==null||s==="";
const numUnd = u=>{const p=String(u||"").split(" "); const n=parseInt(p[p.length-1],10); return isNaN(n)?0:n;};
const tituloCase = s=>String(s||"").toLowerCase().split(" ").map(w=>["de","do","da","dos","das","e"].includes(w)?w:w.charAt(0).toUpperCase()+w.slice(1)).join(" ");
const fmtTel = t=>{t=String(t||"").replace(/\D/g,""); if(t.length<12) return t; return `+${t.slice(0,2)} (0${t.slice(2,4)}) ${t.slice(4,5)} ${t.slice(5,9)}-${t.slice(9,13)}`;};
function rng(seed){let s=seed>>>0||1; return ()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};}

/* ================= USUÁRIOS DE TESTE ================= */
const USUARIOS_SEED = [
  {login:"rodrigo.machado",nome:"Rodrigo Machado",perms:["admin","obra","instalacoes","excelencia","rc","financeiro","arquitetura"]},
  {login:"carla.mendes",nome:"Carla Mendes",perms:["obra"]},
  {login:"paulo.ribeiro",nome:"Paulo Ribeiro",perms:["instalacoes"]},
  {login:"marina.lopes",nome:"Marina Lopes",perms:["excelencia"]},
  {login:"julia.prado",nome:"Júlia Prado",perms:["rc"]},
  {login:"fabio.nunes",nome:"Fábio Nunes",perms:["financeiro"]},
  {login:"beatriz.alves",nome:"Beatriz Alves",perms:["arquitetura"]}
];

/* ================= STORE ================= */
const STORE_KEY="ge-demo-v1";
let DB=null;
function salvarLocal(){ try{ localStorage.setItem(STORE_KEY, JSON.stringify(DB)); }catch(e){} }
function carregarLocal(){
  try{ const raw=localStorage.getItem(STORE_KEY); if(raw){ const d=JSON.parse(raw); if(d&&d.v===1){DB=d; return;} } }catch(e){}
  DB=gerarDadosTeste(); salvarLocal();
}
function nextIdLocal(t){ DB.seq[t]=(DB.seq[t]||0)+1; return DB.seq[t]; }
const obraById = id=>DB.obras.find(o=>o.id===id);
const userByLogin = l=>DB.usuarios.find(u=>u.login===l);
const nomeUsuario = l=>(userByLogin(l)||{}).nome||tituloCase(String(l||"").split("@")[0].replace(/\./g," "));
const localById = id=>DB.locais.find(l=>l.id===id);
const clienteById = id=>DB.clientes.find(c=>c.id===id);
function nivel2Nome(u){const l=localById(u.nivel_1); if(!l||!u.nivel_2) return ""; return (l.niveis2.split(", ")[u.nivel_2-1])||"";}
function nivel1Nome(u){const l=localById(u.nivel_1); return l?l.nivel1:"";}

