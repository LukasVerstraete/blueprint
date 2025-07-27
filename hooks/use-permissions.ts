import { useProjectContext } from '@/app/providers/project-provider'
import { UserRole } from '@/types/project'

export function usePermissions() {
  const { currentProject } = useProjectContext()

  const roleHierarchy = {
    [UserRole.Default]: 0,
    [UserRole.ContentManager]: 1,
    [UserRole.Administrator]: 2,
  }

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!currentProject) return false
    
    const userRoleLevel = roleHierarchy[currentProject.user_role]
    const requiredRoleLevel = roleHierarchy[requiredRole]
    
    return userRoleLevel >= requiredRoleLevel
  }

  const permissions = {
    canViewProjects: true,
    canCreateProjects: true,
    canViewEntities: hasRole(UserRole.Administrator),
    canManageEntities: hasRole(UserRole.Administrator),
    canViewPages: hasRole(UserRole.ContentManager),
    canManagePages: hasRole(UserRole.ContentManager),
    canViewQueries: hasRole(UserRole.ContentManager),
    canManageQueries: hasRole(UserRole.ContentManager),
    canViewUsers: hasRole(UserRole.Administrator),
    canManageUsers: hasRole(UserRole.Administrator),
    canInviteUsers: hasRole(UserRole.Administrator),
    canAssignRoles: hasRole(UserRole.Administrator),
    canArchiveProject: hasRole(UserRole.Administrator),
    canDuplicateProject: hasRole(UserRole.Administrator),
    canTransferOwnership: hasRole(UserRole.Administrator),
  }

  return {
    ...permissions,
    hasRole,
    currentRole: currentProject?.user_role,
    isAdmin: currentProject?.user_role === UserRole.Administrator,
    isContentManager: hasRole(UserRole.ContentManager),
  }
}