-- =============================================================================
-- SCSTix EPOS Merchandise POS System - Supabase Schema Migration
-- =============================================================================
-- Run this migration against your Supabase (PostgreSQL) database.
-- Tables are created in dependency order to satisfy foreign key constraints.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. OPTIMO INTEGRATION TABLES
-- -----------------------------------------------------------------------------

CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  optimo_venue_id TEXT UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  optimo_site_id TEXT UNIQUE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'retail',
  location TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2. OPERATIONS (counters must exist before orders, cash_sessions, parked_bills)
-- -----------------------------------------------------------------------------

CREATE TABLE counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id),
  name TEXT NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 3. AUTH / USERS
-- -----------------------------------------------------------------------------

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  optimo_user_id TEXT,
  display_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'manager', 'cashier', 'staff', 'customer')),
  venue_id UUID REFERENCES venues(id),
  site_id UUID REFERENCES sites(id),
  active BOOLEAN DEFAULT true,
  loyalty_points INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'Bronze',
  total_spent NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 4. PRODUCT DOMAIN
-- -----------------------------------------------------------------------------

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  sizes TEXT[],
  colors TEXT[],
  materials TEXT[],
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sizes TEXT[],
  colors TEXT[],
  category_id UUID REFERENCES categories(id),
  brand TEXT,
  material TEXT,
  fit TEXT,
  care TEXT,
  base_price NUMERIC(10,2) NOT NULL,
  cost_price NUMERIC(10,2),
  tax_code TEXT DEFAULT 'standard',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  featured BOOLEAN DEFAULT false,
  image_url TEXT,
  emoji TEXT DEFAULT '📦',
  returnable BOOLEAN DEFAULT true,
  track_serial BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size TEXT,
  color TEXT,
  sku_suffix TEXT,
  barcode TEXT,
  price_override NUMERIC(10,2),
  stock_threshold INTEGER DEFAULT 10,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE product_barcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  barcode TEXT NOT NULL,
  format TEXT DEFAULT 'EAN13',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(barcode)
);

-- -----------------------------------------------------------------------------
-- 5. INVENTORY DOMAIN
-- -----------------------------------------------------------------------------

CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  stock_on_hand INTEGER NOT NULL DEFAULT 0,
  reserved_qty INTEGER NOT NULL DEFAULT 0,
  reorder_point INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, variant_id, site_id)
);

CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  from_site_id UUID REFERENCES sites(id),
  to_site_id UUID REFERENCES sites(id),
  quantity INTEGER NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('receive', 'sell', 'return', 'adjust', 'transfer', 'damage', 'loss')),
  reference_id TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 6. SALES DOMAIN
-- -----------------------------------------------------------------------------

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  site_id UUID REFERENCES sites(id),
  customer_id UUID REFERENCES profiles(id),
  cashier_id UUID REFERENCES profiles(id),
  counter_id UUID REFERENCES counters(id),
  order_type TEXT NOT NULL DEFAULT 'in-store' CHECK (order_type IN ('in-store', 'delivery', 'pickup', 'online')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'completed', 'refunded', 'cancelled')),
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  loyalty_discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  manual_discount_pct NUMERIC(5,2) DEFAULT 0,
  delivery_charge NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_details JSONB,
  notes TEXT,
  delivery_address TEXT,
  delivery_status TEXT,
  loyalty_earned INTEGER DEFAULT 0,
  loyalty_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  discount_pct NUMERIC(5,2) DEFAULT 0,
  override_price NUMERIC(10,2),
  line_total NUMERIC(10,2) NOT NULL,
  serial_numbers JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number TEXT UNIQUE NOT NULL,
  order_id UUID NOT NULL REFERENCES orders(id),
  customer_id UUID REFERENCES profiles(id),
  processed_by UUID REFERENCES profiles(id),
  type TEXT NOT NULL DEFAULT 'full' CHECK (type IN ('full', 'partial', 'exchange')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT,
  refund_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  refund_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id),
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  refund_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  restock BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 7. CASH MANAGEMENT
-- -----------------------------------------------------------------------------

CREATE TABLE cash_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id),
  counter_id UUID REFERENCES counters(id),
  opened_by UUID NOT NULL REFERENCES profiles(id),
  closed_by UUID REFERENCES profiles(id),
  opening_float NUMERIC(10,2) NOT NULL DEFAULT 0,
  closing_cash NUMERIC(10,2),
  expected_cash NUMERIC(10,2),
  variance NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opened_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sale', 'refund', 'drop', 'lift', 'float')),
  amount NUMERIC(10,2) NOT NULL,
  reference_id TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 8. OPERATIONS (remaining)
-- -----------------------------------------------------------------------------

CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id),
  title TEXT NOT NULL,
  subtitle TEXT,
  cta TEXT,
  image_url TEXT,
  gradient TEXT,
  offer_type TEXT DEFAULT 'none',
  offer_target TEXT,
  offer_discount NUMERIC(5,2) DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('percent', 'fixed', 'delivery')),
  value NUMERIC(10,2) NOT NULL,
  min_order NUMERIC(10,2) DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE site_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, site_id)
);

CREATE TABLE promotions (
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

CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id),
  site_id UUID REFERENCES sites(id),
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(venue_id, site_id, key)
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  user_name TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE parked_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id),
  counter_id UUID REFERENCES counters(id),
  cashier_id UUID REFERENCES profiles(id),
  customer_id UUID REFERENCES profiles(id),
  items JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  parked_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('cash', 'card', 'split_cash', 'split_card', 'qr', 'voucher', 'refund')),
  reference_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- SERIAL NUMBER TRACKING (high-value items)
-- -----------------------------------------------------------------------------

CREATE TABLE serial_numbers (
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

-- =============================================================================
-- INDEXES
-- =============================================================================

-- venues
CREATE INDEX idx_venues_optimo_venue_id ON venues(optimo_venue_id);
CREATE INDEX idx_venues_status ON venues(status);

-- sites
CREATE INDEX idx_sites_venue_id ON sites(venue_id);
CREATE INDEX idx_sites_optimo_site_id ON sites(optimo_site_id);
CREATE INDEX idx_sites_status ON sites(status);

-- counters
CREATE INDEX idx_counters_site_id ON counters(site_id);
CREATE INDEX idx_counters_status ON counters(status);

-- profiles
CREATE INDEX idx_profiles_optimo_user_id ON profiles(optimo_user_id);
CREATE INDEX idx_profiles_venue_id ON profiles(venue_id);
CREATE INDEX idx_profiles_site_id ON profiles(site_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- categories
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);

-- products
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_featured ON products(featured);

-- product_variants
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_barcode ON product_variants(barcode);

-- product_barcodes
CREATE INDEX idx_product_barcodes_product_id ON product_barcodes(product_id);
CREATE INDEX idx_product_barcodes_variant_id ON product_barcodes(variant_id);
CREATE INDEX idx_product_barcodes_barcode ON product_barcodes(barcode);

-- inventory
CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_inventory_variant_id ON inventory(variant_id);
CREATE INDEX idx_inventory_site_id ON inventory(site_id);
CREATE INDEX idx_inventory_site_product ON inventory(site_id, product_id);

-- inventory_movements
CREATE INDEX idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_variant_id ON inventory_movements(variant_id);
CREATE INDEX idx_inventory_movements_from_site_id ON inventory_movements(from_site_id);
CREATE INDEX idx_inventory_movements_to_site_id ON inventory_movements(to_site_id);
CREATE INDEX idx_inventory_movements_created_by ON inventory_movements(created_by);
CREATE INDEX idx_inventory_movements_created_at ON inventory_movements(created_at);
CREATE INDEX idx_inventory_movements_movement_type ON inventory_movements(movement_type);

-- orders
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_site_id ON orders(site_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_cashier_id ON orders(cashier_id);
CREATE INDEX idx_orders_counter_id ON orders(counter_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- order_items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_variant_id ON order_items(variant_id);

-- returns
CREATE INDEX idx_returns_return_number ON returns(return_number);
CREATE INDEX idx_returns_order_id ON returns(order_id);
CREATE INDEX idx_returns_customer_id ON returns(customer_id);
CREATE INDEX idx_returns_processed_by ON returns(processed_by);
CREATE INDEX idx_returns_status ON returns(status);

-- return_items
CREATE INDEX idx_return_items_return_id ON return_items(return_id);
CREATE INDEX idx_return_items_order_item_id ON return_items(order_item_id);

-- cash_sessions
CREATE INDEX idx_cash_sessions_site_id ON cash_sessions(site_id);
CREATE INDEX idx_cash_sessions_counter_id ON cash_sessions(counter_id);
CREATE INDEX idx_cash_sessions_opened_by ON cash_sessions(opened_by);
CREATE INDEX idx_cash_sessions_status ON cash_sessions(status);
CREATE INDEX idx_cash_sessions_opened_at ON cash_sessions(opened_at);

-- cash_movements
CREATE INDEX idx_cash_movements_session_id ON cash_movements(session_id);
CREATE INDEX idx_cash_movements_created_by ON cash_movements(created_by);
CREATE INDEX idx_cash_movements_created_at ON cash_movements(created_at);

-- banners
CREATE INDEX idx_banners_venue_id ON banners(venue_id);
CREATE INDEX idx_banners_active ON banners(active);
CREATE INDEX idx_banners_dates ON banners(start_date, end_date);

-- coupons
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(active);

CREATE INDEX idx_site_prices_product_id ON site_prices(product_id);
CREATE INDEX idx_site_prices_site_id ON site_prices(site_id);
CREATE INDEX idx_promotions_product_id ON promotions(product_id);
CREATE INDEX idx_promotions_category_id ON promotions(category_id);
CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date);

-- settings
CREATE INDEX idx_settings_venue_id ON settings(venue_id);
CREATE INDEX idx_settings_site_id ON settings(site_id);
CREATE INDEX idx_settings_key ON settings(key);

-- audit_logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_module ON audit_logs(module);
CREATE INDEX idx_audit_logs_module_action ON audit_logs(module, action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- parked_bills
CREATE INDEX idx_parked_bills_site_id ON parked_bills(site_id);
CREATE INDEX idx_parked_bills_counter_id ON parked_bills(counter_id);
CREATE INDEX idx_parked_bills_cashier_id ON parked_bills(cashier_id);
CREATE INDEX idx_parked_bills_parked_at ON parked_bills(parked_at);

-- payments
CREATE INDEX idx_payments_order_id ON payments(order_id);

-- serial_numbers
CREATE INDEX idx_serial_numbers_product_id ON serial_numbers(product_id);
CREATE INDEX idx_serial_numbers_site_id ON serial_numbers(site_id);
CREATE INDEX idx_serial_numbers_serial_number ON serial_numbers(serial_number);
CREATE INDEX idx_serial_numbers_status ON serial_numbers(status);
CREATE INDEX idx_serial_numbers_order_item_id ON serial_numbers(order_item_id);

-- Remove duplicate index (inventory_product_id was listed twice)
DROP INDEX IF EXISTS idx_inventory_product_id;

-- =============================================================================
-- SEQUENCES FOR ORDER/RETURN NUMBERS
-- =============================================================================

CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS return_number_seq START 1;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- 1. Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_venues_updated_at
  BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_sites_updated_at
  BEFORE UPDATE ON sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_returns_updated_at
  BEFORE UPDATE ON returns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_serial_numbers_updated_at
  BEFORE UPDATE ON serial_numbers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Get authenticated user's own profile (bypasses RLS, safe via auth.uid())
CREATE OR REPLACE FUNCTION get_my_profile()
RETURNS SETOF profiles AS $$
  SELECT * FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 2b. Get authenticated user's role (bypasses RLS to prevent infinite recursion)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2c. Get authenticated user's venue_id (bypasses RLS)
CREATE OR REPLACE FUNCTION get_my_venue_id()
RETURNS UUID AS $$
  SELECT venue_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. Auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. Generate order_number (ORD-0001, ORD-0002, etc.)
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'ORD-' || lpad(nextval('order_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_orders_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- 4. Generate return_number (RET-0001, etc.)
CREATE OR REPLACE FUNCTION generate_return_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.return_number IS NULL OR NEW.return_number = '' THEN
    NEW.return_number := 'RET-' || lpad(nextval('return_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_returns_return_number
  BEFORE INSERT ON returns
  FOR EACH ROW EXECUTE FUNCTION generate_return_number();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_barcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE parked_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE serial_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- RLS POLICIES
-- -----------------------------------------------------------------------------

-- profiles: users can read their own profile, admins/managers can read all in their venue
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins and managers can read all profiles in venue"
  ON profiles FOR SELECT
  USING (
    get_my_role() IN ('admin', 'manager')
    AND (get_my_venue_id() = profiles.venue_id OR get_my_venue_id() IS NULL)
  );

CREATE POLICY "Service role can manage profiles"
  ON profiles FOR ALL
  USING (auth.role() = 'service_role');

-- products: everyone can read, managers/admins can write
CREATE POLICY "Everyone can read products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Managers and admins can update products"
  ON products FOR ALL
  USING (get_my_role() IN ('admin', 'manager'));

-- product_variants
CREATE POLICY "Everyone can read product_variants"
  ON product_variants FOR SELECT
  USING (true);

CREATE POLICY "Managers and admins can manage product_variants"
  ON product_variants FOR ALL
  USING (get_my_role() IN ('admin', 'manager'));

-- product_barcodes
CREATE POLICY "Everyone can read product_barcodes"
  ON product_barcodes FOR SELECT
  USING (true);

CREATE POLICY "Managers and admins can manage product_barcodes"
  ON product_barcodes FOR ALL
  USING (get_my_role() IN ('admin', 'manager'));

-- inventory: everyone can read, managers/cashiers/admins can write
CREATE POLICY "Everyone can read inventory"
  ON inventory FOR SELECT
  USING (true);

CREATE POLICY "Managers, cashiers and admins can manage inventory"
  ON inventory FOR ALL
  USING (get_my_role() IN ('admin', 'manager', 'cashier'));

-- inventory_movements
CREATE POLICY "Everyone can read inventory_movements"
  ON inventory_movements FOR SELECT
  USING (true);

CREATE POLICY "Managers, cashiers and admins can manage inventory_movements"
  ON inventory_movements FOR ALL
  USING (get_my_role() IN ('admin', 'manager', 'cashier'));

-- orders: cashiers can create, customers read own, managers/admins read all in venue
CREATE POLICY "Cashiers can create orders"
  ON orders FOR INSERT
  WITH CHECK (get_my_role() IN ('admin', 'manager', 'cashier'));

CREATE POLICY "Customers can read own orders"
  ON orders FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Managers and admins can read all orders"
  ON orders FOR SELECT
  USING (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "Managers and admins can update orders"
  ON orders FOR UPDATE
  USING (get_my_role() IN ('admin', 'manager'));

-- order_items
CREATE POLICY "Customers can read own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
      AND o.customer_id = auth.uid()
    )
  );

CREATE POLICY "Staff can read order items"
  ON order_items FOR SELECT
  USING (get_my_role() IN ('admin', 'manager', 'cashier', 'staff'));

CREATE POLICY "Cashiers can create order items"
  ON order_items FOR INSERT
  WITH CHECK (get_my_role() IN ('admin', 'manager', 'cashier'));

-- returns: customers create, managers approve/reject
CREATE POLICY "Customers can create returns"
  ON returns FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can read own returns"
  ON returns FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Managers and admins can read all returns"
  ON returns FOR SELECT
  USING (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "Managers and admins can update returns (approve/reject)"
  ON returns FOR UPDATE
  USING (get_my_role() IN ('admin', 'manager'));

-- return_items
CREATE POLICY "Customers can read own return items"
  ON return_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM returns r
      WHERE r.id = return_items.return_id
      AND r.customer_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage return items"
  ON return_items FOR ALL
  USING (get_my_role() IN ('admin', 'manager', 'cashier'));

-- audit_logs: admins can read all, insert only (no update/delete)
CREATE POLICY "Admins can read audit_logs"
  ON audit_logs FOR SELECT
  USING (get_my_role() = 'admin');

CREATE POLICY "Authenticated users can insert audit_logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- settings: authenticated users can read, admins can write
CREATE POLICY "Authenticated users can read settings"
  ON settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage settings"
  ON settings FOR ALL
  USING (get_my_role() = 'admin');

-- venues, sites, counters, categories, coupons, banners, cash_sessions, cash_movements, parked_bills
-- Allow authenticated staff to read/manage as needed
CREATE POLICY "Staff can read venues"
  ON venues FOR SELECT
  USING (get_my_role() IN ('admin', 'manager', 'cashier', 'staff'));

CREATE POLICY "Admins can manage venues"
  ON venues FOR ALL
  USING (get_my_role() = 'admin');

CREATE POLICY "Staff can read sites"
  ON sites FOR SELECT
  USING (get_my_role() IN ('admin', 'manager', 'cashier', 'staff'));

CREATE POLICY "Admins can manage sites"
  ON sites FOR ALL
  USING (get_my_role() = 'admin');

CREATE POLICY "Staff can read counters"
  ON counters FOR SELECT
  USING (get_my_role() IN ('admin', 'manager', 'cashier', 'staff'));

CREATE POLICY "Admins can manage counters"
  ON counters FOR ALL
  USING (get_my_role() = 'admin');

CREATE POLICY "Everyone can read categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Managers and admins can manage categories"
  ON categories FOR ALL
  USING (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "Everyone can read coupons"
  ON coupons FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage coupons"
  ON coupons FOR ALL
  USING (get_my_role() = 'admin');

CREATE POLICY "Everyone can read site_prices"
  ON site_prices FOR SELECT USING (true);
CREATE POLICY "Managers and admins can manage site_prices"
  ON site_prices FOR ALL USING (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "Everyone can read promotions"
  ON promotions FOR SELECT USING (true);
CREATE POLICY "Managers and admins can manage promotions"
  ON promotions FOR ALL USING (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "Staff can read banners"
  ON banners FOR SELECT
  USING (get_my_role() IN ('admin', 'manager', 'cashier', 'staff'));

CREATE POLICY "Admins can manage banners"
  ON banners FOR ALL
  USING (get_my_role() = 'admin');

CREATE POLICY "Cashiers can manage cash_sessions"
  ON cash_sessions FOR ALL
  USING (get_my_role() IN ('admin', 'manager', 'cashier'));

CREATE POLICY "Cashiers can manage cash_movements"
  ON cash_movements FOR ALL
  USING (get_my_role() IN ('admin', 'manager', 'cashier'));

CREATE POLICY "Cashiers can manage parked_bills"
  ON parked_bills FOR ALL
  USING (get_my_role() IN ('admin', 'manager', 'cashier'));

CREATE POLICY "Everyone can read serial_numbers"
  ON serial_numbers FOR SELECT
  USING (true);

CREATE POLICY "Managers, cashiers and admins can manage serial_numbers"
  ON serial_numbers FOR ALL
  USING (get_my_role() IN ('admin', 'manager', 'cashier'));

CREATE POLICY "Staff can read payments"
  ON payments FOR SELECT
  USING (get_my_role() IN ('admin', 'manager', 'cashier'));

CREATE POLICY "Cashiers can create payments"
  ON payments FOR INSERT
  WITH CHECK (get_my_role() IN ('admin', 'manager', 'cashier'));

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================

-- ═══════════════════════════════════════════════════════════
-- DB FUNCTIONS & STOCK CONSTRAINTS
-- ═══════════════════════════════════════════════════════════

-- Stock check constraint: prevent negative inventory
ALTER TABLE inventory ADD CONSTRAINT check_quantity_non_negative CHECK (stock_on_hand >= 0);
ALTER TABLE inventory ADD CONSTRAINT check_reserved_non_negative CHECK (reserved_qty >= 0);

-- Increment coupon uses (used by services/coupons.js)
CREATE OR REPLACE FUNCTION increment_coupon_uses(coupon_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE coupons SET current_uses = current_uses + 1 WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete a sale: insert order + order_items, deduct inventory, record movement
CREATE OR REPLACE FUNCTION complete_sale(
  p_order JSONB,
  p_items JSONB
)
RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_variant_id UUID;
  v_qty INT;
BEGIN
  -- Insert the order
  INSERT INTO orders (
    site_id, counter_id, cashier_id, customer_id,
    order_type, subtotal, discount_amount, tax_amount, total,
    payment_method, payment_details, status, notes
  )
  SELECT
    (p_order->>'site_id')::UUID,
    (p_order->>'counter_id')::UUID,
    (p_order->>'cashier_id')::UUID,
    NULLIF(p_order->>'customer_id', '')::UUID,
    COALESCE(p_order->>'order_type', 'in-store'),
    (p_order->>'subtotal')::NUMERIC,
    COALESCE((p_order->>'discount_amount')::NUMERIC, 0),
    COALESCE((p_order->>'tax_amount')::NUMERIC, 0),
    (p_order->>'total')::NUMERIC,
    p_order->>'payment_method',
    COALESCE(p_order->'payment_details', '{}'::JSONB),
    COALESCE(p_order->>'status', 'completed'),
    p_order->>'notes'
  RETURNING id INTO v_order_id;

  -- Insert each order item and deduct stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_variant_id := (v_item->>'variant_id')::UUID;
    v_qty := (v_item->>'quantity')::INT;

    INSERT INTO order_items (order_id, product_id, variant_id, product_name, quantity, unit_price, discount_pct, line_total)
    VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      v_variant_id,
      COALESCE(v_item->>'product_name', ''),
      v_qty,
      (v_item->>'unit_price')::NUMERIC,
      COALESCE((v_item->>'discount_pct')::NUMERIC, 0),
      (v_item->>'line_total')::NUMERIC
    );

    -- Deduct from inventory
    UPDATE inventory
    SET stock_on_hand = stock_on_hand - v_qty, updated_at = NOW()
    WHERE variant_id = v_variant_id
      AND site_id = (p_order->>'site_id')::UUID;

    -- Record movement
    INSERT INTO inventory_movements (product_id, variant_id, from_site_id, movement_type, quantity, reference_id, created_by, notes)
    VALUES (
      (v_item->>'product_id')::UUID,
      v_variant_id,
      (p_order->>'site_id')::UUID,
      'sell',
      -v_qty,
      v_order_id::TEXT,
      (p_order->>'cashier_id')::UUID,
      'Auto-deducted by sale'
    );
  END LOOP;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process a return: create return record, restock if applicable
CREATE OR REPLACE FUNCTION process_return(
  p_return JSONB,
  p_items JSONB
)
RETURNS UUID AS $$
DECLARE
  v_return_id UUID;
  v_item JSONB;
  v_variant_id UUID;
  v_qty INT;
  v_restock BOOLEAN;
BEGIN
  INSERT INTO returns (
    order_id, processed_by, customer_id,
    type, reason, refund_method, refund_amount, status, notes
  )
  SELECT
    (p_return->>'order_id')::UUID,
    (p_return->>'processed_by')::UUID,
    NULLIF(p_return->>'customer_id', '')::UUID,
    COALESCE(p_return->>'type', 'full'),
    p_return->>'reason',
    COALESCE(p_return->>'refund_method', 'original'),
    (p_return->>'refund_amount')::NUMERIC,
    COALESCE(p_return->>'status', 'pending'),
    p_return->>'notes'
  RETURNING id INTO v_return_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_variant_id := (v_item->>'variant_id')::UUID;
    v_qty := (v_item->>'quantity')::INT;
    v_restock := COALESCE((v_item->>'restock')::BOOLEAN, TRUE);

    INSERT INTO return_items (return_id, order_item_id, product_id, variant_id, quantity, refund_amount, restock)
    VALUES (
      v_return_id,
      (v_item->>'order_item_id')::UUID,
      (v_item->>'product_id')::UUID,
      v_variant_id,
      v_qty,
      (v_item->>'refund_amount')::NUMERIC,
      v_restock
    );

    IF v_restock THEN
      UPDATE inventory
      SET stock_on_hand = stock_on_hand + v_qty, updated_at = NOW()
      WHERE variant_id = v_variant_id
        AND site_id = (p_return->>'site_id')::UUID;

      INSERT INTO inventory_movements (product_id, variant_id, to_site_id, movement_type, quantity, reference_id, created_by, notes)
      VALUES (
        (v_item->>'product_id')::UUID,
        v_variant_id,
        (p_return->>'site_id')::UUID,
        'return',
        v_qty,
        v_return_id::TEXT,
        (p_return->>'processed_by')::UUID,
        'Auto-restocked by return'
      );
    END IF;
  END LOOP;

  RETURN v_return_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate Z-Report summary for a given site and date
CREATE OR REPLACE FUNCTION calculate_z_report(
  p_site_id UUID,
  p_date DATE
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'date', p_date,
    'site_id', p_site_id,
    'total_orders', COUNT(*),
    'gross_sales', COALESCE(SUM(total), 0),
    'total_discounts', COALESCE(SUM(discount_amount), 0),
    'total_tax', COALESCE(SUM(tax_amount), 0),
    'net_sales', COALESCE(SUM(total) - SUM(discount_amount), 0),
    'avg_order_value', CASE WHEN COUNT(*) > 0 THEN ROUND(AVG(total), 2) ELSE 0 END,
    'payment_breakdown', (
      SELECT jsonb_object_agg(pm, pm_total)
      FROM (
        SELECT payment_method AS pm, SUM(total) AS pm_total
        FROM orders
        WHERE site_id = p_site_id
          AND created_at::DATE = p_date
          AND status NOT IN ('cancelled', 'voided')
        GROUP BY payment_method
      ) sub
    ),
    'returns_count', (
      SELECT COUNT(*) FROM returns r
      JOIN orders o ON o.id = r.order_id
      WHERE o.site_id = p_site_id AND r.created_at::DATE = p_date
    ),
    'returns_total', (
      SELECT COALESCE(SUM(r.refund_amount), 0) FROM returns r
      JOIN orders o ON o.id = r.order_id
      WHERE o.site_id = p_site_id AND r.created_at::DATE = p_date AND r.status = 'approved'
    ),
    'cash_sessions', (
      SELECT jsonb_agg(jsonb_build_object(
        'id', cs.id,
        'opened_at', cs.opened_at,
        'closed_at', cs.closed_at,
        'opening_float', cs.opening_float,
        'closing_cash', cs.closing_cash,
        'expected_cash', cs.expected_cash,
        'variance', cs.variance
      ))
      FROM cash_sessions cs
      WHERE cs.site_id = p_site_id AND cs.opened_at::DATE = p_date
    )
  )
  INTO v_result
  FROM orders
  WHERE site_id = p_site_id
    AND created_at::DATE = p_date
    AND status NOT IN ('cancelled', 'voided');

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
