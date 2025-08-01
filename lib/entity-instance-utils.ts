import { PropertyType } from '@/types/entity'
import { formatDate, formatDateTime, formatTime } from '@/lib/date-utils'

/**
 * Cast a string value to the appropriate type based on property type
 */
export function castValue(value: string | null, propertyType: PropertyType): any {
  if (value === null || value === '') {
    return null
  }

  switch (propertyType) {
    case PropertyType.String:
      return value

    case PropertyType.Number:
      const num = parseFloat(value)
      return isNaN(num) ? null : num

    case PropertyType.Boolean:
      return value === 'true' || value === '1'

    case PropertyType.Date:
      // Expect YYYY-MM-DD format
      const date = new Date(value + 'T00:00:00')
      return isNaN(date.getTime()) ? null : value

    case PropertyType.DateTime:
      // Expect ISO format
      const dateTime = new Date(value)
      return isNaN(dateTime.getTime()) ? null : value

    case PropertyType.Time:
      // Expect HH:MM:SS format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/
      return timeRegex.test(value) ? value : null

    case PropertyType.Entity:
      // UUID validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      return uuidRegex.test(value) ? value : null

    default:
      return value
  }
}

/**
 * Format a typed value back to string for storage
 */
export function formatValue(value: any, propertyType: PropertyType): string | null {
  if (value === null || value === undefined) {
    return null
  }

  switch (propertyType) {
    case PropertyType.String:
    case PropertyType.Date:
    case PropertyType.Time:
    case PropertyType.Entity:
      return String(value)

    case PropertyType.Number:
      return isNaN(value) ? null : String(value)

    case PropertyType.Boolean:
      return value ? 'true' : 'false'

    case PropertyType.DateTime:
      if (value instanceof Date) {
        return value.toISOString()
      }
      return String(value)

    default:
      return String(value)
  }
}

/**
 * Validate a value against property type and requirements
 */
export function validateValue(
  value: any,
  propertyType: PropertyType,
  isRequired: boolean,
  isList: boolean
): { valid: boolean; error?: string } {
  // Handle list properties
  if (isList) {
    if (!Array.isArray(value)) {
      return { valid: false, error: 'Value must be an array for list properties' }
    }
    
    if (isRequired && value.length === 0) {
      return { valid: false, error: 'This field is required' }
    }

    // Validate each item in the list
    for (const item of value) {
      const result = validateSingleValue(item, propertyType, true)
      if (!result.valid) {
        return result
      }
    }
    
    return { valid: true }
  }

  // Single value validation
  return validateSingleValue(value, propertyType, isRequired)
}

function validateSingleValue(
  value: any,
  propertyType: PropertyType,
  isRequired: boolean
): { valid: boolean; error?: string } {
  // Check required
  if (isRequired && (value === null || value === undefined || value === '')) {
    return { valid: false, error: 'This field is required' }
  }

  // If not required and empty, it's valid
  if (value === null || value === undefined || value === '') {
    return { valid: true }
  }

  // Type-specific validation
  switch (propertyType) {
    case PropertyType.Number:
      if (typeof value !== 'number' || isNaN(value)) {
        return { valid: false, error: 'Must be a valid number' }
      }
      break

    case PropertyType.Boolean:
      if (typeof value !== 'boolean') {
        return { valid: false, error: 'Must be true or false' }
      }
      break

    case PropertyType.Date:
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(value)) {
        return { valid: false, error: 'Must be a valid date (YYYY-MM-DD)' }
      }
      break

    case PropertyType.DateTime:
      const date = new Date(value)
      if (isNaN(date.getTime())) {
        return { valid: false, error: 'Must be a valid date and time' }
      }
      break

    case PropertyType.Time:
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/
      if (!timeRegex.test(value)) {
        return { valid: false, error: 'Must be a valid time (HH:MM:SS)' }
      }
      break

    case PropertyType.Entity:
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(value)) {
        return { valid: false, error: 'Must be a valid entity reference' }
      }
      break
  }

  return { valid: true }
}

/**
 * Format a value for display in the UI
 */
export function formatDisplayValue(value: any, propertyType: PropertyType): string {
  if (value === null || value === undefined) {
    return ''
  }

  switch (propertyType) {
    case PropertyType.Boolean:
      return value ? 'Yes' : 'No'

    case PropertyType.DateTime:
      return formatDateTime(value)

    case PropertyType.Date:
      return formatDate(value)

    case PropertyType.Time:
      return formatTime(value)

    default:
      return String(value)
  }
}