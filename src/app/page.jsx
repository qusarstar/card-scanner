'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import CardItem from '@/components/CardItem';
import BottomNav from '@/components/BottomNav';

export default function HomePage() {
  const supabase = createClient();
  const router = useRouter();

  const [cards, setCards] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      setUser(user);

      const { data } = await supabase
        .from('cards')
        .select('*')
        .order('created_at', { ascending: false });
      setCards(data || []);
      setLoading(false);
    }
    init();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  const filtered = cards.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q) ||
      (c.title || '').toLowerCase().includes(q) ||
      (c.industry || '').toLowerCase().includes(q)
    );
  });

  return (
    <main className="min-h-screen pb-24 safe-top">
      <header className="sticky top-0 bg-[#F2F2F7]/90 backdrop-blur z-10 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-3xl font-bold">名片管理</h1>
          <button onClick={handleSignOut} className="text-sm text-gray-500">
            登出
          </button>
        </div>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 搜尋姓名、公司、職稱、行業…"
          className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-brand text-base"
        />
      </header>

      <div className="px-4 mt-2 space-y-2">
        {loading ? (
          <div className="text-center py-20 text-gray-400">載入中…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📇</div>
            <p className="text-lg font-semibold">
              {cards.length === 0 ? '還沒有名片' : '找不到符合的名片'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {cards.length === 0
                ? '點擊下方掃描按鈕新增第一張'
                : '試試其他關鍵字'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 px-1">
              共 {filtered.length} 張名片
            </p>
            {filtered.map((card) => (
              <CardItem key={card.id} card={card} />
            ))}
          </>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
