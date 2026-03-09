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
		authHeader := r.Header.Get("Authorization")

		// 2. スペース（半角、連続、タブ等）で分割する
		parts := strings.Fields(authHeader)

		// 3. "Bearer <TOKEN>" の2要素になっているかチェック
		// strings.EqualFold は大文字小文字を無視して比較してくれる
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			fmt.Printf("認証エラー詳細: ヘッダー形式が不正です (Header: %s)\n", authHeader)
			http.Error(w, "認証形式が正しくありません (Bearer <token>)", http.StatusUnauthorized)
			return
		}

		tokenString := parts[1] // これで確実にトークンだけ取れる

		// 4. 鑑定関数を呼ぶ
		authInfo, err := ValidateAccessToken(tokenString)
		if err != nil {
			fmt.Printf("認証エラー詳細: %v\n", err)
			http.Error(w, "認証に失敗しました", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), "auth", authInfo)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
