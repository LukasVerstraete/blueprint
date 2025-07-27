'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Select a project to manage or create a new one
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="flex items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 px-4 py-32">
        <div className="text-center">
          <h3 className="text-lg font-semibold">No projects yet</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Create your first project to get started
          </p>
          <Button className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        </div>
      </div>
    </div>
  )
}