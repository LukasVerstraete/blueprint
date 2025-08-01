'use client'

import { useState } from 'react'
import { QueryGroupWithRules, QueryRule as QueryRuleType } from '@/types/query'
import { Property } from '@/types/entity'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, ChevronRight, ChevronDown } from 'lucide-react'
import { QueryRule } from './query-rule'
import { cn } from '@/lib/utils'

interface QueryGroupProps {
  group: QueryGroupWithRules
  properties: Property[]
  depth: number
  onUpdate: (group: QueryGroupWithRules) => void
  onDelete: () => void
  isFirst: boolean
  isLast: boolean
  isRoot?: boolean
}

export function QueryGroup({ 
  group, 
  properties, 
  depth, 
  onUpdate, 
  onDelete,
  isFirst: _isFirst,
  isLast: _isLast,
  isRoot = false
}: QueryGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const handleOperatorChange = (operator: 'AND' | 'OR') => {
    onUpdate({ ...group, operator })
  }

  const handleAddRule = () => {
    const newRule: QueryRuleType = {
      id: `temp-${Date.now()}`,
      query_group_id: group.id,
      property_id: '',
      operator: 'equals',
      value: null,
      sort_order: (group.rules?.length || 0),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: '',
      last_modified_by: ''
    }
    onUpdate({
      ...group,
      rules: [...(group.rules || []), newRule]
    })
  }

  const handleAddGroup = () => {
    const newGroup: QueryGroupWithRules = {
      id: `temp-${Date.now()}-${Math.random()}`,
      query_id: group.query_id,
      parent_group_id: group.id,
      operator: 'AND',
      sort_order: (group.groups?.length || 0),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: '',
      last_modified_by: '',
      rules: [],
      groups: []
    }
    onUpdate({
      ...group,
      groups: [...(group.groups || []), newGroup]
    })
  }

  const handleUpdateRule = (ruleId: string, updatedRule: QueryRuleType) => {
    onUpdate({
      ...group,
      rules: group.rules?.map(r => r.id === ruleId ? updatedRule : r) || []
    })
  }

  const handleDeleteRule = (ruleId: string) => {
    onUpdate({
      ...group,
      rules: group.rules?.filter(r => r.id !== ruleId) || []
    })
  }

  const handleUpdateNestedGroup = (groupId: string, updatedGroup: QueryGroupWithRules) => {
    onUpdate({
      ...group,
      groups: group.groups?.map(g => g.id === groupId ? updatedGroup : g) || []
    })
  }

  const handleDeleteNestedGroup = (groupId: string) => {
    onUpdate({
      ...group,
      groups: group.groups?.filter(g => g.id !== groupId) || []
    })
  }

  const hasContent = (group.rules && group.rules.length > 0) || (group.groups && group.groups.length > 0)

  return (
    <div 
      className={cn(
        'border rounded-lg',
        depth === 0 ? 'border-border' : 'border-muted',
        depth > 0 && 'ml-8'
      )}
    >
      <div className="p-3 bg-muted/30">
        <div className="flex items-center gap-2">
          {hasContent && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          
          <Select value={group.operator} onValueChange={handleOperatorChange}>
            <SelectTrigger className="w-24 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">AND</SelectItem>
              <SelectItem value="OR">OR</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddRule}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Rule
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddGroup}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Group
          </Button>

          {!isRoot && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {isExpanded && hasContent && (
        <div className="p-3 space-y-2">
          {group.rules?.map((rule) => (
            <QueryRule
              key={rule.id}
              rule={rule}
              properties={properties}
              onUpdate={(updated) => handleUpdateRule(rule.id, updated)}
              onDelete={() => handleDeleteRule(rule.id)}
            />
          ))}

          {group.groups?.map((nestedGroup, index) => (
            <QueryGroup
              key={nestedGroup.id}
              group={nestedGroup}
              properties={properties}
              depth={depth + 1}
              onUpdate={(updated) => handleUpdateNestedGroup(nestedGroup.id, updated)}
              onDelete={() => handleDeleteNestedGroup(nestedGroup.id)}
              isFirst={index === 0}
              isLast={index === (group.groups?.length || 0) - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}