// js/student-result.js
// Student result display page
import { formatDate, getGradeClass } from './main.js'

const resultData = sessionStorage.getItem('studentResult')
const container = document.getElementById('result-container')
const loadingEl = document.getElementById('result-loading')
const notFoundEl = document.getElementById('result-not-found')

if (!resultData) {
  // No result in session - redirect to search
  if (loadingEl) loadingEl.style.display = 'none'
  if (notFoundEl) notFoundEl.style.display = 'block'
  if (container) container.style.display = 'none'
} else {
  try {
    const result = JSON.parse(resultData)
    renderResult(result)
  } catch {
    if (loadingEl) loadingEl.style.display = 'none'
    if (notFoundEl) notFoundEl.style.display = 'block'
  }
}

function renderResult(r) {
  if (loadingEl) loadingEl.style.display = 'none'
  if (notFoundEl) notFoundEl.style.display = 'none'
  if (container) container.style.display = 'block'

  // Student info
  setText('student-name', r.full_name || '-')
  setText('student-reg', r.registration_number || '-')
  setText('student-birth', r.birth_year || '-')

  // Result fields
  setText('r-attendance', formatScore(r.attendance))
  setText('r-behavior', formatScore(r.good_behavior))
  setText('r-memorization', formatScore(r.new_memorization))
  setText('r-tajweed', formatScore(r.tajweed))
  setText('r-final-exam', formatScore(r.final_exam))
  setText('r-percentage', r.percentage !== null && r.percentage !== undefined ? r.percentage + '%' : '-')
  
  // Fallback: Calculate grade from percentage if RPC doesn't return it
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

  // Grade badge
  const gradeBadge = document.getElementById('grade-badge')
  if (gradeBadge && finalGrade) {
    gradeBadge.textContent = finalGrade
    gradeBadge.className = `result-grade-badge ${getGradeClass(finalGrade)}`
  }

  // Updated at
  setText('result-updated-at', formatDate(r.updated_at))

  // Clear session after displaying (optional - keep for back button)
  // sessionStorage.removeItem('studentResult')
}

function setText(id, text) {
  const el = document.getElementById(id)
  if (el) el.textContent = text
}

function formatScore(val) {
  if (val === null || val === undefined || val === '') return '-'
  return val
}

// Back button
const backBtn = document.getElementById('back-btn')
if (backBtn) {
  backBtn.addEventListener('click', () => {
    window.location.href = '/results.html'
  })
}

// Print button
const printBtn = document.getElementById('print-btn')
if (printBtn) {
  printBtn.addEventListener('click', () => window.print())
}
