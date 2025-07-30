import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { CreateEntityInput } from '@/types/entity'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const projectId = params.id

  // Check user has access to project
  const { data: role, error: roleError } = await supabase
    .from('user_project_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('project_id', projectId)
    .single()

  if (roleError || !role) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (role.role !== 'administrator') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Get entities
  const { data: entities, error: entitiesError } = await supabase
    .from('entities')
    .select('*')
    .eq('project_id', projectId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (entitiesError) {
    console.error('Error fetching entities:', entitiesError)
    return NextResponse.json({ error: 'Failed to fetch entities' }, { status: 500 })
  }

  // Get property counts for each entity
  const entityIds = entities.map(e => e.id)
  const { data: propertyCounts, error: countError } = await supabase
    .from('properties')
    .select('entity_id')
    .in('entity_id', entityIds)
    .eq('is_deleted', false)

  if (countError) {
    console.error('Error fetching property counts:', countError)
  }

  // Count properties per entity
  const propertyCountMap = propertyCounts?.reduce((acc, prop) => {
    acc[prop.entity_id] = (acc[prop.entity_id] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  // Transform the data to include property_count
  const transformedEntities = entities.map(entity => ({
    ...entity,
    property_count: propertyCountMap[entity.id] || 0
  }))

  return NextResponse.json({ entities: transformedEntities })
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const projectId = params.id

  // Check user has admin access
  const { data: role, error: roleError } = await supabase
    .from('user_project_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('project_id', projectId)
    .single()

  if (roleError || !role || role.role !== 'administrator') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  try {
    const body: CreateEntityInput = await request.json()

    // Validate input
    if (!body.name || !body.display_string) {
      return NextResponse.json({ error: 'Name and display string are required' }, { status: 400 })
    }

    // Check for duplicate name
    const { data: existing } = await supabase
      .from('entities')
      .select('id')
      .eq('project_id', projectId)
      .eq('name', body.name)
      .eq('is_deleted', false)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'An entity with this name already exists' }, { status: 400 })
    }

    // Create entity
    const { data: entity, error: createError } = await supabase
      .from('entities')
      .insert({
        project_id: projectId,
        name: body.name,
        display_string: body.display_string,
        created_by: user.id,
        last_modified_by: user.id
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating entity:', createError)
      return NextResponse.json({ error: 'Failed to create entity' }, { status: 500 })
    }

    return NextResponse.json({ entity })
  } catch (error) {
    console.error('Entity creation error:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}