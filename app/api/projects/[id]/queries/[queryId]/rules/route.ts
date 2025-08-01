import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { QueryRule, CreateQueryRuleData } from '@/types/query'
import { OPERATORS_BY_TYPE } from '@/types/query'
import { PropertyType } from '@/types/entity'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; queryId: string }> }
) {
  const { id: projectId, queryId } = await params
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check user has ContentManager or Administrator role
  const { data: role, error: roleError } = await supabase
    .from('user_project_roles')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single()

  if (roleError || !role || role.role === 'default') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Parse request body
  const body: CreateQueryRuleData = await request.json()

  // Verify query group exists and belongs to the query
  const { data: group, error: groupError } = await supabase
    .from('query_groups')
    .select('id, query_id')
    .eq('id', body.query_group_id)
    .eq('query_id', queryId)
    .single()

  if (groupError || !group) {
    return NextResponse.json({ error: 'Query group not found' }, { status: 404 })
  }

  // Verify property exists and validate operator
  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id, property_type, entity_id')
    .eq('id', body.property_id)
    .eq('is_deleted', false)
    .single()

  if (propertyError || !property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  }

  // Entity properties are not allowed in queries
  if (property.property_type === PropertyType.Entity) {
    return NextResponse.json({ error: 'Entity properties cannot be used in queries' }, { status: 400 })
  }

  // Validate operator for property type
  const allowedOperators = OPERATORS_BY_TYPE[property.property_type as PropertyType]
  if (!allowedOperators.includes(body.operator)) {
    return NextResponse.json({ 
      error: `Invalid operator '${body.operator}' for property type '${property.property_type}'` 
    }, { status: 400 })
  }

  // Validate that property belongs to the query's entity
  const { data: query, error: queryError } = await supabase
    .from('queries')
    .select('entity_id')
    .eq('id', queryId)
    .single()

  if (queryError || !query || query.entity_id !== property.entity_id) {
    return NextResponse.json({ error: 'Property does not belong to query entity' }, { status: 400 })
  }

  // Create query rule
  const { data: rule, error } = await supabase
    .from('query_rules')
    .insert({
      query_group_id: body.query_group_id,
      property_id: body.property_id,
      operator: body.operator,
      value: body.value,
      sort_order: body.sort_order,
      created_by: user.id,
      last_modified_by: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating query rule:', error)
    return NextResponse.json({ error: 'Failed to create query rule' }, { status: 500 })
  }

  return NextResponse.json(rule as QueryRule, { status: 201 })
}