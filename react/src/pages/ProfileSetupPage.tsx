// src/pages/ProfileSetupPage.tsx
import React, { useState, useRef,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import  client  from "../api/client"; // 先ほど作ったクライアントをインポート

import UserAvatar from "../components/common/UserAvatar";
import ImageCropModal from "../components/common/ImageCropModal";

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAiNaming, setIsAiNaming] = useState(false); // AI命名中のステート
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
	
	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {  
		const file = e.target.files?.[0];  
		if (file) {    
			const reader = new FileReader();    
			reader.onload = () => {      
				setTempImage(reader.result as string);      
				setIsCropModalOpen(true); // モーダルを開く    
			};    
			reader.readAsDataURL(file);  
		}
	};


	useEffect(() => {
		// apiから	ユーザーデータの取得
		client.get("/users/me").then((res) => {

			setDisplayName(res.data.display_name);
			setAvatarPreview(res.data.avatar_url);
		}).catch((err) => {
			console.error("ユーザーデータの取得に失敗:", err);
		});
	}, []);

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
      navigate("/dashboard"); 
    } catch (error) {
      console.error("プロフィール設定エラー:", error);
      // 必要に応じて画面上にエラーメッセージを表示する処理を追加
    } finally {
      setIsLoading(false);
    }
  };

	const handleCropComplete = (croppedBlob: Blob) => {
		const croppedPreviewUrl = URL.createObjectURL(croppedBlob);
  
  	// 1. これを UserAvatar に渡せば、即座に「切り抜かれた後の顔」が表示される！
		setAvatarPreview(croppedPreviewUrl); 
  
  	// 2. サーバー送信用のファイルとして保持
		const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
		setAvatarFile(file);
		
		setIsCropModalOpen(false);
	};

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-6 tracking-tight">プロフィール設定</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-4">
						<div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
							<div className="w-24 h-24 rounded-full overflow-hidden border-2 border-zinc-700 group-hover:border-emerald-500 transition-all duration-300">
								<UserAvatar displayName={displayName} avatarUrl={avatarPreview} size="xl" />
								<div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
									<span className="text-[10px] font-bold text-white tracking-widest">CHANGE</span>
								</div>
							</div>
							<div className="absolute bottom-0 right-0 bg-emerald-500 p-1.5 rounded-full border-2 border-zinc-950 shadow-lg transform translate-x-1 translate-y-1 group-hover:scale-110 transition-transform duration-300">
								<Camera size={14} className="text-zinc-950" />
							</div>

				    	{/* 背景の装飾：ホバー時にエメラルド色の光を漏らす */}
							<div className="absolute -z-10 inset-0 rounded-full bg-emerald-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
						</div>

						<input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />

						<div className="text-center">
							<p className="text-xs font-medium text-zinc-400 group-hover:text-emerald-400 transition-colors">
								アイコンをアップロード
							</p>
						</div>
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
			{isCropModalOpen && tempImage && (
				<ImageCropModal 
					image={tempImage} 
					onCropComplete={handleCropComplete} 
					onClose={() => setIsCropModalOpen(false)} 
				/>
			)}
    </div>
  );
}