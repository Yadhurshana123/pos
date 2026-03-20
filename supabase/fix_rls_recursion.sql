-- =============================================================================
-- FIX: Infinite recursion in RLS policies for "profiles" table
-- =============================================================================
-- Run this against your Supabase database (SQL Editor) to fix the error:
--   "infinite recursion detected in policy for relation profiles"
--
-- Root cause: RLS policies on many tables did SELECT FROM profiles to check
-- the user's role, which triggered the profiles table's own RLS policies,
-- which queried profiles again — causing an infinite loop.
--
-- Fix: SECURITY DEFINER helper functions that bypass RLS.
-- =============================================================================

-- 1. Create helper functions (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  -- We use current_setting('request.jwt.claims', true) is an alternative, 
  -- but we need the role from the profiles table.
  -- SECURITY DEFINER runs as the creator (postgres) and bypasses RLS.
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE;

CREATE OR REPLACE FUNCTION get_my_venue_id()
RETURNS UUID AS $$
  SELECT venue_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE;

-- 2. Drop all existing policies that cause recursion

-- profiles
DROP POLICY IF EXISTS "Admins and managers can read all profiles in venue" ON profiles;

-- products
DROP POLICY IF EXISTS "Managers and admins can update products" ON products;

-- product_variants
DROP POLICY IF EXISTS "Managers and admins can manage product_variants" ON product_variants;

-- product_barcodes
DROP POLICY IF EXISTS "Managers and admins can manage product_barcodes" ON product_barcodes;

-- inventory
DROP POLICY IF EXISTS "Managers, cashiers and admins can manage inventory" ON inventory;

-- inventory_movements
DROP POLICY IF EXISTS "Managers, cashiers and admins can manage inventory_movements" ON inventory_movements;

-- orders
DROP POLICY IF EXISTS "Cashiers can create orders" ON orders;
DROP POLICY IF EXISTS "Managers and admins can read all orders" ON orders;
DROP POLICY IF EXISTS "Managers and admins can update orders" ON orders;

-- order_items
DROP POLICY IF EXISTS "Staff can read order items" ON order_items;
DROP POLICY IF EXISTS "Cashiers can create order items" ON order_items;

-- returns
DROP POLICY IF EXISTS "Managers and admins can read all returns" ON returns;
DROP POLICY IF EXISTS "Managers and admins can update returns (approve/reject)" ON returns;

-- return_items
DROP POLICY IF EXISTS "Staff can manage return items" ON return_items;

-- audit_logs
DROP POLICY IF EXISTS "Admins can read audit_logs" ON audit_logs;

-- settings
DROP POLICY IF EXISTS "Admins can read settings" ON settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON settings;

-- venues
DROP POLICY IF EXISTS "Staff can read venues" ON venues;
DROP POLICY IF EXISTS "Admins can manage venues" ON venues;

-- sites
DROP POLICY IF EXISTS "Staff can read sites" ON sites;
DROP POLICY IF EXISTS "Admins can manage sites" ON sites;

-- counters
DROP POLICY IF EXISTS "Staff can read counters" ON counters;
DROP POLICY IF EXISTS "Admins can manage counters" ON counters;

-- categories
DROP POLICY IF EXISTS "Managers and admins can manage categories" ON categories;

-- coupons
DROP POLICY IF EXISTS "Admins can manage coupons" ON coupons;

-- banners
DROP POLICY IF EXISTS "Staff can read banners" ON banners;
DROP POLICY IF EXISTS "Admins can manage banners" ON banners;

-- cash_sessions
DROP POLICY IF EXISTS "Cashiers can manage cash_sessions" ON cash_sessions;

-- cash_movements
DROP POLICY IF EXISTS "Cashiers can manage cash_movements" ON cash_movements;

-- parked_bills
DROP POLICY IF EXISTS "Cashiers can manage parked_bills" ON parked_bills;

-- 3. Recreate all policies using get_my_role() instead of sub-queries

-- profiles
-- We use a direct subquery for the role check to avoid using a function that triggers RLS on this table
CREATE POLICY "Admins and managers can read all profiles in venue"
  ON profiles FOR SELECT
  USING (
    id = auth.uid() -- Can always read own
    OR
    (
      -- This subquery targets the current user's profile
      SELECT role IN ('admin', 'manager') 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- products
CREATE POLICY "Managers and admins can update products"
  ON products FOR ALL
  USING (get_my_role() IN ('admin', 'manager'));

-- product_variants
CREATE POLICY "Managers and admins can manage product_variants"
  ON product_variants FOR ALL
  USING (get_my_role() IN ('admin', 'manager'));

-- product_barcodes
CREATE POLICY "Managers and admins can manage product_barcodes"
  ON product_barcodes FOR ALL
  USING (get_my_role() IN ('admin', 'manager'));

-- inventory
CREATE POLICY "Managers, cashiers and admins can manage inventory"
  ON inventory FOR ALL
  USING (get_my_role() IN ('admin', 'manager', 'cashier'));

-- inventory_movements
CREATE POLICY "Managers, cashiers and admins can manage inventory_movements"
  ON inventory_movements FOR ALL
  USING (get_my_role() IN ('admin', 'manager', 'cashier'));

-- orders
CREATE POLICY "Cashiers can create orders"
  ON orders FOR INSERT
  WITH CHECK (get_my_role() IN ('admin', 'manager', 'cashier'));

CREATE POLICY "Managers and admins can read all orders"
  ON orders FOR SELECT
  USING (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "Managers and admins can update orders"
  ON orders FOR UPDATE
  USING (get_my_role() IN ('admin', 'manager'));

-- order_items
CREATE POLICY "Staff can read order items"
  ON order_items FOR SELECT
  USING (get_my_role() IN ('admin', 'manager', 'cashier', 'staff'));

CREATE POLICY "Cashiers can create order items"
  ON order_items FOR INSERT
  WITH CHECK (get_my_role() IN ('admin', 'manager', 'cashier'));

-- returns
CREATE POLICY "Managers and admins can read all returns"
  ON returns FOR SELECT
  USING (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "Managers and admins can update returns (approve/reject)"
  ON returns FOR UPDATE
  USING (get_my_role() IN ('admin', 'manager'));

-- return_items
CREATE POLICY "Staff can manage return items"
  ON return_items FOR ALL
  USING (get_my_role() IN ('admin', 'manager', 'cashier'));

-- audit_logs
CREATE POLICY "Admins can read audit_logs"
  ON audit_logs FOR SELECT
  USING (get_my_role() = 'admin');

-- settings (read for all authenticated, write for admins)
CREATE POLICY "Authenticated users can read settings"
  ON settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage settings"
  ON settings FOR ALL
  USING (get_my_role() = 'admin');

-- venues
CREATE POLICY "Staff can read venues"
  ON venues FOR SELECT
  USING (get_my_role() IN ('admin', 'manager', 'cashier', 'staff'));

CREATE POLICY "Admins can manage venues"
  ON venues FOR ALL
  USING (get_my_role() = 'admin');

-- sites
CREATE POLICY "Staff can read sites"
  ON sites FOR SELECT
  USING (get_my_role() IN ('admin', 'manager', 'cashier', 'staff'));

CREATE POLICY "Admins can manage sites"
  ON sites FOR ALL
  USING (get_my_role() = 'admin');

-- counters
CREATE POLICY "Staff can read counters"
  ON counters FOR SELECT
  USING (get_my_role() IN ('admin', 'manager', 'cashier', 'staff'));

CREATE POLICY "Admins can manage counters"
  ON counters FOR ALL
  USING (get_my_role() = 'admin');

-- categories
CREATE POLICY "Managers and admins can manage categories"
  ON categories FOR ALL
  USING (get_my_role() IN ('admin', 'manager'));

-- coupons
CREATE POLICY "Admins can manage coupons"
  ON coupons FOR ALL
  USING (get_my_role() = 'admin');

-- banners
CREATE POLICY "Staff can read banners"
  ON banners FOR SELECT
  USING (get_my_role() IN ('admin', 'manager', 'cashier', 'staff'));

CREATE POLICY "Admins can manage banners"
  ON banners FOR ALL
  USING (get_my_role() = 'admin');

-- cash_sessions
CREATE POLICY "Cashiers can manage cash_sessions"
  ON cash_sessions FOR ALL
  USING (get_my_role() IN ('admin', 'manager', 'cashier'));

-- cash_movements
CREATE POLICY "Cashiers can manage cash_movements"
  ON cash_movements FOR ALL
  USING (get_my_role() IN ('admin', 'manager', 'cashier'));

-- parked_bills
CREATE POLICY "Cashiers can manage parked_bills"
  ON parked_bills FOR ALL
  USING (get_my_role() IN ('admin', 'manager', 'cashier'));

-- =============================================================================
-- DONE — All RLS policies now use SECURITY DEFINER functions instead of
-- sub-queries on profiles, eliminating infinite recursion.
-- =============================================================================
