// backend/internal/handlers/user.go
package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"nook-backend/internal/auth"
	"nook-backend/internal/database"
	"nook-backend/internal/models"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
)

// UpdateProfileHandlerは、ユーザーのプロフィール情報を更新するためのハンドラーです。
func UpdateProfileHandler(w http.ResponseWriter, r *http.Request) {
	// 1. JWTからユーザーIDを取得 (AuthMiddlewareで context にセットされている想定)

	authInfo, ok := r.Context().Value("auth").(*auth.AuthInfo)
	if !ok {
		http.Error(w, "認証エラー (Update)", http.StatusUnauthorized)
		return
	}
	userID := authInfo.UserID

	// 2. マルチパートフォームのパース (最大10MB)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, "データのパースに失敗しました", http.StatusBadRequest)
		return
	}

	displayName := r.FormValue("displayName")
	if displayName == "" {
		http.Error(w, "表示名は必須です", http.StatusBadRequest)
		return
	}

	avatarURL := ""

	// 3. 画像ファイルの処理 (送信されている場合のみ)
	file, header, err := r.FormFile("avatar")
	if err == nil {
		defer file.Close()

		// uploads ディレクトリの作成
		uploadDir := "./uploads/avatars"
		os.MkdirAll(uploadDir, os.ModePerm)

		// ファイル名の生成 (安全のためUUID等を使用)
		ext := filepath.Ext(header.Filename)
		newFileName := uuid.New().String() + "_" + time.Now().Format("20060102150405") + ext
		filePath := filepath.Join(uploadDir, newFileName)

		// ファイルの保存
		dst, err := os.Create(filePath)
		if err != nil {
			http.Error(w, "ファイルの保存に失敗しました", http.StatusInternalServerError)
			return
		}
		defer dst.Close()
		if _, err := io.Copy(dst, file); err != nil {
			http.Error(w, "ファイルの書き込みに失敗しました", http.StatusInternalServerError)
			return
		}

		// DBに保存するURLパスを設定
		avatarURL = "/uploads/avatars/" + newFileName
	}

	// 4. データベースの更新
	db := database.GetDB()
	var query string
	var queryArgs []interface{}

	if avatarURL != "" {
		query = `UPDATE users SET display_name = $1, avatar_url = $2, is_setup = true WHERE id = $3`
		queryArgs = []interface{}{displayName, avatarURL, userID}
	} else {
		query = `UPDATE users SET display_name = $1, is_setup = true WHERE id = $2`
		queryArgs = []interface{}{displayName, userID}
	}

	_, err = db.Exec(query, queryArgs...)
	if err != nil {
		http.Error(w, "データベースの更新に失敗しました", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "プロフィールを更新しました", "avatar_url": avatarURL})
}

// GetProfileHandlerは、認証されたユーザーのプロフィール情報を取得するためのハンドラーです。
func GetProfileHandler(w http.ResponseWriter, r *http.Request) {
	// コンテキストから認証済みユーザー情報を取得
	authInfo, ok := r.Context().Value("auth").(*auth.AuthInfo)
	if !ok {
		http.Error(w, "認証エラー", http.StatusUnauthorized)
		return
	}
	userID := authInfo.UserID

	db := database.GetDB()
	var user models.User

	// データベースからプロフィール情報を取得
	// avatar_url 等が未設定(NULL)の状態でエラーになるのを防ぐため COALESCE を使用
	query := `
		SELECT id, display_name, COALESCE(avatar_url, ''), birth_date, is_setup
		FROM users
		WHERE id = $1
	`
	err := db.QueryRow(query, userID).Scan(
		&user.ID,
		&user.DisplayName,
		&user.AvatarURL,
		&user.BirthDate,
		&user.IsSetup,
	)

	if err != nil {
		http.Error(w, "ユーザー情報の取得に失敗しました", http.StatusNotFound)
		return
	}

	// JSONとしてレスポンスを返す
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}
