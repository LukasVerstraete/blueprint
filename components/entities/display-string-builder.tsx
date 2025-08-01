'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Property, PropertyType } from '@/types/entity'
import { parseDisplayString } from '@/lib/entity-utils'

interface DisplayStringBuilderProps {
  value: string
  onChange: (value: string) => void
  properties: Property[]
}

export function DisplayStringBuilder({ value, onChange, properties }: DisplayStringBuilderProps) {
  const [inputValue, setInputValue] = useState(value)
  const [cursorPosition, setCursorPosition] = useState(0)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Filter out entity type properties as they're not supported in display strings
  const availableProperties = properties.filter(p => p.property_type !== PropertyType.Entity && !p.is_deleted)

  const insertProperty = (propertyName: string) => {
    const placeholder = `{${propertyName}}`
    const newValue = inputValue.slice(0, cursorPosition) + placeholder + inputValue.slice(cursorPosition)
    setInputValue(newValue)
    onChange(newValue)
    
    // Move cursor after the inserted placeholder
    const newPosition = cursorPosition + placeholder.length
    setCursorPosition(newPosition)
    
    // Focus back on input and set cursor position
    const input = document.getElementById('display-string-input') as HTMLInputElement
    if (input) {
      input.focus()
      setTimeout(() => {
        input.setSelectionRange(newPosition, newPosition)
      }, 0)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    onChange(e.target.value)
    setCursorPosition(e.target.selectionStart || 0)
  }

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement
    setCursorPosition(target.selectionStart || 0)
  }

  const handleInputKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement
    setCursorPosition(target.selectionStart || 0)
  }

  // Generate preview with example values
  const generatePreview = () => {
    let preview = inputValue
    const placeholders = parseDisplayString(inputValue)
    
    placeholders.forEach(placeholder => {
      const property = availableProperties.find(p => p.property_name === placeholder)
      if (property) {
        let exampleValue = ''
        switch (property.property_type) {
          case PropertyType.String:
            exampleValue = property.name === 'First Name' ? 'John' : 
                          property.name === 'Last Name' ? 'Doe' : 
                          'Example Text'
            break
          case PropertyType.Number:
            exampleValue = '123'
            break
          case PropertyType.Boolean:
            exampleValue = 'true'
            break
          case PropertyType.Date:
            exampleValue = '2024-01-15'
            break
          case PropertyType.DateTime:
            exampleValue = '2024-01-15 14:30'
            break
          case PropertyType.Time:
            exampleValue = '14:30'
            break
        }
        preview = preview.replace(`{${placeholder}}`, exampleValue)
      }
    })
    
    return preview
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="display-string-input">Display String Template</Label>
        <Input
          id="display-string-input"
          value={inputValue}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onKeyUp={handleInputKeyUp}
          placeholder="{firstName} {lastName}"
          className="font-mono"
        />
        <p className="text-sm text-muted-foreground">
          Use curly braces to insert property placeholders
        </p>
      </div>

      {availableProperties.length > 0 && (
        <div className="grid gap-2">
          <Label>Insert Property</Label>
          <div className="flex gap-2">
            <Select onValueChange={insertProperty}>
              <SelectTrigger>
                <SelectValue placeholder="Select a property to insert" />
              </SelectTrigger>
              <SelectContent>
                {availableProperties.map((property) => (
                  <SelectItem key={property.id} value={property.property_name}>
                    {property.name} ({property.property_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="grid gap-2">
        <Label>Preview</Label>
        <div className="p-3 bg-muted rounded-md">
          <p className="text-sm">{generatePreview() || '(empty)'}</p>
        </div>
      </div>
    </div>
  )
}