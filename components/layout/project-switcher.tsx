'use client'

import { useState } from 'react'
import { ChevronsUpDown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export function ProjectSwitcher() {
  const [open, setOpen] = useState(false)
  const [selectedProject] = useState<{ id: string; name: string; role: string } | null>(null)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[240px] justify-between"
        >
          <span className="truncate">{selectedProject?.name || 'Select project...'}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0">
        <Command>
          <CommandList>
            <CommandEmpty>No projects available</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false)
                  // Navigate to create project page
                  window.location.href = '/projects/new'
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create new project
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}