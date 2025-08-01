'use client'

import { QueryRule as QueryRuleType, OPERATORS_BY_TYPE, QueryOperator } from '@/types/query'
import { Property, PropertyType } from '@/types/entity'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { QueryValueInput } from './query-value-input'

interface QueryRuleProps {
  rule: QueryRuleType
  properties: Property[]
  onUpdate: (rule: QueryRuleType) => void
  onDelete: () => void
}

export function QueryRule({ rule, properties, onUpdate, onDelete }: QueryRuleProps) {
  // Filter out entity-type properties
  const availableProperties = properties.filter(p => p.property_type !== PropertyType.Entity)
  
  const selectedProperty = availableProperties.find(p => p.id === rule.property_id)
  const allowedOperators = selectedProperty 
    ? OPERATORS_BY_TYPE[selectedProperty.property_type]
    : []

  const handlePropertyChange = (propertyId: string) => {
    const property = availableProperties.find(p => p.id === propertyId)
    if (!property) return

    // Get first allowed operator for the property type
    const firstOperator = OPERATORS_BY_TYPE[property.property_type][0]
    
    onUpdate({
      ...rule,
      property_id: propertyId,
      operator: firstOperator as QueryOperator,
      value: null
    })
  }

  const handleOperatorChange = (operator: string) => {
    onUpdate({
      ...rule,
      operator: operator as QueryOperator,
      value: null // Reset value when operator changes
    })
  }

  const handleValueChange = (value: string | null) => {
    onUpdate({
      ...rule,
      value
    })
  }

  // Check if operator requires a value input
  const operatorRequiresValue = ![
    'is_empty', 'is_not_empty', 'is_null', 'is_not_null',
    'is_true', 'is_false', 'is_today', 'is_this_week', 'is_this_month'
  ].includes(rule.operator)

  return (
    <div className="flex items-center gap-2 p-2 bg-background border rounded">
      {/* Property Selection */}
      <Select value={rule.property_id} onValueChange={handlePropertyChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select property" />
        </SelectTrigger>
        <SelectContent>
          {availableProperties.map(property => (
            <SelectItem key={property.id} value={property.id}>
              {property.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operator Selection */}
      <Select 
        value={rule.operator} 
        onValueChange={handleOperatorChange}
        disabled={!selectedProperty}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Select operator" />
        </SelectTrigger>
        <SelectContent>
          {allowedOperators.map(operator => (
            <SelectItem key={operator} value={operator}>
              {formatOperatorLabel(operator)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Value Input */}
      {operatorRequiresValue && selectedProperty && (
        <div className="flex-1">
          <QueryValueInput
            value={rule.value}
            onChange={handleValueChange}
            propertyType={selectedProperty.property_type}
            operator={rule.operator}
          />
        </div>
      )}

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="h-9 text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

function formatOperatorLabel(operator: string): string {
  const labels: Record<string, string> = {
    equals: 'Equals',
    not_equals: 'Not equals',
    contains: 'Contains',
    not_contains: 'Does not contain',
    starts_with: 'Starts with',
    ends_with: 'Ends with',
    is_empty: 'Is empty',
    is_not_empty: 'Is not empty',
    matches_regex: 'Matches regex',
    greater_than: 'Greater than',
    less_than: 'Less than',
    greater_than_or_equal: 'Greater than or equal',
    less_than_or_equal: 'Less than or equal',
    is_null: 'Is null',
    is_not_null: 'Is not null',
    before: 'Before',
    after: 'After',
    in_last_days: 'In last X days',
    in_last_months: 'In last X months',
    is_today: 'Is today',
    is_this_week: 'Is this week',
    is_this_month: 'Is this month',
    is_true: 'Is true',
    is_false: 'Is false'
  }
  return labels[operator] || operator
}