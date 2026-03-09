import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect
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
    const initAuth = async () => {
      const isPublicPath = publicPaths.includes(location.pathname);

      try {
        const res = await client.get("/user/me");

        const data = res.data;
        // Axiosが復活させてくれた最新のトークンをメモリにセットし直す
        const newToken = getAccessTokenFromMemory();

        setUser({
          userId: data.id,
          isMinor: data.is_minor,
          displayName: data.display_name,
          avatarUrl: data.avatar_url
        });
        setAccessToken(newToken);
      } catch (error) {
        // ここに来る ＝ Cookieも死んでいて、Axiosも復活させられなかった「本当の未ログイン」
        console.log("復活失敗、または未ログインです");
        if (!isPublicPath) {
          navigate("/auth");
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

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
      {isLoading
        ? <div>認証チェック中...</div> // ここで追い出しを止めている
        : children}
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
