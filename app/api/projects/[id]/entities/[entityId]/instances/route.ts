import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { Property } from '@/types/entity'
import { EntityInstanceWithProperties, CreateEntityInstanceInput } from '@/types/entity-instance'
import { castValue, formatValue, validateValue } from '@/lib/entity-instance-utils'
import { resolveDisplayString } from '@/lib/display-string-utils'

interface Params {
  params: Promise<{
    id: string
    entityId: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { id: projectId, entityId } = await params
    const supabase = await createClient()

    // Get pagination parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // First, get the entity and its properties
    const { data: entity, error: entityError } = await supabase
      .from('entities')
      .select('id, name, display_string')
      .eq('id', entityId)
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .single()

    if (entityError || !entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
    }

    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('*')
      .eq('entity_id', entityId)
      .eq('is_deleted', false)
      .order('sort_order')

    if (propertiesError) {
      return NextResponse.json({ error: propertiesError.message }, { status: 500 })
    }

    // Ensure properties is an array
    const propertiesArray = properties || []

    // Get total count
    const { count } = await supabase
      .from('entity_instances')
      .select('*', { count: 'exact', head: true })
      .eq('entity_id', entityId)
      .eq('is_deleted', false)

    // Get entity instances
    const { data: instances, error: instancesError } = await supabase
      .from('entity_instances')
      .select('*')
      .eq('entity_id', entityId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (instancesError) {
      return NextResponse.json({ error: instancesError.message }, { status: 500 })
    }

    // Get all property instances for these entity instances
    const instanceIds = instances.map(i => i.id)
    
    // Handle case where there are no instances
    if (instanceIds.length === 0) {
      return NextResponse.json({
        instances: [],
        total: 0,
        page,
        limit
      })
    }
    
    const { data: propertyInstances, error: propInstancesError } = await supabase
      .from('property_instances')
      .select('*')
      .in('entity_instance_id', instanceIds)
      .eq('is_deleted', false)
      .order('sort_order')

    if (propInstancesError) {
      return NextResponse.json({ error: propInstancesError.message }, { status: 500 })
    }

    // Group property instances by entity instance
    const propertyInstancesByEntity = new Map<string, any[]>()
    propertyInstances.forEach(pi => {
      if (!propertyInstancesByEntity.has(pi.entity_instance_id)) {
        propertyInstancesByEntity.set(pi.entity_instance_id, [])
      }
      propertyInstancesByEntity.get(pi.entity_instance_id)!.push(pi)
    })

    // Build the response with resolved property values
    const instancesWithProperties: EntityInstanceWithProperties[] = instances.map(instance => {
      const instancePropertyInstances = propertyInstancesByEntity.get(instance.id) || []
      const propertyValues: Record<string, any> = {}

      // Group property instances by property
      const instancesByProperty = new Map<string, any[]>()
      instancePropertyInstances.forEach(pi => {
        if (!instancesByProperty.has(pi.property_id)) {
          instancesByProperty.set(pi.property_id, [])
        }
        instancesByProperty.get(pi.property_id)!.push(pi)
      })

      // Process each property
      propertiesArray.forEach((property: Property) => {
        const propInstances = instancesByProperty.get(property.id) || []
        
        if (property.is_list) {
          // For list properties, collect all values in sort order
          propertyValues[property.property_name] = propInstances
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(pi => castValue(pi.value, property.property_type))
            .filter(v => v !== null)
        } else {
          // For single properties, take the first value
          const propInstance = propInstances[0]
          propertyValues[property.property_name] = propInstance 
            ? castValue(propInstance.value, property.property_type) 
            : null
        }
      })

      // Resolve display string
      const displayString = resolveDisplayString(
        { ...instance, properties: propertyValues },
        propertiesArray,
        entity.display_string
      )

      return {
        ...instance,
        properties: propertyValues,
        _displayString: displayString
      }
    })

    return NextResponse.json({
      instances: instancesWithProperties,
      total: count || 0,
      page,
      limit
    })
  } catch (error) {
    console.error('Error in GET /api/projects/[id]/entities/[entityId]/instances:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { id: projectId, entityId } = await params
    const supabase = await createClient()

  // Get user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse request body
  const body: CreateEntityInstanceInput = await request.json()

  // Verify entity exists and get properties
  const { data: entity, error: entityError } = await supabase
    .from('entities')
    .select('id')
    .eq('id', entityId)
    .eq('project_id', projectId)
    .eq('is_deleted', false)
    .single()

  if (entityError || !entity) {
    return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
  }

  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('*')
    .eq('entity_id', entityId)
    .eq('is_deleted', false)

  if (propertiesError) {
    return NextResponse.json({ error: propertiesError.message }, { status: 500 })
  }

  // Create a map of property names to properties
  const propertyMap = new Map<string, Property>()
  properties.forEach(prop => {
    propertyMap.set(prop.property_name, prop)
  })

  // Validate all property values
  const validationErrors: Record<string, string> = {}
  
  for (const [propertyName, value] of Object.entries(body.properties)) {
    const property = propertyMap.get(propertyName)
    if (!property) {
      validationErrors[propertyName] = `Unknown property: ${propertyName}`
      continue
    }

    const validation = validateValue(value, property.property_type, property.is_required, property.is_list)
    if (!validation.valid) {
      validationErrors[propertyName] = validation.error!
    }
  }

  // Check for missing required properties
  properties.forEach(property => {
    if (property.is_required && !(property.property_name in body.properties)) {
      validationErrors[property.property_name] = 'This field is required'
    }
  })

  if (Object.keys(validationErrors).length > 0) {
    return NextResponse.json({ errors: validationErrors }, { status: 400 })
  }

  // Create entity instance
  const { data: instance, error: instanceError } = await supabase
    .from('entity_instances')
    .insert({
      entity_id: entityId,
      created_by: user.id,
      last_modified_by: user.id
    })
    .select()
    .single()

  if (instanceError) {
    return NextResponse.json({ error: instanceError.message }, { status: 500 })
  }

  // Create property instances
  const propertyInstancesData: any[] = []
  
  for (const [propertyName, value] of Object.entries(body.properties)) {
    const property = propertyMap.get(propertyName)!
    
    if (property.is_list && Array.isArray(value)) {
      // For list properties, create multiple instances
      value.forEach((item, index) => {
        const formattedValue = formatValue(item, property.property_type)
        if (formattedValue !== null) {
          propertyInstancesData.push({
            entity_instance_id: instance.id,
            property_id: property.id,
            value: formattedValue,
            sort_order: index,
            created_by: user.id,
            last_modified_by: user.id
          })
        }
      })
    } else {
      // For single properties
      const formattedValue = formatValue(value, property.property_type)
      if (formattedValue !== null) {
        propertyInstancesData.push({
          entity_instance_id: instance.id,
          property_id: property.id,
          value: formattedValue,
          sort_order: 0,
          created_by: user.id,
          last_modified_by: user.id
        })
      }
    }
  }

  if (propertyInstancesData.length > 0) {
    const { error: propInsertError } = await supabase
      .from('property_instances')
      .insert(propertyInstancesData)

    if (propInsertError) {
      // Rollback by deleting the entity instance
      await supabase
        .from('entity_instances')
        .delete()
        .eq('id', instance.id)
      
      return NextResponse.json({ error: propInsertError.message }, { status: 500 })
    }
  }

  return NextResponse.json(instance, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/projects/[id]/entities/[entityId]/instances:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}