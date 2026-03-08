package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"nook-backend/internal/auth"
	"nook-backend/internal/config"
	"nook-backend/internal/database"
	"nook-backend/internal/models"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"google.golang.org/api/idtoken"
)

type AuthRequest struct {
	Token     string `json:"token"`
	BirthDate string `json:"birth_date"` // "2000-01-01" 形式などを想定
}

func GoogleAuthHandler(w http.ResponseWriter, r *http.Request) {
	var req AuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "リクエストが不正です", http.StatusBadRequest)
		return
	}

	// 1. Googleトークンの検証
	clientID := config.AppConfig.GoogleClientID
	payload, err := idtoken.Validate(context.Background(), req.Token, clientID)
	if err != nil {
		http.Error(w, "トークンが無効です", http.StatusUnauthorized)
		return
	}

	googleID := payload.Subject
	email := payload.Claims["email"].(string)
	picture := payload.Claims["picture"].(string)

	db := database.GetDB()
	user := models.User{
		ID:          uuid.Nil,                          // 後でDBから生成されるのでここでは空でOK
		DisplayName: "User_" + uuid.New().String()[:4], // 仮の表示名、後でDBから取得するのでここでは適当でOK
		BirthDate:   time.Time{},                       // 後でDBから取得するのでここでは空でOK
		IsSetup:     false,                             // 初期値、後でDBから取得するのでここではfalseでOK
	} // これがないとmodelsパッケージがimportされないので、User構造体を一度参照しておきます

	// 2. データベース操作（トランザクション）
	tx, err := db.Begin()
	if err != nil {
		http.Error(w, "DBエラー", http.StatusInternalServerError)
		return
	}

	// 既存ユーザーの確認
	queryAuth := `SELECT user_id FROM user_auths WHERE provider = 'google' AND provider_id = $1`
	err = tx.QueryRow(queryAuth, googleID).Scan(&user.ID)

	if err != nil { // 【新規ユーザー登録】
		// フロントから届いた誕生日をパース
		user.BirthDate, err = time.Parse("2006-01-02", req.BirthDate)
		if err != nil {
			tx.Rollback()
			http.Error(w, "誕生日フォーマットが不正です", http.StatusBadRequest)
			return
		}

		// users作成 (UUIDをRETURNINGで受け取る)
		queryUser := `INSERT INTO users (display_name, avatar_url, birth_date) 
                      VALUES ($1, $2, $3) RETURNING id, is_setup`
		err = tx.QueryRow(queryUser, user.DisplayName, picture, user.BirthDate).Scan(&user.ID, &user.IsSetup)
		if err != nil {
			tx.Rollback()
			http.Error(w, "ユーザー作成失敗", http.StatusInternalServerError)
			return
		}

		// user_auths紐付け (ここでuserIDを使用)
		queryNewAuth := `INSERT INTO user_auths (user_id, provider, provider_id, email) VALUES ($1, 'google', $2, $3)`
		if _, err := tx.Exec(queryNewAuth, user.ID, googleID, email); err != nil {
			tx.Rollback()
			http.Error(w, "認証情報保存失敗", http.StatusInternalServerError)
			return
		}
	} else { // 【既存ユーザーログイン】
		// 登録済みの誕生日と設定状況を取得
		err = tx.QueryRow("SELECT is_setup, birth_date FROM users WHERE id = $1", user.ID).Scan(&user.IsSetup, &user.BirthDate)
		if err != nil {
			tx.Rollback()
			http.Error(w, "ユーザーデータ取得失敗", http.StatusInternalServerError)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, "確定エラー", http.StatusInternalServerError)
		return
	}

	// 3. トークン発行
	isMinor := auth.IsMinor(user.BirthDate)
	accessToken, _ := auth.GenerateAccessToken(user.ID, isMinor)
	refreshToken, _ := auth.GenerateRefreshToken(user.ID)

	// 4. セッション保存 (リフレッシュトークン管理)
	querySession := `INSERT INTO user_sessions (user_id, refresh_token, expires_at) VALUES ($1, $2, $3)`
	db.Exec(querySession, user.ID, refreshToken, time.Now().Add(time.Hour*24*30))

	// 5. レスポンス（CookieとJSON）
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		HttpOnly: true,
		Secure:   false, // ローカル開発中(HTTP)は false にする
		Path:     "/api/auth/refresh",
		MaxAge:   60 * 60 * 24 * 30,
		SameSite: http.SameSiteLaxMode, // 明示的にLaxを設定
	})

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":      "ログイン完了",
		"isNewUser":    !user.IsSetup,
		"access_token": accessToken,
		"userID":       user.ID,
		"isMinor":      isMinor, // フロントエンドでも即座に判定に使える
	})
}

func RefreshHandler(w http.ResponseWriter, r *http.Request) {
	// 1. Cookieからリフレッシュトークンを取得
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		http.Error(w, "リフレッシュトークンがありません", http.StatusUnauthorized)
		return
	}

	// 2. リフレッシュトークンの検証
	claims := &auth.CustomClaims{}
	token, err := jwt.ParseWithClaims(cookie.Value, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(config.AppConfig.JWTRefreshSecret), nil
	})

	if err != nil || !token.Valid {
		http.Error(w, "リフレッシュトークンが無効です。再ログインしてください", http.StatusUnauthorized)
		return
	}

	// 4. 最新の年齢をDBから取得
	db := database.GetDB()
	var birthDate time.Time
	err = db.QueryRow("SELECT birth_date FROM users WHERE id = $1", claims.UserID).Scan(&birthDate)
	if err != nil {
		http.Error(w, "ユーザーが見つかりません", http.StatusUnauthorized)
		return
	}

	isMinor := auth.IsMinor(birthDate)

	// 5. 新しいアクセストークンを発行（型を合わせたuserIDを渡す）
	newAccessToken, _ := auth.GenerateAccessToken(claims.UserID, isMinor)

	json.NewEncoder(w).Encode(map[string]string{
		"access_token": newAccessToken,
	})
}
