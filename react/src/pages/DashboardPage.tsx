// src/pages/DashboardPage.tsx （または既存のホーム画面ファイル）
import React from "react";

import UserProfile from "../components/UserProfile";
import BottomNav from "../components/common/BottomNav";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-black italic text-emerald-400">ホーム</h1>
        <UserProfile />
      </header>

      {/* タイムラインなどのメインコンテンツが続く想定 */}
      <main className="text-zinc-400">ここからコンテンツが始まります...</main>

      {/* 切り出したナビゲーション */}
      <BottomNav
        activeTab={"timeline"}
        onTabChange={tab => console.log("タブ変更:", tab)}
        onPostClick={() => console.log("ボトルを投げるアクション"):j,mm}
      />
    </div>
  );
}
