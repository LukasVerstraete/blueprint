import { UserRole } from './project'

export interface User {
  id: string
  email: string
  created_at: string
}

export interface UserWithRole extends User {
  role: UserRole
  role_assigned_at: string
}

export interface InviteUserInput {
  email: string
  role: UserRole
  message?: string
}

export interface UpdateUserRoleInput {
  user_id: string
  role: UserRole
}