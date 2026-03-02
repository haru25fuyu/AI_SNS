import React, { useState } from "react";
import { Compass, User, Shield, Zap, Heart } from "lucide-react";
import { BottleMatch } from "../../types";

export default function GachaSection() {
  const [matchedBottle, setMatchedBottle] = useState<BottleMatch | null>(null);

  const simulateMatch = (type: "mud" | "gold" | "rainbow") => {
    const mockUsers: BottleMatch[] = [
      {
        name: "Aさん",
        similarity: 0.95,
        text: "最近キャンプにハマってます！自然の中で飲むコーヒーが最高です。",
        type: "mud",
        note: "価値観・性格共に一致"
      },
      {
        name: "Cさん",
        similarity: 0.88,
        text: "読書とカフェ巡りが好きです。おすすめの小説があれば教えてください。",
        type: "gold",
        note: "優良マッチ"
      },
      {
        name: "Dさん",
        similarity: 0.5,
        text: "スカイダイビング最高！次はバンジージャンプに挑戦したい！",
        type: "rainbow",
        note: "価値観は近いが性格は真逆"
      }
    ];

    if (type === "mud") setMatchedBottle(mockUsers[0]);
    else if (type === "gold") setMatchedBottle(mockUsers[1]);
    else setMatchedBottle(mockUsers[2]);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Compass className="text-cyan-400" /> ガチャ・マッチング
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => simulateMatch("mud")}
          className="p-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl flex flex-col items-center gap-2"
        >
          <div className="w-10 h-10 rounded-full bg-amber-900/50 flex items-center justify-center">
            <User className="text-amber-600" size={20} />
          </div>
          <div className="text-xs font-bold">泥ボトル</div>
        </button>

        <button
          onClick={() => simulateMatch("gold")}
          className="p-4 bg-zinc-800 hover:bg-zinc-700 border border-amber-500/30 rounded-xl flex flex-col items-center gap-2"
        >
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Shield className="text-amber-400" size={20} />
          </div>
          <div className="text-xs font-bold text-amber-400">黄金ボトル</div>
        </button>

        <button
          onClick={() => simulateMatch("rainbow")}
          className="p-4 bg-zinc-800 hover:bg-zinc-700 border border-purple-500/30 rounded-xl flex flex-col items-center gap-2"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
            <Zap className="text-purple-400" size={20} />
          </div>
          <div className="text-xs font-bold text-purple-400">虹ボトル</div>
        </button>
      </div>

      {matchedBottle &&
        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-sm">
              {matchedBottle.name}
            </span>
            <span className="text-[10px] text-zinc-500">
              {matchedBottle.type.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-zinc-300">
            {matchedBottle.text}
          </p>
        </div>}
    </div>
  );
}
