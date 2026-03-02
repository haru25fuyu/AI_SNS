package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID          uuid.UUID `json:"id" db:"id"`
	DisplayName string    `json:"display_name" db:"display_name"`
	BirthDate   time.Time `json:"birth_date" db:"birth_date"`
	IsSetup     bool      `json:"is_setup" db:"is_setup"`
}
