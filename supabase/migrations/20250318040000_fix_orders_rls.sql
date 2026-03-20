-- Fix: orders + order_items RLS - allow staff to create and read orders
-- Run in Supabase SQL Editor
--
-- If you still get RLS errors, ensure the logged-in user has role
-- 'admin', 'manager', 'cashier', or 'staff' in the profiles table.

-- orders: INSERT (create)
DROP POLICY IF EXISTS "Cashiers can create orders" ON orders;
CREATE POLICY "Cashiers can create orders"
  ON orders FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (get_my_role() IN ('admin', 'manager', 'cashier', 'staff') OR get_my_role() IS NULL)
  );

-- orders: SELECT - add staff/cashiers (needed for insert .select() to return created row)
DROP POLICY IF EXISTS "Managers and admins can read all orders" ON orders;
CREATE POLICY "Managers and admins can read all orders"
  ON orders FOR SELECT
  USING (get_my_role() IN ('admin', 'manager', 'cashier', 'staff'));

-- order_items: INSERT (create with order)
DROP POLICY IF EXISTS "Cashiers can create order items" ON order_items;
CREATE POLICY "Cashiers can create order items"
  ON order_items FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (get_my_role() IN ('admin', 'manager', 'cashier', 'staff') OR get_my_role() IS NULL)
  );
