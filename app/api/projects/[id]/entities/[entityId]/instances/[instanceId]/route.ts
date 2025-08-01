import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { Property } from '@/types/entity'
import { EntityInstanceWithProperties, UpdateEntityInstanceInput } from '@/types/entity-instance'
import { castValue, formatValue, validateValue } from '@/lib/entity-instance-utils'
import { resolveDisplayString } from '@/lib/display-string-utils'

interface Params {
  params: Promise<{
    id: string
    entityId: string
    instanceId: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: Params
) {
  const { id: projectId, entityId, instanceId } = await params
  const supabase = await createClient()

  // Get the entity and its properties
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

  // Get the entity instance
  const { data: instance, error: instanceError } = await supabase
    .from('entity_instances')
    .select('*')
    .eq('id', instanceId)
    .eq('entity_id', entityId)
    .eq('is_deleted', false)
    .single()

  if (instanceError || !instance) {
    return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
  }

  // Get property instances
  const { data: propertyInstances, error: propInstancesError } = await supabase
    .from('property_instances')
    .select('*')
    .eq('entity_instance_id', instanceId)
    .eq('is_deleted', false)
    .order('sort_order')

  if (propInstancesError) {
    return NextResponse.json({ error: propInstancesError.message }, { status: 500 })
  }

  // Build property values
  const propertyValues: Record<string, unknown> = {}
  const instancesByProperty = new Map<string, Array<{ value: string | null; sort_order: number }>>()
  
  propertyInstances.forEach(pi => {
    if (!instancesByProperty.has(pi.property_id)) {
      instancesByProperty.set(pi.property_id, [])
    }
    instancesByProperty.get(pi.property_id)!.push(pi)
  })

  properties.forEach((property: Property) => {
    const propInstances = instancesByProperty.get(property.id) || []
    
    if (property.is_list) {
      propertyValues[property.property_name] = propInstances
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(pi => castValue(pi.value, property.property_type))
        .filter(v => v !== null)
    } else {
      const propInstance = propInstances[0]
      propertyValues[property.property_name] = propInstance 
        ? castValue(propInstance.value, property.property_type) 
        : null
    }
  })

  // Resolve display string
  const displayString = resolveDisplayString(
    { ...instance, properties: propertyValues },
    properties,
    entity.display_string
  )

  const instanceWithProperties: EntityInstanceWithProperties = {
    ...instance,
    properties: propertyValues,
    _displayString: displayString
  }

  return NextResponse.json(instanceWithProperties)
}

export async function PUT(
  request: NextRequest,
  { params }: Params
) {
  const { id: projectId, entityId, instanceId } = await params
  const supabase = await createClient()

  // Get user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse request body
  const body: UpdateEntityInstanceInput = await request.json()

  // Verify entity and instance exist
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

  const { data: instance, error: instanceError } = await supabase
    .from('entity_instances')
    .select('id')
    .eq('id', instanceId)
    .eq('entity_id', entityId)
    .eq('is_deleted', false)
    .single()

  if (instanceError || !instance) {
    return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
  }

  // Get properties
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

  // Get existing property instances
  const { data: existingPropInstances, error: existingError } = await supabase
    .from('property_instances')
    .select('*')
    .eq('entity_instance_id', instanceId)
    .eq('is_deleted', false)

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 })
  }

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

  // Check that required properties are not being removed
  properties.forEach(property => {
    if (property.is_required) {
      // Check if property exists in current data
      const hasExistingValue = existingPropInstances.some(pi => pi.property_id === property.id)
      const hasNewValue = property.property_name in body.properties && 
                         body.properties[property.property_name] !== null &&
                         body.properties[property.property_name] !== undefined &&
                         body.properties[property.property_name] !== ''

      if (!hasNewValue && !hasExistingValue) {
        validationErrors[property.property_name] = 'This field is required'
      }
    }
  })

  if (Object.keys(validationErrors).length > 0) {
    return NextResponse.json({ errors: validationErrors }, { status: 400 })
  }

  // Update entity instance timestamp
  const { error: updateError } = await supabase
    .from('entity_instances')
    .update({ 
      last_modified_by: user.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', instanceId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Handle property updates
  for (const [propertyName, value] of Object.entries(body.properties)) {
    const property = propertyMap.get(propertyName)!
    
    // Get existing instances for this property
    const existingForProperty = existingPropInstances.filter(pi => pi.property_id === property.id)

    if (property.is_list && Array.isArray(value)) {
      // For list properties, soft delete existing and create new
      if (existingForProperty.length > 0) {
        const { error: deleteError } = await supabase
          .from('property_instances')
          .update({ is_deleted: true })
          .in('id', existingForProperty.map(pi => pi.id))

        if (deleteError) {
          return NextResponse.json({ error: deleteError.message }, { status: 500 })
        }
      }

      // Create new instances
      const newInstances = value
        .map((item, index) => {
          const formattedValue = formatValue(item, property.property_type)
          return formattedValue !== null ? {
            entity_instance_id: instanceId,
            property_id: property.id,
            value: formattedValue,
            sort_order: index,
            created_by: user.id,
            last_modified_by: user.id
          } : null
        })
        .filter(Boolean)

      if (newInstances.length > 0) {
        const { error: insertError } = await supabase
          .from('property_instances')
          .insert(newInstances)

        if (insertError) {
          return NextResponse.json({ error: insertError.message }, { status: 500 })
        }
      }
    } else {
      // For single properties
      const formattedValue = formatValue(value, property.property_type)
      
      if (existingForProperty.length > 0) {
        // Update existing
        if (formattedValue !== null) {
          const { error: updateError } = await supabase
            .from('property_instances')
            .update({ 
              value: formattedValue,
              last_modified_by: user.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingForProperty[0].id)

          if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 })
          }
        } else {
          // Soft delete if value is null
          const { error: deleteError } = await supabase
            .from('property_instances')
            .update({ is_deleted: true })
            .eq('id', existingForProperty[0].id)

          if (deleteError) {
            return NextResponse.json({ error: deleteError.message }, { status: 500 })
          }
        }
      } else if (formattedValue !== null) {
        // Create new
        const { error: insertError } = await supabase
          .from('property_instances')
          .insert({
            entity_instance_id: instanceId,
            property_id: property.id,
            value: formattedValue,
            sort_order: 0,
            created_by: user.id,
            last_modified_by: user.id
          })

        if (insertError) {
          return NextResponse.json({ error: insertError.message }, { status: 500 })
        }
      }
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: NextRequest,
  { params }: Params
) {
  const { entityId, instanceId } = await params
  const supabase = await createClient()

  // Get user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify instance exists
  const { data: instance, error: instanceError } = await supabase
    .from('entity_instances')
    .select('id')
    .eq('id', instanceId)
    .eq('entity_id', entityId)
    .eq('is_deleted', false)
    .single()

  if (instanceError || !instance) {
    return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
  }

  // Soft delete the instance
  const { error: deleteError } = await supabase
    .from('entity_instances')
    .update({ 
      is_deleted: true,
      last_modified_by: user.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', instanceId)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  // Soft delete all property instances
  const { error: propDeleteError } = await supabase
    .from('property_instances')
    .update({ 
      is_deleted: true,
      last_modified_by: user.id,
      updated_at: new Date().toISOString()
    })
    .eq('entity_instance_id', instanceId)

  if (propDeleteError) {
    return NextResponse.json({ error: propDeleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}