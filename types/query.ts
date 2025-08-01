import { PropertyType } from './entity'

export interface Query {
  id: string
  project_id: string
  entity_id: string
  name: string
  created_at: string
  updated_at: string
  created_by: string
  last_modified_by: string
  is_deleted: boolean
}

export interface QueryGroup {
  id: string
  query_id: string
  parent_group_id: string | null
  operator: 'AND' | 'OR'
  sort_order: number
  created_at: string
  updated_at: string
  created_by: string
  last_modified_by: string
}

export interface QueryRule {
  id: string
  query_group_id: string
  property_id: string
  operator: QueryOperator
  value: string | null
  sort_order: number
  created_at: string
  updated_at: string
  created_by: string
  last_modified_by: string
}

// Operator types based on property type
export type StringOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'contains' 
  | 'not_contains'
  | 'starts_with' 
  | 'ends_with' 
  | 'is_empty' 
  | 'is_not_empty'
  | 'matches_regex'

export type NumberOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'greater_than' 
  | 'less_than' 
  | 'greater_than_or_equal' 
  | 'less_than_or_equal'
  | 'is_null' 
  | 'is_not_null'

export type DateOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'before' 
  | 'after'
  | 'in_last_days' 
  | 'in_last_months' 
  | 'is_today' 
  | 'is_this_week' 
  | 'is_this_month'

export type BooleanOperator = 
  | 'is_true' 
  | 'is_false' 
  | 'is_null'

export type TimeOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'before' 
  | 'after'
  | 'is_null' 
  | 'is_not_null'

export type QueryOperator = 
  | StringOperator 
  | NumberOperator 
  | DateOperator 
  | BooleanOperator 
  | TimeOperator

// Map property types to their allowed operators
export const OPERATORS_BY_TYPE: Record<PropertyType, readonly QueryOperator[]> = {
  [PropertyType.String]: [
    'equals', 'not_equals', 'contains', 'not_contains',
    'starts_with', 'ends_with', 'is_empty', 'is_not_empty', 'matches_regex'
  ],
  [PropertyType.Number]: [
    'equals', 'not_equals', 'greater_than', 'less_than',
    'greater_than_or_equal', 'less_than_or_equal', 'is_null', 'is_not_null'
  ],
  [PropertyType.Date]: [
    'equals', 'not_equals', 'before', 'after',
    'in_last_days', 'in_last_months', 'is_today', 'is_this_week', 'is_this_month'
  ],
  [PropertyType.DateTime]: [
    'equals', 'not_equals', 'before', 'after',
    'in_last_days', 'in_last_months', 'is_today', 'is_this_week', 'is_this_month'
  ],
  [PropertyType.Time]: [
    'equals', 'not_equals', 'before', 'after', 'is_null', 'is_not_null'
  ],
  [PropertyType.Boolean]: [
    'is_true', 'is_false', 'is_null'
  ],
  [PropertyType.Entity]: [] // Entity properties not supported in queries
}

// Query execution result with pagination
export interface QueryResult<T = any> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Query with nested groups and rules for UI
export interface QueryWithDetails extends Query {
  groups?: QueryGroupWithRules[]
}

export interface QueryGroupWithRules extends QueryGroup {
  rules?: QueryRule[]
  groups?: QueryGroupWithRules[] // Nested groups
}

// Form data types for creating/updating
export interface CreateQueryData {
  name: string
  entity_id: string
}

export interface UpdateQueryData {
  name?: string
}

export interface CreateQueryGroupData {
  query_id: string
  parent_group_id: string | null
  operator: 'AND' | 'OR'
  sort_order: number
}

export interface CreateQueryRuleData {
  query_group_id: string
  property_id: string
  operator: QueryOperator
  value: string | null
  sort_order: number
}