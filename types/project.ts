export interface Project {
  id: string
  name: string
  created_at: string
  updated_at: string
  created_by: string
  is_deleted: boolean
}

export interface UserProjectRole {
  id: string
  user_id: string
  project_id: string
  role: UserRole
  created_at: string
  created_by: string
}

export enum UserRole {
  Default = 'default',
  ContentManager = 'content_manager', 
  Administrator = 'administrator'
}

export interface ProjectWithRole extends Project {
  user_role: UserRole
}

export interface CreateProjectInput {
  name: string
}

export interface UpdateProjectInput {
  name?: string
  is_deleted?: boolean
}

export interface ProjectInvitation {
  id: string
  project_id: string
  email: string
  role: UserRole
  expires_at: string
  used_at?: string
  created_at: string
  created_by: string
}