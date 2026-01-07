import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import {
  Users,
  LayoutDashboard,
  Calendar,
  Settings,
  UserPlus,
  Briefcase,
  Mail,
  Search,
} from 'lucide-react'
import { useCandidates } from '@/hooks/useCandidates'
import { useAppStore } from '@/store'
import { getInitials } from '@/types'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const { data: candidates } = useCandidates()
  const { setIsAddModalOpen, setSelectedCandidateId } = useAppStore()

  // Toggle with CMD+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  // Filter recent candidates (max 5)
  const recentCandidates = candidates?.slice(0, 5) || []

  // Search candidates
  const filteredCandidates = search
    ? candidates?.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 5)
    : []

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command Menu"
      className="fixed inset-0 z-50"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] max-h-[400px] bg-white rounded-xl shadow-lg border border-[var(--border)] overflow-hidden animate-scale-in">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
          <Search className="w-4 h-4 text-[var(--text-muted)]" />
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="Search candidates, jobs, actions..."
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-[var(--text-muted)]"
          />
          <kbd className="px-2 py-0.5 text-xs bg-[var(--background-muted)] text-[var(--text-muted)] rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <Command.List className="max-h-[320px] overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-[var(--text-muted)]">
            No results found.
          </Command.Empty>

          {/* Search Results */}
          {search && filteredCandidates && filteredCandidates.length > 0 && (
            <Command.Group heading="Candidates" className="mb-2">
              <p className="px-2 py-1.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                Candidates
              </p>
              {filteredCandidates.map((candidate) => (
                <Command.Item
                  key={candidate.id}
                  value={candidate.name}
                  onSelect={() => runCommand(() => setSelectedCandidateId(candidate.id))}
                  className="flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer hover:bg-[var(--background-subtle)] data-[selected=true]:bg-[var(--background-subtle)]"
                >
                  <div className="w-7 h-7 rounded-full bg-[var(--background-muted)] flex items-center justify-center text-xs font-medium text-[var(--text-secondary)]">
                    {getInitials(candidate.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {candidate.name}
                    </p>
                    {candidate.email && (
                      <p className="text-xs text-[var(--text-muted)] truncate">
                        {candidate.email}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">Candidate</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {/* Recent (show when no search) */}
          {!search && recentCandidates.length > 0 && (
            <Command.Group className="mb-2">
              <p className="px-2 py-1.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                Recent
              </p>
              {recentCandidates.map((candidate) => (
                <Command.Item
                  key={candidate.id}
                  value={`recent-${candidate.name}`}
                  onSelect={() => runCommand(() => setSelectedCandidateId(candidate.id))}
                  className="flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer hover:bg-[var(--background-subtle)] data-[selected=true]:bg-[var(--background-subtle)]"
                >
                  <div className="w-7 h-7 rounded-full bg-[var(--background-muted)] flex items-center justify-center text-xs font-medium text-[var(--text-secondary)]">
                    {getInitials(candidate.name)}
                  </div>
                  <span className="flex-1 text-sm text-[var(--text-primary)]">
                    {candidate.name}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">Candidate</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {/* Actions */}
          <Command.Group className="mb-2">
            <p className="px-2 py-1.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              Actions
            </p>
            <Command.Item
              value="Add Candidate"
              onSelect={() => runCommand(() => setIsAddModalOpen(true))}
              className="flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer hover:bg-[var(--background-subtle)] data-[selected=true]:bg-[var(--background-subtle)]"
            >
              <UserPlus className="w-4 h-4 text-[var(--text-secondary)]" />
              <span className="flex-1 text-sm text-[var(--text-primary)]">Add Candidate</span>
              <kbd className="text-xs text-[var(--text-muted)]">⌘ N</kbd>
            </Command.Item>
            <Command.Item
              value="Add Job Posting"
              onSelect={() => runCommand(() => navigate('/positions'))}
              className="flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer hover:bg-[var(--background-subtle)] data-[selected=true]:bg-[var(--background-subtle)]"
            >
              <Briefcase className="w-4 h-4 text-[var(--text-secondary)]" />
              <span className="flex-1 text-sm text-[var(--text-primary)]">Add Job Posting</span>
              <kbd className="text-xs text-[var(--text-muted)]">⌘ J</kbd>
            </Command.Item>
            <Command.Item
              value="Send Bulk Email"
              onSelect={() => runCommand(() => navigate('/templates'))}
              className="flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer hover:bg-[var(--background-subtle)] data-[selected=true]:bg-[var(--background-subtle)]"
            >
              <Mail className="w-4 h-4 text-[var(--text-secondary)]" />
              <span className="flex-1 text-sm text-[var(--text-primary)]">Email Templates</span>
              <kbd className="text-xs text-[var(--text-muted)]">⌘ E</kbd>
            </Command.Item>
          </Command.Group>

          {/* Navigation */}
          <Command.Group>
            <p className="px-2 py-1.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              Navigation
            </p>
            <Command.Item
              value="Go to Pipeline"
              onSelect={() => runCommand(() => navigate('/pipeline'))}
              className="flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer hover:bg-[var(--background-subtle)] data-[selected=true]:bg-[var(--background-subtle)]"
            >
              <Users className="w-4 h-4 text-[var(--text-secondary)]" />
              <span className="flex-1 text-sm text-[var(--text-primary)]">Go to Pipeline</span>
              <kbd className="text-xs text-[var(--text-muted)]">G P</kbd>
            </Command.Item>
            <Command.Item
              value="Go to Dashboard"
              onSelect={() => runCommand(() => navigate('/'))}
              className="flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer hover:bg-[var(--background-subtle)] data-[selected=true]:bg-[var(--background-subtle)]"
            >
              <LayoutDashboard className="w-4 h-4 text-[var(--text-secondary)]" />
              <span className="flex-1 text-sm text-[var(--text-primary)]">Go to Dashboard</span>
              <kbd className="text-xs text-[var(--text-muted)]">G D</kbd>
            </Command.Item>
            <Command.Item
              value="Go to Calendar"
              onSelect={() => runCommand(() => navigate('/calendar'))}
              className="flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer hover:bg-[var(--background-subtle)] data-[selected=true]:bg-[var(--background-subtle)]"
            >
              <Calendar className="w-4 h-4 text-[var(--text-secondary)]" />
              <span className="flex-1 text-sm text-[var(--text-primary)]">Go to Calendar</span>
              <kbd className="text-xs text-[var(--text-muted)]">G C</kbd>
            </Command.Item>
            <Command.Item
              value="Go to Settings"
              onSelect={() => runCommand(() => navigate('/settings'))}
              className="flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer hover:bg-[var(--background-subtle)] data-[selected=true]:bg-[var(--background-subtle)]"
            >
              <Settings className="w-4 h-4 text-[var(--text-secondary)]" />
              <span className="flex-1 text-sm text-[var(--text-primary)]">Go to Settings</span>
              <kbd className="text-xs text-[var(--text-muted)]">G S</kbd>
            </Command.Item>
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  )
}
