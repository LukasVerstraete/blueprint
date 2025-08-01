import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { CreateProjectInput, UserRole } from '@/types/project'

export async function GET(_request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      *,
      user_project_roles!inner(role)
    `)
    .eq('user_project_roles.user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const projectsWithRole = projects?.map(project => ({
    id: project.id,
    name: project.name,
    created_at: project.created_at,
    updated_at: project.updated_at,
    created_by: project.created_by,
    is_deleted: project.is_deleted,
    user_role: project.user_project_roles[0].role
  }))

  return NextResponse.json(projectsWithRole)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: CreateProjectInput = await request.json()

  if (!body.name || body.name.trim().length === 0) {
    return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
  }

  const { data: project, error: createError } = await supabase
    .from('projects')
    .insert({
      name: body.name,
      created_by: user.id
    })
    .select()
    .single()

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 500 })
  }

  const { error: roleError } = await supabase
    .from('user_project_roles')
    .insert({
      user_id: user.id,
      project_id: project.id,
      role: UserRole.Administrator,
      created_by: user.id
    })

  if (roleError) {
    await supabase.from('projects').delete().eq('id', project.id)
    return NextResponse.json({ error: roleError.message }, { status: 500 })
  }

  return NextResponse.json({
    ...project,
    user_role: UserRole.Administrator
  })
}