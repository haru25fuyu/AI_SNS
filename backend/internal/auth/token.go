package auth

import (
	"nook-backend/internal/config"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// 呼び出し側に返すための情報セット
type AuthInfo struct {
	UserID  uuid.UUID
	IsMinor bool
}

type CustomClaims struct {
	UserID  uuid.UUID `json:"user_id"` // ここも型を合わせる
	IsMinor bool      `json:"is_minor"`
	jwt.RegisteredClaims
}

// アクセストークン生成（引数を uuid.UUID に変更）
func GenerateAccessToken(userID uuid.UUID, isMinor bool) (string, error) {
	claims := CustomClaims{
		UserID:  userID,
		IsMinor: isMinor,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.AppConfig.JWTSecret))
}

// リフレッシュトークン生成（引数を uuid.UUID に変更）
func GenerateRefreshToken(userID uuid.UUID) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID.String(), // JWTのペイロードには文字列で保存
		"exp":     time.Now().Add(24 * 30 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.AppConfig.JWTRefreshSecret))
}

func IsMinor(birthDate time.Time) bool {
	now := time.Now()
	age := now.Year() - birthDate.Year()

	// 月が若い、または月が同じでも日が若い場合はまだ誕生日が来ていない
	if now.Month() < birthDate.Month() || (now.Month() == birthDate.Month() && now.Day() < birthDate.Day()) {
		age--
	}
	return age < 18
}

// トークンを検証して情報を抜き出す関数
func ValidateAccessToken(tokenString string) (*AuthInfo, error) {
	claims := &CustomClaims{}

	// 署名の検証とパース
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(config.AppConfig.JWTSecret), nil
	})

	if err != nil || !token.Valid {
		return nil, err
	}

	// 鑑定結果を構造体に入れて返す
	// claims.UserID が既に uuid.UUID 型ならそのまま渡せます
	return &AuthInfo{
		UserID:  claims.UserID,
		IsMinor: claims.IsMinor,
	}, nil
}
