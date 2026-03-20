-- ═══════════════════════════════════════════════════════════════
-- DAMAGE / LOST INVENTORY TABLE SCHEMA
-- For E-POS Supabase Database
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS damage_lost_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  type VARCHAR(20) NOT NULL CHECK (type IN ('Damage', 'Lost')),
  reason TEXT NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status VARCHAR(20) DEFAULT 'recorded' CHECK (status IN ('recorded', 'reviewed', 'resolved')),
  
  -- Index for better query performance
  UNIQUE(id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_damage_lost_site_id ON damage_lost_inventory(site_id);
CREATE INDEX IF NOT EXISTS idx_damage_lost_product_id ON damage_lost_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_damage_lost_type ON damage_lost_inventory(type);
CREATE INDEX IF NOT EXISTS idx_damage_lost_created_at ON damage_lost_inventory(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_damage_lost_status ON damage_lost_inventory(status);

-- Enable RLS
ALTER TABLE damage_lost_inventory ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Allow managers and admins to view damage/lost entries for their site
CREATE POLICY "damage_lost_select_policy" ON damage_lost_inventory
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE (
        raw_user_meta_data->>'role' = 'manager' 
        OR raw_user_meta_data->>'role' = 'admin'
      )
    )
  );

-- Allow managers and admins to insert damage/lost entries
CREATE POLICY "damage_lost_insert_policy" ON damage_lost_inventory
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE (
        raw_user_meta_data->>'role' = 'manager' 
        OR raw_user_meta_data->>'role' = 'admin'
      )
    )
  );

-- Allow managers and admins to update damage/lost entries
CREATE POLICY "damage_lost_update_policy" ON damage_lost_inventory
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE (
        raw_user_meta_data->>'role' = 'manager' 
        OR raw_user_meta_data->>'role' = 'admin'
      )
    )
  );

-- Allow admins to delete damage/lost entries
CREATE POLICY "damage_lost_delete_policy" ON damage_lost_inventory
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );
