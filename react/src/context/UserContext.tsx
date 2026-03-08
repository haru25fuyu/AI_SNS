import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { useNavigate, useLocation } from "react-router-dom"; // useLocationを追加
import { setAuthData, getAccessTokenFromMemory } from "../api/authStore";
import { client } from "../api/client";

// --- 型定義などは変更なし ---
export interface UserState {
  userId: string;
  isMinor: boolean;
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
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<UserState | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 未ログインでも見れるページのリスト
  const publicPaths = ["/auth", "/terms", "/privacy"]; 

  useEffect(() => {
    const fetchProfile = async () => {
      const token = getAccessTokenFromMemory();
      
      // 現在のページが公開ページかどうか
      const isPublicPath = publicPaths.includes(location.pathname);

      if (!token) {
        setIsLoading(false);
        // トークンがなくて、かつ公開ページでもない場合のみ飛ばす
        if (!isPublicPath) {
          navigate("/auth");
        }
        return;
      }

      try {
        const res = await client.get("/users/me");
        const data = res.data;

        setUser((prev) => ({
          userId: data.id || prev?.userId || "",
          isMinor: data.is_minor ?? prev?.isMinor ?? false,
          displayName: data.display_name,
          avatarUrl: data.avatar_url,
        }));
        
        setAccessToken(token);
      } catch (error: any) {
        console.error("プロフィール情報の取得に失敗しました", error);
        
        setUser(null);
        setAccessToken(null);
        setAuthData(null, null);

        // 失敗時も、公開ページ以外にいる時だけ飛ばす
        if (!isPublicPath) {
          navigate("/auth");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [accessToken, location.pathname]);

  const login = (token: string, userData: UserState) => {
    setAccessToken(token);
    setUser(userData);
    setAuthData(token, userData);
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setAuthData(null, null);
    navigate("/auth");
  };

  return (
    <UserContext.Provider
      value={{ user, accessToken, login, logout, isLoading }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};