import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { QueryGroup, CreateQueryGroupData } from '@/types/query'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; queryId: string }> }
) {
  const { queryId } = await params
  const supabase = await createClient()

  const { data: groups, error } = await supabase
    .from('query_groups')
    .select(`
      *,
      rules:query_rules(*)
    `)
    .eq('query_id', queryId)
    .order('sort_order')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Order rules within each group
  groups?.forEach(group => {
    if (group.rules) {
      group.rules.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
    }
  })

  return NextResponse.json(groups)
}

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

  // Verify query exists and belongs to project
  const { data: query, error: queryError } = await supabase
    .from('queries')
    .select('id')
    .eq('id', queryId)
    .eq('project_id', projectId)
    .eq('is_deleted', false)
    .single()

  if (queryError || !query) {
    return NextResponse.json({ error: 'Query not found' }, { status: 404 })
  }

  // Parse request body
  const body: CreateQueryGroupData = await request.json()

  // If parent_group_id is provided, verify it belongs to the same query
  if (body.parent_group_id) {
    const { data: parentGroup, error: parentError } = await supabase
      .from('query_groups')
      .select('id')
      .eq('id', body.parent_group_id)
      .eq('query_id', queryId)
      .single()

    if (parentError || !parentGroup) {
      return NextResponse.json({ error: 'Parent group not found' }, { status: 404 })
    }
  }

  // Create query group
  const { data: group, error } = await supabase
    .from('query_groups')
    .insert({
      query_id: queryId,
      parent_group_id: body.parent_group_id,
      operator: body.operator,
      sort_order: body.sort_order,
      created_by: user.id,
      last_modified_by: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating query group:', error)
    return NextResponse.json({ error: 'Failed to create query group' }, { status: 500 })
  }

  return NextResponse.json(group as QueryGroup, { status: 201 })
}