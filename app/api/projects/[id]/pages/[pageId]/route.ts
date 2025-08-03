import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { UpdatePageInput } from '@/types/page'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const { id: projectId, pageId } = await context.params
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user has access to project
    const { data: role } = await supabase
      .from('user_project_roles')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!role) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 })
    }

    // Get page with parameters and containers
    const { data: page, error } = await supabase
      .from('pages')
      .select(`
        *,
        parameters:page_parameters(*),
        containers(
          *,
          components(
            *,
            config:component_config(*),
            form_properties(*),
            table_columns(*)
          )
        )
      `)
      .eq('id', pageId)
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .single()

    if (error || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    return NextResponse.json({ page })
  } catch (error) {
    console.error('Error in page GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const { id: projectId, pageId } = await context.params
    const supabase = await createClient()
    const json = await request.json() as UpdatePageInput

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

    // Verify page belongs to project
    const { data: existingPage } = await supabase
      .from('pages')
      .select('id')
      .eq('id', pageId)
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .single()

    if (!existingPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Validate parent page if provided
    if (json.parent_page_id !== undefined) {
      // Check for circular reference
      if (json.parent_page_id === pageId) {
        return NextResponse.json({ error: 'Page cannot be its own parent' }, { status: 400 })
      }

      if (json.parent_page_id) {
        const { data: parentPage } = await supabase
          .from('pages')
          .select('id')
          .eq('id', json.parent_page_id)
          .eq('project_id', projectId)
          .eq('is_deleted', false)
          .single()

        if (!parentPage) {
          return NextResponse.json({ error: 'Parent page not found' }, { status: 400 })
        }

        // TODO: Check for circular references in hierarchy
      }
    }

    // Update the page
    const { data: page, error } = await supabase
      .from('pages')
      .update({
        ...json,
        last_modified_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', pageId)
      .select()
      .single()

    if (error) {
      console.error('Error updating page:', error)
      return NextResponse.json({ error: 'Failed to update page' }, { status: 500 })
    }

    return NextResponse.json({ page })
  } catch (error) {
    console.error('Error in page PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const { id: projectId, pageId } = await context.params
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

    // Verify page belongs to project
    const { data: existingPage } = await supabase
      .from('pages')
      .select('id')
      .eq('id', pageId)
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .single()

    if (!existingPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Check if page has children
    const { data: children } = await supabase
      .from('pages')
      .select('id')
      .eq('parent_page_id', pageId)
      .eq('is_deleted', false)
      .limit(1)

    if (children && children.length > 0) {
      return NextResponse.json({ error: 'Cannot delete page with subpages' }, { status: 400 })
    }

    // Soft delete the page
    const { error } = await supabase
      .from('pages')
      .update({
        is_deleted: true,
        last_modified_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', pageId)

    if (error) {
      console.error('Error deleting page:', error)
      return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in page DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}