-- 3. Create sub_categories table
CREATE TABLE IF NOT EXISTS sub_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  attribute_config JSONB DEFAULT '[]',
  custom_attributes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Update products table to reference sub_categories
ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES sub_categories(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS dynamic_attributes JSONB DEFAULT '{}';

-- 5. Add lengths column to categories (as requested earlier)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS lengths TEXT[];
ALTER TABLE categories ADD COLUMN IF NOT EXISTS attribute_config JSONB DEFAULT '[]';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS custom_attributes JSONB DEFAULT '{}';

-- 6. Enable RLS for sub_categories
ALTER TABLE sub_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read sub_categories"
  ON sub_categories FOR SELECT
  USING (true);

CREATE POLICY "Managers and admins can manage sub_categories"
  ON sub_categories FOR ALL
  USING (get_my_role() IN ('admin', 'manager'));

-- 8. Create attributes table
CREATE TABLE IF NOT EXISTS attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Create subcategory_attributes mapping table
-- We use ON DELETE CASCADE to avoid "cascade errors" when deleting parents
CREATE TABLE IF NOT EXISTS subcategory_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_id UUID NOT NULL REFERENCES sub_categories(id) ON DELETE CASCADE,
  attribute_id UUID NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
  UNIQUE(subcategory_id, attribute_id)
);

-- 10. Seed Default Attributes
INSERT INTO attributes (name) 
VALUES ('Size'), ('Color'), ('Material'), ('Length')
ON CONFLICT (name) DO NOTHING;

-- 11. Enable RLS
ALTER TABLE attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategory_attributes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read attributes" ON attributes FOR SELECT USING (true);
CREATE POLICY "Admins can manage attributes" ON attributes FOR ALL USING (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "Everyone can read subcategory_attributes" ON subcategory_attributes FOR SELECT USING (true);
CREATE POLICY "Admins can manage subcategory_attributes" ON subcategory_attributes FOR ALL USING (get_my_role() IN ('admin', 'manager'));

-- 12. Force Schema Cache Reload
NOTIFY pgrst, 'reload schema';
