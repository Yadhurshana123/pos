import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export function OfflineBanner() {
  const online = useOnlineStatus()

  if (online) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000,
      background: '#ef4444', color: '#fff', textAlign: 'center',
      padding: '8px 16px', fontSize: 13, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    }}>
      <span>⚠️</span>
      <span>You are offline. Some features may be unavailable. Changes will sync when reconnected.</span>
    </div>
  )
}
