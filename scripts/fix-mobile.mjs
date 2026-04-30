import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter((l) => l.includes('='))
    .map((l) => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await supabase
  .from('cards')
  .update({ mobile: '0935691292' })
  .eq('id', '22aa05ca-5c3f-4d57-a18f-517f333e4ebd')
  .select();

if (error) console.error(error);
else console.log('修正成功：', data[0].mobile);
