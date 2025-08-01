import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { Query, UpdateQueryData, QueryGroupWithRules } from '@/types/query'

export async function GET(
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

  // Get query with nested groups and rules
  const { data: query, error: queryError } = await supabase
    .from('queries')
    .select('*')
    .eq('id', queryId)
    .eq('project_id', projectId)
    .eq('is_deleted', false)
    .single()

  if (queryError || !query) {
    return NextResponse.json({ error: 'Query not found' }, { status: 404 })
  }

  // Get all groups for this query
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
  const rootGroups: QueryGroupWithRules[] = []
  groups?.forEach(group => {
    const groupWithRules = groupsMap.get(group.id)!
    if (group.parent_group_id) {
      const parent = groupsMap.get(group.parent_group_id)
      if (parent) {
        parent.groups = parent.groups || []
        parent.groups.push(groupWithRules)
      }
    } else {
      rootGroups.push(groupWithRules)
    }
  })

  const queryWithDetails = {
    ...query,
    groups: rootGroups
  }

  return NextResponse.json(queryWithDetails)
}

export async function PATCH(
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

  // Check user has ContentManager or Administrator role
  const { data: role, error: roleError } = await supabase
    .from('user_project_roles')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single()

  if (roleError || !role || role.role === 'default') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Parse request body
  const body: UpdateQueryData = await request.json()

  // Update query
  const { data: query, error } = await supabase
    .from('queries')
    .update({
      ...body,
      last_modified_by: user.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', queryId)
    .eq('project_id', projectId)
    .eq('is_deleted', false)
    .select()
    .single()

  if (error) {
    console.error('Error updating query:', error)
    return NextResponse.json({ error: 'Failed to update query' }, { status: 500 })
  }

  if (!query) {
    return NextResponse.json({ error: 'Query not found' }, { status: 404 })
  }

  return NextResponse.json(query as Query)
}

export async function DELETE(
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

  // Check user has ContentManager or Administrator role
  const { data: role, error: roleError } = await supabase
    .from('user_project_roles')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single()

  if (roleError || !role || role.role === 'default') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Soft delete query
  const { error } = await supabase
    .from('queries')
    .update({
      is_deleted: true,
      last_modified_by: user.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', queryId)
    .eq('project_id', projectId)

  if (error) {
    console.error('Error deleting query:', error)
    return NextResponse.json({ error: 'Failed to delete query' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}