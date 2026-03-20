import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { useVenueStore } from '@/stores/venueStore'
import { venuesService } from '@/services'
import { Btn } from '@/components/ui'

const DEFAULT_VENUE_ID = 'a0000000-0000-0000-0000-000000000001'
const DEFAULT_SITE_ID = 'b0000000-0000-0000-0000-000000000001'

export function VenueSiteConfirmation() {
  const { t } = useTheme()
  const { currentUser } = useAuth()
  const { setVenue, setSite } = useVenueStore()
  const navigate = useNavigate()
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVenueId, setSelectedVenueId] = useState('')
  const [selectedSiteId, setSelectedSiteId] = useState('')

  // Detect venue/site from user profile
  const detectedVenueId = currentUser?.venue_id || currentUser?.venueId || DEFAULT_VENUE_ID
  const detectedSiteId = currentUser?.site_id || currentUser?.siteId || DEFAULT_SITE_ID

  useEffect(() => {
    venuesService.fetchVenuesWithSites().then((data) => {
      const list = data || []
      setVenues(list)
      const v = list.find(x => x.id === detectedVenueId)
      const sites = v?.sites || []
      const venueId = v ? detectedVenueId : (list[0]?.id || '')
      const siteId = sites.some(s => s.id === detectedSiteId) ? detectedSiteId : (sites[0]?.id || list[0]?.sites?.[0]?.id || '')
      setSelectedVenueId(venueId)
      setSelectedSiteId(siteId)
      setLoading(false)
    })
  }, [detectedVenueId, detectedSiteId])

  const selectedVenue = venues.find(v => v.id === selectedVenueId)
  const sites = selectedVenue?.sites || []

  useEffect(() => {
    if (!selectedVenueId || !venues.length) return
    const v = venues.find(x => x.id === selectedVenueId)
    const siteList = v?.sites || []
    const currentInList = siteList.some(s => s.id === selectedSiteId)
    if (!currentInList && siteList[0]) {
      setSelectedSiteId(siteList[0].id)
    }
  }, [selectedVenueId, venues])

  const handleConfirm = () => {
    const venueId = selectedVenueId || detectedVenueId
    const siteId = selectedSiteId || (sites[0]?.id || detectedSiteId)
    setVenue(venueId)
    setSite(siteId)
    navigate('/app')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.bg }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '4px solid ' + t.border, borderTopColor: t.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>Detecting location...</div>
        </div>
      </div>
    )
  }

  const detectedVenue = venues.find(v => v.id === detectedVenueId)
  const detectedSite = detectedVenue?.sites?.find(s => s.id === detectedSiteId)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: t.bg }}>
      <div style={{ flex: 1, background: `linear-gradient(160deg,${t.accent} 0%,#7f1d1d 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, position: 'relative', overflow: 'hidden' }} className="hide-mobile">
        <div style={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
        <div style={{ position: 'relative', textAlign: 'center', color: '#fff', maxWidth: 360 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📍</div>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5, marginBottom: 10 }}>Venue & Site</div>
          <div style={{ fontSize: 15, opacity: 0.9, lineHeight: 1.6 }}>Confirm where you are working today</div>
        </div>
      </div>
      <div style={{ width: '100%', maxWidth: 460, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(16px,4vw,40px)', background: t.bg2 }}>
        <div style={{ width: '100%' }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: t.text, marginBottom: 6 }}>Confirm your location</div>
          <div style={{ fontSize: 14, color: t.text3, marginBottom: 24 }}>
            We detected your venue and site from your profile. Please confirm or change below.
          </div>

          {detectedVenue && detectedSite && (
            <div style={{ background: t.greenBg, border: `1px solid ${t.greenBorder}`, borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: t.green, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Detected</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>
                {detectedVenue.name} → {detectedSite.name}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: t.text3, marginBottom: 6 }}>Venue</label>
              <select
                value={selectedVenueId}
                onChange={e => { setSelectedVenueId(e.target.value); setSelectedSiteId('') }}
                style={{
                  width: '100%', background: t.input, border: `1px solid ${t.border}`, borderRadius: 9,
                  padding: '10px 14px', color: t.text, fontSize: 14, outline: 'none', cursor: 'pointer',
                }}
              >
                {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: t.text3, marginBottom: 6 }}>Site</label>
              <select
                value={selectedSiteId}
                onChange={e => setSelectedSiteId(e.target.value)}
                style={{
                  width: '100%', background: t.input, border: `1px solid ${t.border}`, borderRadius: 9,
                  padding: '10px 14px', color: t.text, fontSize: 14, outline: 'none', cursor: 'pointer',
                }}
              >
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <Btn t={t} variant="primary" fullWidth onClick={handleConfirm} style={{ marginTop: 8 }}>
              ✓ Confirm & Continue
            </Btn>
          </div>
        </div>
      </div>
    </div>
  )
}
