// src/pages/AuthPage.tsx
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import axios from "axios";

export default function AuthPage() {
  const navigate = useNavigate();
  const { login } = useUser(); // Contextの更新関数を取得

  const handleSuccess = async (response: CredentialResponse) => {
    // 1. localStorage から誕生日を取得
    const birthDate = localStorage.getItem("birth_date");

    if (!birthDate) {
      alert("誕生日が設定されていません。憲章ページからやり直してください。");
      navigate("/terms");
      return;
    }

    // 2. Googleトークンと誕生日をセットで送信
    const res = await axios.post(
      "http://localhost:8080/api/auth/google",
      {
        token: response.credential,
        birth_date: birthDate
      },
      {
        withCredentials: true
      }
    );

    if (!res || res.status !== 200) {
      alert("ログインサーバーとの接続に失敗しました。");
      return;
    }

    const data = res.data;

    // 3. ログイン成功後の処理
    // 前回作った「一度だけデコードしてStoreに入れる」処理をここで実行
    login(data.access_token, {
      userId: data.userID,
      isMinor: data.isMinor // バックエンドから返ってくる判定フラグ
    });

    // 使い終わった誕生日は消しておくと客観的に見て綺麗です
    localStorage.removeItem("birth_date");

    if (data.isNewUser) {
      navigate("/setup");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black italic text-emerald-400">ログイン</h1>
        <p className="text-zinc-500 text-sm italic">KIAI 憲章に基づき、認証を開始します</p>
      </div>

      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-2xl">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => alert("ログインに失敗しました。気合を入れ直してください。")}
          theme="filled_black"
          shape="pill"
        />
      </div>
    </div>
  );
}
