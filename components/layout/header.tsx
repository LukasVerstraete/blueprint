'use client'

import Link from 'next/link'
import { ProjectSwitcher } from '@/components/layout/project-switcher'
import { UserMenu } from '@/components/layout/user-menu'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'
import { useProjectContext } from '@/app/providers/project-provider'
import { UserRole } from '@/types/project'

export function Header() {
  const { currentProject } = useProjectContext()
  
  // Show View Application button for ContentManagers and Administrators
  const showViewAppButton = currentProject && (
    currentProject.user_role === UserRole.Administrator || 
    currentProject.user_role === UserRole.ContentManager
  )
  
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background px-6">
      <div className="flex flex-1 items-center gap-4">
        {/* Project Switcher */}
        <ProjectSwitcher />
        
        {/* Breadcrumb */}
        <Breadcrumb />
      </div>
      
      {/* View Application Button */}
      {showViewAppButton && (
        <Link href={`/projects/${currentProject.id}/app`} className="mr-4">
          <Button variant="outline" size="sm">
            <ExternalLink className="mr-2 h-4 w-4" />
            View Application
          </Button>
        </Link>
      )}
      
      {/* User Menu */}
      <UserMenu />
    </header>
  )
}