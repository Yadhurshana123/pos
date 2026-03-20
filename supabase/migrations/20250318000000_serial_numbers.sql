-- Serial number tracking for high-value products
-- Run this migration after the main schema

ALTER TABLE products ADD COLUMN IF NOT EXISTS track_serial BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS serial_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  serial_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'sold', 'returned', 'damaged', 'lost')),
  order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, serial_number)
);

CREATE INDEX IF NOT EXISTS idx_serial_numbers_product_id ON serial_numbers(product_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_site_id ON serial_numbers(site_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_serial_number ON serial_numbers(serial_number);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_status ON serial_numbers(status);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_order_item_id ON serial_numbers(order_item_id);

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS serial_numbers JSONB DEFAULT '[]';

CREATE TRIGGER trigger_serial_numbers_updated_at
  BEFORE UPDATE ON serial_numbers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE serial_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read serial_numbers"
  ON serial_numbers FOR SELECT
  USING (true);

CREATE POLICY "Managers, cashiers and admins can manage serial_numbers"
  ON serial_numbers FOR ALL
  USING (get_my_role() IN ('admin', 'manager', 'cashier'));
