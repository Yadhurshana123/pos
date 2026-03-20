export function GuestFooter() {
  return (
    <div style={{ background: '#0f172a', color: '#94a3b8', padding: '40px 5% 24px', marginTop: 'auto' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#dc2626,#7f1d1d)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>S</div>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#fff' }}>SCSTix EPOS</div>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 340, marginBottom: 20 }}>Your merchandise destination — browse products, accessories, equipment and collectibles.</div>
        <div style={{ borderTop: '1px solid #1e293b', paddingTop: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: 12 }}>
          <span>© 2025 SCSTix EPOS. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 20 }}>{['Privacy Policy', 'Terms of Service', 'Returns'].map(l => <span key={l} style={{ cursor: 'pointer' }}>{l}</span>)}</div>
        </div>
      </div>
    </div>
  )
}
