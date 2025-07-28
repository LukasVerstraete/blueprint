'use client'

import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { ProjectCard } from '@/components/projects/project-card'
import { useProjects } from '@/hooks/use-projects'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Archive } from 'lucide-react'

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects()
  
  const activeProjects = projects?.filter(p => !p.is_deleted) || []
  const archivedProjects = projects?.filter(p => p.is_deleted) || []
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Select a project to manage or create a new one
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active Projects</TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Archived ({archivedProjects.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-6">
          {activeProjects.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 px-4 py-32">
              <div className="text-center">
                <h3 className="text-lg font-semibold">No active projects</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Create your first project to get started
                </p>
                <CreateProjectDialog />
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="archived" className="mt-6">
          {archivedProjects.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {archivedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 px-4 py-32">
              <div className="text-center">
                <h3 className="text-lg font-semibold">No archived projects</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Archived projects will appear here
                </p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}