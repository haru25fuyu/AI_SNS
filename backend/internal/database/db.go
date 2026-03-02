package database

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq"
)

var db *sql.DB

func InitDB(source string) *sql.DB {
	var err error

	// 最大10回リトライする
	for i := 0; i < 10; i++ {
		db, err = sql.Open("postgres", source)
		if err == nil {
			err = db.Ping()
			if err == nil {
				break
			}
		}
		fmt.Printf("DB接続待ち... (%d/10)\n", i+1)
		time.Sleep(2 * time.Second) // 2秒待ってリトライ
	}

	if err != nil {
		log.Fatalf("データベースに接続できませんでした: %v", err)
	}
	fmt.Println("データベース接続成功！")

	// pgvector拡張を有効化（初回のみ）
	_, err = db.Exec("CREATE EXTENSION IF NOT EXISTS vector")
	if err != nil {
		log.Fatal(err)
	}

	// テーブル作成
	query := `
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    personality_vector vector(768), -- Geminiのベクトルサイズ(モデルにより調整)
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bottles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    mode TEXT NOT NULL, -- 'normal', 'safety', 'adventure'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`
	_, err = db.Exec(query)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("テーブル作成完了！")

	return db
}

func GetDB() *sql.DB {
	return db
}
