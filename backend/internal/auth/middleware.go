// internal/auth/middleware.go
package auth

import (
	"context"
	"fmt"
	"net/http"
	"strings"
)

func RequireAuth(f func(http.ResponseWriter, *http.Request)) http.Handler {
	return AuthMiddleware(http.HandlerFunc(f))
}

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenString := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")

		// 念のため前後の空白や改行を削除（これだけで直るケースもあります）
		tokenString = strings.TrimSpace(tokenString)

		// 鑑定関数をガチャンと呼ぶ
		authInfo, err := ValidateAccessToken(tokenString)
		if err != nil {
			// ▼ ここで実際のエラー内容をバックエンドのコンソールに出力 ▼
			fmt.Printf("認証エラー詳細: %v\n", err)

			http.Error(w, "認証に失敗しました", http.StatusUnauthorized)
			return
		}

		// 次の工程（ハンドラー）に「鑑定済み情報」を渡す
		ctx := context.WithValue(r.Context(), "auth", authInfo)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
