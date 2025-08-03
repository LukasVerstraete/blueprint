import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { CreatePageParameterInput } from '@/types/page'

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

    // Verify page belongs to project
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

    // Get parameters for the page
    const { data: parameters, error } = await supabase
      .from('page_parameters')
      .select('*')
      .eq('page_id', pageId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching parameters:', error)
      return NextResponse.json({ error: 'Failed to fetch parameters' }, { status: 500 })
    }

    return NextResponse.json({ parameters: parameters || [] })
  } catch (error) {
    console.error('Error in parameters GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const { id: projectId, pageId } = await context.params
    const supabase = await createClient()
    const json = await request.json() as CreatePageParameterInput

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

    // Check if parameter name already exists for this page
    const { data: existing } = await supabase
      .from('page_parameters')
      .select('id')
      .eq('page_id', pageId)
      .eq('name', json.name)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Parameter with this name already exists' }, { status: 400 })
    }

    // Create the parameter
    const { data: parameter, error } = await supabase
      .from('page_parameters')
      .insert({
        page_id: pageId,
        name: json.name,
        data_type: json.data_type,
        is_required: json.is_required || false,
        created_by: user.id,
        last_modified_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating parameter:', error)
      return NextResponse.json({ error: 'Failed to create parameter' }, { status: 500 })
    }

    return NextResponse.json({ parameter })
  } catch (error) {
    console.error('Error in parameters POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}