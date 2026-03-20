const OPTIMO_ENABLED = import.meta.env.VITE_OPTIMO_ENABLED === 'true'

/**
 * Check if Optimo integration is enabled via VITE_OPTIMO_ENABLED env var.
 * @returns {boolean}
 */
export function isOptimoEnabled() {
  return OPTIMO_ENABLED
}

/**
 * Sync users from Optimo into SCSTix profiles.
 * When implemented: fetch users from Optimo API, upsert into profiles table
 * matching on optimo_user_id, map Optimo roles to SCSTix roles.
 * @returns {Promise<{ synced: number, errors: string[] }>}
 */
export async function syncUsers() {
  if (!OPTIMO_ENABLED) return { synced: 0, errors: [] }
  throw new Error('Optimo user sync not yet implemented')
}

/**
 * Sync venues from Optimo into SCSTix venues table.
 * When implemented: fetch venues from Optimo API, upsert into venues table
 * matching on optimo_venue_id.
 * @returns {Promise<{ synced: number, errors: string[] }>}
 */
export async function syncVenues() {
  if (!OPTIMO_ENABLED) return { synced: 0, errors: [] }
  throw new Error('Optimo venue sync not yet implemented')
}

/**
 * Sync sites from Optimo into SCSTix sites table.
 * When implemented: fetch sites from Optimo API, upsert into sites table
 * matching on optimo_site_id.
 * @returns {Promise<{ synced: number, errors: string[] }>}
 */
export async function syncSites() {
  if (!OPTIMO_ENABLED) return { synced: 0, errors: [] }
  throw new Error('Optimo site sync not yet implemented')
}

/**
 * Authenticate with Optimo using a JWT token.
 * When implemented: validate the Optimo JWT, extract user info, find or create
 * matching Supabase user, return session.
 * @param {string} token - Optimo JWT token
 * @returns {Promise<object>} Session object when implemented
 */
export async function authenticateWithOptimo(token) {
  if (!OPTIMO_ENABLED) {
    return { synced: 0, errors: [] }
  }
  throw new Error('Optimo authentication not yet implemented')
}
