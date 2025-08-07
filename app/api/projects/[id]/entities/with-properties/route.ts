import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: projectId } = await params

  // Check user has access to project
  const { data: role, error: roleError } = await supabase
    .from('user_project_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('project_id', projectId)
    .single()

  if (roleError || !role) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // For property configuration, content managers also need access
  if (!['administrator', 'content_manager'].includes(role.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Get entities first
  const { data: entities, error: entitiesError } = await supabase
    .from('entities')
    .select('*')
    .eq('project_id', projectId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (entitiesError) {
    console.error('Error fetching entities:', entitiesError)
    return NextResponse.json({ error: 'Failed to fetch entities' }, { status: 500 })
  }

  if (!entities || entities.length === 0) {
    return NextResponse.json({ entities: [] })
  }

  // Get all properties for these entities
  const entityIds = entities.map(e => e.id)
  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('*')
    .in('entity_id', entityIds)
    .eq('is_deleted', false)
    .order('sort_order', { ascending: true })

  if (propertiesError) {
    console.error('Error fetching properties:', propertiesError)
    // Don't fail if properties fetch fails - return entities without properties
    const entitiesWithoutProperties = entities.map(entity => ({
      ...entity,
      properties: []
    }))
    return NextResponse.json({ entities: entitiesWithoutProperties })
  }

  // Group properties by entity_id
  const propertiesByEntity: Record<string, any[]> = {}
  properties?.forEach(prop => {
    if (!propertiesByEntity[prop.entity_id]) {
      propertiesByEntity[prop.entity_id] = []
    }
    propertiesByEntity[prop.entity_id].push(prop)
  })

  // Combine entities with their properties
  const entitiesWithFilteredProperties = entities.map(entity => ({
    ...entity,
    properties: propertiesByEntity[entity.id] || []
  }))

  return NextResponse.json({ entities: entitiesWithFilteredProperties })
}