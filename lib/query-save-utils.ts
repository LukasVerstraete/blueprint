import { QueryGroupWithRules } from '@/types/query'

/**
 * Saves the entire query structure (groups and rules) to the database
 */
export async function saveQueryStructure(
  projectId: string,
  queryId: string,
  rootGroup: QueryGroupWithRules
): Promise<void> {
  // First, delete all existing groups and rules for this query
  await deleteExistingStructure(projectId, queryId)
  
  // Then save the new structure recursively
  await saveGroupRecursive(projectId, queryId, rootGroup, null)
}

/**
 * Deletes all existing groups and rules for a query
 */
async function deleteExistingStructure(projectId: string, queryId: string): Promise<void> {
  // Get all groups for this query
  const response = await fetch(`/api/projects/${projectId}/queries/${queryId}/groups`)
  if (!response.ok) return
  
  const groups = await response.json()
  
  // Delete each group (rules will be deleted via cascade)
  for (const group of groups) {
    await fetch(`/api/projects/${projectId}/queries/${queryId}/groups/${group.id}`, {
      method: 'DELETE'
    })
  }
}

/**
 * Recursively saves a group and all its rules and nested groups
 */
async function saveGroupRecursive(
  projectId: string,
  queryId: string,
  group: QueryGroupWithRules,
  parentGroupId: string | null
): Promise<string> {
  // Create the group
  const groupResponse = await fetch(`/api/projects/${projectId}/queries/${queryId}/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      parent_group_id: parentGroupId,
      operator: group.operator,
      sort_order: group.sort_order || 0
    })
  })
  
  if (!groupResponse.ok) {
    throw new Error('Failed to create group')
  }
  
  const createdGroup = await groupResponse.json()
  const groupId = createdGroup.id
  
  // Save all rules for this group
  if (group.rules && group.rules.length > 0) {
    for (let i = 0; i < group.rules.length; i++) {
      const rule = group.rules[i]
      if (!rule.property_id) continue // Skip rules without property selected
      
      await fetch(`/api/projects/${projectId}/queries/${queryId}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query_group_id: groupId,
          property_id: rule.property_id,
          operator: rule.operator,
          value: rule.value,
          sort_order: i
        })
      })
    }
  }
  
  // Save all nested groups
  if (group.groups && group.groups.length > 0) {
    for (let i = 0; i < group.groups.length; i++) {
      const nestedGroup = group.groups[i]
      await saveGroupRecursive(projectId, queryId, {
        ...nestedGroup,
        sort_order: i
      }, groupId)
    }
  }
  
  return groupId
}