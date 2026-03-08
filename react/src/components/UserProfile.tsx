// src/components/UserProfile.tsx
import { useUser } from "../context/UserContext";
import UserAvatar from "../components/common/UserAvatar";

export default function UserProfile() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <div className="text-zinc-500 text-sm animate-pulse">読み込み中...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 bg-zinc-900 p-3 rounded-xl border border-zinc-800">
      {/* 修正ポイント：
        外側のボーダー付きdivを削除し、UserAvatarをそのまま置く 
      */}
      <UserAvatar 
        displayName={user?.displayName} 
        avatarUrl={user?.avatarUrl} 
        size="md" 
      />

      {/* 名前と年齢層部分 */}
      <div className="flex flex-col">
        <span className="text-zinc-100 font-bold text-sm">
          {user.displayName || "名無しさん"}
        </span>
        <span className="text-emerald-400 text-[10px] mt-0.5">
          {user.isMinor ? "18歳未満" : "成人済み"}
        </span>
      </div>
    </div>
  );
}