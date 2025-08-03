import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { UpdateContainerInput } from '@/types/page'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; pageId: string; containerId: string }> }
) {
  try {
    const { id: projectId, pageId, containerId } = await context.params
    const supabase = await createClient()
    const json = await request.json() as UpdateContainerInput

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user has content manager or admin role
    const { data: role } = await supabase
      .from('user_project_roles')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!role || role.role === 'default') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Verify page belongs to project and container belongs to page
    const { data: page } = await supabase
      .from('pages')
      .select('id')
      .eq('id', pageId)
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .single()

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    const { data: existingContainer } = await supabase
      .from('containers')
      .select('id, layout_type')
      .eq('id', containerId)
      .eq('page_id', pageId)
      .single()

    if (!existingContainer) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 })
    }

    // Validate parent container if provided
    if (json.parent_container_id !== undefined) {
      // Check for circular reference
      if (json.parent_container_id === containerId) {
        return NextResponse.json({ error: 'Container cannot be its own parent' }, { status: 400 })
      }

      if (json.parent_container_id) {
        const { data: parentContainer } = await supabase
          .from('containers')
          .select('id')
          .eq('id', json.parent_container_id)
          .eq('page_id', pageId)
          .single()

        if (!parentContainer) {
          return NextResponse.json({ error: 'Parent container not found' }, { status: 400 })
        }

        // TODO: Check for circular references in hierarchy
      }
    }

    // Determine the layout type (use existing if not changing)
    const layoutType = json.layout_type || existingContainer.layout_type

    // Validate grid columns if grid layout
    if (layoutType === 'grid' && json.grid_columns !== undefined && json.grid_columns !== null && json.grid_columns < 1) {
      return NextResponse.json({ error: 'Grid columns must be at least 1' }, { status: 400 })
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      ...json,
      last_modified_by: user.id,
      updated_at: new Date().toISOString()
    }

    // Clear flex properties if switching to grid
    if (json.layout_type === 'grid') {
      updateData.flex_direction = null
      updateData.flex_justify = null
      updateData.flex_align = null
    }
    // Clear grid properties if switching to flex
    else if (json.layout_type === 'flex') {
      updateData.grid_columns = null
    }

    // Update the container
    const { data: container, error } = await supabase
      .from('containers')
      .update(updateData)
      .eq('id', containerId)
      .select()
      .single()

    if (error) {
      console.error('Error updating container:', error)
      return NextResponse.json({ error: 'Failed to update container' }, { status: 500 })
    }

    return NextResponse.json({ container })
  } catch (error) {
    console.error('Error in container PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; pageId: string; containerId: string }> }
) {
  try {
    const { id: projectId, pageId, containerId } = await context.params
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user has content manager or admin role
    const { data: role } = await supabase
      .from('user_project_roles')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!role || role.role === 'default') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Verify page belongs to project and container belongs to page
    const { data: page } = await supabase
      .from('pages')
      .select('id')
      .eq('id', pageId)
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .single()

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    const { data: existingContainer } = await supabase
      .from('containers')
      .select('id')
      .eq('id', containerId)
      .eq('page_id', pageId)
      .single()

    if (!existingContainer) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 })
    }

    // Delete the container (CASCADE will handle child containers and components)
    const { error } = await supabase
      .from('containers')
      .delete()
      .eq('id', containerId)

    if (error) {
      console.error('Error deleting container:', error)
      return NextResponse.json({ error: 'Failed to delete container' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in container DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}