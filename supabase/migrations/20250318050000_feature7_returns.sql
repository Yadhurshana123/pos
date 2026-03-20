-- Feature 7: Returns, Refunds & Exchanges (Cashier, No Approval)
-- Run in Supabase SQL Editor

-- 1. Add reason_code to returns
ALTER TABLE returns ADD COLUMN IF NOT EXISTS reason_code TEXT;

-- 2. Add 'completed' to returns.status (cashier processes directly)
ALTER TABLE returns DROP CONSTRAINT IF EXISTS returns_status_check;
ALTER TABLE returns ADD CONSTRAINT returns_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'completed'));

-- 3. Add return_id to payments (link refund to return)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS return_id UUID REFERENCES returns(id);

CREATE INDEX IF NOT EXISTS idx_payments_return_id ON payments(return_id);

-- 4. Allow cashiers to create returns (counter-initiated, no approval)
DROP POLICY IF EXISTS "Cashiers can create returns" ON returns;
CREATE POLICY "Cashiers can create returns"
  ON returns FOR INSERT
  WITH CHECK (get_my_role() IN ('admin', 'manager', 'cashier'));

-- 5. Allow cashiers to read returns (extend managers policy)
DROP POLICY IF EXISTS "Managers and admins can read all returns" ON returns;
CREATE POLICY "Managers and admins can read all returns"
  ON returns FOR SELECT
  USING (get_my_role() IN ('admin', 'manager', 'cashier'));
