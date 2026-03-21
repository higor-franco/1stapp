-- name: CreateInvoice :one
INSERT INTO invoices (user_id, vindi_bill_id, amount, status, due_at, paid_at)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: ListInvoicesByUserID :many
SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20;

-- name: UpdateInvoiceStatus :one
UPDATE invoices SET status = $2, paid_at = $3
WHERE vindi_bill_id = $1
RETURNING *;
