import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gtprkkjxrbwopwuwkglc.supabase.co';
const supabaseKey = 'sb_publishable_wGKuEBe_RvW7nKCmTGrtBQ_4FJlkBXS';

export const supabase = createClient(supabaseUrl, supabaseKey);