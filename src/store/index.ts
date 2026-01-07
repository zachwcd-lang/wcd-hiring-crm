import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Position, Source } from '@/types'

interface AppState {
  // Sidebar
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void

  // Filters
  searchQuery: string
  setSearchQuery: (query: string) => void
  positionFilter: Position | 'all'
  setPositionFilter: (position: Position | 'all') => void
  sourceFilter: Source | 'all'
  setSourceFilter: (source: Source | 'all') => void

  // Candidate Panel
  selectedCandidateId: string | null
  setSelectedCandidateId: (id: string | null) => void

  // Add Modal
  isAddModalOpen: boolean
  setIsAddModalOpen: (open: boolean) => void

  // Shortcuts Help
  showShortcutsHelp: boolean
  setShowShortcutsHelp: (show: boolean) => void

  // Table selection
  selectedIds: Set<string>
  toggleSelection: (id: string) => void
  selectAll: (ids: string[]) => void
  clearSelection: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Sidebar
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Filters
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      positionFilter: 'all',
      setPositionFilter: (position) => set({ positionFilter: position }),
      sourceFilter: 'all',
      setSourceFilter: (source) => set({ sourceFilter: source }),

      // Candidate Panel
      selectedCandidateId: null,
      setSelectedCandidateId: (id) => set({ selectedCandidateId: id }),

      // Add Modal
      isAddModalOpen: false,
      setIsAddModalOpen: (open) => set({ isAddModalOpen: open }),

      // Shortcuts Help
      showShortcutsHelp: false,
      setShowShortcutsHelp: (show) => set({ showShortcutsHelp: show }),

      // Table selection
      selectedIds: new Set(),
      toggleSelection: (id) => set((state) => {
        const newSet = new Set(state.selectedIds)
        if (newSet.has(id)) {
          newSet.delete(id)
        } else {
          newSet.add(id)
        }
        return { selectedIds: newSet }
      }),
      selectAll: (ids) => set({ selectedIds: new Set(ids) }),
      clearSelection: () => set({ selectedIds: new Set() }),
    }),
    {
      name: 'wcd-crm-storage',
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
)
