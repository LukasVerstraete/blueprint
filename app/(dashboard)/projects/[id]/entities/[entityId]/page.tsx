'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useProjectContext } from '@/app/providers/project-provider'
import { UserRole } from '@/types/project'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, Edit } from 'lucide-react'
import { useEntity, useEntities, useCreateProperty, useUpdateEntity, useDeleteProperty } from '@/hooks/use-entities'
import { PropertyTable } from '@/components/properties/property-table'
import { PropertyForm } from '@/components/properties/property-form'
import { DeletePropertyDialog } from '@/components/properties/delete-property-dialog'
import { EntityForm } from '@/components/entities/entity-form'
import { Property, CreatePropertyInput, UpdatePropertyInput } from '@/types/entity'
import { toast } from 'sonner'

export default function EntityDetailPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const entityId = params.entityId as string
  const { currentProject } = useProjectContext()
  const [formOpen, setFormOpen] = useState(false)
  const [entityFormOpen, setEntityFormOpen] = useState(false)
  const [deleteProperty, setDeleteProperty] = useState<Property | null>(null)

  // Queries and mutations
  const { data: entity, isLoading } = useEntity(projectId, entityId)
  const { data: entities = [] } = useEntities(projectId)
  const createPropertyMutation = useCreateProperty(projectId, entityId)
  const updateEntityMutation = useUpdateEntity(projectId, entityId)
  const deletePropertyMutation = useDeleteProperty(projectId, entityId)

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

  const handleCreateProperty = async (data: CreatePropertyInput) => {
    try {
      await createPropertyMutation.mutateAsync(data)
      toast.success('Property created successfully')
      setFormOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create property')
    }
  }

  const handleDeleteProperty = async () => {
    if (!deleteProperty) return
    
    try {
      await deletePropertyMutation.mutateAsync(deleteProperty.id)
      toast.success('Property deleted successfully')
      setDeleteProperty(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete property')
    }
  }

  const handleUpdateEntity = async (data: CreateEntityInput) => {
    try {
      await updateEntityMutation.mutateAsync(data)
      toast.success('Entity updated successfully')
      setEntityFormOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update entity')
    }
  }

  const handleUpdateProperty = async (propertyId: string, data: UpdatePropertyInput) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/entities/${entityId}/properties/${propertyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update property')
      }
      
      toast.success('Property updated successfully')
      // Refresh the entity data
      window.location.reload() // Temporary - should use React Query invalidation
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update property')
    }
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{entity.name}</h1>
            <p className="text-muted-foreground">Display String: {entity.display_string}</p>
          </div>
          <Button variant="outline" onClick={() => setEntityFormOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Entity
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Properties</h2>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </div>

        <PropertyTable
          properties={entity.properties}
          onUpdate={handleUpdateProperty}
          onDelete={setDeleteProperty}
        />
      </div>

      <PropertyForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreateProperty}
        isLoading={createPropertyMutation.isPending}
        entities={entities.filter(e => e.id !== entityId)} // Exclude current entity to prevent self-reference
      />

      <DeletePropertyDialog
        property={deleteProperty}
        open={!!deleteProperty}
        onOpenChange={(open) => !open && setDeleteProperty(null)}
        onConfirm={handleDeleteProperty}
        isLoading={deletePropertyMutation.isPending}
      />

      <EntityForm
        open={entityFormOpen}
        onOpenChange={setEntityFormOpen}
        entity={entity}
        properties={entity?.properties || []}
        onSubmit={handleUpdateEntity}
        isLoading={updateEntityMutation.isPending}
      />
    </div>
  )
}