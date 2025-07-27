'use client'

import { usePermissions } from '@/hooks/use-permissions'
import { UserRole } from '@/types/project'
import { ReactNode } from 'react'

interface RoleGuardProps {
  children: ReactNode
  requiredRole?: UserRole
  requiredPermission?: keyof ReturnType<typeof usePermissions>
  fallback?: ReactNode
}

export function RoleGuard({ 
  children, 
  requiredRole, 
  requiredPermission,
  fallback = null 
}: RoleGuardProps) {
  const permissions = usePermissions()

  if (requiredRole && !permissions.hasRole(requiredRole)) {
    return <>{fallback}</>
  }

  if (requiredPermission && !permissions[requiredPermission]) {
    return <>{fallback}</>
  }

  return <>{children}</>
}