'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbItem {
  id: string
  name: string
  href: string
  template?: string | null
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  projectId: string
}

export function Breadcrumb({ items, projectId }: BreadcrumbProps) {
  const searchParams = useSearchParams()
  
  // Function to replace template placeholders with actual values
  const resolveBreadcrumbText = (item: BreadcrumbItem): string => {
    if (!item.template) {
      return item.name
    }
    
    let resolvedText = item.template
    
    // Replace all {paramName} placeholders with values from URL
    const placeholderRegex = /\{([^}]+)\}/g
    resolvedText = resolvedText.replace(placeholderRegex, (match, paramName) => {
      const value = searchParams?.get(paramName)
      return value || match // Keep placeholder if no value found
    })
    
    return resolvedText
  }

  if (!items || items.length === 0) {
    return null
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      <Link 
        href={`/projects/${projectId}/app`}
        className="hover:text-foreground transition-colors"
      >
        Home
      </Link>
      
      {items.map((item, index) => (
        <div key={item.id} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-1" />
          {index === items.length - 1 ? (
            <span className="text-foreground font-medium">
              {resolveBreadcrumbText(item)}
            </span>
          ) : (
            <Link 
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {resolveBreadcrumbText(item)}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}