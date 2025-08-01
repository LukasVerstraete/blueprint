import { QueryGroupWithRules, QueryRule, QueryOperator } from '@/types/query'
import { PropertyType } from '@/types/entity'
import { SupabaseClient } from '@supabase/supabase-js'

interface PropertyInfo {
  id: string
  property_name: string
  property_type: PropertyType
}

/**
 * Executes a query and returns matching entity instance IDs
 * Uses a two-phase approach:
 * 1. Filter phase: Query property_instances to get matching entity_instance_ids
 * 2. Fetch phase: Get full entity instances with all properties
 */
export async function executeQuery(
  supabase: SupabaseClient,
  entityId: string,
  rootGroup: QueryGroupWithRules | null,
  properties: PropertyInfo[]
): Promise<string[] | null> {
  // If no query conditions, or root group has no rules and no nested groups, return null to indicate "fetch all"
  if (!rootGroup || (!rootGroup.rules?.length && !rootGroup.groups?.length)) {
    return null
  }

  const propertyMap = new Map(properties.map(p => [p.id, p]))
  
  // Process the root group to get matching entity instance IDs
  return processGroup(supabase, rootGroup, propertyMap)
}

/**
 * Process a query group (AND/OR) and return matching entity instance IDs
 */
async function processGroup(
  supabase: SupabaseClient,
  group: QueryGroupWithRules,
  propertyMap: Map<string, PropertyInfo>
): Promise<string[]> {
  const results: string[][] = []
  
  // Process rules grouped by property
  if (group.rules && group.rules.length > 0) {
    // Group rules by property_id
    const rulesByProperty = new Map<string, QueryRule[]>()
    
    for (const rule of group.rules) {
      const rules = rulesByProperty.get(rule.property_id) || []
      rules.push(rule)
      rulesByProperty.set(rule.property_id, rules)
    }
    
    // Execute queries for each property
    for (const [propertyId, propertyRules] of rulesByProperty) {
      const property = propertyMap.get(propertyId)
      if (!property) continue
      
      const ids = await queryPropertyInstances(supabase, propertyId, propertyRules, property)
      results.push(ids)
    }
  }
  
  // Process nested groups
  if (group.groups && group.groups.length > 0) {
    for (const nestedGroup of group.groups) {
      const ids = await processGroup(supabase, nestedGroup, propertyMap)
      results.push(ids)
    }
  }
  
  // Combine results based on operator
  if (results.length === 0) return []
  if (results.length === 1) return results[0]
  
  return group.operator === 'AND' 
    ? intersectArrays(results)
    : unionArrays(results)
}

/**
 * Query property_instances for a specific property with multiple rules
 */
async function queryPropertyInstances(
  supabase: SupabaseClient,
  propertyId: string,
  rules: QueryRule[],
  property: PropertyInfo
): Promise<string[]> {
  // If multiple rules for same property, they should be ORed together
  // (e.g., age = 18 OR age = 19)
  const allIds: string[][] = []
  
  for (const rule of rules) {
    let query = supabase
      .from('property_instances')
      .select('entity_instance_id')
      .eq('property_id', propertyId)
      .eq('is_deleted', false)
    
    // Apply operator-specific filtering
    query = applyOperator(query, rule.operator, rule.value, property.property_type)
    
    const { data, error } = await query
    if (error) throw error
    
    const ids = data?.map(pi => pi.entity_instance_id) || []
    allIds.push(ids)
  }
  
  // OR the results for multiple rules on same property
  return unionArrays(allIds)
}

/**
 * Apply Supabase operator based on query operator
 */
function applyOperator<T extends Record<string, unknown>>(
  query: T,
  operator: QueryOperator,
  value: string | null,
  _propertyType: PropertyType
): T {
  switch (operator) {
    // String operators
    case 'equals':
      return query.eq('value', value)
    
    case 'not_equals':
      return query.neq('value', value)
    
    case 'contains':
      return query.ilike('value', `%${value}%`)
    
    case 'not_contains':
      return query.not('value', 'ilike', `%${value}%`)
    
    case 'starts_with':
      return query.ilike('value', `${value}%`)
    
    case 'ends_with':
      return query.ilike('value', `%${value}`)
    
    case 'is_empty':
      return query.or('value.is.null,value.eq.')
    
    case 'is_not_empty':
      return query.not('value', 'is', null).neq('value', '')
    
    case 'matches_regex':
      // Note: Supabase doesn't support regex directly, would need RPC function
      console.warn('Regex matching not implemented in Supabase query')
      return query
    
    // Number operators (cast value for numeric comparisons)
    case 'greater_than':
      return query.gt('value', value)
    
    case 'less_than':
      return query.lt('value', value)
    
    case 'greater_than_or_equal':
      return query.gte('value', value)
    
    case 'less_than_or_equal':
      return query.lte('value', value)
    
    // Date/DateTime operators
    case 'before':
      return query.lt('value', value)
    
    case 'after':
      return query.gt('value', value)
    
    case 'in_last_days': {
      const days = parseInt(value || '0')
      const date = new Date()
      date.setDate(date.getDate() - days)
      return query.gte('value', date.toISOString())
    }
    
    case 'in_last_months': {
      const months = parseInt(value || '0')
      const date = new Date()
      date.setMonth(date.getMonth() - months)
      return query.gte('value', date.toISOString())
    }
    
    case 'is_today': {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return query.gte('value', today.toISOString()).lt('value', tomorrow.toISOString())
    }
    
    case 'is_this_week': {
      const now = new Date()
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)
      return query.gte('value', weekStart.toISOString()).lt('value', weekEnd.toISOString())
    }
    
    case 'is_this_month': {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      return query.gte('value', monthStart.toISOString()).lt('value', monthEnd.toISOString())
    }
    
    // Boolean operators
    case 'is_true':
      return query.eq('value', 'true')
    
    case 'is_false':
      return query.eq('value', 'false')
    
    // Null operators
    case 'is_null':
      return query.is('value', null)
    
    case 'is_not_null':
      return query.not('value', 'is', null)
    
    default:
      console.warn(`Unknown operator: ${operator}`)
      return query
  }
}

/**
 * Get full entity instances with all properties for given IDs
 */
export async function fetchEntityInstances(
  supabase: SupabaseClient,
  entityId: string,
  instanceIds: string[] | null,
  limit?: number,
  offset?: number
) {
  // If instanceIds is null, fetch all instances (empty query)
  // If instanceIds is empty array, return empty results (no matches)
  if (instanceIds !== null && instanceIds.length === 0) {
    return { data: [], total: 0 }
  }
  
  // Get total count
  let countQuery = supabase
    .from('entity_instances')
    .select('*', { count: 'exact', head: true })
    .eq('entity_id', entityId)
    .eq('is_deleted', false)
  
  if (instanceIds !== null) {
    countQuery = countQuery.in('id', instanceIds)
  }
  
  const { count, error: countError } = await countQuery
  if (countError) throw countError
  
  // Get paginated instances
  let query = supabase
    .from('entity_instances')
    .select(`
      *,
      property_instances!inner(
        id,
        property_id,
        value,
        sort_order,
        properties!inner(
          property_name,
          property_type
        )
      )
    `)
    .eq('entity_id', entityId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
  
  if (instanceIds !== null) {
    query = query.in('id', instanceIds)
  }
  
  if (limit !== undefined && offset !== undefined) {
    query = query.range(offset, offset + limit - 1)
  } else if (limit !== undefined) {
    query = query.limit(limit)
  }
  
  const { data, error } = await query
  if (error) throw error
  
  // Transform to expected format
  const instances = data?.map(instance => {
    const propertyValues: Record<string, any> = {}
    
    if (Array.isArray(instance.property_instances)) {
      instance.property_instances.forEach((pi: any) => {
        if (pi.properties?.property_name) {
          propertyValues[pi.properties.property_name] = pi.value
        }
      })
    }
    
    return {
      id: instance.id,
      entity_id: instance.entity_id,
      created_at: instance.created_at,
      updated_at: instance.updated_at,
      created_by: instance.created_by,
      last_modified_by: instance.last_modified_by,
      is_deleted: instance.is_deleted,
      properties: propertyValues
    }
  }) || []
  
  return {
    data: instances,
    total: count || 0
  }
}

/**
 * Utility functions for set operations
 */
function intersectArrays(arrays: string[][]): string[] {
  if (arrays.length === 0) return []
  if (arrays.length === 1) return arrays[0]
  
  // Start with first array and intersect with others
  let result = new Set(arrays[0])
  
  for (let i = 1; i < arrays.length; i++) {
    const currentSet = new Set(arrays[i])
    result = new Set([...result].filter(id => currentSet.has(id)))
  }
  
  return Array.from(result)
}

function unionArrays(arrays: string[][]): string[] {
  const result = new Set<string>()
  
  for (const array of arrays) {
    for (const id of array) {
      result.add(id)
    }
  }
  
  return Array.from(result)
}