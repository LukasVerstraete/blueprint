import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { CreatePageInput, PageWithChildren, LayoutType, FlexDirection, FlexAlign } from '@/types/page'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params
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

    // Get all pages for the project with their parameters
    const { data: pages, error } = await supabase
      .from('pages')
      .select(`
        *,
        parameters:page_parameters(*)
      `)
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching pages:', error)
      return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 })
    }

    // Build hierarchical structure
    const pageMap = new Map<string, PageWithChildren>()
    const rootPages: PageWithChildren[] = []

    // First pass: create map
    pages?.forEach(page => {
      pageMap.set(page.id, { ...page, children: [] })
    })

    // Second pass: build hierarchy
    pages?.forEach(page => {
      const pageWithChildren = pageMap.get(page.id)
      if (!pageWithChildren) return
      
      if (page.parent_page_id) {
        const parent = pageMap.get(page.parent_page_id)
        if (parent && parent.children) {
          parent.children.push(pageWithChildren)
        }
      } else {
        rootPages.push(pageWithChildren)
      }
    })

    return NextResponse.json({ pages: rootPages })
  } catch (error) {
    console.error('Error in pages GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params
    const supabase = await createClient()
    const json = await request.json() as CreatePageInput

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

    // Validate parent page if provided
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
    }

    // Create the page
    const { data: page, error } = await supabase
      .from('pages')
      .insert({
        project_id: projectId,
        name: json.name,
        parent_page_id: json.parent_page_id || null,
        breadcrumb_template: json.breadcrumb_template || null,
        sort_order: json.sort_order || 0,
        created_by: user.id,
        last_modified_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating page:', error)
      return NextResponse.json({ error: 'Failed to create page' }, { status: 500 })
    }

    // Auto-create root container for the page
    const { error: containerError } = await supabase
      .from('containers')
      .insert({
        page_id: page.id,
        parent_container_id: null,
        layout_type: LayoutType.Flex,
        flex_direction: FlexDirection.Column,
        flex_align: FlexAlign.Stretch,
        spacing: 24,
        padding: 24,
        sort_order: 0,
        created_by: user.id,
        last_modified_by: user.id
      })

    if (containerError) {
      console.error('Error creating root container:', containerError)
      // Don't fail the page creation, just log the error
    }

    return NextResponse.json({ page })
  } catch (error) {
    console.error('Error in pages POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}