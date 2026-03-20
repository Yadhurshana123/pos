-- ═══════════════════════════════════════════════════════════
-- SCSTix EPOS — SEED DATA
-- Run this AFTER schema.sql has been deployed.
-- NOTE: Create auth users first via Supabase Dashboard →
--       Authentication → Users → "Add user" (email+password)
--       Then paste their UUIDs below.
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- 1. VENUE + SITE + COUNTERS
-- ─────────────────────────────────────────────────────────
INSERT INTO venues (id, name, address, phone)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Main Stadium',
  '123 Stadium Road, London, UK',
  '+44 20 1234 5678'
);

INSERT INTO sites (id, venue_id, name, type)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Main Merchandise Store', 'retail'),
  -- Extra outlet stores
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'North Stand Outlet', 'retail'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'South Stand Outlet', 'retail'),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'East Stand Outlet', 'retail'),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'West Stand Outlet', 'retail'),
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'VIP Lounge Outlet', 'retail');

INSERT INTO counters (id, site_id, name, status)
VALUES
  -- Main Merchandise Store
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Counter 1', 'active'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Counter 2', 'active'),
  -- North Stand Outlet
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'Counter 1', 'active'),
  -- South Stand Outlet
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 'Counter 1', 'active'),
  -- East Stand Outlet
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000004', 'Counter 1', 'active'),
  -- West Stand Outlet
  ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000005', 'Counter 1', 'active'),
  -- VIP Lounge Outlet
  ('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000006', 'Counter 1', 'active');

-- ─────────────────────────────────────────────────────────
-- 2. ASSIGN ROLES TO AUTH USERS
--    Run this AFTER creating users in Supabase Dashboard →
--    Authentication → Users. The trigger auto-creates profiles
--    with role='customer'. These UPDATEs fix the roles.
-- ─────────────────────────────────────────────────────────
UPDATE profiles SET
  role = 'admin',
  display_name = 'Admin User',
  venue_id = 'a0000000-0000-0000-0000-000000000001',
  site_id = 'b0000000-0000-0000-0000-000000000001'
WHERE email = 'admin@scstix.com';

UPDATE profiles SET
  role = 'manager',
  display_name = 'Manager User',
  venue_id = 'a0000000-0000-0000-0000-000000000001',
  site_id = 'b0000000-0000-0000-0000-000000000001'
WHERE email = 'manager@scstix.com';

UPDATE profiles SET
  role = 'cashier',
  display_name = 'Cashier User',
  venue_id = 'a0000000-0000-0000-0000-000000000001',
  site_id = 'b0000000-0000-0000-0000-000000000001'
WHERE email = 'cashier@scstix.com';

-- ─────────────────────────────────────────────────────────
-- 3. CATEGORIES
-- (Clean state - no default categories)
-- ─────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────
-- 4. PRODUCTS
-- (Clean state - no default products)
-- ─────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────
-- 5. COUPONS
-- ─────────────────────────────────────────────────────────
INSERT INTO coupons (code, description, type, value, min_order, max_uses, active, expires_at)
VALUES
  ('WELCOME10', '10% off your first order',  'percent', 10, 20.00, 500, true, NOW() + INTERVAL '90 days'),
  ('MATCHDAY5', '£5 off on match day',       'fixed',    5,  0.00, 100, true, NOW() + INTERVAL '30 days');

-- ─────────────────────────────────────────────────────────
-- 6. SETTINGS (value column is JSONB)
-- ─────────────────────────────────────────────────────────
INSERT INTO settings (venue_id, site_id, key, value)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'storeName',     '"SCSTix EPOS"'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'storeAddress',  '"123 Stadium Road, London"'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'storePhone',    '"+44 20 1234 5678"'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'storeEmail',    '"info@scstix.com"'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'vatRate',       '20'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'currency',      '"GBP"'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'loyaltyRate',   '1'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'loyaltyValue',  '0.01'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'receiptFooter', '"Thank you for shopping at SCSTix EPOS!"');
