import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  // Try a simple query to test connection and RLS
  const { error: testError, count } = await supabase
    .from('queries')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)

  return NextResponse.json({
    user: user?.email || 'Not authenticated',
    userError: userError?.message || null,
    queryTestError: testError?.message || testError?.code || null,
    queryCount: count,
    projectId,
    success: !testError
  })
}