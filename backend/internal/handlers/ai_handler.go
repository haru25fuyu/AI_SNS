package handlers

import (
	"encoding/json"
	"net/http"
	"nook-backend/services"

	"github.com/gorilla/mux"
)

type AiHandler struct {
}

func NewAiHandler() *AiHandler {
	return &AiHandler{}
}

func (h *AiHandler) RegisterRoutes(r *mux.Router) {
	r.HandleFunc("/api/ai/onboarding", h.OnboardingHandler).Methods("POST", "OPTIONS")
}

type OnboardingRequest struct {
	History []struct {
		Role string `json:"role"`
		Text string `json:"text"`
	} `json:"history"`
}

func (h *AiHandler) OnboardingHandler(w http.ResponseWriter, r *http.Request) {
	// CORS設定
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		return
	}

	var req OnboardingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// 最後のメッセージをAIに投げる（簡易版）
	lastMsg := req.History[len(req.History)-1].Text
	reply, err := services.GetAIChatResponse(r.Context(), lastMsg)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"reply": reply})
}
