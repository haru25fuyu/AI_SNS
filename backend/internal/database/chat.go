package database

import "github.com/google/uuid"

// SaveChatMessage はメッセージを PostgreSQL に保存します
func (d *Database) SaveChatMessage(senderID, recipientID uuid.UUID, content string) error {
	query := `INSERT INTO chat_messages (sender_id, recipient_id, content) VALUES ($1, $2, $3)`
	_, err := d.DB.Exec(query, senderID, recipientID, content)
	return err
}
