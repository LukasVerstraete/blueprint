import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { componentId: string } }
) {
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Fetch component config
  const { data: config, error } = await supabase
    .from('component_config')
    .select('*')
    .eq('component_id', params.componentId)

  if (error) {
    console.error('Error fetching component config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch component config' },
      { status: 500 }
    )
  }

  return NextResponse.json(config || [])
}