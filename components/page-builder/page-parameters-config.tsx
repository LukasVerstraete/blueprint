'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

interface PageParameter {
  id?: string
  name: string
  data_type: 'string' | 'number' | 'boolean'
  is_required: boolean
}

interface PageParametersConfigProps {
  pageId: string
  projectId: string
  parameters: PageParameter[]
  onParametersChange: () => void
}

export function PageParametersConfig({
  pageId,
  projectId,
  parameters,
  onParametersChange
}: PageParametersConfigProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newParam, setNewParam] = useState<PageParameter>({
    name: '',
    data_type: 'string',
    is_required: false
  })
  const { toast } = useToast()
  
  const handleAddParameter = async () => {
    if (!newParam.name) {
      toast({
        title: 'Error',
        description: 'Parameter name is required',
        variant: 'destructive'
      })
      return
    }
    
    // Check for duplicate names
    if (parameters.some(p => p.name === newParam.name)) {
      toast({
        title: 'Error',
        description: 'A parameter with this name already exists',
        variant: 'destructive'
      })
      return
    }
    
    try {
      const response = await fetch(
        `/api/projects/${projectId}/pages/${pageId}/parameters`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newParam)
        }
      )
      
      if (!response.ok) {
        throw new Error('Failed to add parameter')
      }
      
      toast({
        title: 'Success',
        description: 'Parameter added successfully'
      })
      
      setNewParam({ name: '', data_type: 'string', is_required: false })
      setIsAdding(false)
      onParametersChange()
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to add parameter',
        variant: 'destructive'
      })
    }
  }
  
  const handleDeleteParameter = async (paramId: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/pages/${pageId}/parameters/${paramId}`,
        {
          method: 'DELETE'
        }
      )
      
      if (!response.ok) {
        throw new Error('Failed to delete parameter')
      }
      
      toast({
        title: 'Success',
        description: 'Parameter deleted successfully'
      })
      
      onParametersChange()
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete parameter',
        variant: 'destructive'
      })
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Page Parameters</CardTitle>
        <CardDescription>
          Define URL parameters that can be passed to this page
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Parameters */}
        {parameters.length > 0 && (
          <div className="space-y-2">
            {parameters.map(param => (
              <div
                key={param.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">{param.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Type: {param.data_type} • {param.is_required ? 'Required' : 'Optional'}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => param.id && handleDeleteParameter(param.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {/* Add New Parameter */}
        {isAdding ? (
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="param-name">Parameter Name</Label>
              <Input
                id="param-name"
                placeholder="e.g., customerId"
                value={newParam.name}
                onChange={(e) => setNewParam({ ...newParam, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="param-type">Data Type</Label>
              <Select
                value={newParam.data_type}
                onValueChange={(value: 'string' | 'number' | 'boolean') => 
                  setNewParam({ ...newParam, data_type: value })
                }
              >
                <SelectTrigger id="param-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="param-required"
                checked={newParam.is_required}
                onCheckedChange={(checked) => 
                  setNewParam({ ...newParam, is_required: checked })
                }
              />
              <Label htmlFor="param-required">Required parameter</Label>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleAddParameter}>Add Parameter</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false)
                  setNewParam({ name: '', data_type: 'string', is_required: false })
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setIsAdding(true)}
            variant="outline"
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Parameter
          </Button>
        )}
      </CardContent>
    </Card>
  )
}