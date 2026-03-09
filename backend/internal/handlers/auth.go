package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"nook-backend/config"
	"nook-backend/internal/auth"
	"nook-backend/internal/database"
	"nook-backend/internal/models"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"google.golang.org/api/idtoken"
)

type AuthHandler struct {
	DB *database.Database // ここを追加
}

func NewAuthHandler(db *database.Database) *AuthHandler {
	return &AuthHandler{DB: db}
}
func (h *AuthHandler) RegisterRoutes(r *mux.Router) {
	r.HandleFunc("/api/auth/google", h.GoogleAuthHandler).Methods("POST")
	r.HandleFunc("/api/auth/refresh", h.RefreshHandler).Methods("POST")
}

type AuthRequest struct {
	Token     string `json:"token"`
	BirthDate string `json:"birth_date"` // "2000-01-01" 形式などを想定
}

func (h *AuthHandler) GoogleAuthHandler(w http.ResponseWriter, r *http.Request) {
	var req AuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "リクエストが不正です", http.StatusBadRequest)
		return
	}

	// 1. Googleトークンの検証
	clientID := config.GoogleClientID
	payload, err := idtoken.Validate(context.Background(), req.Token, clientID)
	if err != nil {
		http.Error(w, "トークンが無効です", http.StatusUnauthorized)
		return
	}

	googleID := payload.Subject
	email := payload.Claims["email"].(string)
	picture := payload.Claims["picture"].(string)

	// 1. 既存ユーザーか確認
	userID, err := h.DB.GetUserIDByAuth("google", googleID)

	var user *models.User
	if err != nil { // 新規登録
		birthDate, _ := time.Parse("2006-01-02", req.BirthDate)
		displayName := "User_" + uuid.New().String()[:4]

		user, err = h.DB.RegisterGoogleUser(displayName, picture, birthDate, googleID, email)
		if err != nil {
			http.Error(w, "ユーザー登録失敗", http.StatusInternalServerError)
			return
		}
	} else { // 既存ログイン
		user, err = h.DB.GetUserByID(userID) // 前に作った共通関数を利用！
		if err != nil {
			http.Error(w, "データ取得失敗", http.StatusInternalServerError)
			return
		}
	}

	// 2. トークン発行とセッション保存
	isMinor := auth.IsMinor(user.BirthDate)
	accessToken, _ := auth.GenerateAccessToken(user.ID, isMinor)
	refreshToken, _ := auth.GenerateRefreshToken(user.ID)

	h.DB.CreateSession(user.ID, refreshToken, time.Now().Add(time.Hour*24*30))

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

func (h *AuthHandler) RefreshHandler(w http.ResponseWriter, r *http.Request) {
	// 1. Cookieからリフレッシュトークンを取得
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		http.Error(w, "リフレッシュトークンがありません", http.StatusUnauthorized)
		return
	}

	// 2. リフレッシュトークンの検証
	claims := &auth.CustomClaims{}
	token, err := jwt.ParseWithClaims(cookie.Value, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(config.JWTRefreshSecret), nil
	})

	if err != nil || !token.Valid {
		http.Error(w, "リフレッシュトークンが無効です。再ログインしてください", http.StatusUnauthorized)
		return
	}

	// 4. 最新の年齢をDBから取得
	user, err := h.DB.GetUserByID(claims.UserID)
	if err != nil {
		http.Error(w, "ユーザーが見つかりません", http.StatusUnauthorized)
		return
	}

	isMinor := auth.IsMinor(user.BirthDate)

	// 5. 新しいアクセストークンを発行（型を合わせたuserIDを渡す）
	newAccessToken, _ := auth.GenerateAccessToken(claims.UserID, isMinor)

	json.NewEncoder(w).Encode(map[string]string{
		"access_token": newAccessToken,
	})
}
