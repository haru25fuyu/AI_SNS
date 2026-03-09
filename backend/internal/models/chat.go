package models

import (
	"time"

	"github.com/google/uuid"
)

// internal/models/chat.go
type ChatMessage struct {
	ID          int       `db:"id" json:"id"`
	SenderID    uuid.UUID `db:"sender_id" json:"sender_id"`
	RecipientID uuid.UUID `db:"recipient_id" json:"recipient_id"`
	Content     string    `db:"content" json:"content"`
	CreatedAt   time.Time `db:"created_at" json:"created_at"`
}
