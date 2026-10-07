/* ================= INÍCIO ================= */
async function iniciar(){
  try{ const t=localStorage.getItem("ge-tema"); if(t) S.dark=t==="dark"; }catch(_){}
  aplicarTema();
  S.agd={mes:new Date(new Date().getFullYear(),new Date().getMonth(),1),dia:startOfDay(new Date()),busca:""};
  if(MODO_DEMO){
    carregarLocal(); REAL_USER="rodrigo.machado"; S.user=REAL_USER; resetFiltros(); render();
    toast("Info","Modo demonstração","Dados fictícios. Preencha js/config.js para usar o Supabase.");
    return;
  }
  if(!window.supabase){ document.getElementById("app").innerHTML='<p style="padding:24px">Não foi possível carregar a biblioteca do Supabase (js/vendor/supabase.js).</p>'; return; }
  sb=window.supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  S.auth={tela:"carregando"}; render();
  sb.auth.onAuthStateChange(ev=>{ if(ev==="SIGNED_OUT"&&!S.saindo){ S.auth={tela:"entrar",msg:"Sua sessão terminou. Entre de novo."}; render(); } });
  document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible") API.autoAtualizar(); });
  window.addEventListener("beforeunload",e=>{ if(API.ocupado||API.fila.length){ e.preventDefault(); e.returnValue=""; } });
  const { data:{ session } } = await sb.auth.getSession();
  if(!session){ S.auth={tela:"entrar"}; render(); return; }
  await posLogin();
}
iniciar();
