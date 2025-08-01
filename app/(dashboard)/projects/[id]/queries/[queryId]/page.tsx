'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectContext } from '@/app/providers/project-provider'
import { UserRole } from '@/types/project'
import { useQuery, useUpdateQuery } from '@/hooks/use-queries'
import { useEntity } from '@/hooks/use-entities'
import { useProperties } from '@/hooks/use-properties'
import { useQueryExecution } from '@/hooks/use-query-execution'
import { QueryBuilder } from '@/components/queries/query-builder'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Play } from 'lucide-react'
import { QueryGroupWithRules } from '@/types/query'
import { toast } from 'sonner'
import { EntityInstanceResultsTable } from '@/components/entity-instances/entity-instance-results-table'
import { saveQueryStructure } from '@/lib/query-save-utils'

export default function QueryDetailPage({
  params
}: {
  params: Promise<{ id: string; queryId: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { currentProject } = useProjectContext()
  const [queryName, setQueryName] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [currentGroups, setCurrentGroups] = useState<QueryGroupWithRules[]>([])
  const [_testResults, setTestResults] = useState<Record<string, unknown> | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const { data: query, isLoading: queryLoading } = useQuery(
    resolvedParams.id,
    resolvedParams.queryId
  )
  const { data: entity } = useEntity(
    resolvedParams.id,
    query?.entity_id || ''
  )
  const { data: properties } = useProperties(
    resolvedParams.id,
    query?.entity_id || ''
  )
  const updateQuery = useUpdateQuery(resolvedParams.id, resolvedParams.queryId)

  // Query execution hook (disabled by default)
  const { data: executionResult, refetch: executeQuery } = useQueryExecution(
    resolvedParams.id,
    resolvedParams.queryId,
    { enabled: false, groups: currentGroups }
  )

  useEffect(() => {
    if (currentProject && currentProject.user_role === UserRole.Default) {
      router.push(`/projects/${currentProject.id}`)
    }
  }, [currentProject, router])

  useEffect(() => {
    if (query) {
      setQueryName(query.name)
      // Extract the root group
      const rootGroup = (query.groups || []).find(g => g.parent_group_id === null)
      setCurrentGroups(rootGroup ? [rootGroup] : [])
      // Mark as having changes if this is a new query (no groups yet)
      if (!rootGroup) {
        setHasChanges(true)
      }
    }
  }, [query])

  if (!currentProject || currentProject.user_role === UserRole.Default) {
    return null
  }

  const handleSave = async () => {
    if (!queryName.trim()) {
      toast.error('Query name is required')
      return
    }

    setIsSaving(true)
    try {
      // First update the query name if it changed
      if (queryName !== query?.name) {
        await updateQuery.mutateAsync({ name: queryName })
      }

      // Then save groups and rules
      const rootGroup = currentGroups[0]
      if (rootGroup) {
        await saveQueryStructure(resolvedParams.id, resolvedParams.queryId, rootGroup)
      }
      
      toast.success('Query saved successfully')
      setHasChanges(false)
    } catch {
      toast.error('Failed to save query')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestQuery = async () => {
    setIsExecuting(true)
    try {
      const result = await executeQuery()
      setTestResults(result.data)
    } catch {
      toast.error('Failed to execute query')
    } finally {
      setIsExecuting(false)
    }
  }

  const handleGroupsUpdate = (updatedGroups: QueryGroupWithRules[]) => {
    setCurrentGroups(updatedGroups)
    setHasChanges(true)
  }

  if (queryLoading || !query) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading query...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/projects/${currentProject.id}/queries`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Queries
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Query</h1>
            <p className="text-muted-foreground">
              Entity: {entity?.name || 'Loading...'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleTestQuery}
            disabled={isExecuting}
          >
            <Play className="h-4 w-4 mr-2" />
            Test Query
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateQuery.isPending || isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Query Details</CardTitle>
          <CardDescription>
            Configure your query name and conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="queryName">Query Name</Label>
              <Input
                id="queryName"
                value={queryName}
                onChange={(e) => {
                  setQueryName(e.target.value)
                  setHasChanges(true)
                }}
                placeholder="e.g., Active Customers"
              />
            </div>

            <div className="space-y-2">
              <Label>Query Conditions</Label>
              {properties ? (
                <QueryBuilder
                  query={query}
                  properties={properties}
                  onUpdate={handleGroupsUpdate}
                />
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Loading properties...
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {executionResult && (
        <Card>
          <CardHeader>
            <CardTitle>Query Results</CardTitle>
            <CardDescription>
              Found {executionResult.total} results
              {executionResult.totalPages > 1 && 
                ` (Page ${executionResult.page} of ${executionResult.totalPages})`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {entity && properties && (
              <EntityInstanceResultsTable
                instances={executionResult.data}
                entity={entity}
                properties={properties}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}