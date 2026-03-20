-- Payments table for order payment tracking (split tender, refunds)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('cash', 'card', 'split_cash', 'split_card', 'qr', 'voucher', 'refund')),
  reference_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read payments"
  ON payments FOR SELECT
  USING (get_my_role() IN ('admin', 'manager', 'cashier'));

CREATE POLICY "Cashiers can create payments"
  ON payments FOR INSERT
  WITH CHECK (get_my_role() IN ('admin', 'manager', 'cashier'));
