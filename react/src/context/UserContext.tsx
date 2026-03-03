// src/contexts/UserContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect
} from "react";

import { jwtDecode } from "jwt-decode";

import { setAuthData, getAccessTokenFromMemory } from "../api/authStore";
import { client } from "../api/client";
import { get } from "http";

export interface UserState {
  userId: string; // UUID
  isMinor: boolean; // 成人判定
  displayName?: string;
  avatarUrl?: string;
}

interface UserContextType {
  user: UserState | null;
  accessToken: string | null;
  login: (token: string, userData: UserState) => void;
  logout: () => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserState | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
    const fetchProfile = async () => {
      const token = getAccessTokenFromMemory();
      
      // トークンがなければ未ログインとしてローディングを終了
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // バックエンドからプロフィールを取得
        const res = await client.get("/api/users/me");
        const data = res.data;

        // Contextのユーザー状態を更新（すでにあるisMinorなどの状態と結合）
        setUser((prev) => ({
          userId: data.id || prev?.userId || "",
          isMinor: prev?.isMinor || false,
          displayName: data.display_name,
          avatarUrl: data.avatar_url,
        }));
        
        // リロード時対策としてトークンも状態に復元
        setAccessToken(token);

      } catch (error) {
        console.error("プロフィール情報の取得に失敗しました", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const login = (token: string, userData: UserState) => {
    setAccessToken(token);
    setUser(userData);
    setAuthData(token, userData);
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
  };

  return (
    <UserContext.Provider
      value={{ user, accessToken, login, logout, isLoading }}
    >
      {children}
    </UserContext.Provider>
  );
};

// カスタムフックを作っておくと、使う側が楽になります
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
