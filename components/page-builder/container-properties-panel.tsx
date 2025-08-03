'use client'

import { useState, useEffect } from 'react'
import { Container, LayoutType, FlexDirection, FlexJustify, FlexAlign } from '@/types/page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X } from 'lucide-react'

interface ContainerPropertiesPanelProps {
  container: Container
  pageId: string
  onClose: () => void
  onUpdate?: (containerId: string, updates: any) => void
}

export function ContainerPropertiesPanel({ 
  container, 
  pageId: _pageId, 
  onClose, 
  onUpdate 
}: ContainerPropertiesPanelProps) {

  const [layoutType, setLayoutType] = useState(container.layout_type)
  const [flexDirection, setFlexDirection] = useState(container.flex_direction || FlexDirection.Row)
  const [flexJustify, setFlexJustify] = useState(container.flex_justify || FlexJustify.Start)
  const [flexAlign, setFlexAlign] = useState(container.flex_align || FlexAlign.Stretch)
  const [gridColumns, setGridColumns] = useState(container.grid_columns || 2)
  const [spacing, setSpacing] = useState(container.spacing)
  const [padding, setPadding] = useState(container.padding)
  const [backgroundColor, setBackgroundColor] = useState(container.background_color || '')
  const [width, setWidth] = useState(container.width || '')
  const [height, setHeight] = useState(container.height || '')
  const [minHeight, setMinHeight] = useState(container.min_height || '')

  // Update state when container prop changes
  useEffect(() => {
    setLayoutType(container.layout_type)
    setFlexDirection(container.flex_direction || FlexDirection.Row)
    setFlexJustify(container.flex_justify || FlexJustify.Start)
    setFlexAlign(container.flex_align || FlexAlign.Stretch)
    setGridColumns(container.grid_columns || 2)
    setSpacing(container.spacing)
    setPadding(container.padding)
    setBackgroundColor(container.background_color || '')
    setWidth(container.width || '')
    setHeight(container.height || '')
    setMinHeight(container.min_height || '')
  }, [container])

  // Update immediately when properties change
  const handleUpdate = (updates: any) => {
    onUpdate?.(container.id, updates)
  }

  const handleLayoutTypeChange = (value: LayoutType) => {
    setLayoutType(value)
    handleUpdate({
      layout_type: value,
      flex_direction: value === LayoutType.Flex ? flexDirection : null,
      flex_justify: value === LayoutType.Flex ? flexJustify : null,
      flex_align: value === LayoutType.Flex ? flexAlign : null,
      grid_columns: value === LayoutType.Grid ? gridColumns : null
    })
  }

  const handleFlexPropertyChange = (property: string, value: any) => {
    const updates: any = { [property]: value }
    
    switch (property) {
      case 'flex_direction':
        setFlexDirection(value)
        break
      case 'flex_justify':
        setFlexJustify(value)
        break
      case 'flex_align':
        setFlexAlign(value)
        break
    }
    
    handleUpdate(updates)
  }

  const handleGridColumnsChange = (value: number) => {
    setGridColumns(value)
    handleUpdate({ grid_columns: value })
  }

  const handleSpacingChange = (value: number) => {
    setSpacing(value)
    handleUpdate({ spacing: value })
  }

  const handlePaddingChange = (value: number) => {
    setPadding(value)
    handleUpdate({ padding: value })
  }

  const handleSizeChange = (property: string, value: string) => {
    switch (property) {
      case 'width':
        setWidth(value)
        break
      case 'height':
        setHeight(value)
        break
      case 'min_height':
        setMinHeight(value)
        break
    }
    handleUpdate({ [property]: value || null })
  }

  const handleBackgroundColorChange = (value: string) => {
    setBackgroundColor(value)
    handleUpdate({ background_color: value || null })
  }

  return (
    <div className="w-80 border-l bg-background overflow-y-auto">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Container Properties</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-6">
        {/* Layout */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Layout</h4>
          
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={layoutType} onValueChange={(value) => handleLayoutTypeChange(value as LayoutType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={LayoutType.Flex}>Flex Layout</SelectItem>
                <SelectItem value={LayoutType.Grid}>Grid Layout</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {layoutType === LayoutType.Flex && (
            <>
              <div className="space-y-2">
                <Label>Direction</Label>
                <Select value={flexDirection} onValueChange={(value) => handleFlexPropertyChange('flex_direction', value as FlexDirection)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FlexDirection.Row}>Row</SelectItem>
                    <SelectItem value={FlexDirection.Column}>Column</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Justify</Label>
                <Select value={flexJustify} onValueChange={(value) => handleFlexPropertyChange('flex_justify', value as FlexJustify)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FlexJustify.Start}>Start</SelectItem>
                    <SelectItem value={FlexJustify.End}>End</SelectItem>
                    <SelectItem value={FlexJustify.Center}>Center</SelectItem>
                    <SelectItem value={FlexJustify.SpaceBetween}>Space Between</SelectItem>
                    <SelectItem value={FlexJustify.SpaceAround}>Space Around</SelectItem>
                    <SelectItem value={FlexJustify.SpaceEvenly}>Space Evenly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Align</Label>
                <Select value={flexAlign} onValueChange={(value) => handleFlexPropertyChange('flex_align', value as FlexAlign)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FlexAlign.Start}>Start</SelectItem>
                    <SelectItem value={FlexAlign.End}>End</SelectItem>
                    <SelectItem value={FlexAlign.Center}>Center</SelectItem>
                    <SelectItem value={FlexAlign.Stretch}>Stretch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {layoutType === LayoutType.Grid && (
            <div className="space-y-2">
              <Label>Columns</Label>
              <Input
                type="number"
                min="1"
                max="12"
                value={gridColumns}
                onChange={(e) => handleGridColumnsChange(parseInt(e.target.value) || 2)}
              />
            </div>
          )}
        </div>

        {/* Spacing */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Spacing</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Gap (px)</Label>
              <Input
                type="number"
                min="0"
                value={spacing}
                onChange={(e) => handleSpacingChange(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label>Padding (px)</Label>
              <Input
                type="number"
                min="0"
                value={padding}
                onChange={(e) => handlePaddingChange(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Size</h4>
          
          <div className="space-y-2">
            <Label>Width</Label>
            <Input
              placeholder="e.g., 100%, 500px, auto"
              value={width}
              onChange={(e) => handleSizeChange('width', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Height</Label>
            <Input
              placeholder="e.g., 300px, auto"
              value={height}
              onChange={(e) => handleSizeChange('height', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Min Height</Label>
            <Input
              placeholder="e.g., 100px"
              value={minHeight}
              onChange={(e) => handleSizeChange('min_height', e.target.value)}
            />
          </div>
        </div>

        {/* Appearance */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Appearance</h4>
          
          <div className="space-y-2">
            <Label>Background Color</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="e.g., #f5f5f5"
                value={backgroundColor}
                onChange={(e) => handleBackgroundColorChange(e.target.value)}
                className="flex-1"
              />
              <Input
                type="color"
                value={backgroundColor || '#ffffff'}
                onChange={(e) => handleBackgroundColorChange(e.target.value)}
                className="w-12 p-1 h-9"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}