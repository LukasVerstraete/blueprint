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
  Settings
} from 'lucide-react'
import { useProjectContext } from '@/app/providers/project-provider'
import { UserRole } from '@/types/project'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  requiredRole?: UserRole
  requiresProject?: boolean
}

const baseNavItems: NavItem[] = [
  {
    title: 'Projects',
    href: '/projects',
    icon: FolderOpen,
  },
  {
    title: 'Entities',
    href: '/entities',
    icon: Database,
    requiredRole: UserRole.Administrator,
    requiresProject: true,
  },
  {
    title: 'Pages',
    href: '/pages',
    icon: FileText,
    requiredRole: UserRole.ContentManager,
    requiresProject: true,
  },
  {
    title: 'Queries',
    href: '/queries',
    icon: Search,
    requiredRole: UserRole.ContentManager,
    requiresProject: true,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { currentProject } = useProjectContext()

  // Check if we're on the projects overview page
  const isProjectsOverview = pathname === '/projects'

  const navItems = baseNavItems.map(item => {
    if (item.requiresProject && currentProject) {
      return {
        ...item,
        href: `/projects/${currentProject.id}${item.href}`
      }
    }
    return item
  })

  const canAccessNavItem = (item: NavItem): boolean => {
    // Hide project-specific items on the projects overview page
    if (isProjectsOverview && item.requiresProject) {
      return false
    }

    // Hide the Projects item when inside a specific project
    if (!isProjectsOverview && item.title === 'Projects') {
      return false
    }

    if (item.requiresProject && !currentProject) {
      return false
    }

    if (!item.requiredRole) {
      return true
    }

    if (!currentProject) {
      return false
    }

    const userRole = currentProject.user_role
    const roleHierarchy = {
      [UserRole.Default]: 0,
      [UserRole.ContentManager]: 1,
      [UserRole.Administrator]: 2,
    }

    return roleHierarchy[userRole] >= roleHierarchy[item.requiredRole]
  }

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
          const canAccess = canAccessNavItem(item)
          
          if (!canAccess) {
            return null
          }
          
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