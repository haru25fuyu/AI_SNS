// src/services/chatService.ts
import client from '../api/client'; // さっきの client.ts をインポート

export const sendMessage = async (recipientId: string, content: string) => {
  try {
    const response = await client.post('/chat/send', {
      recipient_id: recipientId,
      content: content,
    });

    return response.data;
  } catch (error: any) {
    console.error('メッセージ送信失敗:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || '送信に失敗しました');
  }
};
