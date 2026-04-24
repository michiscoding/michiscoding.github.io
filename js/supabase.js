const SUPABASE_URL = 'https://wtezfaxtpwjpqdmnmsny.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rYRPB_AT_n9lwAcaMJkuDA_o7b_Zx1E';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
