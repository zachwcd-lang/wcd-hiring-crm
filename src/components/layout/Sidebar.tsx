import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Inbox,
  Kanban,
  Briefcase,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  BarChart3,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', icon: Inbox, label: 'Talent Inbox', shortcut: 'G I' },
  { path: '/pipeline', icon: Kanban, label: 'Pipeline', shortcut: 'G P' },
  { path: '/positions', icon: Briefcase, label: 'Positions', shortcut: 'G J' },
  { path: '/calendar', icon: Calendar, label: 'Calendar', shortcut: 'G C' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics', shortcut: 'G A' },
  { path: '/settings', icon: Settings, label: 'Settings', shortcut: 'G S' },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore()
  const location = useLocation()

  // Keyboard shortcut: [ to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '[' && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          toggleSidebar()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar])

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen transition-all duration-200',
        'bg-white border-r border-[var(--border)]',
        sidebarCollapsed ? 'w-16' : 'w-[220px]'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className={cn(
          'flex items-center h-14 border-b border-[var(--border)]',
          sidebarCollapsed ? 'justify-center px-2' : 'px-4 gap-3'
        )}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--accent-blue)] text-white text-sm font-bold shadow-sm">
            W
          </div>
          {!sidebarCollapsed && (
            <span className="text-sm font-semibold text-[var(--text-primary)]">Streamline ATS</span>
          )}
        </div>

        {/* Search Trigger */}
        {!sidebarCollapsed && (
          <div className="px-3 py-3">
            <button
              onClick={() => {
                const event = new KeyboardEvent('keydown', {
                  key: 'k',
                  metaKey: true,
                  bubbles: true
                })
                document.dispatchEvent(event)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--background)] hover:bg-slate-100 border border-[var(--border)] transition-colors"
            >
              <Search className="w-4 h-4 text-[var(--text-muted)]" strokeWidth={1.5} />
              <span className="flex-1 text-left text-sm text-[var(--text-muted)]">Search...</span>
              <kbd>⌘K</kbd>
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-2 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon

            const linkContent = (
              <NavLink
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-[var(--accent-blue-light)] text-[var(--accent-blue)]'
                    : 'text-[var(--text-secondary)] hover:bg-slate-50 hover:text-[var(--text-primary)]',
                  sidebarCollapsed && 'justify-center px-2'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', isActive && 'text-[var(--accent-blue)]')} strokeWidth={1.5} />
                {!sidebarCollapsed && (
                  <span className="flex-1">{item.label}</span>
                )}
                {!sidebarCollapsed && (
                  <kbd className="opacity-0 group-hover:opacity-100 transition-opacity">{item.shortcut}</kbd>
                )}
              </NavLink>
            )

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.path} delayDuration={0}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    <div className="flex items-center gap-3">
                      <span>{item.label}</span>
                      <kbd>{item.shortcut}</kbd>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.path} className="group">{linkContent}</div>
          })}
        </nav>

        {/* User & Collapse */}
        <div className="p-3 border-t border-[var(--border)]">
          {/* User Menu */}
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-blue)] to-blue-400 text-white flex items-center justify-center text-sm font-medium shadow-sm">
                ZL
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">Zach</p>
                <p className="text-xs text-[var(--text-muted)] truncate">Admin</p>
              </div>
            </div>
          )}

          {/* Collapse Toggle */}
          <button
            onClick={toggleSidebar}
            className={cn(
              'w-full flex items-center justify-center h-8 rounded-lg',
              'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-slate-50 transition-colors',
              !sidebarCollapsed && 'justify-start px-3 gap-2'
            )}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                <span className="text-xs">Collapse</span>
                <kbd className="ml-auto">[</kbd>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}
