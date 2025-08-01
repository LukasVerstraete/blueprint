'use client'

import { useState } from 'react'
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
  const [group, setGroup] = useState<QueryGroupWithRules | null>(rootGroup || null)

  const handleUpdateGroup = (updatedGroup: QueryGroupWithRules) => {
    setGroup(updatedGroup)
    // Always pass the root group as a single-element array for backward compatibility
    onUpdate([updatedGroup])
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        {group ? (
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
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No query conditions defined. The root group should be created automatically.
          </div>
        )}
      </div>
    </div>
  )
}