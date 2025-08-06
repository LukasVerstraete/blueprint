import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { FormPropertyInput } from '@/types/page'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; pageId: string; containerId: string; componentId: string }> }
) {
  try {
    const { id: projectId, pageId, containerId, componentId } = await context.params
    const supabase = await createClient()
    const json = await request.json() as FormPropertyInput[]

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user has access to project and can edit
    const { data: role } = await supabase
      .from('user_project_roles')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!role || role.role === 'default') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Verify component is a form component
    const { data: component } = await supabase
      .from('components')
      .select(`
        id,
        component_type,
        containers!inner(
          page_id,
          pages!inner(project_id)
        )
      `)
      .eq('id', componentId)
      .eq('container_id', containerId)
      .eq('containers.page_id', pageId)
      .eq('containers.pages.project_id', projectId)
      .single()

    if (!component) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 })
    }

    if (component.component_type !== 'form') {
      return NextResponse.json({ error: 'Component is not a form' }, { status: 400 })
    }

    // Delete existing form properties
    const { error: deleteError } = await supabase
      .from('form_properties')
      .delete()
      .eq('component_id', componentId)

    if (deleteError) {
      console.error('Error deleting existing form properties:', deleteError)
      return NextResponse.json({ error: 'Failed to update form properties' }, { status: 500 })
    }

    // Insert new form properties
    if (json.length > 0) {
      const propertyInserts = json.map(({ property_id, visible, sort_order }, index) => ({
        component_id: componentId,
        property_id,
        visible: visible ?? true,
        sort_order: sort_order ?? index,
        created_by: user.id,
        last_modified_by: user.id
      }))

      const { error: insertError } = await supabase
        .from('form_properties')
        .insert(propertyInserts)

      if (insertError) {
        console.error('Error inserting form properties:', insertError)
        return NextResponse.json({ error: 'Failed to update form properties' }, { status: 500 })
      }
    }

    // Update component's updated_at
    await supabase
      .from('components')
      .update({ 
        updated_at: new Date().toISOString(),
        last_modified_by: user.id
      })
      .eq('id', componentId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in form properties PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}