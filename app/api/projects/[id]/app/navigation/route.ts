import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
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

  // Check user has access to this project
  const { data: projectRole, error: roleError } = await supabase
    .from('user_project_roles')
    .select('role')
    .eq('project_id', params.id)
    .eq('user_id', user.id)
    .single()

  if (roleError || !projectRole) {
    return NextResponse.json(
      { error: 'Project not found or access denied' },
      { status: 404 }
    )
  }

  // Fetch top-level pages (no parent) that are navigable
  // A page is navigable if it has no required parameters
  const { data: pages, error: pagesError } = await supabase
    .from('pages')
    .select(`
      id,
      name,
      parent_page_id,
      sort_order,
      page_parameters!left (
        id,
        is_required
      )
    `)
    .eq('project_id', params.id)
    .is('parent_page_id', null)
    .eq('is_deleted', false)
    .order('sort_order', { ascending: true })

  if (pagesError) {
    console.error('Error fetching pages:', pagesError)
    return NextResponse.json(
      { error: 'Failed to fetch navigation' },
      { status: 500 }
    )
  }

  // Filter out pages that have required parameters
  const navigablePages = pages?.filter(page => {
    const hasRequiredParams = page.page_parameters?.some((param: any) => param.is_required)
    return !hasRequiredParams
  }).map(page => ({
    id: page.id,
    name: page.name,
    parent_page_id: page.parent_page_id,
    sort_order: page.sort_order,
    requires_parameters: page.page_parameters?.some((param: any) => param.is_required) || false
  }))

  return NextResponse.json(navigablePages || [])
}