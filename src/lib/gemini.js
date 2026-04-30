import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) console.warn('⚠️ GEMINI_API_KEY 未設定');

export const genAI = new GoogleGenerativeAI(apiKey || '');

export const visionModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: { responseMimeType: 'application/json' },
});

export const textModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: { responseMimeType: 'application/json' },
});

// 從圖片擷取名片資訊
export async function extractCardFromImage(base64Image, mimeType = 'image/jpeg') {
  const prompt = `仔細辨識這張名片上的所有文字，並回傳純 JSON 物件，欄位如下：
{
  "name": "姓名（中文優先）",
  "company": "公司名稱",
  "title": "職稱",
  "email": "電子郵件",
  "phone": "電話（多個用逗號分隔）",
  "address": "地址",
  "website": "網站",
  "industry": "推測的行業類別",
  "notes": "其他可能有用的資訊"
}

規則：
- 找不到的欄位填空字串 ""
- industry 根據公司名稱、職稱、業務內容判斷（例如：科技、金融、醫療、零售、製造業等）
- 不要任何 markdown 或說明文字，只回傳 JSON`;

  const result = await visionModel.generateContent([
    prompt,
    { inlineData: { mimeType, data: base64Image } },
  ]);

  const text = result.response.text();
  return JSON.parse(text);
}

// 分析所有名片，找出潛在客戶
export async function analyzeContacts(cards, userBusiness = '') {
  const cardSummary = cards.map((c, i) => ({
    id: c.id,
    name: c.name,
    company: c.company,
    title: c.title,
    industry: c.industry || '',
    notes: c.notes || '',
    last_contact: c.last_contact_date || '從未聯絡',
  }));

  const prompt = `你是一位資深的業務開發顧問。

${userBusiness ? `使用者的業務領域：${userBusiness}\n` : ''}
這是使用者的名片聯絡人清單：
${JSON.stringify(cardSummary, null, 2)}

請分析這些聯絡人，回傳純 JSON：
{
  "top_prospects": [
    {
      "id": "聯絡人 id",
      "score": 0-100 整數,
      "reason": "為何是潛在客戶（一句話）",
      "follow_up": "具體跟進建議（包含時機、管道、話題、開場白範例）",
      "priority": "high" | "medium" | "low"
    }
  ],
  "industry_insights": "從聯絡人組成看出的行業趨勢觀察（2-3 句）",
  "action_items": ["本週應做的 3-5 個具體行動"]
}

規則：
- top_prospects 至少回傳 3 個，最多 8 個，依分數排序
- follow_up 要具體可執行，包含實際話術
- 不要任何 markdown 或說明文字，只回傳 JSON`;

  const result = await textModel.generateContent(prompt);
  const text = result.response.text();
  return JSON.parse(text);
}
