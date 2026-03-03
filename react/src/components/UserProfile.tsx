// src/components/UserProfile.tsx
import { useUser } from "../context/UserContext";

export default function UserProfile() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <div className="text-zinc-500 text-sm animate-pulse">読み込み中...</div>;
  }

  if (!user) {
    return null; // 未ログイン時は何も表示しない
  }

  // バックエンドのURL (環境変数等で管理するのが理想ですが、一旦直書きしています)
  const backendUrl = "http://localhost:8080";
  const avatarFullPath = user.avatarUrl
    ? `${backendUrl}${user.avatarUrl}`
    : null;

  return (
    <div className="flex items-center gap-4 bg-zinc-900 p-3 rounded-xl border border-zinc-800">
      {/* アイコン部分 */}
      <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 border-2 border-emerald-500 shrink-0">
        {avatarFullPath
          ? <img
              src={avatarFullPath}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          : <div className="w-full h-full flex items-center justify-center text-zinc-500 text-[10px]">
              No Img
            </div>}
      </div>

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
