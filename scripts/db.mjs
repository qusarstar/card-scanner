// 用 service_role 直接查 Supabase 資料庫
// 用法：node scripts/db.mjs [list|count|user-cards <email>]

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// 讀 .env.local
const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => {
      const [k, ...v] = l.split('=');
      return [k.trim(), v.join('=').trim()];
    })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const cmd = process.argv[2] || 'list';

if (cmd === 'list') {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  console.log(JSON.stringify(data, null, 2));
  console.log(`\n--- 共 ${data.length} 張名片 ---`);
} else if (cmd === 'count') {
  const { count, error } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  console.log(`共 ${count} 張名片`);
} else if (cmd === 'analyses') {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  console.log(JSON.stringify(data, null, 2));
} else if (cmd === 'users') {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;
  console.log(data.users.map((u) => ({ id: u.id, email: u.email, created_at: u.created_at })));
} else {
  console.log('用法：node scripts/db.mjs [list|count|analyses|users]');
}
