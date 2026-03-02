// src/contexts/UserContext.tsx
import React, { createContext, useState, useContext, ReactNode } from "react";

import { jwtDecode } from "jwt-decode";

import { setAuthData, getAccessTokenFromMemory } from "../api/authStore";

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
  const [isLoading, setIsLoading] = useState(true);

  const login = (token: string, userData: UserState) => {
    setAccessToken(token);
    setUser(userData);
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
