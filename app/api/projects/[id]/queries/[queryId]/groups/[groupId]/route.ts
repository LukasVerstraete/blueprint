import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; queryId: string; groupId: string }> }
) {
  const { id: projectId, queryId, groupId } = await params
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check user has ContentManager or Administrator role
  const { data: role, error: roleError } = await supabase
    .from('user_project_roles')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single()

  if (roleError || !role || role.role === 'default') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Verify group exists and belongs to the query
  const { data: group, error: groupError } = await supabase
    .from('query_groups')
    .select('id')
    .eq('id', groupId)
    .eq('query_id', queryId)
    .single()

  if (groupError || !group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 })
  }

  // Hard delete the group (this will cascade to rules)
  const { error } = await supabase
    .from('query_groups')
    .delete()
    .eq('id', groupId)

  if (error) {
    console.error('Error deleting query group:', error)
    return NextResponse.json({ error: 'Failed to delete query group' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}