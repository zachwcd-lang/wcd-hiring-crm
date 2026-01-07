import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { Layout } from '@/components/layout/Layout'
import { TalentInbox } from '@/components/talent/TalentInbox'
import { Pipeline } from '@/pages/Pipeline'
import { Candidates } from '@/pages/Candidates'
import { Positions } from '@/pages/Positions'
import { Calendar } from '@/pages/Calendar'
import { EmailTemplates } from '@/pages/EmailTemplates'
import { Settings } from '@/pages/Settings'
import { AddCandidateModal } from '@/components/candidates/AddCandidateModal'
import { CandidatePanel } from '@/components/candidates/CandidatePanel'
import { CommandPalette } from '@/components/common/CommandPalette'
import { ShortcutsHelp } from '@/components/common/ShortcutsHelp'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
    },
  },
})

// Wrapper component to use hooks that require router context
function AppContent() {
  useKeyboardShortcuts()

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<TalentInbox />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="candidates" element={<Candidates />} />
          <Route path="positions" element={<Positions />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="analytics" element={<div className="p-8"><h1 className="text-title">Analytics</h1><p className="text-[var(--text-muted)] mt-2">Coming soon...</p></div>} />
          <Route path="templates" element={<EmailTemplates />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>

      {/* Global Modals & Panels */}
      <CommandPalette />
      <ShortcutsHelp />
      <AddCandidateModal />
      <CandidatePanel />
      <Toaster position="bottom-right" richColors />
    </>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
