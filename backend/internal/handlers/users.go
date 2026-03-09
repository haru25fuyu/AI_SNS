// backend/internal/handlers/user.go
package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"nook-backend/internal/auth"
	"nook-backend/internal/database"
	"os"
	"path/filepath"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"google.golang.org/api/iterator"
)

type UserHandler struct {
	DB              *database.Database
	FirestoreClient *firestore.Client
}

func NewUserHandler(db *database.Database, firestoreClient *firestore.Client) *UserHandler {
	return &UserHandler{DB: db, FirestoreClient: firestoreClient}
}

func (h *UserHandler) RegisterRoutes(r *mux.Router) {
	r.Handle("/api/user/me", auth.RequireAuth(h.GetProfileHandler)).Methods("GET")
	r.Handle("/api/user/profile", auth.RequireAuth(h.UpdateProfileHandler)).Methods("POST")
	r.Handle("/api/user/get/{user_id}", auth.RequireAuth(h.GetUserHandler)).Methods("POST")
	r.Handle("/api/users", auth.RequireAuth(h.GetListUsersHandler)).Methods("GET")
}

// UpdateProfileHandlerは、ユーザーのプロフィール情報を更新するためのハンドラーです。
func (h *UserHandler) UpdateProfileHandler(w http.ResponseWriter, r *http.Request) {
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
	err = h.DB.UpdateProfile(userID, displayName, avatarURL)

	if err != nil {
		http.Error(w, "データベースの更新に失敗しました", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "プロフィールを更新しました", "avatar_url": avatarURL})
}

// GetProfileHandlerは、認証されたユーザーのプロフィール情報を取得するためのハンドラーです。
func (h *UserHandler) GetProfileHandler(w http.ResponseWriter, r *http.Request) {
	// コンテキストから認証済みユーザー情報を取得
	authInfo, ok := r.Context().Value("auth").(*auth.AuthInfo)
	if !ok {
		http.Error(w, "認証エラー", http.StatusUnauthorized)
		return
	}
	userID := authInfo.UserID

	user, err := h.DB.GetUserByID(userID)
	if err != nil {
		http.Error(w, "ユーザー情報の取得に失敗しました", http.StatusNotFound)
		return
	}

	// JSONとしてレスポンスを返す
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

type getUserRequest struct {
	UserID uuid.UUID `json:"user_id"`
}

func (h *UserHandler) GetUserHandler(w http.ResponseWriter, r *http.Request) {
	//　パラメーターからユーザーIDを取得
	vars := mux.Vars(r)
	id := vars["user_id"]

	fmt.Printf("GetUserHandler: user_id=%s", id)
	userID, err := uuid.Parse(id)
	if err != nil {
		http.Error(w, "無効なユーザーIDです", http.StatusBadRequest)
		return
	}

	user, err := h.DB.GetUserByID(userID)
	if err != nil {
		http.Error(w, "ユーザー情報の取得に失敗しました", http.StatusNotFound)
		return
	}

	// JSONとしてレスポンスを返す
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (h *UserHandler) GetListUsersHandler(w http.ResponseWriter, r *http.Request) {
	authInfo := r.Context().Value("auth").(*auth.AuthInfo)
	myID := authInfo.UserID.String()
	ctx := r.Context()

	// 1. 自分宛てのメッセージを全取得（最新順に並べる必要はない、メモリで処理する方が速い）
	// ※ 件数が多い場合は .Limit(500) など制限をかけるのがプロ
	iter := h.FirestoreClient.Collection("messages").
		Where("recipient_id", "==", myID).
		Documents(ctx)

	unreadMap := make(map[string]int)
	lastMsgMap := make(map[string]string)
	lastTimeMap := make(map[string]time.Time)

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			continue
		}

		data := doc.Data()

		// ❌ tokenString := data["sender_id"].(string) ← これが死ぬ原因
		// ✅ こう書けば、型が違っても ok = false になるだけで死なない
		senderID, ok1 := data["sender_id"].(string)
		content, ok2 := data["content"].(string)
		ts, ok3 := data["timestamp"].(time.Time)

		// 全てのデータが正しく取れた場合のみ処理する
		if ok1 && ok2 && ok3 {
			// 未読カウント
			isRead, _ := data["is_read"].(bool)
			if !isRead {
				unreadMap[senderID]++
			}

			// 最新メッセージ更新
			if ts.After(lastTimeMap[senderID]) {
				lastTimeMap[senderID] = ts
				lastMsgMap[senderID] = content
			}
		}
	}

	// 2. PostgreSQLからユーザー一覧を取得
	usersData, err := h.DB.GetAllUsers(authInfo.UserID)
	if err != nil {
		http.Error(w, "ユーザー取得失敗", http.StatusInternalServerError)
		return
	}

	// 3. データをガチャンと合体させる
	for i := range usersData {
		id := usersData[i].ID
		usersData[i].UnreadCount = unreadMap[id]

		// メッセージがあればセット、なければ初期値
		if msg, ok := lastMsgMap[id]; ok {
			usersData[i].LastMessage = msg
			// 時間を「15:04」のような形式に変換
			usersData[i].LastTime = lastTimeMap[id]
		} else {
			usersData[i].LastMessage = "タップしてチャットを開始"
			usersData[i].LastTime = time.Time{} // ゼロ値
		}
	}

	json.NewEncoder(w).Encode(usersData)
}
