'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useProjectContext } from '@/app/providers/project-provider'
import { UserRole } from '@/types/project'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useEntities, useCreateEntity, useUpdateEntity, useDeleteEntity } from '@/hooks/use-entities'
import { EntityTable } from '@/components/entities/entity-table'
import { EntityForm } from '@/components/entities/entity-form'
import { DeleteEntityDialog } from '@/components/entities/delete-entity-dialog'
import { Entity, CreateEntityInput } from '@/types/entity'
import { toast } from 'sonner'

export default function EntitiesPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const { currentProject } = useProjectContext()
  const [formOpen, setFormOpen] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null)
  const [deleteEntity, setDeleteEntity] = useState<Entity | null>(null)

  // Queries and mutations
  const { data: entities = [], isLoading } = useEntities(projectId)
  const createMutation = useCreateEntity(projectId)
  const updateMutation = useUpdateEntity(projectId, selectedEntity?.id || '')
  const deleteMutation = useDeleteEntity(projectId)

  // Check permissions
  if (currentProject && currentProject.user_role !== UserRole.Administrator) {
    router.push(`/projects/${currentProject.id}`)
    return null
  }

  const handleCreate = async (data: CreateEntityInput) => {
    try {
      await createMutation.mutateAsync(data)
      toast.success('Entity created successfully')
      setFormOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create entity')
    }
  }

  const handleUpdate = async (data: CreateEntityInput) => {
    if (!selectedEntity) return
    
    try {
      await updateMutation.mutateAsync(data)
      toast.success('Entity updated successfully')
      setFormOpen(false)
      setSelectedEntity(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update entity')
    }
  }

  const handleEdit = (entity: Entity) => {
    router.push(`/projects/${projectId}/entities/${entity.id}`)
  }

  const handleDelete = async () => {
    if (!deleteEntity) return
    
    try {
      const result = await deleteMutation.mutateAsync(deleteEntity.id)
      toast.success('Entity deleted successfully')
      if (result.impact?.property_references > 0) {
        toast.warning(`${result.impact.property_references} properties were referencing this entity`)
      }
      setDeleteEntity(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete entity')
    }
  }

  if (!currentProject) {
    return null
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Entities</h1>
          <p className="text-muted-foreground">Manage data structures for {currentProject.name}</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Entity
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading entities...</p>
        </div>
      ) : (
        <EntityTable 
          entities={entities}
          onEdit={handleEdit}
          onDelete={setDeleteEntity}
        />
      )}

      <EntityForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setSelectedEntity(null)
        }}
        entity={selectedEntity}
        onSubmit={selectedEntity ? handleUpdate : handleCreate}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <DeleteEntityDialog
        open={!!deleteEntity}
        onOpenChange={(open) => !open && setDeleteEntity(null)}
        entity={deleteEntity}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}