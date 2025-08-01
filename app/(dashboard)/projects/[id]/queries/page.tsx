'use client'

import { useProjectContext } from '@/app/providers/project-provider'
import { UserRole } from '@/types/project'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useQueries, useCreateQuery, useDeleteQuery } from '@/hooks/use-queries'
import { useEntities } from '@/hooks/use-entities'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Edit } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

export default function QueriesPage() {
  const router = useRouter()
  const { currentProject } = useProjectContext()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteQueryId, setDeleteQueryId] = useState<string | null>(null)
  const [newQueryName, setNewQueryName] = useState('')
  const [selectedEntityId, setSelectedEntityId] = useState('')

  const { data: queries, isLoading: queriesLoading } = useQueries(currentProject?.id || '')
  const { data: entities } = useEntities(currentProject?.id || '')
  const createQuery = useCreateQuery(currentProject?.id || '')
  const deleteQuery = useDeleteQuery(currentProject?.id || '')

  useEffect(() => {
    if (currentProject && currentProject.user_role === UserRole.Default) {
      router.push(`/projects/${currentProject.id}`)
    }
  }, [currentProject, router])

  if (!currentProject || currentProject.user_role === UserRole.Default) {
    return null
  }

  const handleCreateQuery = async () => {
    if (!newQueryName || !selectedEntityId) return

    await createQuery.mutateAsync({
      name: newQueryName,
      entity_id: selectedEntityId
    })

    setCreateDialogOpen(false)
    setNewQueryName('')
    setSelectedEntityId('')
  }

  const handleDeleteQuery = async () => {
    if (!deleteQueryId) return
    
    await deleteQuery.mutateAsync(deleteQueryId)
    setDeleteQueryId(null)
  }

  const handleEditQuery = (queryId: string) => {
    router.push(`/projects/${currentProject.id}/queries/${queryId}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Queries</h1>
          <p className="text-muted-foreground">Manage data queries for {currentProject.name}</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Query
        </Button>
      </div>

      {queriesLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading queries...</div>
      ) : queries && queries.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {queries.map((query) => {
            const entity = entities?.find(e => e.id === query.entity_id)
            return (
              <Card key={query.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{query.name}</CardTitle>
                      <CardDescription>
                        Entity: {entity?.name || 'Unknown'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditQuery(query.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteQueryId(query.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No queries yet</CardTitle>
            <CardDescription>
              Create your first query to start filtering and displaying data from your entities.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Create Query Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Query</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Query Name</Label>
              <Input
                id="name"
                value={newQueryName}
                onChange={(e) => setNewQueryName(e.target.value)}
                placeholder="e.g., Active Customers"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entity">Entity</Label>
              <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an entity" />
                </SelectTrigger>
                <SelectContent>
                  {entities?.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateQuery}
              disabled={!newQueryName || !selectedEntityId || createQuery.isPending}
            >
              Create Query
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteQueryId} onOpenChange={() => setDeleteQueryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Query</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this query? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuery}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}