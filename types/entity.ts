export enum PropertyType {
  String = 'string',
  Number = 'number',
  Date = 'date',
  DateTime = 'datetime',
  Time = 'time',
  Boolean = 'boolean',
  Entity = 'entity'
}

export interface Entity {
  id: string
  project_id: string
  name: string
  display_string: string
  created_at: string
  updated_at: string
  created_by: string
  last_modified_by: string
  is_deleted: boolean
}

export interface Property {
  id: string
  entity_id: string
  name: string
  property_name: string
  property_type: PropertyType
  is_list: boolean
  is_required: boolean
  default_value?: string | null
  referenced_entity_id?: string | null
  sort_order: number
  created_at: string
  updated_at: string
  created_by: string
  last_modified_by: string
  is_deleted: boolean
}

export interface EntityWithProperties extends Entity {
  properties: Property[]
}

export interface CreateEntityInput {
  name: string
  display_string: string
}

export interface UpdateEntityInput {
  name?: string
  display_string?: string
}

export interface CreatePropertyInput {
  name: string
  property_name: string
  property_type: PropertyType
  is_list?: boolean
  is_required?: boolean
  default_value?: string | null
  referenced_entity_id?: string | null
  sort_order?: number
}

export interface UpdatePropertyInput {
  name?: string
  property_name?: string
  property_type?: PropertyType
  is_list?: boolean
  is_required?: boolean
  default_value?: string | null
  referenced_entity_id?: string | null
  sort_order?: number
}

export interface ReorderPropertiesInput {
  property_ids: string[]
}