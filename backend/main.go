package main

import (
	"fmt"
	"log"
	"net/http"
	"nook-backend/config"
	"nook-backend/internal/database"
	"nook-backend/internal/handlers"
	"nook-backend/services"
	"os"

	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
)

func main() {
	//設定を読み込む
	config.InitConfig()

	//  DB接続（環境変数は Docker Compose から渡される想定）
	db, err := database.InitDB(os.Getenv("DB_SOURCE"))
	if err != nil {
		log.Fatal("DB接続失敗:", err)
	}

	fsClient := services.InitFirebase()

	// ルーターの作成
	r := mux.NewRouter()

	// ルーティングの設定
	handlers.NewAuthHandler(db).RegisterRoutes(r)
	handlers.NewAiHandler().RegisterRoutes(r)

	// CORSミドルウェアで包む
	//handler := middleware.CORS(r)

	// アップロードされた画像を提供するための静的ファイルサーバー
	fileServer := http.FileServer(http.Dir("./uploads"))
	r.PathPrefix("/uploads/").Handler(http.StripPrefix("/uploads/", fileServer))

	handlers.NewUserHandler(db, fsClient).RegisterRoutes(r)
	handlers.NewChatHandler(db, fsClient).RegisterRoutes(r)

	// サーバー開始のログ（開始「直前」に書くのがコツ！）
	fmt.Println("nook-backend: サーバーをポート8080で開始します... ")

	// サーバー起動（ここでプログラムは「待機状態」に入ります）
	if err := http.ListenAndServe(":8080", r); err != nil {
		log.Fatal("サーバー起動失敗:", err)
	}
}
