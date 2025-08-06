import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { ComponentConfigInput } from '@/types/page'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; pageId: string; containerId: string; componentId: string }> }
) {
  try {
    const { id: projectId, pageId, containerId, componentId } = await context.params
    const supabase = await createClient()
    const json = await request.json() as ComponentConfigInput[]

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

    // Verify component belongs to container, page, and project
    const { data: component } = await supabase
      .from('components')
      .select(`
        id,
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

    // Delete existing config
    const { error: deleteError } = await supabase
      .from('component_config')
      .delete()
      .eq('component_id', componentId)

    if (deleteError) {
      console.error('Error deleting existing config:', deleteError)
      return NextResponse.json({ error: 'Failed to update config' }, { status: 500 })
    }

    // Insert new config
    if (json.length > 0) {
      const configInserts = json.map(({ key, value }) => ({
        component_id: componentId,
        key,
        value,
        created_by: user.id,
        last_modified_by: user.id
      }))

      const { error: insertError } = await supabase
        .from('component_config')
        .insert(configInserts)

      if (insertError) {
        console.error('Error inserting new config:', insertError)
        return NextResponse.json({ error: 'Failed to update config' }, { status: 500 })
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
    console.error('Error in component config PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}