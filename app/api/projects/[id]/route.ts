import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { UpdateProjectInput, UserRole } from '@/types/project'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      user_project_roles!inner(role)
    `)
    .eq('id', (await params).id)
    .eq('user_project_roles.user_id', user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: project.id,
    name: project.name,
    created_at: project.created_at,
    updated_at: project.updated_at,
    created_by: project.created_by,
    is_deleted: project.is_deleted,
    user_role: project.user_project_roles[0].role
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: role } = await supabase
    .from('user_project_roles')
    .select('role')
    .eq('project_id', (await params).id)
    .eq('user_id', user.id)
    .single()

  if (!role || role.role !== UserRole.Administrator) {
    return NextResponse.json({ error: 'Only administrators can update projects' }, { status: 403 })
  }

  const body: UpdateProjectInput = await request.json()

  const updateData: Partial<{ name: string; is_deleted: boolean }> = {}
  if (body.name !== undefined) updateData.name = body.name
  if (body.is_deleted !== undefined) updateData.is_deleted = body.is_deleted

  const { data: project, error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', (await params).id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ...project,
    user_role: role.role
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: role } = await supabase
    .from('user_project_roles')
    .select('role')
    .eq('project_id', (await params).id)
    .eq('user_id', user.id)
    .single()

  if (!role || role.role !== UserRole.Administrator) {
    return NextResponse.json({ error: 'Only administrators can delete projects' }, { status: 403 })
  }

  const { error } = await supabase
    .from('projects')
    .update({ is_deleted: true })
    .eq('id', (await params).id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}