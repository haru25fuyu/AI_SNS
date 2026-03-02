import { Message, Personality } from '../types';

const API_BASE = 'http://localhost:8080/api';

// オンボーディングのチャット
export async function chatForOnboarding(history: Message[]) {
  const res = await fetch(`${API_BASE}/ai/onboarding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ history }),
  });
  const data = await res.json();
  return data.reply;
}

// 性格抽出（Goサーバー側で実装するまでモックでもOK）
export async function extractPersonality(
  history: Message[],
): Promise<Personality> {
  // 本来はここもGoへ送る
  return {
    summary: '気合の入った開発者',
    midTermMemory: ['Reactを勉強中', 'Goでバックエンド構築'],
    conversationStyle: '熱血',
    values: ['挑戦', 'スピード', '気合'],
  };
}

// ボトル代筆
export async function draftBottleMessage(
  p: Personality,
  topic: string,
  input: string,
  mode: string,
) {
  // ひとまずモック
  return `【${topic}】についてのボトル：${input}（${mode}モードで代筆中...）`;
}
