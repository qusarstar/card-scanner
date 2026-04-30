import { NextResponse } from 'next/server';
import { analyzeContacts } from '@/lib/gemini';
import { createClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const { userBusiness } = await request.json();

    // 取得這個使用者的所有名片
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('id, name, company, title, secondary_titles, past_experience, industry, notes, last_contact_date');

    if (cardsError) throw cardsError;
    if (!cards || cards.length === 0) {
      return NextResponse.json({ error: '尚未掃描任何名片' }, { status: 400 });
    }

    const analysis = await analyzeContacts(cards, userBusiness || '');

    // 把每個 prospect 的分析結果寫回對應的 card
    if (analysis.top_prospects?.length) {
      for (const p of analysis.top_prospects) {
        await supabase
          .from('cards')
          .update({
            ai_score: p.score,
            ai_reason: p.reason,
            ai_follow_up: p.follow_up,
            ai_priority: p.priority,
          })
          .eq('id', p.id)
          .eq('user_id', user.id);
      }
    }

    // 儲存整體分析結果
    await supabase.from('analyses').insert({
      user_id: user.id,
      user_business: userBusiness || '',
      result: analysis,
    });

    return NextResponse.json(analysis);
  } catch (err) {
    console.error('Analyze error:', err);
    return NextResponse.json(
      { error: err.message || 'AI 分析失敗，請重試' },
      { status: 500 }
    );
  }
}
