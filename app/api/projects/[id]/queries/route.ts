import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { Query, CreateQueryData } from '@/types/query'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params
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

    // Get all non-deleted queries for the project
    const { data: queries, error } = await supabase
      .from('queries')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .order('name')

    if (error) {
      console.error('Error fetching queries:', error)
      console.error('Project ID:', projectId)
      console.error('User ID:', user.id)
      return NextResponse.json({ 
        error: 'Failed to fetch queries',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json(queries as Query[])
  } catch (error) {
    console.error('Unexpected error in GET /api/projects/[id]/queries:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
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
  const body: CreateQueryData = await request.json()

  // Validate entity exists and belongs to project
  const { data: entity, error: entityError } = await supabase
    .from('entities')
    .select('id, project_id')
    .eq('id', body.entity_id)
    .eq('project_id', projectId)
    .eq('is_deleted', false)
    .single()

  if (entityError || !entity) {
    return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
  }

  // Create query
  const { data: query, error } = await supabase
    .from('queries')
    .insert({
      project_id: projectId,
      entity_id: body.entity_id,
      name: body.name,
      created_by: user.id,
      last_modified_by: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating query:', error)
    return NextResponse.json({ error: 'Failed to create query' }, { status: 500 })
  }

  // Automatically create the root group for the query
  const { error: groupError } = await supabase
    .from('query_groups')
    .insert({
      query_id: query.id,
      parent_group_id: null,
      operator: 'AND',
      sort_order: 0,
      created_by: user.id,
      last_modified_by: user.id
    })

  if (groupError) {
    console.error('Error creating root group:', groupError)
    // Rollback by deleting the query
    await supabase
      .from('queries')
      .delete()
      .eq('id', query.id)
    return NextResponse.json({ error: 'Failed to create query root group' }, { status: 500 })
  }

  return NextResponse.json(query as Query, { status: 201 })
}