package main

import (
	"fmt"
	"log"
	"net/http"
	"nook-backend/internal/config"
	"nook-backend/internal/database"
	"nook-backend/internal/handlers"
	"nook-backend/middleware"
	"os"

	_ "github.com/lib/pq"
)

func main() {
	//設定を読み込む
	config.InitConfig()

	//  DB接続（環境変数は Docker Compose から渡される想定）
	db := database.InitDB(os.Getenv("DB_SOURCE"))
	defer db.Close()

	// ルーターの作成
	mux := http.NewServeMux()

	// ルーティングの設定
	mux.HandleFunc("/api/ai/onboarding", handlers.OnboardingHandler)
	mux.HandleFunc("/api/auth/google", handlers.GoogleAuthHandler)

	// CORSミドルウェアで包む
	// 下に書いてあった enableCORS と中身は同じなので、パッケージ化したこちらを使います
	handler := middleware.CORS(mux)

	// サーバー開始のログ（開始「直前」に書くのがコツ！）
	fmt.Println("nook-backend: サーバーをポート8080で開始します... ")

	// サーバー起動（ここでプログラムは「待機状態」に入ります）
	if err := http.ListenAndServe(":8080", handler); err != nil {
		log.Fatal("サーバー起動失敗:", err)
	}
}
