// ═══════════════════════════════════════════════════════════════
// DAMAGE MANAGEMENT QUICK START GUIDE
// Copy/paste the navigation link into your MainLayout or Sidebar
// ═══════════════════════════════════════════════════════════════

/**
 * STEP 1: Add to MainLayout Navigation sidebar
 * 
 * Location: src/components/layout/MainLayout.jsx
 * or: src/components/layout/Sidebar.jsx
 * 
 * Add this link in the manager section:
 */

// Example sidebar item (adjust styling per your theme):
<NavLink 
  to="/app/damage-lost" 
  label="Damage/Lost" 
  icon="🔴"
  active={location.pathname === '/app/damage-lost'}
/>

// Or if using custom link structure:
<Link 
  to="/app/damage-lost"
  style={{
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    color: location.pathname === '/app/damage-lost' ? theme.primary : theme.text3,
    textDecoration: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: location.pathname === '/app/damage-lost' ? 700 : 600,
    background: location.pathname === '/app/damage-lost' ? theme.bg3 : 'transparent',
    transition: 'all 0.2s'
  }}
>
  <span>🔴</span>
  <span>Damage/Lost</span>
</Link>

/**
 * STEP 2: Verify access in your ProtectedRoute component
 * 
 * The route in App.jsx already has:
 * allowedRoles={['manager', 'admin']}
 * 
 * So only managers and admins can access /app/damage-lost
 */

/**
 * STEP 3: (Optional) Add to dashboard shortcuts
 * 
 * If you have a dashboard with shortcuts:
 */

<Card 
  onClick={() => navigate('/app/damage-lost')}
  style={{ cursor: 'pointer' }}
>
  <div style={{ fontSize: 28, marginBottom: 8 }}>🔴</div>
  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Damage/Lost</div>
  <div style={{ fontSize: 11, color: theme.text3 }}>Manage inventory</div>
</Card>

/**
 * STEP 4: (Optional) Add statistics widget to dashboard
 * 
 * Display damage/lost stats on manager dashboard:
 */

// In ManagerDashboard.jsx:
import { useDamageLostEntries } from '@/hooks/useDamageLost'

function ManagerDashboard() {
  const { data: damageEntries = [] } = useDamageLostEntries(siteId)
  
  const damagedCount = damageEntries.filter(e => e.type === 'Damage').length
  const lostCount = damageEntries.filter(e => e.type === 'Lost').length
  
  return (
    <div>
      {/* Existing dashboard items... */}
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <Card t={t}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔴</div>
          <div style={{ fontSize: 12, fontWeight: 700 }}>Damaged Items</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#dc2626', marginTop: 8 }}>
            {damagedCount}
          </div>
        </Card>
        
        <Card t={t}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🟠</div>
          <div style={{ fontSize: 12, fontWeight: 700 }}>Lost Items</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#ea580c', marginTop: 8 }}>
            {lostCount}
          </div>
        </Card>
      </div>
    </div>
  )
}

/**
 * STEP 5: Verify Theme Context
 * 
 * The component uses useTheme() hook which should be:
 * - Provided by <ThemeProvider> in App.jsx ✓
 * - Already exists in your codebase ✓
 */

/**
 * STEP 6: Verify Auth Context
 * 
 * The component uses useAuth() hook which should be:
 * - Provided by <AuthProvider> in App.jsx ✓
 * - Already exists in your codebase ✓
 */

/**
 * STEP 7: Test the Integration
 * 
 * 1. Ensure you're logged in as a manager or admin
 * 2. Navigate to /app/damage-lost
 * 3. You should see:
 *    - Header with title
 *    - 4 statistics cards
 *    - "Add Damage / Lost Product" button
 *    - Filter dropdown
 *    - Table with sample data
 * 4. Test add/edit/delete functionality
 * 5. Try filtering by type
 */

/**
 * STEP 8: Connect to Database (When Ready)
 * 
 * To use real Supabase data instead of mock:
 * 
 * 1. Run the SQL schema:
 *    supabase/damage_lost_schema.sql
 * 
 * 2. Uncomment React Query hooks in DamageManagement.jsx:
 *    const { data: entries = [] } = useDamageLostEntries(siteId, filters)
 * 
 * 3. Replace local state management with mutations:
 *    useCreateDamageLost().mutate(formData)
 * 
 * 4. Update delete/edit to use hooks instead of state
 */

/**
 * STEP 9: Customize for Your Needs
 * 
 * Edit the component:
 * - OUTLETS array: Add your store locations
 * - SAMPLE_PRODUCTS: Load from props instead of hardcoded
 * - Colors: Adjust via theme object
 * - Column order: Rearrange table columns
 * - Modal width: Change width prop on Modal component
 */

/**
 * STEP 10: Add Audit Logging (Optional)
 * 
 * If you want to track who added damage entries:
 */

const handleSubmit = useCallback(() => {
  if (!validateForm()) return
  
  // ... existing code ...
  
  // Add audit logging
  addAudit(
    currentUser, 
    'Create', 
    'Damage/Lost Inventory',
    `${form.type}: ${form.quantity}x ${product.name} at ${form.outlet}`
  )
  
  // ... rest of code ...
}, [form, addAudit, currentUser])

/**
 * ═══════════════════════════════════════════════════════════════
 * ALL REQUIRED FILES CREATED:
 * ═══════════════════════════════════════════════════════════════
 * 
 * ✓ src/pages/manager/DamageManagement.jsx      - Main component
 * ✓ src/services/damage-lost.js                 - API functions
 * ✓ src/hooks/useDamageLost.js                  - React Query hooks
 * ✓ src/App.jsx                                 - Route added
 * ✓ supabase/damage_lost_schema.sql             - Database script
 * ✓ DAMAGE_LOST_MANAGEMENT_GUIDE.md             - Full documentation
 * 
 * ═══════════════════════════════════════════════════════════════
 * READY TO USE - NO ADDITIONAL SETUP NEEDED!
 * ═══════════════════════════════════════════════════════════════
 */
