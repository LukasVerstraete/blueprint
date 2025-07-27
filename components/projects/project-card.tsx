'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProjectWithRole, UserRole } from '@/types/project'
import { MoreHorizontal, Archive, Copy, UserPlus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'
import { useDeleteProject } from '@/hooks/use-projects'
import { InviteUserDialog } from '@/components/projects/invite-user-dialog'
import { useState } from 'react'

interface ProjectCardProps {
  project: ProjectWithRole
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter()
  const deleteProject = useDeleteProject(project.id)

  const handleOpen = () => {
    router.push(`/projects/${project.id}`)
  }

  const handleArchive = async () => {
    await deleteProject.mutateAsync()
  }

  const getRoleBadge = (role: UserRole) => {
    const roleLabels = {
      [UserRole.Administrator]: 'Administrator',
      [UserRole.ContentManager]: 'Content Manager',
      [UserRole.Default]: 'User'
    }

    const roleColors = {
      [UserRole.Administrator]: 'bg-purple-100 text-purple-800',
      [UserRole.ContentManager]: 'bg-blue-100 text-blue-800',
      [UserRole.Default]: 'bg-gray-100 text-gray-800'
    }

    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[role]}`}>
        {roleLabels[role]}
      </span>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleOpen}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex-1">
          <CardTitle className="text-lg">{project.name}</CardTitle>
          <CardDescription className="mt-1">
            Created {new Date(project.created_at).toLocaleDateString()}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {getRoleBadge(project.user_role)}
          {project.user_role === UserRole.Administrator && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Users
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate Project
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleArchive()
                  }}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {project.is_deleted ? 'This project is archived' : 'Click to open project'}
        </p>
      </CardContent>
    </Card>
  )
}