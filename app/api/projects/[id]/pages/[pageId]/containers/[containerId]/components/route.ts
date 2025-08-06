import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { CreateComponentInput, ComponentType } from '@/types/page'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; pageId: string; containerId: string }> }
) {
  try {
    const { id: projectId, pageId, containerId } = await context.params
    const supabase = await createClient()
    const json = await request.json() as CreateComponentInput

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

    // Verify container belongs to page and project
    const { data: container } = await supabase
      .from('containers')
      .select('id, page_id, pages!inner(project_id)')
      .eq('id', containerId)
      .eq('page_id', pageId)
      .eq('pages.project_id', projectId)
      .single()

    if (!container) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 })
    }

    // Get max sort order for components in this container
    const { data: existingComponents } = await supabase
      .from('components')
      .select('sort_order')
      .eq('container_id', containerId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const maxSortOrder = existingComponents?.[0]?.sort_order ?? -1

    // Create the component
    const { data: component, error } = await supabase
      .from('components')
      .insert({
        container_id: containerId,
        component_type: json.component_type,
        sort_order: json.sort_order ?? maxSortOrder + 1,
        created_by: user.id,
        last_modified_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating component:', error)
      return NextResponse.json({ error: 'Failed to create component' }, { status: 500 })
    }

    // Add default configuration based on component type
    const defaultConfig = getDefaultConfig(json.component_type)
    if (defaultConfig.length > 0) {
      const configInserts = defaultConfig.map(({ key, value }) => ({
        component_id: component.id,
        key,
        value,
        created_by: user.id,
        last_modified_by: user.id
      }))

      const { error: configError } = await supabase
        .from('component_config')
        .insert(configInserts)

      if (configError) {
        console.error('Error creating component config:', configError)
        // Continue even if config fails
      }
    }

    return NextResponse.json({ component })
  } catch (error) {
    console.error('Error in component POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getDefaultConfig(componentType: ComponentType): { key: string; value: string }[] {
  switch (componentType) {
    case ComponentType.Label:
      return [
        { key: 'type', value: 'static' },
        { key: 'text', value: 'New Label' }
      ]
    case ComponentType.Form:
      return [
        { key: 'formType', value: 'create' },
        { key: 'columns', value: '1' }
      ]
    case ComponentType.List:
      return [
        { key: 'pageSize', value: '50' }
      ]
    case ComponentType.Table:
      return [
        { key: 'pageSize', value: '50' }
      ]
    default:
      return []
  }
}