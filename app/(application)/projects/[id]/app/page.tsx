'use client'

import { useProjectContext } from '@/app/providers/project-provider'
import { Card, CardContent } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export default function ApplicationHomePage() {
  const { currentProject } = useProjectContext()

  if (!currentProject) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome to {currentProject.name}</h1>
        <p className="text-muted-foreground">
          Select a page from the navigation menu to get started
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Application Home</h3>
          <p className="text-muted-foreground text-center">
            Navigate to different pages using the menu on the left
          </p>
        </CardContent>
      </Card>
    </div>
  )
}