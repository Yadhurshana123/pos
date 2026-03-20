# Supabase Database Update Report

## Update 1 — Products Table (Multi-Variant Support)

The Supabase database was modified to support the **Multi-Variant** feature.

### Changes
1. **Removed**: `size TEXT` and `color TEXT`
2. **Replaced With**: `sizes TEXT[]` and `colors TEXT[]`

### SQL (if applying to live DB)
```sql
ALTER TABLE products
  DROP COLUMN size,
  DROP COLUMN color,
  ADD COLUMN sizes TEXT[],
  ADD COLUMN colors TEXT[];
```

---

## Update 2 — Categories Table (Category Attributes)

The `categories` table was extended to support granular product attributes (Sizes, Colors, Materials) and hierarchical management.

### Changes
1. **Added**: `sizes TEXT[]`, `colors TEXT[]`, `materials TEXT[]` — arrays to store valid attributes for products in this category/subcategory.
2. **Updated**: `parent_id` FK now uses `ON DELETE CASCADE` (deleting a parent auto-removes subcategories).

### SQL (if applying to live DB)
```sql
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS sizes TEXT[],
  ADD COLUMN IF NOT EXISTS colors TEXT[],
  ADD COLUMN IF NOT EXISTS materials TEXT[];

-- Re-apply cascade delete on parent_id
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_parent_id_fkey;
ALTER TABLE categories
  ADD CONSTRAINT categories_parent_id_fkey
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE;
```

---

## Technical Details

- **Files Added**: `src/services/categories.js`, `src/pages/manager/CategoryManagement.jsx`
- **Modified**: `src/App.jsx`, `src/components/layout/Sidebar.jsx`, `supabase/schema.sql`
- **UI Improvements**: Hierarchical list view, attribute chip selectors, modal-based forms.
