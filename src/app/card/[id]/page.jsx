'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

const FIELDS = [
  { key: 'name', label: '姓名', icon: '👤' },
  { key: 'company', label: '公司', icon: '🏢' },
  { key: 'title', label: '職稱', icon: '💼' },
  { key: 'email', label: 'Email', icon: '✉️', link: (v) => `mailto:${v}` },
  { key: 'phone', label: '電話', icon: '📞', link: (v) => `tel:${v.replace(/[^\d+]/g, '')}` },
  { key: 'address', label: '地址', icon: '📍', link: (v) => `https://maps.google.com/?q=${encodeURIComponent(v)}` },
  { key: 'website', label: '網站', icon: '🌐', link: (v) => v.startsWith('http') ? v : `https://${v}` },
  { key: 'industry', label: '行業', icon: '🏭' },
  { key: 'notes', label: '備註', icon: '📝', multiline: true },
];

export default function CardDetailPage() {
  const supabase = createClient();
  const router = useRouter();
  const { id } = useParams();

  const [card, setCard] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        setError(error.message);
      } else {
        setCard(data);
        setDraft(data);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  function update(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    const { data, error } = await supabase
      .from('cards')
      .update({
        name: draft.name, company: draft.company, title: draft.title,
        email: draft.email, phone: draft.phone, address: draft.address,
        website: draft.website, industry: draft.industry, notes: draft.notes,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      setError(error.message);
    } else {
      setCard(data);
      setEditing(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`確定要刪除「${card.name || card.company}」嗎？`)) return;

    if (card.image_url) {
      // 從 URL 取出檔案路徑刪除
      const path = card.image_url.split('/card-images/')[1];
      if (path) await supabase.storage.from('card-images').remove([path]);
    }
    await supabase.from('cards').delete().eq('id', id);
    router.replace('/');
    router.refresh();
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">載入中…</div>;
  }

  if (!card) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <p className="text-lg">找不到這張名片</p>
        <Link href="/" className="mt-4 text-brand">回首頁</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-12">
      <header className="sticky top-0 bg-white border-b z-10 safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => router.back()} className="text-brand">
            ‹ 返回
          </button>
          <h1 className="font-semibold truncate max-w-[180px]">
            {card.name || card.company || '名片'}
          </h1>
          {editing ? (
            <button onClick={handleSave} className="text-brand font-semibold">儲存</button>
          ) : (
            <button onClick={() => setEditing(true)} className="text-brand">編輯</button>
          )}
        </div>
      </header>

      {card.image_url && (
        <img src={card.image_url} alt="" className="w-full max-h-56 object-contain bg-black" />
      )}

      {card.ai_score != null && !editing && (
        <AIInsight card={card} />
      )}

      {error && (
        <div className="bg-red-50 mx-4 mt-4 px-4 py-2 rounded-lg text-sm text-red-700 text-center">
          ❌ {error}
        </div>
      )}

      <div className="bg-white mx-4 mt-4 rounded-2xl divide-y">
        {FIELDS.map((f) => {
          const value = editing ? draft[f.key] : card[f.key];
          if (!editing && !value) return null;

          return (
            <div key={f.key} className="flex items-start px-4 py-3">
              <div className="text-xl mr-3 mt-1">{f.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">{f.label}</p>
                {editing ? (
                  f.multiline ? (
                    <textarea
                      value={value || ''}
                      onChange={(e) => update(f.key, e.target.value)}
                      placeholder={`輸入${f.label}`}
                      rows={2}
                      className="w-full mt-1 outline-none resize-none text-base"
                    />
                  ) : (
                    <input
                      value={value || ''}
                      onChange={(e) => update(f.key, e.target.value)}
                      placeholder={`輸入${f.label}`}
                      autoCapitalize="none"
                      className="w-full mt-1 outline-none text-base"
                    />
                  )
                ) : f.link ? (
                  <a href={f.link(value)} className="text-brand text-base block break-all">
                    {value}
                  </a>
                ) : (
                  <p className="text-base break-words">{value}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!editing && (
        <button
          onClick={handleDelete}
          className="mt-6 mx-4 w-[calc(100%-2rem)] py-4 bg-white text-red-600 rounded-2xl font-medium"
        >
          🗑️ 刪除名片
        </button>
      )}
    </main>
  );
}

function AIInsight({ card }) {
  const score = card.ai_score;
  const color =
    score >= 75 ? 'text-green-600 border-green-200 bg-green-50' :
    score >= 50 ? 'text-orange-500 border-orange-200 bg-orange-50' :
                  'text-gray-500 border-gray-200 bg-gray-50';
  const label =
    score >= 75 ? '高潛力' :
    score >= 50 ? '中潛力' :
                  '低潛力';

  return (
    <div className={`mx-4 mt-4 p-4 rounded-2xl border ${color}`}>
      <div className="flex items-center gap-3">
        <div className="text-3xl font-bold">{score}</div>
        <div>
          <p className="font-semibold">{label}客戶</p>
          {card.ai_reason && <p className="text-sm opacity-80">{card.ai_reason}</p>}
        </div>
      </div>
      {card.ai_follow_up && (
        <div className="mt-3 pt-3 border-t border-current/10">
          <p className="text-xs uppercase font-semibold opacity-70 mb-1">💡 跟進建議</p>
          <p className="text-sm leading-6 text-gray-700 whitespace-pre-wrap">{card.ai_follow_up}</p>
        </div>
      )}
    </div>
  );
}
