package services

import (
	"context"
	"log"
	"os"
	"path/filepath"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"google.golang.org/api/option"
)

func InitFirebase() *firestore.Client {
	ctx := context.Background()

	// 1. プロジェクトIDも環境変数から取るのがベスト（なければ直接指定）
	projectID := os.Getenv("FIREBASE_PROJECT_ID")
	if projectID == "" {
		projectID = "nook-ai-sns-67af4"
	}

	conf := &firebase.Config{ProjectID: projectID}

	// 2. 鍵ファイルを「読み込む」
	serviceAccountKeyPath := filepath.Join("config", "firebase-key.json")
	jsonData, err := os.ReadFile(serviceAccountKeyPath)
	if err != nil {
		log.Fatalf("鍵ファイルの読み込みに失敗しました: %v", err)
	}

	opt := option.WithCredentialsJSON(jsonData)

	app, err := firebase.NewApp(ctx, conf, opt)
	if err != nil {
		log.Fatalf("Firebase初期化エラー: %v", err)
	}

	client, err := app.Firestore(ctx)
	if err != nil {
		log.Fatalf("Firestore取得エラー: %v", err)
	}

	log.Println("🔥 Firebase (Firestore) 連携に成功しました！(Secure Mode)")
	return client
}
