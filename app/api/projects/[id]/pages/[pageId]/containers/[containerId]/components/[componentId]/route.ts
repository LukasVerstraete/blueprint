import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { UpdateComponentInput } from '@/types/page'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; pageId: string; containerId: string; componentId: string }> }
) {
  try {
    const { id: projectId, pageId, containerId, componentId } = await context.params
    const supabase = await createClient()
    const json = await request.json() as UpdateComponentInput

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

    // Update the component
    const updateData: any = {
      last_modified_by: user.id,
      updated_at: new Date().toISOString()
    }

    if (json.container_id !== undefined) updateData.container_id = json.container_id
    if (json.sort_order !== undefined) updateData.sort_order = json.sort_order

    const { data: updatedComponent, error } = await supabase
      .from('components')
      .update(updateData)
      .eq('id', componentId)
      .select()
      .single()

    if (error) {
      console.error('Error updating component:', error)
      return NextResponse.json({ error: 'Failed to update component' }, { status: 500 })
    }

    return NextResponse.json({ component: updatedComponent })
  } catch (error) {
    console.error('Error in component PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; pageId: string; containerId: string; componentId: string }> }
) {
  try {
    const { id: projectId, pageId, containerId, componentId } = await context.params
    const supabase = await createClient()

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

    // Delete the component (cascade will handle related records)
    const { error } = await supabase
      .from('components')
      .delete()
      .eq('id', componentId)

    if (error) {
      console.error('Error deleting component:', error)
      return NextResponse.json({ error: 'Failed to delete component' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in component DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}