/* ================= INÍCIO ================= */
async function iniciar(){
  try{ const t=localStorage.getItem("ge-tema"); S.dark=t==="dark"; }catch(_){ S.dark=false; }   // padrão: claro
  aplicarTema();
  S.agd={mes:new Date(new Date().getFullYear(),new Date().getMonth(),1),dia:startOfDay(new Date()),busca:""};
  if(MODO_DEMO){
    try{ S.perfil={prefs:JSON.parse(localStorage.getItem("ge-prefs")||"{}")}; }catch(_){ S.perfil={prefs:{}}; }
    carregarLocal(); REAL_USER="rodrigo.machado"; S.user=REAL_USER; resetFiltros(); render();
    toast("Info","Modo demonstração","Dados fictícios. Preencha js/config.js para usar o Supabase.");
    return;
  }
  if(!window.supabase){ document.getElementById("app").innerHTML='<p style="padding:24px">Não foi possível carregar a biblioteca do Supabase (js/vendor/supabase.js).</p>'; return; }
  sb=window.supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  S.auth={tela:"carregando",passo:{t:"Conectando",s:"Abrindo conexão segura com o servidor"}}; render();
  sb.auth.onAuthStateChange(ev=>{ if(ev==="SIGNED_OUT"&&!S.saindo){ S.auth={tela:"entrar",msg:"Sua sessão terminou. Entre de novo."}; render(); } });
  document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible") API.autoAtualizar(); });
  window.addEventListener("beforeunload",e=>{ if(API.ocupado||API.fila.length){ e.preventDefault(); e.returnValue=""; } });
  passo("Validando login","Verificando se você já entrou neste aparelho");
  const { data:{ session } } = await sb.auth.getSession();
  if(!session){ S.auth={tela:"entrar"}; render(); return; }
  await posLogin();
}
iniciar();
