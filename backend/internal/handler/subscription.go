package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	db "github.com/higor-franco/1stapp/internal/database/sqlc"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// ── Upgrade (POST /api/subscription/upgrade) ─────────────────────────────────

type upgradeReq struct {
	HolderName     string `json:"holder_name"`
	CardNumber     string `json:"card_number"`
	CardExpiration string `json:"card_expiration"`
	CardCVV        string `json:"card_cvv"`
}

func (h *Handler) handleUpgrade(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)

	if user.Plan == "start" {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "você já possui o Plano Start"})
		return
	}

	if h.cfg.VindiAPIKey == "" {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "pagamentos não configurados"})
		return
	}

	var req upgradeReq
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "dados inválidos"})
		return
	}
	req.CardNumber = strings.ReplaceAll(req.CardNumber, " ", "")

	if req.HolderName == "" || len(req.CardNumber) < 13 || req.CardExpiration == "" || req.CardCVV == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "preencha todos os dados do cartão"})
		return
	}

	vindi := newVindiClient(h.cfg.VindiAPIKey, h.cfg.VindiSandbox)

	// Create customer
	customerID, err := vindi.createCustomer(user.Name, user.Email)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "erro ao criar cliente na Vindi"})
		return
	}

	// Create payment profile
	_, err = vindi.createPaymentProfile(customerID, req.HolderName, req.CardNumber, req.CardExpiration, req.CardCVV)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "cartão recusado ou inválido"})
		return
	}

	// Create subscription
	subscriptionID, status, err := vindi.createSubscription(customerID, h.cfg.VindiPlanID)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "erro ao criar assinatura"})
		return
	}

	// Persist subscription
	periodEnd := pgtype.Timestamptz{Time: time.Now().AddDate(0, 1, 0), Valid: true}
	_, err = h.db.UpsertSubscription(r.Context(), db.UpsertSubscriptionParams{
		UserID:              user.ID,
		VindiCustomerID:     pgtype.Int4{Int32: int32(customerID), Valid: true},
		VindiSubscriptionID: pgtype.Int4{Int32: int32(subscriptionID), Valid: true},
		Status:              status,
		CurrentPeriodEnd:    periodEnd,
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro ao salvar assinatura"})
		return
	}

	// Upgrade user plan
	if _, err := h.db.UpdateUserPlan(r.Context(), db.UpdateUserPlanParams{
		ID:   user.ID,
		Plan: "start",
	}); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro ao atualizar plano"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"plan": "start"})
}

// ── Get Subscription (GET /api/subscription/me) ───────────────────────────────

type subscriptionResp struct {
	Plan             string     `json:"plan"`
	Status           string     `json:"status"`
	CurrentPeriodEnd *time.Time `json:"current_period_end,omitempty"`
	Invoices         []invoiceItem `json:"invoices"`
}

type invoiceItem struct {
	ID     int32      `json:"id"`
	Amount int32      `json:"amount"`
	Status string     `json:"status"`
	DueAt  *time.Time `json:"due_at,omitempty"`
	PaidAt *time.Time `json:"paid_at,omitempty"`
}

func (h *Handler) handleGetSubscription(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)

	resp := subscriptionResp{
		Plan:     user.Plan,
		Status:   "inactive",
		Invoices: []invoiceItem{},
	}

	sub, err := h.db.GetSubscriptionByUserID(r.Context(), user.ID)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro interno"})
		return
	}
	if err == nil {
		resp.Status = sub.Status
		if sub.CurrentPeriodEnd.Valid {
			t := sub.CurrentPeriodEnd.Time
			resp.CurrentPeriodEnd = &t
		}
	}

	invoices, err := h.db.ListInvoicesByUserID(r.Context(), user.ID)
	if err == nil {
		for _, inv := range invoices {
			item := invoiceItem{
				ID:     inv.VindiBillID.Int32,
				Amount: inv.Amount,
				Status: inv.Status,
			}
			if inv.DueAt.Valid {
				t := inv.DueAt.Time
				item.DueAt = &t
			}
			if inv.PaidAt.Valid {
				t := inv.PaidAt.Time
				item.PaidAt = &t
			}
			resp.Invoices = append(resp.Invoices, item)
		}
	}

	writeJSON(w, http.StatusOK, resp)
}

// ── Cancel Subscription (POST /api/subscription/cancel) ─────────────────────

func (h *Handler) handleCancelSubscription(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)

	if user.Plan != "start" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "sem assinatura ativa"})
		return
	}

	sub, err := h.db.GetSubscriptionByUserID(r.Context(), user.ID)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "assinatura não encontrada"})
		return
	}

	if h.cfg.VindiAPIKey != "" && sub.VindiSubscriptionID.Valid {
		vindi := newVindiClient(h.cfg.VindiAPIKey, h.cfg.VindiSandbox)
		_ = vindi.cancelSubscription(int(sub.VindiSubscriptionID.Int32))
	}

	_, err = h.db.UpdateSubscriptionStatus(r.Context(), db.UpdateSubscriptionStatusParams{
		VindiSubscriptionID: sub.VindiSubscriptionID,
		Status:              "canceled",
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro ao cancelar"})
		return
	}

	if _, err := h.db.UpdateUserPlan(r.Context(), db.UpdateUserPlanParams{
		ID:   user.ID,
		Plan: "free",
	}); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro ao atualizar plano"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"plan": "free"})
}

// ── Vindi Webhook (POST /api/webhooks/vindi) ──────────────────────────────────

func (h *Handler) handleVindiWebhook(w http.ResponseWriter, r *http.Request) {
	// Verify secret token via query param or header
	if h.cfg.VindiWebhookSecret != "" {
		token := r.URL.Query().Get("token")
		if token == "" {
			token = r.Header.Get("X-Vindi-Token")
		}
		if token != h.cfg.VindiWebhookSecret {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
	}

	var event vindiWebhookEvent
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	switch event.Event.Type {
	case "bill_paid":
		var data struct {
			Bill struct {
				ID           int     `json:"id"`
				Amount       float64 `json:"amount"`
				DueAt        string  `json:"due_at"`
				PaidAt       string  `json:"paid_at"`
				Subscription *struct {
					ID int `json:"id"`
				} `json:"subscription"`
			} `json:"bill"`
		}
		if err := json.Unmarshal(event.Event.Data, &data); err == nil && data.Bill.Subscription != nil {
			subID := int32(data.Bill.Subscription.ID)
			_, _ = h.db.UpdateSubscriptionStatus(r.Context(), db.UpdateSubscriptionStatusParams{
				VindiSubscriptionID: pgtype.Int4{Int32: subID, Valid: true},
				Status:              "active",
			})

			paidAt := pgtype.Timestamptz{}
			if t, err := time.Parse(time.RFC3339, data.Bill.PaidAt); err == nil {
				paidAt = pgtype.Timestamptz{Time: t, Valid: true}
			}
			dueAt := pgtype.Timestamptz{}
			if t, err := time.Parse(time.RFC3339, data.Bill.DueAt); err == nil {
				dueAt = pgtype.Timestamptz{Time: t, Valid: true}
			}

			// find user by subscription
			sub, err := h.db.UpdateSubscriptionStatus(r.Context(), db.UpdateSubscriptionStatusParams{
				VindiSubscriptionID: pgtype.Int4{Int32: subID, Valid: true},
				Status:              "active",
			})
			if err == nil {
				_, _ = h.db.CreateInvoice(r.Context(), db.CreateInvoiceParams{
					UserID:      sub.UserID,
					VindiBillID: pgtype.Int4{Int32: int32(data.Bill.ID), Valid: true},
					Amount:      int32(data.Bill.Amount * 100),
					Status:      "paid",
					DueAt:       dueAt,
					PaidAt:      paidAt,
				})
				_, _ = h.db.UpdateUserPlan(r.Context(), db.UpdateUserPlanParams{
					ID:   sub.UserID,
					Plan: "start",
				})
			}
		}

	case "subscription_canceled":
		var data struct {
			Subscription struct {
				ID int `json:"id"`
			} `json:"subscription"`
		}
		if err := json.Unmarshal(event.Event.Data, &data); err == nil {
			subID := int32(data.Subscription.ID)
			sub, err := h.db.UpdateSubscriptionStatus(r.Context(), db.UpdateSubscriptionStatusParams{
				VindiSubscriptionID: pgtype.Int4{Int32: subID, Valid: true},
				Status:              "canceled",
			})
			if err == nil {
				_, _ = h.db.UpdateUserPlan(r.Context(), db.UpdateUserPlanParams{
					ID:   sub.UserID,
					Plan: "free",
				})
			}
		}

	case "subscription_reactivated":
		var data struct {
			Subscription struct {
				ID int `json:"id"`
			} `json:"subscription"`
		}
		if err := json.Unmarshal(event.Event.Data, &data); err == nil {
			subID := int32(data.Subscription.ID)
			sub, err := h.db.UpdateSubscriptionStatus(r.Context(), db.UpdateSubscriptionStatusParams{
				VindiSubscriptionID: pgtype.Int4{Int32: subID, Valid: true},
				Status:              "active",
			})
			if err == nil {
				_, _ = h.db.UpdateUserPlan(r.Context(), db.UpdateUserPlanParams{
					ID:   sub.UserID,
					Plan: "start",
				})
			}
		}
	}

	w.WriteHeader(http.StatusOK)
}

// ── Payment Addon (GET/POST /api/payment-addon) ───────────────────────────────

type paymentAddonReq struct {
	VindiAPIKey   string `json:"vindi_api_key"`
	ServiceName   string `json:"service_name"`
	ServiceAmount int32  `json:"service_amount"`
	ServiceType   string `json:"service_type"`
	Active        bool   `json:"active"`
}

func (h *Handler) handleGetPaymentAddon(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)

	addon, err := h.db.GetPaymentAddonByUserID(r.Context(), user.ID)
	if errors.Is(err, pgx.ErrNoRows) {
		writeJSON(w, http.StatusOK, nil)
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro interno"})
		return
	}

	// Mask API key
	masked := addon
	if len(masked.VindiApiKey) > 4 {
		masked.VindiApiKey = "****" + masked.VindiApiKey[len(masked.VindiApiKey)-4:]
	}
	writeJSON(w, http.StatusOK, masked)
}

func (h *Handler) handleSavePaymentAddon(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)

	if user.Plan != "start" {
		writeJSON(w, http.StatusPaymentRequired, map[string]string{"error": "requer Plano Start"})
		return
	}

	var req paymentAddonReq
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "dados inválidos"})
		return
	}

	if req.ServiceName == "" || req.ServiceAmount <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "nome e valor do serviço são obrigatórios"})
		return
	}
	if req.ServiceType != "one_time" && req.ServiceType != "recurring" {
		req.ServiceType = "one_time"
	}

	// Validate the API key with Vindi (optional check)
	if req.VindiAPIKey != "" && !strings.HasPrefix(req.VindiAPIKey, "****") {
		testClient := newVindiClient(req.VindiAPIKey, h.cfg.VindiSandbox)
		if err := testClient.do("GET", "/plans?per_page=1", nil, nil); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "chave da API Vindi inválida"})
			return
		}
	}

	// If masked key sent, keep existing key
	apiKey := req.VindiAPIKey
	if strings.HasPrefix(apiKey, "****") {
		existing, err := h.db.GetPaymentAddonByUserID(r.Context(), user.ID)
		if err == nil {
			apiKey = existing.VindiApiKey
		} else {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "informe a chave da API Vindi"})
			return
		}
	}

	addon, err := h.db.UpsertPaymentAddon(r.Context(), db.UpsertPaymentAddonParams{
		UserID:        user.ID,
		VindiApiKey:   apiKey,
		ServiceName:   req.ServiceName,
		ServiceAmount: req.ServiceAmount,
		ServiceType:   req.ServiceType,
		Active:        req.Active,
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro ao salvar"})
		return
	}

	// Inject or remove payment button in site HTML
	if err := h.updateSitePaymentButton(r, user, addon); err != nil {
		// Non-fatal: log but continue
		_ = fmt.Errorf("update site payment button: %w", err)
	}

	// Mask before returning
	addon.VindiApiKey = "****" + apiKey[max(0, len(apiKey)-4):]
	writeJSON(w, http.StatusOK, addon)
}

func (h *Handler) updateSitePaymentButton(r *http.Request, user db.User, addon db.PaymentAddon) error {
	site, err := h.db.GetSiteByUserID(r.Context(), user.ID)
	if err != nil {
		return err
	}

	html := site.HtmlContent

	// Remove existing payment button if present
	const marker = "<!-- vindi-payment-button -->"
	if idx := strings.Index(html, marker); idx != -1 {
		end := strings.Index(html[idx:], "<!-- /vindi-payment-button -->")
		if end != -1 {
			html = html[:idx] + html[idx+end+len("<!-- /vindi-payment-button -->"):]
		}
	}

	if addon.Active && addon.ServiceAmount > 0 {
		amountBRL := fmt.Sprintf("R$ %.2f", float64(addon.ServiceAmount)/100)
		label := addon.ServiceName
		buttonHTML := fmt.Sprintf(`<!-- vindi-payment-button --><section style="text-align:center;padding:40px 20px;background:#f8f9fa"><h3 style="margin-bottom:16px">%s</h3><p style="font-size:1.2em;font-weight:bold;margin-bottom:20px">%s</p><a href="#pagar" onclick="alert('Pagamento via Vindi - configure no painel')" style="display:inline-block;background:#0066cc;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:1.1em">Pagar agora</a></section><!-- /vindi-payment-button -->`, label, amountBRL)

		// Insert before </body>
		html = strings.Replace(html, "</body>", buttonHTML+"</body>", 1)
	}

	_, err = h.db.UpdateSiteContent(r.Context(), db.UpdateSiteContentParams{
		ID:          site.ID,
		HtmlContent: html,
	})
	return err
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
