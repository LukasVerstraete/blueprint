import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: projectId } = await params

  try {
    // Check if user has admin access to the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        user_project_roles!inner(role)
      `)
      .eq('id', projectId)
      .eq('user_project_roles.user_id', user.id)
      .eq('user_project_roles.role', 'administrator')
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or insufficient permissions' },
        { status: 403 }
      )
    }

    // Restore the project
    const { error: updateError } = await supabase
      .from('projects')
      .update({ is_deleted: false })
      .eq('id', projectId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Project restore error:', error)
    return NextResponse.json(
      { error: 'Failed to restore project' },
      { status: 500 }
    )
  }
}