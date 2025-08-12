export interface PageParameter {
  id: string
  page_id: string
  name: string
  data_type: 'string' | 'number' | 'boolean'
  is_required: boolean
}

export interface ParameterValidationResult {
  isValid: boolean
  errors: Record<string, string>
  values: Record<string, any>
}

export function validatePageParameters(
  parameters: PageParameter[],
  urlParams: URLSearchParams
): ParameterValidationResult {
  const errors: Record<string, string> = {}
  const values: Record<string, any> = {}
  
  for (const param of parameters) {
    const value = urlParams.get(param.name)
    
    // Check required parameters
    if (param.is_required && !value) {
      errors[param.name] = `${param.name} is required`
      continue
    }
    
    // Skip optional parameters with no value
    if (!value) {
      continue
    }
    
    // Validate and convert based on type
    switch (param.data_type) {
      case 'number':
        const numValue = Number(value)
        if (isNaN(numValue)) {
          errors[param.name] = `${param.name} must be a valid number`
        } else {
          values[param.name] = numValue
        }
        break
        
      case 'boolean':
        if (value !== 'true' && value !== 'false') {
          errors[param.name] = `${param.name} must be true or false`
        } else {
          values[param.name] = value === 'true'
        }
        break
        
      case 'string':
      default:
        values[param.name] = value
        break
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    values
  }
}

export function buildUrlWithParams(
  basePath: string,
  params: Record<string, any>
): string {
  const url = new URL(basePath, window.location.origin)
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value))
    }
  })
  
  return url.pathname + url.search
}