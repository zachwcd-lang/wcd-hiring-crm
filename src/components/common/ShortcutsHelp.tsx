import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useAppStore } from '@/store'
import { SHORTCUTS } from '@/hooks/useKeyboardShortcuts'

export function ShortcutsHelp() {
  const { showShortcutsHelp, setShowShortcutsHelp } = useAppStore()

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showShortcutsHelp) {
        setShowShortcutsHelp(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showShortcutsHelp, setShowShortcutsHelp])

  if (!showShortcutsHelp) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setShowShortcutsHelp(false)}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] bg-[var(--background)] rounded-xl shadow-lg border border-[var(--border)] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={() => setShowShortcutsHelp(false)}
            className="p-1.5 rounded-md hover:bg-[var(--background-muted)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-6">
            {SHORTCUTS.map((category) => (
              <div key={category.category}>
                <h3 className="text-label text-[var(--text-muted)] mb-3">
                  {category.category}
                </h3>
                <div className="space-y-2">
                  {category.shortcuts.map((shortcut, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-1.5"
                    >
                      <span className="text-sm text-[var(--text-secondary)]">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, j) => (
                          <span key={j}>
                            <kbd className="px-2 py-1 text-xs font-medium bg-[var(--background-muted)] text-[var(--text-primary)] rounded border border-[var(--border)]">
                              {key}
                            </kbd>
                            {j < shortcut.keys.length - 1 && (
                              <span className="text-[var(--text-muted)] mx-0.5">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--border)] bg-[var(--background-subtle)]">
          <p className="text-xs text-[var(--text-muted)]">
            Press <kbd className="px-1.5 py-0.5 text-xs bg-[var(--background-muted)] rounded border border-[var(--border)]">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  )
}
