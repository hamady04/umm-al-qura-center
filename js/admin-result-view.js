// js/admin-result-view.js
// Admin viewing student result (same view as student)
import { supabase } from './supabase.js'
import { showLoading, hideLoading, formatDate, getGradeClass } from './main.js'
import { requireAdmin } from './auth.js'

async function init() {
  showLoading()
  const auth = await requireAdmin()
  if (!auth) return
  hideLoading()

  const params = new URLSearchParams(window.location.search)
  const studentId = params.get('id')
  const regNum = params.get('reg')

  if (!studentId && !regNum) {
    window.location.href = '/students.html'
    return
  }

  await loadResult(studentId, regNum)
}

async function loadResult(studentId, regNum) {
  const container = document.getElementById('result-container')
  const loadingEl = document.getElementById('result-loading')
  const notFoundEl = document.getElementById('result-not-found')

  let result = null

  if (regNum) {
    // Use RPC function
    const { data, error } = await supabase.rpc('get_student_result', {
      p_registration_number: regNum
    })
    if (!error && data && data.length > 0) {
      result = data[0]
    }
  } else if (studentId) {
    // Direct query for admin
    const { data: student } = await supabase
      .from('students')
      .select('id, registration_number, full_name, birth_year')
      .eq('id', studentId)
      .single()

    const { data: resultData } = await supabase
      .from('results')
      .select('*')
      .eq('student_id', studentId)
      .single()

    if (student && resultData) {
      result = { ...student, ...resultData }
    } else if (student) {
      result = { ...student }
    }
  }

  if (loadingEl) loadingEl.style.display = 'none'

  if (!result) {
    if (notFoundEl) notFoundEl.style.display = 'block'
    return
  }

  if (container) container.style.display = 'block'
  renderResult(result)
}

function renderResult(r) {
  setText('student-name', r.full_name || '-')
  setText('student-reg', r.registration_number || '-')
  setText('student-birth', r.birth_year || '-')
  setText('r-attendance', r.attendance ?? '-')
  setText('r-behavior', r.good_behavior ?? '-')
  setText('r-memorization', r.new_memorization ?? '-')
  setText('r-tajweed', r.tajweed ?? '-')
  setText('r-final-exam', r.final_exam ?? '-')
  setText('r-percentage', r.percentage !== null && r.percentage !== undefined ? r.percentage + '%' : '-')
  
  // Fallback: Calculate grade from percentage if DB doesn't return it
  let finalGrade = r.grade;
  if (!finalGrade && r.percentage !== null && r.percentage !== undefined) {
    const p = Number(r.percentage);
    if (p >= 85) finalGrade = 'ممتاز'
    else if (p >= 75) finalGrade = 'جيد جداً'
    else if (p >= 65) finalGrade = 'جيد'
    else if (p >= 50) finalGrade = 'مقبول'
    else finalGrade = 'ضعيف وارجو الاهتمام اكثر'
  }

  setText('r-grade', finalGrade || '-')
  setText('result-updated-at', formatDate(r.updated_at))

  const gradeBadge = document.getElementById('grade-badge')
  if (gradeBadge && finalGrade) {
    gradeBadge.textContent = finalGrade
    gradeBadge.className = `result-grade-badge ${getGradeClass(finalGrade)}`
  }
}

function setText(id, text) {
  const el = document.getElementById(id)
  if (el) el.textContent = text
}

// Back button
const backBtn = document.getElementById('back-btn')
if (backBtn) {
  backBtn.addEventListener('click', () => history.back())
}

// Print button
const printBtn = document.getElementById('print-btn')
if (printBtn) {
  printBtn.addEventListener('click', () => window.print())
}

init()
