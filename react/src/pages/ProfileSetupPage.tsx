// src/pages/ProfileSetupPage.tsx
import React, { useState, useRef,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import  client  from "../api/client"; // 先ほど作ったクライアントをインポート

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		// apiから	ユーザーデータの取得
		client.get("/users/me").then((res) => {

			setDisplayName(res.data.display_name);
			setAvatarPreview(res.data.avatar_url);
		}).catch((err) => {
			console.error("ユーザーデータの取得に失敗:", err);
		});
	}, []);


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setIsLoading(true);
    try {
      // 1. FormData オブジェクトの作成
      const formData = new FormData();
      formData.append("displayName", displayName);
      
      // 画像ファイルが選択されている場合のみ追加
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      // 2. バックエンドへPOST送信 (multipart/form-data)
      await client.post("/users/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // 保存成功後、次のページへ遷移
      navigate("/onboarding"); 
    } catch (error) {
      console.error("プロフィール設定エラー:", error);
      // 必要に応じて画面上にエラーメッセージを表示する処理を追加
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-6 tracking-tight">プロフィール設定</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* アイコン設定セクション */}
          <div className="flex flex-col items-center gap-4">
            <div 
              className="relative w-24 h-24 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-emerald-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera className="text-zinc-400 group-hover:text-emerald-400 transition-colors" size={32} />
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-medium text-white">変更</span>
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              accept="image/*" 
              className="hidden" 
            />
            <p className="text-sm text-zinc-400">アイコンをアップロード</p>
          </div>

          {/* 名前設定セクション */}
          <div className="space-y-2">
            <label htmlFor="displayName" className="block text-sm font-medium text-zinc-300">
              表示名
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="あなたの名前"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-zinc-100"
              required
            />
          </div>

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={!displayName.trim() || isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold py-3 rounded-lg transition-colors"
          >
            {isLoading ? "保存中..." : "この内容で始める"}
          </button>
        </form>
      </div>
    </div>
  );
}