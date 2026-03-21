package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

const (
	vindiProdURL    = "https://app.vindi.com.br/api/v1"
	vindiSandboxURL = "https://sandbox-app.vindi.com.br/api/v1"
)

type vindiClient struct {
	apiKey  string
	baseURL string
}

func newVindiClient(apiKey string, sandbox bool) *vindiClient {
	base := vindiProdURL
	if sandbox {
		base = vindiSandboxURL
	}
	return &vindiClient{apiKey: apiKey, baseURL: base}
}

func (c *vindiClient) do(method, path string, body any, out any) error {
	var bodyReader io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return err
		}
		bodyReader = bytes.NewReader(b)
	}
	req, err := http.NewRequest(method, c.baseURL+path, bodyReader)
	if err != nil {
		return err
	}
	req.SetBasicAuth(c.apiKey, "")
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return fmt.Errorf("vindi error %d: %s", resp.StatusCode, string(respBody))
	}
	if out != nil {
		return json.Unmarshal(respBody, out)
	}
	return nil
}

// ── Customer ──────────────────────────────────────────────────────────────────

type vindiCustomerReq struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

type vindiCustomerResp struct {
	Customer struct {
		ID int `json:"id"`
	} `json:"customer"`
}

func (c *vindiClient) createCustomer(name, email string) (int, error) {
	var resp vindiCustomerResp
	err := c.do("POST", "/customers", vindiCustomerReq{Name: name, Email: email}, &resp)
	return resp.Customer.ID, err
}

// ── Payment Profile (credit card) ─────────────────────────────────────────────

type vindiPaymentProfileReq struct {
	HolderName        string `json:"holder_name"`
	CardExpiration    string `json:"card_expiration"`
	CardNumber        string `json:"card_number"`
	CardCVV           string `json:"card_cvv"`
	PaymentMethodCode string `json:"payment_method_code"`
	CustomerID        int    `json:"customer_id"`
}

type vindiPaymentProfileResp struct {
	PaymentProfile struct {
		ID int `json:"id"`
	} `json:"payment_profile"`
}

func (c *vindiClient) createPaymentProfile(customerID int, holderName, cardNumber, cardExpiration, cardCVV string) (int, error) {
	var resp vindiPaymentProfileResp
	err := c.do("POST", "/payment_profiles", vindiPaymentProfileReq{
		HolderName:        holderName,
		CardExpiration:    cardExpiration,
		CardNumber:        cardNumber,
		CardCVV:           cardCVV,
		PaymentMethodCode: "credit_card",
		CustomerID:        customerID,
	}, &resp)
	return resp.PaymentProfile.ID, err
}

// ── Subscription ──────────────────────────────────────────────────────────────

type vindiSubscriptionReq struct {
	CustomerID       int    `json:"customer_id"`
	PlanIdentifier   string `json:"plan_identifier,omitempty"`
	PaymentMethodCode string `json:"payment_method_code"`
	ProductItems     []vindiProductItem `json:"product_items,omitempty"`
}

type vindiProductItem struct {
	ProductIdentifier string `json:"product_identifier"`
	Cycles            *int   `json:"cycles,omitempty"`
}

type vindiSubscriptionResp struct {
	Subscription struct {
		ID     int    `json:"id"`
		Status string `json:"status"`
	} `json:"subscription"`
}

func (c *vindiClient) createSubscription(customerID int, planID string) (int, string, error) {
	var resp vindiSubscriptionResp
	err := c.do("POST", "/subscriptions", vindiSubscriptionReq{
		CustomerID:        customerID,
		PlanIdentifier:    planID,
		PaymentMethodCode: "credit_card",
	}, &resp)
	return resp.Subscription.ID, resp.Subscription.Status, err
}

func (c *vindiClient) cancelSubscription(subscriptionID int) error {
	return c.do("DELETE", fmt.Sprintf("/subscriptions/%d", subscriptionID), nil, nil)
}

// ── Bills (invoices) ──────────────────────────────────────────────────────────

type vindiBill struct {
	ID     int    `json:"id"`
	Status string `json:"status"`
	Amount float64 `json:"amount"`
	DueAt  string `json:"due_at"`
	PaidAt *string `json:"paid_at"`
}

type vindiBillsResp struct {
	Bills []vindiBill `json:"bills"`
}

func (c *vindiClient) listBills(customerID int) ([]vindiBill, error) {
	var resp vindiBillsResp
	err := c.do("GET", fmt.Sprintf("/bills?query=customer_id:%d&per_page=20&sort_by=created_at&sort_order=desc", customerID), nil, &resp)
	return resp.Bills, err
}

// ── Charge (add-on) ──────────────────────────────────────────────────────────

type vindiChargeReq struct {
	CustomerID        int     `json:"customer_id"`
	Amount            float64 `json:"amount"`
	PaymentMethodCode string  `json:"payment_method_code"`
}

type vindiChargeResp struct {
	Charge struct {
		ID     int    `json:"id"`
		Status string `json:"status"`
	} `json:"charge"`
}

// ── Webhook event ─────────────────────────────────────────────────────────────

type vindiWebhookEvent struct {
	Event struct {
		Type string          `json:"type"`
		Data json.RawMessage `json:"data"`
	} `json:"event"`
}
