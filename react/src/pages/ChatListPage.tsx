import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { useUser } from "../context/UserContext";
import { query, collection, where, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import UserAvatar from "../components/common/UserAvatar";
import { formatTime } from "../services/function";

export default function ChatListPage() {
  const [users, setUsers] = useState<any[]>([]);
	const { user: me } = useUser();

  const navigate = useNavigate();

  // 1. GoのAPIを叩いて一覧を更新する関数
  const fetchUsers = async () => {
    try {
      const res = await client.get("/users");
      setUsers(res.data);
			console.log("ユーザー一覧を更新しました:", res.data); // デバッグ用ログ
    } catch (err) {
      console.error(err);
    }
  };

  // 初回読み込み
  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. 「自分宛てのメッセージ」を監視して、届いたら fetchUsers() を呼ぶ
  useEffect(() => {
    if (!me?.userId) return;

    const q = query(
      collection(db, "messages"),
      where("recipient_id", "==", me.userId), // 自分宛ての
      where("is_read", "==", false)           // 未読メッセージ
    );

    const unsubscribe = onSnapshot(q, () => {
      // 🔔 何か未読に変化（新着など）があったらGoに聞き直す！
      console.log("未読状況が変わったので一覧を更新します...");
      fetchUsers();
    });

    return () => unsubscribe();
  }, [me?.userId]);

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-100">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 tracking-tight">メッセージ</h1>
        
        <div className="flex flex-col gap-3">
          {users.length <= 0 ? (
            <div className="text-center py-10">
              <p className="text-zinc-500">ユーザーが見つかりません</p>
            </div>
          ) : (
            users.map((user) => (
              <div
							  key={user.id}
							  onClick={() => navigate(`/chat/${user.id}`)}
							  className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl cursor-pointer hover:bg-zinc-800 transition-all duration-200 active:scale-[0.98]"
							>
							  {/* アバターコンテナ */}
							  <div className="relative flex-shrink-0">
							    <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 font-bold text-lg">
							      <UserAvatar 
        							displayName={user?.display_name} 
        							avatarUrl={user?.avatar_url} 
        							size="md" 
      							/>
							    </div>

							    {/* 未読バッジをアバターの右上に浮かせる */}
							    {user.unread_count > 0 && (
							      <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-zinc-950">
							        {user.unread_count}
							      </div>
							    )}
							  </div>
								
							  {/* テキスト情報 */}
							  <div className="flex-1 min-w-0">
								  <div className="flex justify-between items-center mb-1">
								    <span className="font-bold text-lg truncate">{user.display_name}</span>
																
								    {/* 12:34 ではなく、Go から届いた最新時刻を表示 */}
								    <span className="text-xs text-zinc-500 flex-shrink-0">
								      {formatTime(user.last_time)}
								    </span>
								  </div>
																
								  {/* 固定のメッセージではなく、実際の最新メッセージを表示 */}
								  <p className="text-sm text-zinc-400 truncate">
								    {user.last_message || "タップしてチャットを開始"}
								  </p>
								</div>
							</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}