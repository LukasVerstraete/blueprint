'use client'

import { ProjectSwitcher } from '@/components/layout/project-switcher'
import { UserMenu } from '@/components/layout/user-menu'
import { Breadcrumb } from '@/components/layout/breadcrumb'

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background px-6">
      <div className="flex flex-1 items-center gap-4">
        {/* Project Switcher */}
        <ProjectSwitcher />
        
        {/* Breadcrumb */}
        <Breadcrumb />
      </div>
      
      {/* User Menu */}
      <UserMenu />
    </header>
  )
}