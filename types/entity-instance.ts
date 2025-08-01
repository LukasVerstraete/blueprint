import { PropertyType } from './entity'

export interface EntityInstance {
  id: string
  entity_id: string
  created_at: string
  updated_at: string
  created_by: string
  last_modified_by: string
  is_deleted: boolean
}

export interface PropertyInstance {
  id: string
  entity_instance_id: string
  property_id: string
  value: string | null
  sort_order: number
  created_at: string
  updated_at: string
  created_by: string
  last_modified_by: string
  is_deleted: boolean
}

export interface EntityInstanceWithProperties extends EntityInstance {
  properties: Record<string, any> // propertyName -> typed value (or array for lists)
  _displayString?: string // Cached resolved display string
}

export interface CreateEntityInstanceInput {
  entity_id: string
  properties: Record<string, any> // propertyName -> value (or array for lists)
}

export interface UpdateEntityInstanceInput {
  properties: Record<string, any> // propertyName -> value (or array for lists)
}

export interface PropertyValue {
  property_id: string
  property_name: string
  property_type: PropertyType
  is_list: boolean
  is_required: boolean
  value: any // Typed value after casting
}