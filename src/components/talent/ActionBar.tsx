import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, X, Archive, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActionBarProps {
  selectedCount: number
  onAdvance: () => void
  onReject: () => void
  onArchive: () => void
  onClear: () => void
}

export function ActionBar({
  selectedCount,
  onAdvance,
  onReject,
  onArchive,
  onClear,
}: ActionBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-3 px-4 py-3 bg-white border border-[var(--border)] rounded-xl action-bar-glow">
            {/* Selection count */}
            <div className="flex items-center gap-2 pr-3 border-r border-[var(--border)]">
              <div className="w-6 h-6 rounded-full bg-[var(--accent-blue)] flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={2} />
              </div>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {selectedCount} selected
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Advance Button */}
              <button
                onClick={onAdvance}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all',
                  'bg-[var(--accent-blue)] text-white',
                  'hover:bg-[var(--accent-blue-hover)] hover:shadow-md',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:ring-offset-2'
                )}
              >
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                Advance
                <kbd className="ml-1 px-1.5 py-0.5 text-[10px] font-medium bg-white/20 rounded">G</kbd>
              </button>

              {/* Reject Button */}
              <button
                onClick={onReject}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all',
                  'bg-red-50 text-red-600 border border-red-100',
                  'hover:bg-red-100 hover:border-red-200',
                  'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                )}
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
                Reject
                <kbd className="ml-1 px-1.5 py-0.5 text-[10px] font-medium bg-red-100 text-red-500 rounded">X</kbd>
              </button>

              {/* Archive Button */}
              <button
                onClick={onArchive}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all',
                  'text-[var(--text-secondary)] border border-[var(--border)]',
                  'hover:bg-slate-50 hover:border-slate-300',
                  'focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2'
                )}
              >
                <Archive className="w-4 h-4" strokeWidth={1.5} />
                Archive
                <kbd className="ml-1 px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-500 rounded">A</kbd>
              </button>
            </div>

            {/* Clear selection */}
            <button
              onClick={onClear}
              className="ml-2 p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-slate-50 transition-colors"
              aria-label="Clear selection"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
