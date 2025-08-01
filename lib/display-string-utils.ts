import { Property } from '@/types/entity'
import { EntityInstanceWithProperties } from '@/types/entity-instance'
import { formatDisplayValue } from './entity-instance-utils'

/**
 * Extract property placeholders from a display string template
 * Example: "{firstName} {lastName}" -> ["firstName", "lastName"]
 */
export function parseDisplayString(template: string): string[] {
  const regex = /\{([^}]+)\}/g
  const matches: string[] = []
  let match

  while ((match = regex.exec(template)) !== null) {
    matches.push(match[1])
  }

  return [...new Set(matches)] // Remove duplicates
}

/**
 * Resolve a display string template with actual property values
 * Example: "{firstName} {lastName}" with {firstName: "John", lastName: "Doe"} -> "John Doe"
 */
export function resolveDisplayString(
  instance: EntityInstanceWithProperties,
  properties: Property[],
  template: string
): string {
  let resolved = template

  // Create a map of property names to property metadata
  const propertyMap = new Map<string, Property>()
  properties.forEach(prop => {
    propertyMap.set(prop.property_name, prop)
  })

  // Extract property names from template
  const propertyNames = parseDisplayString(template)

  // Replace each placeholder with the actual value
  propertyNames.forEach(propertyName => {
    const property = propertyMap.get(propertyName)
    const value = instance.properties[propertyName]
    
    let displayValue = ''
    
    if (property && value !== undefined && value !== null) {
      if (property.is_list && Array.isArray(value)) {
        // For list properties, join the values
        displayValue = value
          .map(v => formatDisplayValue(v, property.property_type))
          .join(', ')
      } else {
        displayValue = formatDisplayValue(value, property.property_type)
      }
    }

    // Replace all occurrences of this placeholder
    resolved = resolved.replace(new RegExp(`\\{${propertyName}\\}`, 'g'), displayValue)
  })

  return resolved
}

/**
 * Get required property names from a display string template
 * Used to determine which properties need to be loaded
 */
export function getRequiredProperties(template: string): string[] {
  return parseDisplayString(template)
}

/**
 * Validate that all required properties for a display string exist
 */
export function validateDisplayString(
  template: string,
  availableProperties: Property[]
): { valid: boolean; missingProperties: string[] } {
  const requiredProps = parseDisplayString(template)
  const availablePropertyNames = new Set(availableProperties.map(p => p.property_name))
  
  const missingProperties = requiredProps.filter(prop => !availablePropertyNames.has(prop))
  
  return {
    valid: missingProperties.length === 0,
    missingProperties
  }
}