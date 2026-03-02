// internal/auth/middleware.go
package auth

import (
	"context"
	"net/http"
	"strings"
)

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenString := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")

		// 鑑定関数をガチャンと呼ぶ
		authInfo, err := ValidateAccessToken(tokenString)
		if err != nil {
			http.Error(w, "認証に失敗しました", http.StatusUnauthorized)
			return
		}

		// 次の工程（ハンドラー）に「鑑定済み情報」を渡す
		ctx := context.WithValue(r.Context(), "auth", authInfo)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
