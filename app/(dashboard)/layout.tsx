'use client'

import { useAuth } from '@/app/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { ProjectProvider } from '@/app/providers/project-provider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <ProjectProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Fixed left sidebar - 240px/16rem width */}
        <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r bg-background">
          <Sidebar />
        </aside>
        
        {/* Main content area - takes remaining width */}
        <div className="flex-1 ml-60">
          {/* Header with project switcher and user menu */}
          <Header />
          
          {/* Scrollable content area */}
          <main className="h-[calc(100vh-4rem)] overflow-y-auto bg-muted/10">
            <div className="px-6 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProjectProvider>
  )
}