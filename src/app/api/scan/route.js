import { NextResponse } from 'next/server';
import { extractCardFromImage } from '@/lib/gemini';
import { createClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request) {
  try {
    // 驗證使用者已登入
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const { image, mimeType } = await request.json();
    if (!image) {
      return NextResponse.json({ error: '缺少圖片資料' }, { status: 400 });
    }

    const card = await extractCardFromImage(image, mimeType || 'image/jpeg');

    return NextResponse.json(card);
  } catch (err) {
    console.error('Scan error:', err);
    return NextResponse.json(
      { error: err.message || 'AI 辨識失敗，請重試' },
      { status: 500 }
    );
  }
}
