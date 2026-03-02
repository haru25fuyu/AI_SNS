import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Calendar, CheckCircle2 } from "lucide-react";

import BirthdayPicker from "../components/onboarding/BirthdayPicker";

export default function TermsPage() {
  const navigate = useNavigate();

  // 状態管理：誕生日（YYYY-MM-DD）と同意チェック
  const [birthDate, setBirthDate] = useState<string>("");
  const [hasChecked, setHasChecked] = useState(false);

  const handleStart = () => {
    if (!birthDate || !hasChecked) return;

    // 選択結果を保存（Googleログイン時にここから読み取ってAPIに送る）
    localStorage.setItem("agreed", "true");
    localStorage.setItem("birth_date", birthDate);

    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
      <div className="max-w-xl w-full space-y-8 bg-zinc-900 border border-zinc-800 p-8 md:p-12 rounded-[2rem] shadow-2xl">
        <header className="text-center space-y-2">
          <div className="inline-flex p-3 bg-emerald-500/10 rounded-2xl mb-2">
            <ShieldCheck size={40} className="text-emerald-400" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter italic">
            KIAI 憲章
          </h2>
          <p className="text-zinc-500 text-sm">この門を潜る者に、嘘偽りなし。</p>
        </header>

        {/* 規約本文（省略なし） */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 h-40 overflow-y-auto text-sm text-zinc-400 leading-relaxed">
          <p className="text-zinc-200 font-bold mb-2">【第1条：熱量の尊重】</p>
          <p>本サービスは、農業、林業、モノづくり、そして未来を語る全ての「気合」ある人々を歓迎します。</p>
          <p className="mt-4 text-zinc-200 font-bold">【第2条：全世代への門戸】</p>
          <p>
            未成年の方も、次世代を担う仲間として利用可能です。ただし、シニア世代はジュニア世代を導く「守護者」としての誇りを持って接してください。
          </p>
          <p className="mt-4">※誹謗中傷、下ネタ、出会い目的の利用は即BAN対象となります。</p>
        </div>

        {/* 誕生日入力セクション */}
        <div className="space-y-4">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest text-center">
            あなたの生年月日を入力してください
          </p>
          <div className="relative group">
            <BirthdayPicker onDateChange={setBirthDate} />
          </div>
          <p className="text-[10px] text-zinc-500 text-center">
            ※生年月日に基づき、適切なコミュニティ設定が適用されます。
          </p>
        </div>

        {/* 同意チェック */}
        <label className="flex items-center gap-3 cursor-pointer group justify-center py-2">
          <div className="relative">
            <input
              type="checkbox"
              checked={hasChecked}
              onChange={e => setHasChecked(e.target.checked)}
              className="peer sr-only"
            />
            <div className="w-6 h-6 border-2 border-zinc-700 rounded-lg peer-checked:bg-emerald-600 peer-checked:border-emerald-600 transition-all" />
            <CheckCircle2
              size={16}
              className="absolute top-1 left-1 text-white opacity-0 peer-checked:opacity-100 transition-all"
            />
          </div>
          <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">
            憲章を読み、正しく申告しました
          </span>
        </label>

        <button
          onClick={handleStart}
          disabled={!birthDate || !hasChecked}
          className="w-full bg-zinc-100 disabled:bg-zinc-800 text-zinc-900 disabled:text-zinc-600 font-black py-4 rounded-2xl text-lg transition-all active:scale-95 shadow-xl shadow-white/5"
        >
          {birthDate ? "KIAI の世界へ" : "情報を入力してください"}
        </button>
      </div>
    </div>
  );
}
