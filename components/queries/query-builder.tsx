'use client'

import { useState, useEffect } from 'react'
import { QueryWithDetails, QueryGroupWithRules } from '@/types/query'
import { Property } from '@/types/entity'
import { QueryGroup } from './query-group'
import { cn } from '@/lib/utils'

interface QueryBuilderProps {
  query: QueryWithDetails
  properties: Property[]
  onUpdate: (groups: QueryGroupWithRules[]) => void
  className?: string
}

export function QueryBuilder({ query, properties, onUpdate, className }: QueryBuilderProps) {
  // Extract the single root group from the groups array
  const rootGroup = (query.groups || []).find(g => g.parent_group_id === null)
  
  // Initialize with root group or create a new one
  const [group, setGroup] = useState<QueryGroupWithRules | null>(() => {
    if (rootGroup) return rootGroup
    
    // Create a default root group for new queries
    const defaultRootGroup: QueryGroupWithRules = {
      id: `temp-root-${Date.now()}`,
      query_id: query.id,
      parent_group_id: null,
      operator: 'AND',
      sort_order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: '',
      last_modified_by: '',
      rules: [],
      groups: []
    }
    return defaultRootGroup
  })

  // Notify parent of the default group on mount if it was created
  useEffect(() => {
    if (!rootGroup && group) {
      onUpdate([group])
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdateGroup = (updatedGroup: QueryGroupWithRules) => {
    setGroup(updatedGroup)
    // Always pass the root group as a single-element array for backward compatibility
    onUpdate([updatedGroup])
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        {group && (
          <QueryGroup
            key={group.id}
            group={group}
            properties={properties}
            depth={0}
            onUpdate={handleUpdateGroup}
            onDelete={() => {}} // Root group cannot be deleted
            isFirst={true}
            isLast={true}
            isRoot={true}
          />
        )}
      </div>
    </div>
  )
}