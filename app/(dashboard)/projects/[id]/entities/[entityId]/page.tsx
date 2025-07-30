'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useProjectContext } from '@/app/providers/project-provider'
import { UserRole } from '@/types/project'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Plus } from 'lucide-react'
import { useEntity, useEntities, useCreateProperty, useUpdateEntity, useDeleteProperty } from '@/hooks/use-entities'
import { useQueryClient } from '@tanstack/react-query'
import { PropertyTable } from '@/components/properties/property-table'
import { PropertyForm } from '@/components/properties/property-form'
import { DeletePropertyDialog } from '@/components/properties/delete-property-dialog'
import { DisplayStringParts } from '@/components/entities/display-string-parts'
import { Property, CreatePropertyInput, UpdatePropertyInput } from '@/types/entity'
import { toast } from 'sonner'

export default function EntityDetailPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const entityId = params.entityId as string
  const { currentProject } = useProjectContext()
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteProperty, setDeleteProperty] = useState<Property | null>(null)
  const [editingEntityName, setEditingEntityName] = useState(false)
  const [entityName, setEntityName] = useState('')
  const [displayString, setDisplayString] = useState('')

  // Queries and mutations
  const { data: entity, isLoading } = useEntity(projectId, entityId)
  const { data: entities = [] } = useEntities(projectId)
  const createPropertyMutation = useCreateProperty(projectId, entityId)
  const updateEntityMutation = useUpdateEntity(projectId, entityId)
  const deletePropertyMutation = useDeleteProperty(projectId, entityId)

  // Update entity data when entity loads
  useEffect(() => {
    if (entity) {
      setEntityName(entity.name)
      setDisplayString(entity.display_string)
    }
  }, [entity])

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

  const handleSaveEntityName = async () => {
    if (!entityName.trim()) {
      toast.error('Entity name cannot be empty')
      setEntityName(entity?.name || '')
      setEditingEntityName(false)
      return
    }

    try {
      await updateEntityMutation.mutateAsync({ name: entityName.trim() })
      toast.success('Entity name updated successfully')
      setEditingEntityName(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update entity name')
      setEntityName(entity?.name || '')
      setEditingEntityName(false)
    }
  }

  const handleCancelEntityNameEdit = () => {
    setEntityName(entity?.name || '')
    setEditingEntityName(false)
  }

  const handleSaveDisplayString = async () => {
    try {
      await updateEntityMutation.mutateAsync({ display_string: displayString })
      toast.success('Display string updated successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update display string')
      setDisplayString(entity?.display_string || '')
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
      
      // Invalidate queries to refresh the data
      await queryClient.invalidateQueries({ queryKey: ['entities', projectId] })
      await queryClient.invalidateQueries({ queryKey: ['entities', projectId, entityId] })
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
        <div>
          {editingEntityName ? (
            <div className="flex items-center gap-2 mb-2">
              <Input
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEntityName()
                  if (e.key === 'Escape') handleCancelEntityNameEdit()
                }}
                className="text-3xl font-bold h-auto py-1"
                autoFocus
              />
              <Button size="sm" onClick={handleSaveEntityName}>Save</Button>
              <Button size="sm" variant="ghost" onClick={handleCancelEntityNameEdit}>Cancel</Button>
            </div>
          ) : (
            <h1 
              className="text-3xl font-bold mb-2 cursor-pointer hover:bg-muted/50 inline-block px-2 -mx-2 rounded"
              onClick={() => setEditingEntityName(true)}
            >
              {entity.name}
            </h1>
          )}
          
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Display String Template</p>
            <DisplayStringParts
              value={displayString}
              onChange={setDisplayString}
              properties={entity.properties}
              onSave={handleSaveDisplayString}
            />
          </div>
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
    </div>
  )
}