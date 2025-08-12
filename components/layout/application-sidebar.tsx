'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  FileText,
  ArrowLeft
} from 'lucide-react'
import { useProjectContext } from '@/app/providers/project-provider'
import { UserRole } from '@/types/project'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'

interface NavigationPage {
  id: string
  name: string
  parent_page_id: string | null
  sort_order: number
  requires_parameters: boolean
}

export function ApplicationSidebar() {
  const pathname = usePathname()
  const params = useParams()
  const projectId = params.id as string
  const { currentProject } = useProjectContext()

  // Fetch navigable pages (top-level pages without required parameters)
  const { data: pages, isLoading } = useQuery({
    queryKey: ['application-navigation', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/app/navigation`)
      if (!response.ok) {
        throw new Error('Failed to fetch navigation')
      }
      return response.json() as Promise<NavigationPage[]>
    },
    enabled: !!projectId,
  })

  const canAccessBuilder = currentProject && (
    currentProject.user_role === UserRole.Administrator || 
    currentProject.user_role === UserRole.ContentManager
  )

  return (
    <div className="flex h-full flex-col">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2 font-semibold">
          <LayoutDashboard className="h-6 w-6" />
          <span className="text-xl">{currentProject?.name || 'Application'}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {isLoading ? (
          <div className="space-y-2">
            {/* Loading skeleton */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2">
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                <div className="h-4 flex-1 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : pages && pages.length > 0 ? (
          pages.map((page) => {
            const href = `/projects/${projectId}/app/${page.id}`
            const isActive = pathname === href
            
            return (
              <Link
                key={page.id}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                )}
              >
                <FileText className="h-4 w-4" />
                {page.name}
              </Link>
            )
          })
        ) : (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            No pages available
          </div>
        )}
      </nav>

      {/* Back to Builder button for authorized users */}
      {canAccessBuilder && (
        <div className="border-t p-4">
          <Link href={`/projects/${projectId}`}>
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Builder
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}