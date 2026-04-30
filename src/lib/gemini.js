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
  const prompt = `仔細辨識這張名片上的所有文字（**包含手寫的內容**，手寫常常是手機號碼或補充說明），並回傳純 JSON 物件：
{
  "name": "姓名（中文優先）",
  "company": "主要服務的公司或機構名稱",
  "title": "主要職位（最重要、最具代表性的那一個）",
  "secondary_titles": ["現任的次要職位 / 兼職 / 委員 / 顧問 1", "..."],
  "past_experience": ["過去的經歷（含「前」「曾任」「前任」等字眼）1", "..."],
  "email": "電子郵件",
  "phone": "公司室話 / 辦公室電話",
  "mobile": "手機號碼（09 開頭，包含手寫的）",
  "fax": "傳真號碼",
  "address": "地址",
  "website": "網站",
  "industry": "推測的行業類別",
  "notes": ""
}

規則：
- 找不到的欄位填空字串 ""，陣列欄位找不到就填 []
- **title**：只放一個最主要的職位（院長、總經理、教授…）
- **secondary_titles**：名片上**現任的**其他兼職、委員、顧問等（例如「教育部牙醫教育組召集人」、「世界吞嚥障礙高峰會委員」）
- **past_experience**：含「前」、「曾任」、「前任」等字眼的職務歸到這（例如「東南亞牙醫教育學會前會長」）
- **phone**：辦公室室話（02、03、04 等開頭）
- **mobile**：09 開頭的手機，**特別注意手寫**的數字。台灣手機格式固定為 **10 碼**（09XX-XXX-XXX），辨識完務必檢查總共是 10 碼，不要多讀或少讀數字
- **fax**：傳真號碼
- 一張名片如果同時有室話、手機、傳真，要分別放到對應欄位，不要全部塞 phone
- notes 留空字串，不要把頭銜或經歷塞進去
- industry 根據公司名稱、職位、業務內容判斷（例如：科技、金融、醫療、零售、製造業等）
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
    secondary_titles: c.secondary_titles || [],
    past_experience: c.past_experience || [],
    industry: c.industry || '',
    notes: c.notes || '',
    last_contact: c.last_contact_date || '從未聯絡',
  }));

  const prompt = `你是一位資深的業務開發顧問。

${userBusiness ? `使用者的業務領域：${userBusiness}\n` : ''}
這是使用者**目前所有**的名片聯絡人清單（共 ${cardSummary.length} 張）：
${JSON.stringify(cardSummary, null, 2)}

請分析這些聯絡人，回傳純 JSON：
{
  "top_prospects": [
    {
      "id": "必須是上面清單裡某張名片的真實 id",
      "score": 0-100 整數,
      "reason": "為何是潛在客戶（一句話）",
      "follow_up": "具體跟進建議（包含時機、管道、話題、開場白範例）",
      "priority": "high" | "medium" | "low"
    }
  ],
  "industry_insights": "從聯絡人組成看出的行業趨勢觀察（2-3 句）",
  "action_items": ["本週應做的具體行動，每一項都必須對應到上面清單裡的真實聯絡人"]
}

**極為重要的規則（違反就是嚴重錯誤）：**
- ⚠️ **絕對禁止編造任何人名、公司名、職稱**。所有提到的人、公司、職位都必須**逐字**來自上面提供的名片清單
- ⚠️ top_prospects 的 id 必須是上面清單裡實際存在的 id，不可虛構
- ⚠️ action_items 裡每一項提到的人名都必須是清單裡真實存在的人
- top_prospects 數量 **不超過清單總數**（目前清單只有 ${cardSummary.length} 張，所以最多 ${cardSummary.length} 個）
- 如果清單很少，就少給幾個建議，**寧可少也不要編**
- follow_up 要具體可執行，包含實際話術
- 不要任何 markdown 或說明文字，只回傳 JSON`;

  const result = await textModel.generateContent(prompt);
  const text = result.response.text();
  return JSON.parse(text);
}
