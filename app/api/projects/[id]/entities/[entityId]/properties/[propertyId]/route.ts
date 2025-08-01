import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { UpdatePropertyInput } from '@/types/entity'
import { validatePropertyType, detectCycles, toCamelCase } from '@/lib/entity-utils'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; entityId: string; propertyId: string }> }
) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: projectId, entityId, propertyId } = await params

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
    const body: UpdatePropertyInput = await request.json()

    // Check property exists
    const { data: existing } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .eq('entity_id', entityId)
      .eq('is_deleted', false)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Validate default value if provided
    const propertyType = body.property_type || existing.property_type
    if (body.default_value && !validatePropertyType(body.default_value, propertyType)) {
      return NextResponse.json({ error: 'Invalid default value for property type' }, { status: 400 })
    }

    // If name is updated, update property_name as well
    const updateData = { ...body }
    if (body.name && body.name !== existing.name) {
      updateData.property_name = toCamelCase(body.name)
    }

    // Check for duplicate property name if updating name
    const propertyNameToCheck = updateData.property_name || body.property_name
    if (propertyNameToCheck && propertyNameToCheck !== existing.property_name) {
      const { data: duplicate } = await supabase
        .from('properties')
        .select('id')
        .eq('entity_id', entityId)
        .eq('property_name', propertyNameToCheck)
        .eq('is_deleted', false)
        .neq('id', propertyId)
        .single()

      if (duplicate) {
        return NextResponse.json({ error: 'A property with this name already exists' }, { status: 400 })
      }
    }

    // For entity type properties, check for cycles
    if ((body.property_type === 'entity' || existing.property_type === 'entity') && 
        (body.referenced_entity_id || existing.referenced_entity_id)) {
      const referencedEntityId = body.referenced_entity_id || existing.referenced_entity_id
      
      // Get entity's project
      const { data: entity } = await supabase
        .from('entities')
        .select('project_id')
        .eq('id', entityId)
        .single()

      // Get all entities and properties in the project
      const { data: allEntities } = await supabase
        .from('entities')
        .select('*')
        .eq('project_id', entity?.project_id)
        .eq('is_deleted', false)

      const { data: allProperties } = await supabase
        .from('properties')
        .select('*')
        .in('entity_id', allEntities?.map(e => e.id) || [])
        .eq('is_deleted', false)
        .neq('id', propertyId) // Exclude current property

      if (detectCycles(allEntities || [], allProperties || [], entityId, referencedEntityId!)) {
        return NextResponse.json({ 
          error: 'This reference would create a circular dependency' 
        }, { status: 400 })
      }
    }

    // Update property
    const { data: property, error: updateError } = await supabase
      .from('properties')
      .update({
        ...updateData,
        last_modified_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', propertyId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating property:', updateError)
      return NextResponse.json({ error: 'Failed to update property' }, { status: 500 })
    }

    return NextResponse.json({ property })
  } catch (error) {
    console.error('Property update error:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; entityId: string; propertyId: string }> }
) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: projectId, entityId, propertyId } = await params

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

  // Check property exists
  const { data: existing } = await supabase
    .from('properties')
    .select('id')
    .eq('id', propertyId)
    .eq('entity_id', entityId)
    .eq('is_deleted', false)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  }

  // Soft delete
  const { error: deleteError } = await supabase
    .from('properties')
    .update({
      is_deleted: true,
      last_modified_by: user.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', propertyId)

  if (deleteError) {
    console.error('Error deleting property:', deleteError)
    return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}