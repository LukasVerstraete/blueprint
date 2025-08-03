import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { UpdatePageParameterInput } from '@/types/page'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; pageId: string; parameterId: string }> }
) {
  try {
    const { id: projectId, pageId, parameterId } = await context.params
    const supabase = await createClient()
    const json = await request.json() as UpdatePageParameterInput

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

    // Verify page belongs to project and parameter belongs to page
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

    const { data: existingParameter } = await supabase
      .from('page_parameters')
      .select('id')
      .eq('id', parameterId)
      .eq('page_id', pageId)
      .single()

    if (!existingParameter) {
      return NextResponse.json({ error: 'Parameter not found' }, { status: 404 })
    }

    // Check if new name conflicts with existing parameter
    if (json.name) {
      const { data: conflict } = await supabase
        .from('page_parameters')
        .select('id')
        .eq('page_id', pageId)
        .eq('name', json.name)
        .neq('id', parameterId)
        .single()

      if (conflict) {
        return NextResponse.json({ error: 'Parameter with this name already exists' }, { status: 400 })
      }
    }

    // Update the parameter
    const { data: parameter, error } = await supabase
      .from('page_parameters')
      .update({
        ...json,
        last_modified_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', parameterId)
      .select()
      .single()

    if (error) {
      console.error('Error updating parameter:', error)
      return NextResponse.json({ error: 'Failed to update parameter' }, { status: 500 })
    }

    return NextResponse.json({ parameter })
  } catch (error) {
    console.error('Error in parameter PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; pageId: string; parameterId: string }> }
) {
  try {
    const { id: projectId, pageId, parameterId } = await context.params
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

    // Verify page belongs to project and parameter belongs to page
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

    const { data: existingParameter } = await supabase
      .from('page_parameters')
      .select('id')
      .eq('id', parameterId)
      .eq('page_id', pageId)
      .single()

    if (!existingParameter) {
      return NextResponse.json({ error: 'Parameter not found' }, { status: 404 })
    }

    // Delete the parameter (hard delete with CASCADE)
    const { error } = await supabase
      .from('page_parameters')
      .delete()
      .eq('id', parameterId)

    if (error) {
      console.error('Error deleting parameter:', error)
      return NextResponse.json({ error: 'Failed to delete parameter' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in parameter DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}