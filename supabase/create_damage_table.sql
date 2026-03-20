-- =============================================================================
-- CREATE MISSING TABLE: damage_lost_inventory
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.damage_lost_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  type TEXT NOT NULL CHECK (type IN ('Damage', 'Lost')),
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.damage_lost_inventory ENABLE ROW LEVEL SECURITY;

-- Policies (Using get_my_role() helper from previous fix)
CREATE POLICY "Managers and admins can manage damage_lost"
  ON public.damage_lost_inventory FOR ALL
  USING (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "Cashiers can read damage_lost"
  ON public.damage_lost_inventory FOR SELECT
  USING (get_my_role() = 'cashier');

CREATE POLICY "Cashiers can insert damage_lost"
  ON public.damage_lost_inventory FOR INSERT
  WITH CHECK (get_my_role() = 'cashier');
