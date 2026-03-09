package database

import (
	"nook-backend/internal/models"

	"github.com/google/uuid"
)

// メソッドとして定義
func (d *Database) UpdateProfile(userID uuid.UUID, displayName string, avatarURL string) error {
	var query string
	var queryArgs []interface{}

	if avatarURL != "" {
		query = `UPDATE users SET display_name = $1, avatar_url = $2, is_setup = true WHERE id = $3`
		queryArgs = []interface{}{displayName, avatarURL, userID}
	} else {
		query = `UPDATE users SET display_name = $1, is_setup = true WHERE id = $2`
		queryArgs = []interface{}{displayName, userID}
	}

	_, err := d.DB.Exec(query, queryArgs...)
	return err
}

// GetUserByID は指定されたIDのユーザー情報を取得します
func (d *Database) GetUserByID(userID uuid.UUID) (*models.User, error) {
	var user models.User

	query := `
		SELECT id, display_name, COALESCE(avatar_url, '') AS avatar_url, birth_date, is_setup
		FROM users
		WHERE id = $1
	`

	// d.DB.Get は1件取得して構造体にマッピングするsqlxの便利機能です
	err := d.DB.Get(&user, query, userID)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

// GetAllUsers は自分以外のユーザー一覧を取得します
func (d *Database) GetAllUsers(excludeID uuid.UUID) ([]models.UserListResponse, error) {
	var users []models.UserListResponse
	query := `SELECT id, display_name, avatar_url FROM users WHERE id != $1`

	// sqlxなら Select を使うとスライスに一気に流し込めます
	err := d.DB.Select(&users, query, excludeID)
	return users, err
}
