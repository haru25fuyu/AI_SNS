// src/api/client.ts
import axios from 'axios';
import { jwtDecode, JwtPayload } from 'jwt-decode';

import { getAccessTokenFromMemory } from './authStore'; // トークン管理のユーティリティ関数
import { setAuthData } from './authStore'; // トークンとユーザーデータを保存する関数

export const client = axios.create({
  baseURL: 'http://localhost:8080/api',
  withCredentials: true, // これでリフレッシュトークン(Cookie)が自動で飛ぶ
});

// バックエンドの CustomClaims と一致させるインターフェース
export interface CustomJwtPayload extends JwtPayload {
  user_id: string;
  is_minor: boolean;
}

// 通信を送る直前の「割り込み処理」
client.interceptors.request.use((config) => {
  const token = getAccessTokenFromMemory();
  if (token) {
    // プロパティへの直接代入ではなく .set() を使用する
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// レスポンスインターセプター
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // error.response が存在するかどうかの安全確認を追加
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(
          'http://localhost:8080/api/auth/refresh',
          {},
          { withCredentials: true },
        );
        const { access_token } = res.data;
        const decoded: any = jwtDecode(access_token);

        setAuthData(access_token, {
          userId: decoded.user_id,
          isMinor: decoded.is_minor,
        });

        // 再試行時も .set() を使用する
        originalRequest.headers.set('Authorization', `Bearer ${access_token}`);
        return client(originalRequest);
      } catch (err) {
        console.error('トークンのリフレッシュに失敗しました', err);
        // リフレッシュも失敗した場合は、完全にログイン切れとして認証画面へ飛ばす
        //window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  },
);

export default client;
