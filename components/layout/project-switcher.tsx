'use client'

import { useState } from 'react'
import { ChevronsUpDown, Plus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useProjectContext } from '@/app/providers/project-provider'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export function ProjectSwitcher() {
  const [open, setOpen] = useState(false)
  const { currentProject, setCurrentProject, projects, isLoading } = useProjectContext()
  const router = useRouter()

  if (isLoading) {
    return (
      <Button variant="outline" className="w-[240px] justify-between" disabled>
        <span className="truncate">Loading...</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[240px] justify-between"
        >
          <span className="truncate">{currentProject?.name || 'Select project...'}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0">
        <Command>
          <CommandList>
            <CommandEmpty>No projects available</CommandEmpty>
            {projects.length > 0 && (
              <CommandGroup heading="Projects">
                {projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    value={project.name}
                    onSelect={() => {
                      const currentPath = window.location.pathname
                      const pathParts = currentPath.split('/')
                      
                      if (pathParts[1] === 'projects' && pathParts[2] && pathParts[3]) {
                        router.push(`/projects/${project.id}/${pathParts[3]}`)
                      } else {
                        router.push(`/projects/${project.id}`)
                      }
                      
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        currentProject?.id === project.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{project.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false)
                  router.push('/projects')
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Manage projects
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}