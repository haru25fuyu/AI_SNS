// src/api/client.ts
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

import { getAccessTokenFromMemory } from './authStore'; // トークン管理のユーティリティ関数
import { setAuthData } from './authStore'; // トークンとユーザーデータを保存する関数

const client = axios.create({
  baseURL: 'http://localhost:8080/api',
  withCredentials: true, // これでリフレッシュトークン(Cookie)が自動で飛ぶ
});

// 通信を送る直前の「割り込み処理」
client.interceptors.request.use((config) => {
  // メモリ等からトークンを取得（後述のストアから呼ぶのが一般的）
  const token = getAccessTokenFromMemory();

  if (token) {
    // ヘッダーに「合鍵」をガチャンと装着
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401エラーかつ、まだリトライしていない場合
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 1. リフレッシュAPIを叩く（Cookieが自動で送られる）
        const res = await axios.post(
          'http://localhost:8080/api/auth/refresh',
          {},
          { withCredentials: true },
        );
        const { access_token } = res.data;

        const decoded: any = jwtDecode(access_token);

        // 2. 新しいアクセストークンをメモリに保存
        setAuthData(access_token, {
          userId: decoded.user_id,
          isMinor: decoded.is_minor,
        });

        // 3. 失敗したリクエストを新しい鍵で再実行！
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return client(originalRequest);
      } catch (err) {
        // リフレッシュも失敗（期限切れ）ならログアウト
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  },
);

export default client;
