package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"nook-backend/internal/auth"
	"nook-backend/internal/database"
	"strings"

	"cloud.google.com/go/firestore"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"google.golang.org/api/iterator"
)

type ChatHandler struct {
	DB              *database.Database
	FirestoreClient *firestore.Client
}

func NewChatHandler(db *database.Database, firestoreClient *firestore.Client) *ChatHandler {
	return &ChatHandler{DB: db, FirestoreClient: firestoreClient}
}

func (h *ChatHandler) RegisterRoutes(r *mux.Router) {
	// 認証が必要な送信エンドポイント
	r.Handle("/api/chat/send", auth.RequireAuth(h.SendMessage)).Methods("POST")
	// 認証が必要な既読エンドポイント
	r.Handle("/api/chat/read", auth.RequireAuth(h.MarkAsRead)).Methods("POST")
}

func (h *ChatHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	// 1. JWTからユーザーIDを取得 (AuthMiddlewareで context にセットされている想定)
	authInfo, ok := r.Context().Value("auth").(*auth.AuthInfo)
	if !ok {
		http.Error(w, "認証に失敗しました", http.StatusUnauthorized)
		return
	}

	senderID := authInfo.UserID

	// 2. リクエストボディの解析（相手IDと内容だけ受け取る）
	var req struct {
		RecipientID uuid.UUID `json:"recipient_id"`
		Content     string    `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "無効なリクエストです", http.StatusBadRequest)
		log.Printf("リクエストボディの解析に失敗しました: %v", err)
		return
	}
	// 3. 【検閲】禁止ワードチェック
	if containsForbiddenWords(req.Content) {
		http.Error(w, "不適切な言葉が含まれています", http.StatusForbidden)
		return
	}

	// 4. PostgreSQL に保存（自作の DB メソッドを呼び出す）
	err := h.DB.SaveChatMessage(senderID, req.RecipientID, req.Content)
	if err != nil {
		http.Error(w, "履歴の保存に失敗しました", http.StatusInternalServerError)
		log.Printf("DBへの保存に失敗しました: %v", err)
		return
	}

	// 5. Firestore に書き込み（リアルタイム配信用）
	ctx := r.Context()

	messageData := map[string]interface{}{
		"sender_id":    authInfo.UserID.String(),
		"recipient_id": req.RecipientID.String(),
		"content":      req.Content,
		"timestamp":    firestore.ServerTimestamp,
		"is_read":      false,
	}

	_, _, err = h.FirestoreClient.Collection("messages").Add(ctx, messageData)
	if err != nil {
		http.Error(w, "メッセージの配信に失敗しました", http.StatusInternalServerError)
		log.Printf("Firestoreへの保存に失敗しました: %v", err)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

// 禁止ワードチェックの補助関数
func containsForbiddenWords(content string) bool {
	forbidden := []string{"ひどい言葉1", "禁止ワード2"}
	for _, word := range forbidden {
		if strings.Contains(content, word) {
			return true
		}
	}
	return false
}

// 既読処理
func (h *ChatHandler) MarkAsRead(w http.ResponseWriter, r *http.Request) {
	authInfo := r.Context().Value("auth").(*auth.AuthInfo)
	targetUserID := r.URL.Query().Get("target_id")

	fmt.Printf("DEBUG: 既読処理開始 - 自分(recipient): %s, 相手(sender): %s\n", authInfo.UserID.String(), targetUserID)

	iter := h.FirestoreClient.Collection("messages").
		Where("recipient_id", "==", authInfo.UserID.String()).
		Where("sender_id", "==", targetUserID).
		Where("is_read", "==", false).
		Documents(r.Context())

	count := 0
	batch := h.FirestoreClient.Batch()
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			continue
		}

		batch.Update(doc.Ref, []firestore.Update{{Path: "is_read", Value: true}})
		count++
	}

	if count > 0 {
		_, err := batch.Commit(r.Context())
		if err != nil {
			fmt.Printf("既読更新エラー: %v\n", err)
		}
	}

	fmt.Printf("DEBUG: %d 件のメッセージを既読にしました\n", count)
	w.WriteHeader(http.StatusOK)
}
