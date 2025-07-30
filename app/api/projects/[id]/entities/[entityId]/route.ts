import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { UpdateEntityInput } from '@/types/entity'

export async function GET(
  request: Request,
  { params }: { params: { id: string; entityId: string } }
) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const projectId = params.id
  const entityId = params.entityId

  // Check user has access
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

  // Get entity
  const { data: entity, error: entityError } = await supabase
    .from('entities')
    .select('*')
    .eq('id', entityId)
    .eq('project_id', projectId)
    .eq('is_deleted', false)
    .single()

  if (entityError || !entity) {
    return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
  }

  // Get properties for this entity
  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('*')
    .eq('entity_id', entityId)
    .eq('is_deleted', false)
    .order('sort_order', { ascending: true })

  if (propertiesError) {
    console.error('Error fetching properties:', propertiesError)
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
  }

  // Combine entity with properties
  const entityWithProperties = {
    ...entity,
    properties: properties || []
  }

  return NextResponse.json({ entity: entityWithProperties })
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string; entityId: string } }
) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const projectId = params.id
  const entityId = params.entityId

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
    const body: UpdateEntityInput = await request.json()

    // Check entity exists
    const { data: existing } = await supabase
      .from('entities')
      .select('id')
      .eq('id', entityId)
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
    }

    // Check for duplicate name if updating name
    if (body.name) {
      const { data: duplicate } = await supabase
        .from('entities')
        .select('id')
        .eq('project_id', projectId)
        .eq('name', body.name)
        .eq('is_deleted', false)
        .neq('id', entityId)
        .single()

      if (duplicate) {
        return NextResponse.json({ error: 'An entity with this name already exists' }, { status: 400 })
      }
    }

    // Update entity
    const { data: entity, error: updateError } = await supabase
      .from('entities')
      .update({
        ...body,
        last_modified_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', entityId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating entity:', updateError)
      return NextResponse.json({ error: 'Failed to update entity' }, { status: 500 })
    }

    return NextResponse.json({ entity })
  } catch (error) {
    console.error('Entity update error:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; entityId: string } }
) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const projectId = params.id
  const entityId = params.entityId

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

  // Check entity exists
  const { data: existing } = await supabase
    .from('entities')
    .select('id')
    .eq('id', entityId)
    .eq('project_id', projectId)
    .eq('is_deleted', false)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
  }

  // Get impact analysis
  const { data: referencingProperties } = await supabase
    .from('properties')
    .select('id')
    .eq('referenced_entity_id', entityId)
    .eq('is_deleted', false)

  // For now, we'll just count references. In future phases, we'll add page and query references
  const impactCount = referencingProperties?.length || 0

  // Soft delete
  const { error: deleteError } = await supabase
    .from('entities')
    .update({
      is_deleted: true,
      last_modified_by: user.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', entityId)

  if (deleteError) {
    console.error('Error deleting entity:', deleteError)
    return NextResponse.json({ error: 'Failed to delete entity' }, { status: 500 })
  }

  return NextResponse.json({ 
    success: true,
    impact: {
      property_references: impactCount
    }
  })
}