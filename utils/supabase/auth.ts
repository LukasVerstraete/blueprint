import { createClient } from './client'

export interface AuthResponse {
  error?: string
  success?: boolean
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function signUp(email: string, password: string): Promise<AuthResponse> {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function signOut(): Promise<AuthResponse> {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signOut()

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function getUser() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  return user
}

export async function getSession() {
  const supabase = createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  return session
}