import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { UserRole } from '@/types/project'
import { randomBytes } from 'crypto'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userRole } = await supabase
    .from('user_project_roles')
    .select('role')
    .eq('project_id', (await params).id)
    .eq('user_id', user.id)
    .single()

  if (!userRole || userRole.role !== UserRole.Administrator) {
    return NextResponse.json({ error: 'Only administrators can view invitations' }, { status: 403 })
  }

  const { data: invitations, error } = await supabase
    .from('project_invitations')
    .select('*')
    .eq('project_id', (await params).id)
    .is('used_at', null)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(invitations)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userRole } = await supabase
    .from('user_project_roles')
    .select('role')
    .eq('project_id', (await params).id)
    .eq('user_id', user.id)
    .single()

  if (!userRole || userRole.role !== UserRole.Administrator) {
    return NextResponse.json({ error: 'Only administrators can create invitations' }, { status: 403 })
  }

  const { email, role } = await request.json()

  if (!email || !role) {
    return NextResponse.json({ error: 'Email and role are required' }, { status: 400 })
  }

  if (!Object.values(UserRole).includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  // Check if email is already invited to project (pending invitation)
  const { data: existingInvite } = await supabase
    .from('project_invitations')
    .select('id')
    .eq('project_id', (await params).id)
    .eq('email', email)
    .is('used_at', null)
    .gte('expires_at', new Date().toISOString())
    .single()

  if (existingInvite) {
    return NextResponse.json({ error: 'User already has a pending invitation' }, { status: 400 })
  }

  // Generate invitation token
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

  const { data: invitation, error } = await supabase
    .from('project_invitations')
    .insert({
      project_id: (await params).id,
      email,
      role,
      token,
      expires_at: expiresAt.toISOString(),
      created_by: user.id
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // TODO: Send invitation email
  // For now, just return the invitation with the token
  return NextResponse.json({
    ...invitation,
    invitation_url: `${process.env.NEXT_PUBLIC_APP_URL}/invitations/${token}`
  })
}