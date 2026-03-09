package database

import (
	"nook-backend/internal/models"
	"time"

	"github.com/google/uuid"
)

// GetUserIDByAuth は既存の認証情報からユーザーIDを検索します
func (d *Database) GetUserIDByAuth(provider, providerID string) (uuid.UUID, error) {
	var userID uuid.UUID
	query := `SELECT user_id FROM user_auths WHERE provider = $1 AND provider_id = $2`
	err := d.DB.Get(&userID, query, provider, providerID)
	return userID, err
}

// RegisterGoogleUser は新規ユーザーと認証情報を一括で作成します（トランザクション）
func (d *Database) RegisterGoogleUser(displayName, avatarURL string, birthDate time.Time, googleID, email string) (*models.User, error) {
	tx, err := d.DB.Beginx() // sqlxのトランザクション開始
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var user models.User
	// 1. usersテーブルに挿入
	queryUser := `INSERT INTO users (display_name, avatar_url, birth_date) 
								VALUES ($1, $2, $3) RETURNING id, is_setup, birth_date`
	if err := tx.QueryRowx(queryUser, displayName, avatarURL, birthDate).StructScan(&user); err != nil {
		return nil, err
	}

	// 2. user_authsテーブルに挿入
	queryAuth := `INSERT INTO user_auths (user_id, provider, provider_id, email) VALUES ($1, 'google', $2, $3)`
	if _, err := tx.Exec(queryAuth, user.ID, googleID, email); err != nil {
		return nil, err
	}

	return &user, tx.Commit()
}

// CreateSession はリフレッシュトークンを保存します
func (d *Database) CreateSession(userID uuid.UUID, token string, expiresAt time.Time) error {
	query := `INSERT INTO user_sessions (user_id, refresh_token, expires_at) VALUES ($1, $2, $3)`
	_, err := d.DB.Exec(query, userID, token, expiresAt)
	return err
}
