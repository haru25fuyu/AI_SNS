// src/hooks/useChat.ts
import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
} from 'firebase/firestore';

export const useChat = (currentUserId: string, targetUserId: string) => {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    // 自分と相手のやり取りだけをリアルタイムで取得
    // ※ インデックス作成が必要になる場合があるので、最初はシンプルなクエリから始めるのがコツです
    const q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter(
          (m: any) =>
            (m.sender_id === currentUserId &&
              m.recipient_id === targetUserId) ||
            (m.sender_id === targetUserId && m.recipient_id === currentUserId),
        );
      setMessages(msgs);
    });

    return () => unsubscribe(); // 画面を閉じたら見張りをやめる
  }, [currentUserId, targetUserId]);

  return messages;
};
