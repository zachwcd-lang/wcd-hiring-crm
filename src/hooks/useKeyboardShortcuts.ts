import { useEffect, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'

type ShortcutCallback = () => void

interface Shortcut {
  key: string
  meta?: boolean
  ctrl?: boolean
  description: string
  callback: ShortcutCallback
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate()
  const { setIsAddModalOpen, setShowShortcutsHelp } = useAppStore()
  const [gPressed, setGPressed] = useState(false)

  const shortcuts: Shortcut[] = [
    // Navigation shortcuts (G + key)
    { key: 'd', description: 'Go to Dashboard', callback: () => navigate('/') },
    { key: 'p', description: 'Go to Pipeline', callback: () => navigate('/pipeline') },
    { key: 'j', description: 'Go to Jobs', callback: () => navigate('/positions') },
    { key: 'c', description: 'Go to Calendar', callback: () => navigate('/calendar') },
    { key: 's', description: 'Go to Settings', callback: () => navigate('/settings') },
  ]

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

    // Don't handle shortcuts when typing in inputs
    if (isInput) return

    // CMD+N: New candidate
    if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
      e.preventDefault()
      setIsAddModalOpen(true)
      return
    }

    // CMD+/: Show shortcuts help
    if ((e.metaKey || e.ctrlKey) && e.key === '/') {
      e.preventDefault()
      setShowShortcutsHelp(true)
      return
    }

    // G-based navigation
    if (e.key === 'g' && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()
      setGPressed(true)
      // Reset after 1 second
      setTimeout(() => setGPressed(false), 1000)
      return
    }

    // If G was pressed, check for navigation keys
    if (gPressed) {
      const shortcut = shortcuts.find(s => s.key === e.key.toLowerCase())
      if (shortcut) {
        e.preventDefault()
        shortcut.callback()
        setGPressed(false)
      }
    }
  }, [gPressed, navigate, setIsAddModalOpen, setShowShortcutsHelp])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return { gPressed }
}

// Shortcuts data for the help modal
export const SHORTCUTS = [
  { category: 'Navigation', shortcuts: [
    { keys: ['G', 'D'], description: 'Go to Dashboard' },
    { keys: ['G', 'P'], description: 'Go to Pipeline' },
    { keys: ['G', 'J'], description: 'Go to Jobs' },
    { keys: ['G', 'C'], description: 'Go to Calendar' },
    { keys: ['G', 'S'], description: 'Go to Settings' },
  ]},
  { category: 'Actions', shortcuts: [
    { keys: ['⌘', 'K'], description: 'Open command palette' },
    { keys: ['⌘', 'N'], description: 'Add new candidate' },
    { keys: ['⌘', '/'], description: 'Show keyboard shortcuts' },
  ]},
  { category: 'Pipeline', shortcuts: [
    { keys: ['J'], description: 'Move down' },
    { keys: ['K'], description: 'Move up' },
    { keys: ['Enter'], description: 'Open candidate' },
  ]},
  { category: 'General', shortcuts: [
    { keys: ['['], description: 'Toggle sidebar' },
    { keys: ['Esc'], description: 'Close panel/modal' },
  ]},
]
