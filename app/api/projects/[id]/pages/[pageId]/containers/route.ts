import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { CreateContainerInput, ContainerWithChildren, ComponentWithConfig } from '@/types/page'

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

    // Get all containers for the page with their components
    const { data: containers, error } = await supabase
      .from('containers')
      .select(`
        *,
        components(
          *,
          config:component_config(*),
          form_properties(*),
          table_columns(*)
        )
      `)
      .eq('page_id', pageId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching containers:', error)
      return NextResponse.json({ error: 'Failed to fetch containers' }, { status: 500 })
    }

    // Build hierarchical structure
    const containerMap = new Map<string, ContainerWithChildren>()
    const rootContainers: ContainerWithChildren[] = []

    // First pass: create map
    containers?.forEach(container => {
      containerMap.set(container.id, { 
        ...container, 
        containers: [],
        components: container.components?.sort((a: ComponentWithConfig, b: ComponentWithConfig) => a.sort_order - b.sort_order) || []
      })
    })

    // Second pass: build hierarchy
    containers?.forEach(container => {
      const containerWithChildren = containerMap.get(container.id)
      if (!containerWithChildren) return
      
      if (container.parent_container_id) {
        const parent = containerMap.get(container.parent_container_id)
        if (parent && parent.containers) {
          parent.containers.push(containerWithChildren)
        }
      } else {
        rootContainers.push(containerWithChildren)
      }
    })

    return NextResponse.json({ containers: rootContainers })
  } catch (error) {
    console.error('Error in containers GET:', error)
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
    const json = await request.json() as CreateContainerInput

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

    // Validate parent container if provided
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
    }

    // Validate grid columns if grid layout
    if (json.layout_type === 'grid' && (!json.grid_columns || json.grid_columns < 1)) {
      return NextResponse.json({ error: 'Grid layout requires grid_columns to be at least 1' }, { status: 400 })
    }

    // Create the container
    const { data: container, error } = await supabase
      .from('containers')
      .insert({
        page_id: pageId,
        parent_container_id: json.parent_container_id || null,
        layout_type: json.layout_type,
        flex_direction: json.layout_type === 'flex' ? (json.flex_direction || 'row') : null,
        flex_justify: json.layout_type === 'flex' ? (json.flex_justify || 'start') : null,
        flex_align: json.layout_type === 'flex' ? (json.flex_align || 'stretch') : null,
        grid_columns: json.layout_type === 'grid' ? json.grid_columns : null,
        spacing: json.spacing ?? 16,
        padding: json.padding ?? 0,
        background_color: json.background_color || null,
        sort_order: json.sort_order || 0,
        created_by: user.id,
        last_modified_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating container:', error)
      return NextResponse.json({ error: 'Failed to create container' }, { status: 500 })
    }

    return NextResponse.json({ container })
  } catch (error) {
    console.error('Error in containers POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}