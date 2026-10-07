/* =====================================================================
   CONFIGURAÇÃO DO SUPABASE
   Pegue os dois valores em: Supabase > seu projeto > Project Settings > API
   - Project URL           -> SUPABASE_URL
   - anon / public key     -> SUPABASE_ANON_KEY
   A chave "anon" é pública por natureza (vai para o navegador de todo mundo);
   quem protege os dados são as regras do banco (01_estrutura.sql).
   NUNCA coloque aqui a chave "service_role".

   Deixando os dois vazios, o app abre em MODO DEMONSTRAÇÃO (dados fictícios).
   ===================================================================== */
window.GE_CONFIG = {
  SUPABASE_URL: "https://etifpmuwblsgzhrbyffc.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_xfWauA_rZSDURr9fId2MYw_CC1fHBRc"
};
