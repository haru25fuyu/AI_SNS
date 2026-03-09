import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useChat } from "../hooks/useChat";
import { sendMessage } from "../services/chatService";
import { formatTime } from "../services/function";
import { useUser } from "../context/UserContext";
import UserAvatar from "../components/common/UserAvatar";
import client from "../api/client";

export default function ChatRoomPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: me } = useUser();
  const messages = useChat(me?.userId || "", userId || "");
  const [text, setText] = useState("");
	const [name,setName] = useState("");
	const [avatar,setAvatar] = useState("");
  
  // 自動スクロール用の参照
  const scrollEndRef = useRef<HTMLDivElement>(null);

  // メッセージが増えるたびに一番下へスクロール
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
		client.post(`/user/get/${userId}`)
		.then((res) => {
			setName(res.data.display_name)
			setAvatar(res.data.avatar_url)
		})
  }, [messages]);

	useEffect(() => {
  if (userId) {
    // 相手からのメッセージを既読にするAPIを叩く
    client.post(`/chat/read?target_id=${userId}`);
  }
}, [userId, messages]); // メッセージが増えるたびに実行

  const handleSend = async () => {
    if (!text.trim() || !userId) return;
    try {
      await sendMessage(userId, text.trim());
      setText(""); // 送信成功したら入力欄を空に
    } catch (err) {
      console.error(err);
    }
  };

  // エンターキーの判定
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // 本来の改行動作を止める
      handleSend();
    }
    // Shift + Enter は何もしない（ブラウザ標準の改行が走る）
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100">
      {/* ヘッダー */}
      <header className="flex items-center gap-4 p-4 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10">
        <button 
          onClick={() => navigate("/chats")}
          className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center font-bold">
					<UserAvatar 
        		displayName={name} 
        		avatarUrl={avatar} 
        		size="md" 
      		/>
        </div>
        <h2 className="font-bold text-lg">{name}</h2>
      </header>

      {/* メッセージエリア */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((m) => {
          const isMe = m.sender_id === me?.userId;
          return (
					<div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
  					<div className={`flex items-end max-w-[85%] ${isMe ? "flex-row" : "flex-row-reverse"}`}>

  						{/* 既読 or 時間 (吹き出しの横に添える) */}
  						<div className={`flex flex-col text-[10px] text-zinc-500 mb-1 mx-1 ${isMe ? "items-end" : "items-start"}`}>
  						  {isMe && m.is_read && (
  						    <span className="text-blue-400 font-bold">既読</span>
  						  )}
  						  <span className="text-[10px] text-zinc-500">{formatTime(m.timestamp)}</span>
  						</div>
							
  						{/* メッセージ吹き出し */}
  						<div className={`
  						  p-3 rounded-2xl text-sm leading-relaxed
  						  ${isMe 
  						    ? "bg-blue-600 text-white rounded-tr-none" 
  						    : "bg-zinc-900 text-zinc-100 border border-zinc-800 rounded-tl-none"}
  						`}>
  						  <div className="whitespace-pre-wrap break-words">{m.content}</div>
  						</div>
									
  					</div>
					</div>

          );
        })}
        {/* スクロール位置固定用のダミー要素 */}
        <div ref={scrollEndRef} />
      </main>

      {/* 入力エリア */}
      <footer className="p-4 bg-zinc-950 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto flex items-end gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-2 focus-within:border-zinc-700 transition-colors">
          <textarea
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを送信..."
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2 px-3 max-h-32 text-sm text-zinc-100 placeholder-zinc-500"
            style={{ minHeight: '40px' }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-xl transition-all active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </button>
        </div>
        <p className="text-[10px] text-zinc-500 text-center mt-2">
          Enter で送信 / Shift + Enter で改行
        </p>
      </footer>
    </div>
  );
}