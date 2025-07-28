'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProjectContext } from '@/app/providers/project-provider'

interface BreadcrumbItem {
  title: string
  href?: string
}

export function Breadcrumb() {
  const pathname = usePathname()
  const { currentProject } = useProjectContext()
  
  // Generate breadcrumb items from pathname
  const generateBreadcrumbItems = (): BreadcrumbItem[] => {
    const paths = pathname.split('/').filter(Boolean)
    const items: BreadcrumbItem[] = []
    
    // Always start with home
    items.push({ title: 'Home', href: '/projects' })
    
    // Build breadcrumb items
    let currentPath = ''
    paths.forEach((path, index) => {
      currentPath += `/${path}`
      const isLast = index === paths.length - 1
      
      // Special handling for project routes
      if (paths[0] === 'projects' && index === 1 && currentProject) {
        items.push({
          title: currentProject.name,
          href: isLast ? undefined : currentPath,
        })
        return
      }
      
      // Format the title
      const title = path
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      
      // Skip the word "projects" from breadcrumb if it's the first item
      if (!(index === 0 && path === 'projects')) {
        items.push({
          title,
          href: isLast ? undefined : currentPath,
        })
      }
    })
    
    return items
  }
  
  const items = generateBreadcrumbItems()
  
  // Don't show breadcrumb on home page
  if (items.length <= 1) {
    return null
  }
  
  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm text-muted-foreground">
      {items.map((item, index) => {
        const isFirst = index === 0
        
        return (
          <div key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="mx-1 h-4 w-4" />
            )}
            {item.href ? (
              <Link
                href={item.href}
                className={cn(
                  'flex items-center hover:text-foreground transition-colors',
                  isFirst && 'gap-1'
                )}
              >
                {isFirst && <Home className="h-3 w-3" />}
                {item.title}
              </Link>
            ) : (
              <span className="text-foreground font-medium">{item.title}</span>
            )}
          </div>
        )
      })}
    </nav>
  )
}