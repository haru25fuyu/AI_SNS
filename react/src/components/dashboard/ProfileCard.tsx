import React from "react";
import { User, Shield } from "lucide-react";
import { Personality } from "../../types";

export default function ProfileCard({
  personality
}: {
  personality: Personality | null;
}) {
  if (!personality) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <User size={32} className="text-zinc-950" />
        </div>
        <div>
          <h2 className="text-xl font-bold">あなた</h2>
          <div className="flex items-center gap-1 text-amber-400 text-sm font-medium mt-1">
            <Shield size={14} /> <span>気合ランク: 金</span>
          </div>
        </div>
      </div>
      <div className="space-y-4 text-sm">
        <h3 className="text-zinc-400 uppercase text-xs font-bold tracking-widest">
          性格ベクトル
        </h3>
        <p className="text-zinc-300">
          {personality.summary}
        </p>
        <div className="flex flex-wrap gap-2">
          {personality.values.map((v, i) =>
            <span key={i} className="px-2 py-1 bg-zinc-800 rounded-md text-xs">
              {v}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
