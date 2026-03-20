-- Feature 6: Pricing & Promotions
-- Run in Supabase SQL Editor

ALTER TABLE orders ADD COLUMN IF NOT EXISTS manual_discount_pct NUMERIC(5,2) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS override_price NUMERIC(10,2);

CREATE TABLE IF NOT EXISTS site_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, site_id)
);

CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  promo_price NUMERIC(10,2) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_prices_product_id ON site_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_site_prices_site_id ON site_prices(site_id);
CREATE INDEX IF NOT EXISTS idx_promotions_product_id ON promotions(product_id);
CREATE INDEX IF NOT EXISTS idx_promotions_category_id ON promotions(category_id);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);

ALTER TABLE site_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read site_prices" ON site_prices FOR SELECT USING (true);
CREATE POLICY "Managers and admins can manage site_prices" ON site_prices FOR ALL USING (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "Everyone can read promotions" ON promotions FOR SELECT USING (true);
CREATE POLICY "Managers and admins can manage promotions" ON promotions FOR ALL USING (get_my_role() IN ('admin', 'manager'));
