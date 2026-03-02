export interface AuthUser {
  userId: string;
  isMinor: boolean;
  // その他、AIプロフィールフラグなど
}

// メモリ上にひっそりと保持（外部からは直接触らせない）
let accessToken: string | null = null;
let currentUser: AuthUser | null = null;

export const setAuthData = (token: string | null, user: AuthUser | null) => {
  accessToken = token;
  currentUser = user;
};

export const getAccessTokenFromMemory = () => accessToken;
export const getCurrentUserFromMemory = () => currentUser;

// ログアウト時に一括掃除する道具
export const clearAuthData = () => {
  accessToken = null;
  currentUser = null;
};
