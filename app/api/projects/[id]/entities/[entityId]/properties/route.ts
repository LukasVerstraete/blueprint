import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { CreatePropertyInput } from '@/types/entity'
import { validatePropertyType, detectCycles } from '@/lib/entity-utils'

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

  // Get properties
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

  return NextResponse.json({ properties })
}

export async function POST(
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
    const body: CreatePropertyInput = await request.json()

    // Validate input
    if (!body.name || !body.property_name || !body.property_type) {
      return NextResponse.json({ error: 'Name, property name, and type are required' }, { status: 400 })
    }

    // Validate default value if provided
    if (body.default_value && !validatePropertyType(body.default_value, body.property_type)) {
      return NextResponse.json({ error: 'Invalid default value for property type' }, { status: 400 })
    }

    // Check entity exists
    const { data: entity } = await supabase
      .from('entities')
      .select('id, project_id')
      .eq('id', entityId)
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .single()

    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
    }

    // Check for duplicate property name
    const { data: existing } = await supabase
      .from('properties')
      .select('id')
      .eq('entity_id', entityId)
      .eq('property_name', body.property_name)
      .eq('is_deleted', false)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'A property with this name already exists' }, { status: 400 })
    }

    // For entity type properties, check for cycles
    if (body.property_type === 'entity' && body.referenced_entity_id) {
      // Get all entities and properties in the project
      const { data: allEntities } = await supabase
        .from('entities')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_deleted', false)

      const { data: allProperties } = await supabase
        .from('properties')
        .select('*')
        .in('entity_id', allEntities?.map(e => e.id) || [])
        .eq('is_deleted', false)

      if (detectCycles(allEntities || [], allProperties || [], entityId, body.referenced_entity_id)) {
        return NextResponse.json({ 
          error: 'This reference would create a circular dependency' 
        }, { status: 400 })
      }
    }

    // Get max sort order
    const { data: maxSort } = await supabase
      .from('properties')
      .select('sort_order')
      .eq('entity_id', entityId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const nextSortOrder = (maxSort?.sort_order || -1) + 1

    // Create property
    const { data: property, error: createError } = await supabase
      .from('properties')
      .insert({
        entity_id: entityId,
        name: body.name,
        property_name: body.property_name,
        property_type: body.property_type,
        is_list: body.is_list || false,
        is_required: body.is_required || false,
        default_value: body.default_value,
        referenced_entity_id: body.referenced_entity_id,
        sort_order: body.sort_order ?? nextSortOrder,
        created_by: user.id,
        last_modified_by: user.id
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating property:', createError)
      return NextResponse.json({ error: 'Failed to create property' }, { status: 500 })
    }

    return NextResponse.json({ property })
  } catch (error) {
    console.error('Property creation error:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}