// js/admin.js
// Admin login + dashboard logic
import { supabase } from './supabase.js'
import { showToast, setButtonLoading, showLoading, hideLoading, formatDate } from './main.js'
import { requireAdmin, signOut } from './auth.js'

// ============================================================
// LOGIN PAGE
// ============================================================
const loginForm = document.getElementById('login-form')
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    const email = document.getElementById('email').value.trim()
    const password = document.getElementById('password').value
    const btn = loginForm.querySelector('button[type="submit"]')
    const errorEl = document.getElementById('login-error')

    if (!email || !password) {
      showError(errorEl, 'يرجى إدخال البريد الإلكتروني وكلمة المرور.')
      return
    }

    hideError(errorEl)
    setButtonLoading(btn, true, 'جاري تسجيل الدخول...')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setButtonLoading(btn, false)
        showError(errorEl, 'البريد الإلكتروني أو كلمة المرور غير صحيحة.')
        return
      }

      // Verify admin role
      const { data: profile, error: profileError } = await supabase
        .from('admin_profiles')
        .select('full_name, role')
        .eq('id', data.user.id)
        .single()

      if (profileError || !profile || profile.role !== 'admin') {
        await supabase.auth.signOut()
        setButtonLoading(btn, false)
        showError(errorEl, 'ليس لديك صلاحية الدخول إلى لوحة الإدارة.')
        return
      }

      showToast('مرحباً بك، جاري التحويل...', 'success')
      setTimeout(() => { window.location.href = '/admin-dashboard.html' }, 1000)

    } catch (err) {
      console.error(err)
      setButtonLoading(btn, false)
      showError(errorEl, 'حدث خطأ في الاتصال بقاعدة البيانات.')
    }
  })
}

// ============================================================
// DASHBOARD PAGE
// ============================================================
const dashboardEl = document.getElementById('dashboard-page')
if (dashboardEl) {
  initDashboard()
}

async function initDashboard() {
  showLoading()

  const auth = await requireAdmin()
  if (!auth) return

  hideLoading()

  // Welcome message
  const welcomeEl = document.getElementById('welcome-name')
  if (welcomeEl) {
    welcomeEl.textContent = auth.profile.full_name || 'المسؤول'
  }

  // Load stats
  loadStats()
}

async function loadStats() {
  // Count students
  const { count: studentsCount } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })

  // Count results
  const { count: resultsCount } = await supabase
    .from('results')
    .select('id', { count: 'exact', head: true })

  // Last update
  const { data: lastResult } = await supabase
    .from('results')
    .select('updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  const countEl = document.getElementById('stat-students')
  const resEl = document.getElementById('stat-results')
  const updateEl = document.getElementById('stat-last-update')

  if (countEl) countEl.textContent = studentsCount ?? 0
  if (resEl) resEl.textContent = resultsCount ?? 0
  if (updateEl) updateEl.textContent = lastResult ? formatDate(lastResult.updated_at) : '-'
}

// Logout button on dashboard
const logoutBtn = document.getElementById('logout-btn')
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await signOut()
  })
}

// ---- Helpers ----
function showError(el, msg) {
  if (el) {
    el.textContent = msg
    el.classList.add('show')
    el.style.display = 'block'
  }
}

function hideError(el) {
  if (el) {
    el.textContent = ''
    el.classList.remove('show')
    el.style.display = 'none'
  }
}
