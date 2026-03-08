// src/components/common/UserAvatar.tsx
import React from "react";

interface UserAvatarProps {
  displayName?: string;
  avatarUrl?: string | null; // これ一つでOK！
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  displayName,
  avatarUrl,
  size = "md",
  className = ""
}) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base",
    xl: "w-24 h-24 text-xl"
  };

  const getAvatarSrc = () => {
    if (!avatarUrl) return null;

    // 1. すでにフルURL(http)、切り抜き後(blob)、またはデータ形式(data:)ならそのまま
    if (
      avatarUrl.startsWith("http") ||
      avatarUrl.startsWith("blob:") ||
      avatarUrl.startsWith("data:")
    ) {
      return avatarUrl;
    }

    // 2. それ以外（/uploads/... 等）ならバックエンドのURLを付与
    return `http://localhost:8080${avatarUrl}`;
  };

  const avatarSrc = getAvatarSrc();
  const initial = displayName
    ? displayName.trim().charAt(0).toUpperCase()
    : "?";

  return (
    <div
      className={`${sizeClasses[
        size
      ]} relative rounded-full overflow-hidden bg-zinc-800 border-2 border-emerald-500 shrink-0 flex items-center justify-center ${className}`}
    >
      <span className="absolute text-emerald-500 font-bold select-none">
        {initial}
      </span>
      {avatarSrc &&
        <img
          src={avatarSrc}
          alt={displayName || "User Avatar"}
          className="relative w-full h-full object-cover z-10"
          onError={e => (e.currentTarget.style.opacity = "0")}
        />}
    </div>
  );
};

export default UserAvatar;
