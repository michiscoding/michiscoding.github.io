const SUPABASE_URL = 'https://wtezfaxtpwjpqdmnmsny.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rYRPB_AT_n9lwAcaMJkuDA_o7b_Zx1E';
const MEDIA_BASE = 'https://pub-1b14cd5b095f4411b421c033cdf7625e.r2.dev/';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
