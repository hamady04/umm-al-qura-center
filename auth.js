// js/auth.js
// Authentication & Admin guard functions
import { supabase } from './supabase.js'
import { showToast } from './main.js'

// Check if user is logged in and is admin - redirects if not
export async function requireAdmin() {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    window.location.href = '/admin-login.html'
    return null
  }

  // Verify admin_profiles
  const { data: profile, error } = await supabase
    .from('admin_profiles')
    .select('full_name, role')
    .eq('id', session.user.id)
    .single()

  if (error || !profile || profile.role !== 'admin') {
    showToast('ليس لديك صلاحية الدخول إلى لوحة الإدارة.', 'error')
    await supabase.auth.signOut()
    setTimeout(() => { window.location.href = '/admin-login.html' }, 1500)
    return null
  }

  return { session, profile }
}

// Sign out
export async function signOut() {
  await supabase.auth.signOut()
  window.location.href = '/admin-login.html'
}

// Get current session
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
