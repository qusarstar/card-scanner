# 📇 智慧名片管理 App

手機掃描名片 → 雲端儲存 → AI 分析潛在客戶 → 提供具體跟進建議

**完全免費，iPhone / Android 都能用，不需要上架 App Store**

---

## 你會做什麼？

跟著這份指南，**3 個免費帳號 + 5 個步驟**，最後你會：

1. 在 iPhone 主畫面有一個圖示 📇
2. 點開就能拍名片，AI 自動辨識
3. 名片儲存在雲端，換手機也看得到
4. 一鍵讓 AI 找出哪些是潛在客戶 + 怎麼跟進

---

## 第一階段：申請免費帳號（約 10 分鐘）

### 1️⃣ Google AI Studio（拿 Gemini API Key）

1. 前往 https://aistudio.google.com/app/apikey
2. 用 Google 帳號登入
3. 點 **Create API Key**
4. **複製 API Key**，貼到記事本暫存（看起來像 `AIzaSyXXXX...`）

> 💰 免費額度：每天 1500 次辨識，不需信用卡

### 2️⃣ Supabase（雲端資料庫）

1. 前往 https://supabase.com
2. 點 **Start your project**，用 GitHub 或 Email 註冊
3. 點 **New Project**：
   - Name：`card-scanner`
   - Database Password：自己設一個（記下來）
   - Region：選 `Southeast Asia (Singapore)`
4. 等專案建立（約 1 分鐘）
5. 完成後，左側選單點 **Project Settings → API**
6. **複製這兩個值**：
   - `Project URL`（例如 `https://xxx.supabase.co`）
   - `anon public` key（一長串 `eyJ...`）

### 3️⃣ Vercel（網站託管）

1. 前往 https://vercel.com
2. 點 **Sign Up**，**用 GitHub 帳號註冊**（沒有 GitHub 的話先去 github.com 註冊）

---

## 第二階段：設定 Supabase 資料庫（2 分鐘）

1. 在 Supabase Dashboard 左側選單點 **SQL Editor**
2. 點 **New query**
3. 打開本專案的 `supabase-setup.sql` 檔案，**複製全部內容**
4. 貼到 SQL Editor 視窗，點右下角 **Run**
5. 看到 `Success. No rows returned` 就成功了 ✅

---

## 第三階段：本機測試（5 分鐘）

打開命令提示字元（cmd），輸入：

```
cd C:\Users\user\Desktop\app\CardScanner
npm install
```

等套件安裝好（約 2 分鐘）。

接著建立環境設定檔：

1. 開啟檔案總管，到 `C:\Users\user\Desktop\app\CardScanner`
2. 找到 `.env.local.example`，**複製一份**
3. 重新命名為 `.env.local`
4. 用記事本打開，貼入剛才複製的三個值：

```
NEXT_PUBLIC_SUPABASE_URL=https://你的專案.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx你的key
GEMINI_API_KEY=AIzaSy你的key
```

存檔。

回到 cmd，輸入：

```
npm run dev
```

打開瀏覽器看 **http://localhost:3000**，已經可以註冊登入測試了！

---

## 第四階段：部署到網路（3 分鐘）

讓你的手機可以打開 App：

### 方法 A：用 Vercel CLI（最快）

```
npm install -g vercel
vercel login
vercel --prod
```

照提示按 Enter 即可。最後會給你一個網址，例如 `https://card-scanner-xxx.vercel.app`

部署完成後，在 Vercel 網站把三個環境變數加進去：
1. 進入 Vercel Dashboard → 你的專案 → **Settings → Environment Variables**
2. 把 `.env.local` 的三個值都加進去
3. 點 **Deployments** → 最新的那筆 → 三點選單 → **Redeploy**

### 方法 B：用 GitHub（推薦長期使用）

1. 在 https://github.com/new 建立一個 repo
2. 把整個 `CardScanner` 資料夾推上去
3. 在 Vercel 點 **Add New Project**，選你的 repo
4. **Environment Variables** 那欄填入三個值
5. 點 **Deploy**

---

## 第五階段：iPhone 安裝（30 秒）

1. 用 iPhone 的 **Safari**（一定要 Safari，不能用 Chrome）打開你的網址
2. 註冊帳號 / 登入
3. 點下方 **分享** 按鈕（中間那個方框 + 上箭頭）
4. 往下滑找到 **加入主畫面**
5. 點 **加入**

桌面就會出現 📇 圖示，點開跟原生 App 一樣！

---

## App 功能

| Tab | 功能 |
|---|---|
| **📇 名片** | 名片列表、搜尋、查看詳情 |
| **🎯 AI 分析** | 找出潛在客戶 + 行業洞察 + 本週應做事項 + 個人化跟進建議 |
| **📷 掃描** | 拍照或選圖，Gemini AI 自動辨識所有欄位 |

---

## 費用

| 項目 | 免費額度 | 你會超過嗎？ |
|---|---|---|
| Gemini API | 每天 1500 次辨識 | 不會 |
| Supabase | 500MB 資料 + 1GB 圖片 | 約可存 5000 張名片 |
| Vercel | 100GB 流量 / 月 | 個人使用完全用不完 |

**全部 0 元** 💰

---

## 遇到問題？

| 問題 | 解法 |
|---|---|
| iPhone 相機開不起來 | 確認用 Safari 打開，點 ✅ 允許相機 |
| 辨識結果不準 | 確認光線充足、名片填滿畫面、避免反光 |
| AI 分析跑很久 | 名片超過 50 張時可能要 10 秒，正常 |
| 登入失敗 | 確認 Supabase 專案的 Authentication → Providers 有開啟 Email |
