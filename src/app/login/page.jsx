'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setMessage('✅ 註冊成功！請查收信箱驗證信，或直接登入');
        setMode('signin');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace('/');
        router.refresh();
      }
    } catch (err) {
      setMessage('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">📇</div>
          <h1 className="text-2xl font-bold">名片掃描</h1>
          <p className="text-gray-500 mt-2">智慧管理 + AI 客戶分析</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full mt-1 px-4 py-3 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-brand"
              placeholder="your@email.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">密碼</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full mt-1 px-4 py-3 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-brand"
              placeholder="至少 6 個字元"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </div>

          {message && (
            <p className="text-sm text-center py-2">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand text-white font-semibold rounded-xl shadow-lg shadow-brand/30 disabled:opacity-50"
          >
            {loading ? '處理中…' : mode === 'signup' ? '註冊' : '登入'}
          </button>

          <button
            type="button"
            onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setMessage(''); }}
            className="w-full text-sm text-brand py-1"
          >
            {mode === 'signup' ? '已有帳號？登入' : '還沒有帳號？註冊'}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6 leading-5">
          資料安全儲存於 Supabase 雲端，僅您本人可以存取
        </p>
      </div>
    </div>
  );
}
