import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot
} from "firebase/firestore";
import { db } from "../../services/firebase"; // さっき作った初期化ファイル

export const ChatWindow = ({
  currentUserId,
  targetUserId
}: {
  currentUserId: string;
  targetUserId: string;
}) => {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(
    () => {
      // 1. 「messages」コレクションの中から、自分と相手のやり取りだけを抽出する条件
      // ※ 簡易化のため、全メッセージから自分に関わるものを取る例
      const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));

      // 2. 「見張り番」を設置 (onSnapshot)
      // Firebase側でデータが増えると、この中の関数が勝手に実行される
      const unsubscribe = onSnapshot(q, snapshot => {
        const msgs = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          // 自分宛て、または自分が送ったものだけを表示
          .filter(
            (m: any) =>
              (m.sender_id === currentUserId &&
                m.recipient_id === targetUserId) ||
              (m.sender_id === targetUserId && m.recipient_id === currentUserId)
          );

        setMessages(msgs);
      });

      // 画面を閉じるときに見張りをやめる（メモリ節約）
      return () => unsubscribe();
    },
    [currentUserId, targetUserId]
  );

  return (
    <div className="chat-container">
      {messages.map(msg =>
        <div
          key={msg.id}
          className={msg.sender_id === currentUserId ? "my-msg" : "their-msg"}
        >
          <p>
            {msg.content}
          </p>
        </div>
      )}
    </div>
  );
};
