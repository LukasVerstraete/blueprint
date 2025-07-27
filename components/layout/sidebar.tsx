'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  FolderOpen,
  FileText,
  Database,
  Search,
  Users,
  Settings
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  requiredRole?: 'default' | 'content_manager' | 'administrator'
}

const navItems: NavItem[] = [
  {
    title: 'Projects',
    href: '/projects',
    icon: FolderOpen,
  },
  {
    title: 'Entities',
    href: '/entities',
    icon: Database,
    requiredRole: 'administrator',
  },
  {
    title: 'Pages',
    href: '/pages',
    icon: FileText,
    requiredRole: 'content_manager',
  },
  {
    title: 'Queries',
    href: '/queries',
    icon: Search,
    requiredRole: 'content_manager',
  },
  {
    title: 'Users',
    href: '/users',
    icon: Users,
    requiredRole: 'administrator',
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/projects" className="flex items-center gap-2 font-semibold">
          <LayoutDashboard className="h-6 w-6" />
          <span className="text-xl">Blueprint</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t p-4">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            pathname === '/settings'
              ? 'bg-secondary text-secondary-foreground'
              : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </div>
  )
}