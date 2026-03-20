import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/context/ThemeContext'
import { Btn, Card } from '@/components/ui'

export function OnlineStoreDemo() {
  const { t } = useTheme()
  const navigate = useNavigate()

  const features = [
    { title: 'Real-time Inventory', desc: 'Syncs instantly with your physical store POS inventory.', icon: '📦' },
    { title: 'Secure Checkout', desc: 'Pre-integrated with Card and Cash on Delivery (COD) options.', icon: '🔒' },
    { title: 'Customer Accounts', desc: 'Unified loyalty points system across online and offline sales.', icon: '👤' },
    { title: 'Responsive Design', desc: 'Fully optimized for mobile, tablet, and desktop shoppers.', icon: '📱' }
  ]

  const apiSample = `// Example API Integration
fetch('https://api.scstix-epos.com/v1/products', {
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
})
.then(res => res.json())
.then(products => {
  // Render products in your existing portal
  renderStoreFront(products);
});`

  return (
    <div style={{ minHeight: 'calc(100vh - 68px)', background: t.bg, color: t.text }}>
      {/* Hero Section */}
      <div style={{ background: `linear-gradient(135deg, ${t.bg2} 0%, ${t.bg3} 100%)`, padding: '80px 5%', textAlign: 'center', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 20, background: t.accent + '20', color: t.accent, fontSize: 13, fontWeight: 800, marginBottom: 20 }}>
            FOR DEVELOPERS & MERCHANTS
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 900, letterSpacing: -1.5, marginBottom: 24, lineHeight: 1.1 }}>
            Power Your <span style={{ color: t.accent }}>Online Store</span> with SCSTix API
          </h1>
          <p style={{ fontSize: 18, color: t.text3, lineHeight: 1.6, marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}>
            Transform your physical inventory into a digital storefront. Our robust API allows you to seamlessly integrate e-commerce into any website or portal.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Btn t={t} size="lg" onClick={() => navigate('/shop')}>
              View Shop Sample
            </Btn>
            <Btn t={t} variant="outline" size="lg" onClick={() => navigate('/login')}>
              Get API Key →
            </Btn>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 5%' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 16 }}>Built-in E-commerce Power</h2>
          <p style={{ color: t.text3 }}>Everything you need to sell online, synced with your POS.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 30 }}>
          {features.map((f, i) => (
            <Card key={i} t={t} style={{ padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 40 }}>{f.icon}</div>
              <h3 style={{ fontSize: 20, fontWeight: 800 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: t.text3, lineHeight: 1.6 }}>{f.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* API Preview */}
      <div style={{ background: t.bg2, padding: '80px 5%', borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', gap: 60, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 400px' }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 24, letterSpacing: -1 }}>Simple API Integration</h2>
            <p style={{ fontSize: 16, color: t.text3, lineHeight: 1.7, marginBottom: 30 }}>
              Our RESTful API provides endpoints for products, categories, orders, and customer management. 
              Documentation is available for React, Vue, and vanilla JS implementations.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['✓ Automatic SKU tracking', '✓ Multiple currency support', '✓ Webhook notifications for new orders'].map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600 }}>
                  <span style={{ color: t.accent }}>●</span> {item}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ flex: '1 1 400px', background: '#0f172a', borderRadius: 16, padding: 30, boxShadow: '0 20px 50px rgba(0,0,0,.3)', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }} />
            </div>
            <pre style={{ margin: 0, color: '#94a3b8', fontSize: 14, fontFamily: 'monospace', overflowX: 'auto', lineHeight: 1.5 }}>
              <code>{apiSample}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{ padding: '100px 5%', textAlign: 'center' }}>
        <h2 style={{ fontSize: 40, fontWeight: 900, marginBottom: 24 }}>Ready to sell online?</h2>
        <p style={{ fontSize: 18, color: t.text3, marginBottom: 40 }}>Start your 14-day free trial or contact our support.</p>
        <Btn t={t} size="lg" onClick={() => navigate('/register')} style={{ padding: '16px 48px' }}>
          Join Now
        </Btn>
      </div>
    </div>
  )
}
