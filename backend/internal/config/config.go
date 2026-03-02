package config

import (
	"log"
	"os"
)

// Config: アプリ全体の設定を保持する構造体
type Config struct {
	JWTSecret        string
	JWTRefreshSecret string
	GoogleClientID   string
}

var AppConfig *Config

// InitConfig: アプリ起動時に一度だけ呼び、envから値を読み込む
func InitConfig() {
	AppConfig = &Config{
		JWTSecret:        getEnv("JWT_SECRET", ""), // デフォルトは空文字（必須なので後でチェック）
		JWTRefreshSecret: getEnv("JWT_REFRESH_SECRET", ""),
		GoogleClientID:   getEnv("GOOGLE_CLIENT_ID", ""),
	}

	// 必須チェック（鍵がないと動かないので）
	if AppConfig.JWTSecret == "" || AppConfig.JWTRefreshSecret == "" || AppConfig.GoogleClientID == "" {
		log.Fatal("必須の環境変数が設定されていません。気合を入れて設定してください！")
	}

	log.Println("設定の読み込みが完了しました。")
}

// getEnv: envが空だった場合のデフォルト値を設定する補助関数
func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
