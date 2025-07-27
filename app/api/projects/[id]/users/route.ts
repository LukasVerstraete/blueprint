import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { UserRole } from '@/types/project'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userRole } = await supabase
    .from('user_project_roles')
    .select('role')
    .eq('project_id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!userRole) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const { data: userRoles, error: rolesError } = await supabase
    .from('user_project_roles')
    .select(`
      id,
      user_id,
      role,
      created_at
    `)
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })

  if (rolesError) {
    return NextResponse.json({ error: rolesError.message }, { status: 500 })
  }

  const userIds = userRoles?.map(ur => ur.user_id) || []
  
  const { data: authUsers, error: usersError } = await supabase
    .auth.admin.listUsers()
  
  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 })
  }

  const users = userRoles?.map(ur => {
    const authUser = authUsers.users.find(u => u.id === ur.user_id)
    return {
      id: ur.user_id,
      email: authUser?.email || 'Unknown',
      created_at: authUser?.created_at || '',
      role: ur.role,
      role_assigned_at: ur.created_at
    }
  })

  return NextResponse.json(users)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: adminRole } = await supabase
    .from('user_project_roles')
    .select('role')
    .eq('project_id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!adminRole || adminRole.role !== UserRole.Administrator) {
    return NextResponse.json({ error: 'Only administrators can update user roles' }, { status: 403 })
  }

  const { user_id, role } = await request.json()

  if (!user_id || !role) {
    return NextResponse.json({ error: 'user_id and role are required' }, { status: 400 })
  }

  if (!Object.values(UserRole).includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  if (user_id === user.id) {
    return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
  }

  const { error } = await supabase
    .from('user_project_roles')
    .update({ role })
    .eq('project_id', params.id)
    .eq('user_id', user_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}