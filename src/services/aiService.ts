import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 1. オンボーディング: 性格抽出プロンプト
export async function extractPersonality(chatHistory: { role: string; text: string }[]) {
  const prompt = `
あなたはSNSアプリ『Kiai』のコアエンジンです。
以下のユーザーとの会話履歴から、ユーザーの「ビッグファイブ」「ライフスタイル」「会話の質感」「価値観」を分析し、JSONで出力してください。
また、ユーザー特有の言い回しや文脈を保持した「中期記憶（箇条書きの要約）」も作成してください。

会話履歴:
${chatHistory.map(msg => `${msg.role}: ${msg.text}`).join('\n')}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          bigFive: {
            type: Type.OBJECT,
            properties: {
              openness: { type: Type.NUMBER, description: "0-100" },
              conscientiousness: { type: Type.NUMBER, description: "0-100" },
              extraversion: { type: Type.NUMBER, description: "0-100" },
              agreeableness: { type: Type.NUMBER, description: "0-100" },
              neuroticism: { type: Type.NUMBER, description: "0-100" },
            },
            required: ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"],
          },
          lifestyle: { type: Type.STRING, description: "ライフスタイルの要約" },
          conversationStyle: { type: Type.STRING, description: "会話の質感（例：丁寧、フランク、論理的）" },
          values: { type: Type.ARRAY, items: { type: Type.STRING }, description: "大切にしている価値観" },
          summary: { type: Type.STRING, description: "ユーザーの全体的な性格の要約" },
          midTermMemory: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING }, 
            description: "ユーザー特有の言い回しや文脈を保持した箇条書きの要約" 
          }
        },
        required: ["bigFive", "lifestyle", "conversationStyle", "values", "summary", "midTermMemory"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
}

// 2. ボトル作成支援プロンプト
export async function draftBottleMessage(
  personality: any,
  topic: string,
  userInput: string,
  mode: 'normal' | 'adventure' = 'normal'
) {
  const prompt = `
あなたはSNSアプリ『Kiai』のコアエンジンです。
ユーザーの性格データと、入力された断片的な言葉から、その人の魅力が伝わる「ボトル（投稿文）」を代筆・提案してください。

【ユーザーの性格データ】
${JSON.stringify(personality, null, 2)}

【トピック】
${topic}

【ユーザーの入力】
${userInput}

【モード】
${mode === 'adventure' ? '冒険モード：尖った表現や、心をざわつかせる言い回しを選んでください。守りに入らず攻めた文章にしてください。' : '通常モード：ユーザーの性格に沿った自然な文章にしてください。'}

出力は、ユーザーの性格（会話の質感や価値観）をベースにしつつ、指定されたモードに合わせて魅力的な文章（100〜200文字程度）にしてください。
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text;
}

// 3. オンボーディング会話用チャットボット
export async function chatForOnboarding(chatHistory: { role: string; text: string }[]) {
  const prompt = `
あなたはSNSアプリ『Kiai』のオンボーディングAIです。
ユーザーの性格（ビッグファイブ、ライフスタイル、価値観）を深く知るために、自然な会話を行ってください。
質問は1つずつ、相手が答えやすいように投げかけてください。
3〜5往復で十分なデータが集まるように、少し深掘りする質問を混ぜてください。

これまでの会話:
${chatHistory.map(msg => `${msg.role}: ${msg.text}`).join('\n')}

AIとしての次の返答を生成してください。
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text;
}
