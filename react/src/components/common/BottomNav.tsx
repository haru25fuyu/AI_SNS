import React from "react";
import { Waves, MessageCircle, BarChart2, Send, User } from "lucide-react";

// タブの型定義
export type TabType = "timeline" | "chat" | "analysis" | "profile";

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onPostClick: () => void; // ボトルを投げるアクション用
}

export default function BottomNav({
  activeTab,
  onTabChange,
  onPostClick
}: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-900 px-2 pb-safe z-50">
      <div className="max-w-md mx-auto flex justify-between items-end h-16">
        <NavButton
          active={activeTab === "timeline"}
          onClick={() => onTabChange("timeline")}
          icon={<Waves size={22} />}
          label="海"
        />

        <NavButton
          active={activeTab === "chat"}
          onClick={() => onTabChange("chat")}
          icon={<MessageCircle size={22} />}
          label="対話"
        />

        {/* 中央：ボトルを投げる (メインアクション) */}
        <div className="relative -top-5 px-2">
          <button
            onClick={onPostClick}
            className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 p-4 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-90 transition-all group"
          >
            <Send
              size={24}
              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            />
          </button>
        </div>

        <NavButton
          active={activeTab === "analysis"}
          onClick={() => onTabChange("analysis")}
          icon={<BarChart2 size={22} />}
          label="分析"
        />

        <NavButton
          active={activeTab === "profile"}
          onClick={() => onTabChange("profile")}
          icon={<User size={22} />}
          label="自分"
        />
      </div>
    </nav>
  );
}

// 内部用ボタンコンポーネント
function NavButton({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-1 h-full transition-all ${active
        ? "text-emerald-500"
        : "text-zinc-500 hover:text-zinc-300"}`}
    >
      <div
        className={`${active ? "scale-110" : "scale-100"} transition-transform`}
      >
        {icon}
      </div>
      <span className="text-[9px] font-bold tracking-tighter uppercase">
        {label}
      </span>

      {/* アクティブ時のインジケーター */}
      {active &&
        <div className="w-1 h-1 bg-emerald-500 rounded-full mt-0.5 shadow-[0_0_5px_rgba(16,185,129,1)]" />}
    </button>
  );
}
