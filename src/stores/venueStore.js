import { create } from 'zustand'

export const useVenueStore = create((set) => ({
  selectedVenueId: null,
  selectedSiteId: null,
  setVenue: (venueId) => set({ selectedVenueId: venueId, selectedSiteId: null }),
  setSite: (siteId) => set({ selectedSiteId: siteId }),
  clear: () => set({ selectedVenueId: null, selectedSiteId: null }),
}))
