'use client'

import React, { useState, useEffect } from 'react'
import { useProjectContext } from '@/app/providers/project-provider'
import { usePageParameters } from '@/hooks/use-pages'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Trash2, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { PageParameter, ParameterDataType } from '@/types/page'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface PageSettingsDialogProps {
  pageId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate?: (parameter: any) => void
  onUpdate?: (parameterId: string, updates: any) => void
  onDelete?: (parameterId: string) => void
  localParameters?: {
    created: any[]
    updated: Record<string, any>
    deleted: string[]
  }
}

interface ParameterFormData {
  name: string
  data_type: ParameterDataType
  is_required: boolean
}

export function PageSettingsDialog({ pageId, open, onOpenChange, onCreate, onUpdate, onDelete, localParameters }: PageSettingsDialogProps) {
  const { currentProject } = useProjectContext()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingParameter, setEditingParameter] = useState<PageParameter | null>(null)
  const [_editingParameterId, setEditingParameterId] = useState<string | null>(null)
  const [deleteParameterId, setDeleteParameterId] = useState<string | null>(null)
  const [formData, setFormData] = useState<ParameterFormData>({
    name: '',
    data_type: ParameterDataType.String,
    is_required: false
  })

  // Hooks after state
  const { data: remoteParameters } = usePageParameters(currentProject?.id || '', pageId)
  
  // Merge remote and local parameters
  const parameters = React.useMemo(() => {
    if (!remoteParameters || !localParameters) return remoteParameters || []
    
    // Start with remote parameters, excluding deleted ones
    const result = remoteParameters.filter(p => !localParameters.deleted.includes(p.id))
    
    // Apply updates to existing parameters
    const updatedResult = result.map(p => {
      if (localParameters.updated[p.id]) {
        return { ...p, ...localParameters.updated[p.id] }
      }
      return p
    })
    
    // Add new parameters
    return [...updatedResult, ...localParameters.created]
  }, [remoteParameters, localParameters])

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setShowAddForm(false)
      setEditingParameter(null)
      setFormData({
        name: '',
        data_type: ParameterDataType.String,
        is_required: false
      })
    }
  }, [open])

  const handleAdd = () => {
    if (!formData.name.trim()) {
      toast.error('Parameter name is required')
      return
    }

    // Add locally
    onCreate?.(formData)
    setShowAddForm(false)
    setFormData({
      name: '',
      data_type: ParameterDataType.String,
      is_required: false
    })
  }

  const handleUpdate = () => {
    if (!editingParameter) return

    // Update locally
    onUpdate?.(editingParameter.id, formData)
    setEditingParameter(null)
    setEditingParameterId(null)
    setFormData({
      name: '',
      data_type: ParameterDataType.String,
      is_required: false
    })
  }

  const handleDelete = () => {
    if (!deleteParameterId) return

    // Delete locally
    onDelete?.(deleteParameterId)
    setDeleteParameterId(null)
  }

  const startEdit = (param: PageParameter) => {
    setEditingParameter(param)
    setEditingParameterId(param.id)
    setFormData({
      name: param.name,
      data_type: param.data_type,
      is_required: param.is_required
    })
    setShowAddForm(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Page Settings</DialogTitle>
            <DialogDescription>
              Manage page parameters that can be passed via URL and used by components.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Parameters List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Page Parameters</Label>
                {!showAddForm && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Parameter
                  </Button>
                )}
              </div>

              {showAddForm && (
                <div className="border rounded-lg p-4 space-y-4 mb-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="paramName">Parameter Name</Label>
                      <Input
                        id="paramName"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., id, userId, view"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="dataType">Data Type</Label>
                      <Select 
                        value={formData.data_type} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, data_type: value as ParameterDataType }))}
                      >
                        <SelectTrigger id="dataType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ParameterDataType.String}>String</SelectItem>
                          <SelectItem value={ParameterDataType.Number}>Number</SelectItem>
                          <SelectItem value={ParameterDataType.Boolean}>Boolean</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="required"
                        checked={formData.is_required}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_required: !!checked }))}
                      />
                      <Label htmlFor="required" className="cursor-pointer">
                        Required parameter
                      </Label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={editingParameter ? handleUpdate : handleAdd}
                    >
                      {editingParameter ? 'Update' : 'Add'} Parameter
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false)
                        setEditingParameter(null)
                        setFormData({
                          name: '',
                          data_type: ParameterDataType.String,
                          is_required: false
                        })
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {parameters && parameters.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Required</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parameters.map((param) => (
                        <TableRow key={param.id}>
                          <TableCell className="font-medium">{param.name}</TableCell>
                          <TableCell>{param.data_type}</TableCell>
                          <TableCell>{param.is_required ? 'Yes' : 'No'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEdit(param)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteParameterId(param.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground border rounded-lg">
                  No parameters defined. Add parameters that can be passed via URL.
                </div>
              )}
            </div>

            {/* Usage Instructions */}
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Usage in Components</h4>
              <p className="text-sm text-muted-foreground">
                Components can reference page parameters using <code className="bg-background px-1 rounded">param:parameterName</code> syntax.
                For example, if you have an &quot;id&quot; parameter, use <code className="bg-background px-1 rounded">param:id</code> in component configurations.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteParameterId} onOpenChange={() => setDeleteParameterId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Parameter</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this parameter? Components using this parameter may stop working correctly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}