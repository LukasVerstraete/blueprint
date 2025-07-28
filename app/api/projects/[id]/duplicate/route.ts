import { createServerClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const projectId = params.id

  try {
    // Check if user has admin access to the source project
    const { data: sourceProject, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        user_project_roles!inner(role)
      `)
      .eq('id', projectId)
      .eq('user_project_roles.user_id', user.id)
      .eq('user_project_roles.role', 'administrator')
      .single()

    if (projectError || !sourceProject) {
      return NextResponse.json(
        { error: 'Project not found or insufficient permissions' },
        { status: 403 }
      )
    }

    // Create the new project
    const { data: newProject, error: createError } = await supabase
      .from('projects')
      .insert({
        name: `${sourceProject.name} (Copy)`,
        created_by: user.id,
      })
      .select()
      .single()

    if (createError || !newProject) {
      throw createError
    }

    // Add the user as admin of the new project
    await supabase
      .from('user_project_roles')
      .insert({
        user_id: user.id,
        project_id: newProject.id,
        role: 'administrator'
      })

    // TODO: In later phases, copy entities, properties, pages, and queries

    return NextResponse.json({ project: newProject })
  } catch (error) {
    console.error('Project duplication error:', error)
    return NextResponse.json(
      { error: 'Failed to duplicate project' },
      { status: 500 }
    )
  }
}