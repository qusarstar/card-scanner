'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';

const FIELDS = [
  { key: 'name', label: '姓名', icon: '👤' },
  { key: 'company', label: '公司', icon: '🏢' },
  { key: 'title', label: '主要職位', icon: '💼' },
  { key: 'email', label: 'Email', icon: '✉️', type: 'email' },
  { key: 'phone', label: '電話（室話）', icon: '📞', type: 'tel' },
  { key: 'mobile', label: '手機', icon: '📱', type: 'tel' },
  { key: 'fax', label: '傳真', icon: '📠', type: 'tel' },
  { key: 'address', label: '地址', icon: '📍' },
  { key: 'website', label: '網站', icon: '🌐', type: 'url' },
  { key: 'industry', label: '行業', icon: '🏭' },
  { key: 'notes', label: '備註', icon: '📝', multiline: true },
];

export default function ScanPage() {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState('start');
  const [imageBase64, setImageBase64] = useState(null);
  const [imageBlob, setImageBlob] = useState(null);
  const [fields, setFields] = useState({});
  const [error, setError] = useState('');

  function pickImage() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setStep('scanning');

    try {
      const base64 = await fileToBase64(file);
      setImageBase64(base64);
      setImageBlob(file);

      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64.split(',')[1],
          mimeType: file.type || 'image/jpeg',
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || '辨識失敗');
      }

      const data = await response.json();
      setFields(data);
      setStep('review');
    } catch (err) {
      setError(err.message);
      setStep('start');
    }
  }

  function update(key, value) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function updateListItem(listKey, index, value) {
    setFields((prev) => {
      const list = [...(prev[listKey] || [])];
      list[index] = value;
      return { ...prev, [listKey]: list };
    });
  }

  function addListItem(listKey) {
    setFields((prev) => ({
      ...prev,
      [listKey]: [...(prev[listKey] || []), ''],
    }));
  }

  function removeListItem(listKey, index) {
    setFields((prev) => ({
      ...prev,
      [listKey]: (prev[listKey] || []).filter((_, i) => i !== index),
    }));
  }

  async function handleSave() {
    if (!fields.name && !fields.company) {
      setError('至少需要填寫姓名或公司');
      return;
    }

    setStep('saving');
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('請先登入');

      let imageUrl = null;
      if (imageBlob) {
        const filename = `${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('card-images')
          .upload(filename, imageBlob, { contentType: imageBlob.type, upsert: false });

        if (!uploadError) {
          const { data } = supabase.storage.from('card-images').getPublicUrl(filename);
          imageUrl = data.publicUrl;
        }
      }

      const { error: dbError } = await supabase.from('cards').insert({
        user_id: user.id,
        name: fields.name || '',
        company: fields.company || '',
        title: fields.title || '',
        secondary_titles: (fields.secondary_titles || []).filter((t) => t && t.trim()),
        past_experience: (fields.past_experience || []).filter((t) => t && t.trim()),
        email: fields.email || '',
        phone: fields.phone || '',
        mobile: fields.mobile || '',
        fax: fields.fax || '',
        address: fields.address || '',
        website: fields.website || '',
        industry: fields.industry || '',
        notes: fields.notes || '',
        image_url: imageUrl,
      });

      if (dbError) throw dbError;

      router.replace('/');
      router.refresh();
    } catch (err) {
      setError(err.message);
      setStep('review');
    }
  }

  if (step === 'scanning') {
    return <Loading title="AI 辨識中…" hint="Gemini 正在讀取名片，約 3–5 秒" image={imageBase64} />;
  }

  if (step === 'saving') {
    return <Loading title="儲存中…" hint="正在上傳到雲端" />;
  }

  if (step === 'review') {
    return (
      <main className="min-h-screen pb-32">
        <header className="sticky top-0 bg-white border-b z-10 safe-top">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => setStep('start')} className="text-brand">取消</button>
            <h1 className="font-semibold">確認資訊</h1>
            <button onClick={handleSave} className="text-brand font-semibold">儲存</button>
          </div>
        </header>

        {imageBase64 && (
          <img src={imageBase64} alt="" className="w-full max-h-48 object-contain bg-black" />
        )}

        <div className="bg-green-50 mx-4 mt-4 px-4 py-2 rounded-lg text-sm text-green-700 text-center">
          ✅ AI 已擷取資訊，可手動修正後儲存
        </div>

        {error && (
          <div className="bg-red-50 mx-4 mt-2 px-4 py-2 rounded-lg text-sm text-red-700 text-center">
            ❌ {error}
          </div>
        )}

        {/* 基本欄位（姓名、公司、主要職位） */}
        <div className="bg-white mx-4 mt-4 rounded-2xl divide-y">
          {FIELDS.slice(0, 3).map((f) => (
            <FieldRow key={f.key} f={f} fields={fields} update={update} />
          ))}
        </div>

        {/* 次要職位 */}
        <ListSection
          icon="🎖️"
          label="次要職位（兼職、委員、顧問）"
          listKey="secondary_titles"
          fields={fields}
          updateListItem={updateListItem}
          addListItem={addListItem}
          removeListItem={removeListItem}
          placeholder="例如：教育部牙醫教育組召集人"
        />

        {/* 經歷 */}
        <ListSection
          icon="📜"
          label="經歷（含「前」、「曾任」字眼）"
          listKey="past_experience"
          fields={fields}
          updateListItem={updateListItem}
          addListItem={addListItem}
          removeListItem={removeListItem}
          placeholder="例如：東南亞牙醫教育學會前會長"
        />

        {/* 其他欄位（聯絡方式 + 備註） */}
        <div className="bg-white mx-4 mt-4 rounded-2xl divide-y">
          {FIELDS.slice(3).map((f) => (
            <FieldRow key={f.key} f={f} fields={fields} update={update} />
          ))}
        </div>
      </main>
    );
  }

  // step === 'start'
  return (
    <main className="min-h-screen pb-24 safe-top flex flex-col">
      <header className="px-4 pt-4">
        <h1 className="text-3xl font-bold">掃描名片</h1>
        <p className="text-gray-500 mt-2">拍照或從相簿選圖，AI 自動辨識</p>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-8 space-y-3">
        <button
          onClick={() => {
            fileInputRef.current.setAttribute('capture', 'environment');
            pickImage();
          }}
          className="w-full bg-brand text-white py-5 rounded-2xl shadow-lg shadow-brand/30 active:scale-[0.98] transition flex items-center gap-4 px-6"
        >
          <span className="text-3xl">📷</span>
          <div className="text-left">
            <p className="font-semibold text-lg">拍攝名片</p>
            <p className="text-sm text-white/80">開啟相機立即拍攝</p>
          </div>
        </button>

        <button
          onClick={() => {
            fileInputRef.current.removeAttribute('capture');
            pickImage();
          }}
          className="w-full bg-white py-5 rounded-2xl shadow-sm active:scale-[0.98] transition flex items-center gap-4 px-6"
        >
          <span className="text-3xl">🖼️</span>
          <div className="text-left">
            <p className="font-semibold text-lg">從相簿選取</p>
            <p className="text-sm text-gray-500">選取已拍好的名片圖片</p>
          </div>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {error && <p className="text-sm text-red-600 text-center px-4">❌ {error}</p>}

        <p className="text-xs text-gray-400 text-center pt-6 leading-5 px-4">
          💡 拍攝時讓名片填滿畫面，光線充足效果最佳
        </p>
      </div>

      <BottomNav />
    </main>
  );
}

function FieldRow({ f, fields, update }) {
  return (
    <div className="flex items-start px-4 py-3">
      <div className="text-xl mr-3 mt-1">{f.icon}</div>
      <div className="flex-1">
        <p className="text-xs text-gray-500">{f.label}</p>
        {f.multiline ? (
          <textarea
            value={fields[f.key] || ''}
            onChange={(e) => update(f.key, e.target.value)}
            placeholder={`輸入${f.label}`}
            rows={2}
            className="w-full mt-1 outline-none resize-none text-base"
          />
        ) : (
          <input
            type={f.type || 'text'}
            value={fields[f.key] || ''}
            onChange={(e) => update(f.key, e.target.value)}
            placeholder={`輸入${f.label}`}
            autoCapitalize="none"
            className="w-full mt-1 outline-none text-base"
          />
        )}
      </div>
    </div>
  );
}

function ListSection({ icon, label, listKey, fields, updateListItem, addListItem, removeListItem, placeholder }) {
  const list = fields[listKey] || [];
  return (
    <div className="bg-white mx-4 mt-4 rounded-2xl px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <span className="text-xl mr-3">{icon}</span>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
        <button
          type="button"
          onClick={() => addListItem(listKey)}
          className="text-brand text-sm font-semibold"
        >
          + 新增
        </button>
      </div>
      {list.length === 0 && (
        <p className="text-sm text-gray-400 ml-9">無，可點「+ 新增」加入</p>
      )}
      <div className="ml-9 space-y-2">
        {list.map((t, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={t}
              onChange={(e) => updateListItem(listKey, i, e.target.value)}
              placeholder={placeholder}
              className="flex-1 px-2 py-1 bg-gray-100 rounded outline-none text-sm"
            />
            <button
              type="button"
              onClick={() => removeListItem(listKey, i)}
              className="text-red-500 text-sm px-2"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Loading({ title, hint, image }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black/90 fixed inset-0 z-50">
      {image && (
        <img src={image} alt="" className="absolute inset-0 w-full h-full object-contain opacity-30" />
      )}
      <div className="relative bg-white rounded-2xl px-8 py-6 text-center shadow-2xl">
        <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-semibold text-lg">{title}</p>
        <p className="text-sm text-gray-500 mt-1">{hint}</p>
      </div>
    </div>
  );
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
