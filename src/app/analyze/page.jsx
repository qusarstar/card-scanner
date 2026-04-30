'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';

export default function AnalyzePage() {
  const supabase = createClient();
  const router = useRouter();

  const [cards, setCards] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [userBusiness, setUserBusiness] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      // 載入名片
      const { data: cardsData } = await supabase
        .from('cards')
        .select('*')
        .order('created_at', { ascending: false });
      setCards(cardsData || []);

      // 載入快取的分析結果
      const { data: cached } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cached) {
        setAnalysis(cached.result);
        setUserBusiness(cached.user_business || '');
      }

      setLoading(false);
    }
    init();
  }, []);

  async function handleAnalyze() {
    if (cards.length === 0) {
      setError('請先掃描至少一張名片');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userBusiness }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || '分析失敗');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">載入中…</div>;
  }

  return (
    <main className="min-h-screen pb-24 safe-top">
      <header className="px-4 pt-4 pb-2">
        <h1 className="text-3xl font-bold">🎯 AI 客戶分析</h1>
        <p className="text-gray-500 mt-2 text-sm">
          Gemini 分析你的 {cards.length} 張名片，找出潛在客戶並建議跟進策略
        </p>
      </header>

      <div className="bg-white mx-4 mt-4 p-4 rounded-2xl">
        <label className="text-sm font-semibold">你的業務領域（選填，會讓分析更精準）</label>
        <textarea
          value={userBusiness}
          onChange={(e) => setUserBusiness(e.target.value)}
          placeholder="例如：我做企業 SaaS 軟體銷售，主要服務中小企業數位轉型"
          rows={3}
          className="w-full mt-2 px-3 py-2 bg-gray-100 rounded-lg outline-none text-sm focus:ring-2 focus:ring-brand"
        />
        <button
          onClick={handleAnalyze}
          disabled={analyzing || cards.length === 0}
          className="w-full mt-3 py-3 bg-brand text-white rounded-xl font-semibold disabled:opacity-50 shadow-lg shadow-brand/30"
        >
          {analyzing ? '🤖 AI 分析中…（約 5–10 秒）' : analysis ? '🔄 重新分析' : '✨ 開始 AI 分析'}
        </button>

        {error && <p className="mt-2 text-sm text-red-600 text-center">❌ {error}</p>}
      </div>

      {analysis && !analyzing && (
        <>
          {/* 行業洞察 */}
          {analysis.industry_insights && (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 mx-4 mt-4 p-4 rounded-2xl border border-purple-100">
              <p className="text-xs uppercase font-semibold text-purple-600 mb-2">📊 行業洞察</p>
              <p className="text-sm leading-6">{analysis.industry_insights}</p>
            </div>
          )}

          {/* 本週行動 */}
          {analysis.action_items?.length > 0 && (
            <div className="bg-white mx-4 mt-4 p-4 rounded-2xl">
              <p className="text-xs uppercase font-semibold text-gray-500 mb-3">🚀 本週應做</p>
              <ol className="space-y-2">
                {analysis.action_items.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="font-bold text-brand">{i + 1}.</span>
                    <span className="leading-6">{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* 潛在客戶清單 */}
          <div className="mx-4 mt-4">
            <p className="text-xs uppercase font-semibold text-gray-500 mb-3 px-1">
              ⭐ TOP 潛在客戶
            </p>
            <div className="space-y-3">
              {analysis.top_prospects?.map((p) => {
                const card = cards.find((c) => c.id === p.id);
                if (!card) return null;
                return <ProspectCard key={p.id} card={card} prospect={p} />;
              })}
            </div>
          </div>
        </>
      )}

      {!analysis && !analyzing && cards.length > 0 && (
        <div className="text-center py-12 px-4">
          <div className="text-6xl mb-3">🤖</div>
          <p className="text-gray-500 text-sm">點上方按鈕開始 AI 分析</p>
        </div>
      )}

      <BottomNav />
    </main>
  );
}

function ProspectCard({ card, prospect }) {
  const colors = {
    high: 'bg-green-50 border-green-200 text-green-700',
    medium: 'bg-orange-50 border-orange-200 text-orange-700',
    low: 'bg-gray-50 border-gray-200 text-gray-700',
  };
  const priorityLabel = {
    high: '🔥 高優先',
    medium: '⚡ 中優先',
    low: '💤 低優先',
  };

  return (
    <Link href={`/card/${card.id}`} className="block bg-white rounded-2xl p-4 active:bg-gray-50">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{card.name || '（未命名）'}</p>
          <p className="text-sm text-gray-500 truncate">
            {card.company} {card.title && `· ${card.title}`}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-bold text-brand">{prospect.score}</div>
          <div className={`text-[10px] px-2 py-0.5 rounded-full border ${colors[prospect.priority] || colors.low}`}>
            {priorityLabel[prospect.priority] || prospect.priority}
          </div>
        </div>
      </div>

      {prospect.reason && (
        <p className="mt-3 text-sm text-gray-600 leading-6">
          <span className="font-semibold">為何推薦：</span>{prospect.reason}
        </p>
      )}

      {prospect.follow_up && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs uppercase font-semibold text-brand mb-1">💬 跟進建議</p>
          <p className="text-sm leading-6 whitespace-pre-wrap">{prospect.follow_up}</p>
        </div>
      )}
    </Link>
  );
}
