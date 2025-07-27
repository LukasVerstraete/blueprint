'use client'

import { UserPlus, Shield, ShieldCheck, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProjectContext } from '@/app/providers/project-provider'
import { useProjectUsers, useUpdateUserRole } from '@/hooks/use-project-users'
import { RoleGuard } from '@/components/auth/role-guard'
import { UserRole } from '@/types/project'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/app/providers/auth-provider'
import { InviteUserDialog } from '@/components/projects/invite-user-dialog'

export default function UsersPage() {
  const { currentProject } = useProjectContext()
  const { user: currentUser } = useAuth()
  const { data: users, isLoading } = useProjectUsers(currentProject?.id || '')
  const updateRole = useUpdateUserRole(currentProject?.id || '')

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.Administrator:
        return <ShieldCheck className="h-4 w-4" />
      case UserRole.ContentManager:
        return <Shield className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.Administrator:
        return 'Administrator'
      case UserRole.ContentManager:
        return 'Content Manager'
      default:
        return 'User'
    }
  }

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-muted-foreground">Please select a project first</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <RoleGuard requiredRole={UserRole.Administrator}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground">
              Manage users and their roles in {currentProject.name}
            </p>
          </div>
          <InviteUserDialog projectId={currentProject.id} />
        </div>

        {users && users.length > 0 ? (
          <div className="grid gap-4">
            {users.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{user.email}</CardTitle>
                      <CardDescription>
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(user.role)}
                      {user.id === currentUser?.id ? (
                        <span className="text-sm font-medium">{getRoleLabel(user.role)} (You)</span>
                      ) : (
                        <Select
                          value={user.role}
                          onValueChange={(value: UserRole) => {
                            updateRole.mutate({ user_id: user.id, role: value })
                          }}
                          disabled={updateRole.isPending}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={UserRole.Default}>User</SelectItem>
                            <SelectItem value={UserRole.ContentManager}>Content Manager</SelectItem>
                            <SelectItem value={UserRole.Administrator}>Administrator</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 px-4 py-32">
            <div className="text-center">
              <h3 className="text-lg font-semibold">No users yet</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Invite users to collaborate on this project
              </p>
              <InviteUserDialog projectId={currentProject.id} />
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  )
}