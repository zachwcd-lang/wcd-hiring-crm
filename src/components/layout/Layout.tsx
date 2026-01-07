import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'

export function Layout() {
  const { sidebarCollapsed } = useAppStore()

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <main
        className={cn(
          'min-h-screen transition-all duration-200',
          sidebarCollapsed ? 'ml-16' : 'ml-[220px]'
        )}
      >
        <Outlet />
      </main>
    </div>
  )
}
