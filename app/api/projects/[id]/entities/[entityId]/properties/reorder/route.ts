import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { ReorderPropertiesInput } from '@/types/entity'

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
    const body: ReorderPropertiesInput = await request.json()

    if (!body.property_ids || !Array.isArray(body.property_ids)) {
      return NextResponse.json({ error: 'property_ids array is required' }, { status: 400 })
    }

    // Verify all properties belong to this entity
    const { data: properties } = await supabase
      .from('properties')
      .select('id')
      .eq('entity_id', entityId)
      .eq('is_deleted', false)
      .in('id', body.property_ids)

    if (!properties || properties.length !== body.property_ids.length) {
      return NextResponse.json({ error: 'Invalid property IDs' }, { status: 400 })
    }

    // Update sort order for each property
    const updates = body.property_ids.map((id, index) => ({
      id,
      sort_order: index,
      last_modified_by: user.id,
      updated_at: new Date().toISOString()
    }))

    // Batch update
    for (const update of updates) {
      const { error } = await supabase
        .from('properties')
        .update({
          sort_order: update.sort_order,
          last_modified_by: update.last_modified_by,
          updated_at: update.updated_at
        })
        .eq('id', update.id)

      if (error) {
        console.error('Error updating property order:', error)
        return NextResponse.json({ error: 'Failed to reorder properties' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Property reorder error:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}