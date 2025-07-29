'use client'

import { useParams, useRouter } from 'next/navigation'
import { useProjectContext } from '@/app/providers/project-provider'
import { UserRole } from '@/types/project'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus } from 'lucide-react'
import { useEntity } from '@/hooks/use-entities'

export default function EntityDetailPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const entityId = params.entityId as string
  const { currentProject } = useProjectContext()

  // Query
  const { data: entity, isLoading } = useEntity(projectId, entityId)

  // Check permissions
  if (currentProject && currentProject.user_role !== UserRole.Administrator) {
    router.push(`/projects/${currentProject.id}`)
    return null
  }

  if (!currentProject) {
    return null
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading entity...</p>
      </div>
    )
  }

  if (!entity) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Entity not found</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/projects/${projectId}/entities`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Entities
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{entity.name}</h1>
        <p className="text-muted-foreground">Display String: {entity.display_string}</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Properties</h2>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </div>

        {entity.properties.length === 0 ? (
          <div className="text-center py-8 border rounded-lg">
            <p className="text-muted-foreground">No properties yet. Add your first property to define the entity structure.</p>
          </div>
        ) : (
          <div className="border rounded-lg">
            {/* Property list will go here */}
            <p className="p-4 text-muted-foreground">Properties list coming soon...</p>
          </div>
        )}
      </div>
    </div>
  )
}