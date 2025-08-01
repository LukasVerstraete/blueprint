import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { QueryResult, QueryGroupWithRules } from '@/types/query'
import { executeQuery, fetchEntityInstances } from '@/lib/query-utils'
import { Property } from '@/types/entity'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; queryId: string }> }
) {
  const { id: projectId, queryId } = await params
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check user has access to project
  const { data: role, error: roleError } = await supabase
    .from('user_project_roles')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single()

  if (roleError || !role) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // Parse pagination parameters from request body
  const body = await request.json()
  const page = body.page || 1
  const pageSize = body.pageSize || 50
  const offset = (page - 1) * pageSize
  const groupsFromBody = body.groups as QueryGroupWithRules[] | undefined

  // Get query details
  const { data: query, error: queryError } = await supabase
    .from('queries')
    .select('*, entity:entities!inner(*)')
    .eq('id', queryId)
    .eq('project_id', projectId)
    .eq('is_deleted', false)
    .single()

  if (queryError || !query) {
    return NextResponse.json({ error: 'Query not found' }, { status: 404 })
  }

  let rootGroup: QueryGroupWithRules | null = null

  // If groups are provided in the request body, use them
  if (groupsFromBody && groupsFromBody.length > 0) {
    rootGroup = groupsFromBody[0]
  } else {
    // Otherwise, fetch from database
    const { data: groups, error: groupsError } = await supabase
      .from('query_groups')
      .select('*')
      .eq('query_id', queryId)
      .order('sort_order')

    if (groupsError) {
      console.error('Error fetching query groups:', groupsError)
      return NextResponse.json({ error: 'Failed to fetch query groups' }, { status: 500 })
    }

    // Get all rules for all groups
    const groupIds = groups?.map(g => g.id) || []
    const { data: rules, error: rulesError } = await supabase
      .from('query_rules')
      .select('*')
      .in('query_group_id', groupIds)
      .order('sort_order')

    if (rulesError) {
      console.error('Error fetching query rules:', rulesError)
      return NextResponse.json({ error: 'Failed to fetch query rules' }, { status: 500 })
    }

    // Build nested structure
    const groupsMap = new Map<string, QueryGroupWithRules>()
    groups?.forEach(group => {
      groupsMap.set(group.id, {
        ...group,
        rules: rules?.filter(r => r.query_group_id === group.id) || [],
        groups: []
      })
    })

    // Build hierarchy
    groups?.forEach(group => {
      const groupWithRules = groupsMap.get(group.id)!
      if (group.parent_group_id) {
        const parent = groupsMap.get(group.parent_group_id)
        if (parent) {
          parent.groups = parent.groups || []
          parent.groups.push(groupWithRules)
        }
      } else {
        rootGroup = groupWithRules
      }
    })
  }

  // Get properties for the entity
  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('*')
    .eq('entity_id', query.entity_id)
    .eq('is_deleted', false)

  if (propertiesError) {
    console.error('Error fetching properties:', propertiesError)
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
  }

  try {
    // Phase 1: Execute query to get matching entity instance IDs
    const matchingIds = await executeQuery(
      supabase,
      query.entity_id,
      rootGroup,
      properties as Property[]
    )

    // Phase 2: Fetch full entity instances with properties
    const { data: instances, total } = await fetchEntityInstances(
      supabase,
      query.entity_id,
      matchingIds,
      pageSize,
      offset
    )

    // Format response
    const result: QueryResult = {
      data: instances,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error executing query:', error)
    return NextResponse.json({ 
      error: 'Failed to execute query',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}