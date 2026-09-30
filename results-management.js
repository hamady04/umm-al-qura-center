// js/results-management.js
// Results management page
import { supabase } from './supabase.js'
import { showToast, showLoading, hideLoading, setButtonLoading, getErrorMessage } from './main.js'
import { requireAdmin } from './auth.js'

let currentStudentId = null
let existingResultId = null

async function init() {
  showLoading()
  const auth = await requireAdmin()
  if (!auth) return
  hideLoading()

  // Check if student_id passed via URL
  const params = new URLSearchParams(window.location.search)
  const studentId = params.get('student_id')
  const studentName = params.get('name')

  if (studentId) {
    // Pre-select the student
    await loadStudentSelector()
    const select = document.getElementById('student-select')
    if (select) {
      select.value = studentId
      currentStudentId = studentId
      await loadStudentResult(studentId)
      if (studentName) {
        const label = document.getElementById('selected-student-name')
        if (label) label.textContent = decodeURIComponent(studentName)
      }
    }
  } else {
    await loadStudentSelector()
  }
}

async function loadStudentSelector() {
  const select = document.getElementById('student-select')
  if (!select) return

  select.innerHTML = '<option value="">-- اختر الطالب --</option>'

  const { data, error } = await supabase
    .from('students')
    .select('id, registration_number, full_name')
    .order('full_name')

  if (error || !data) {
    showToast('تعذر تحميل قائمة الطلاب.', 'error')
    return
  }

  data.forEach(s => {
    const option = document.createElement('option')
    option.value = s.id
    option.textContent = `${s.registration_number} - ${s.full_name}`
    select.appendChild(option)
  })

  select.addEventListener('change', async () => {
    currentStudentId = select.value
    if (!currentStudentId) {
      clearResultForm()
      return
    }
    const selected = data.find(s => s.id === currentStudentId)
    const label = document.getElementById('selected-student-name')
    if (label && selected) label.textContent = selected.full_name
    await loadStudentResult(currentStudentId)
  })
}

async function loadStudentResult(studentId) {
  const formSection = document.getElementById('result-form-section')
  if (formSection) formSection.style.display = 'block'

  const { data, error } = await supabase
    .from('results')
    .select('*')
    .eq('student_id', studentId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned (not an error, just no result yet)
    showToast('تعذر تحميل بيانات النتيجة.', 'error')
    return
  }

  if (data) {
    existingResultId = data.id
    populateForm(data)
    const statusEl = document.getElementById('result-status')
    if (statusEl) statusEl.textContent = '(نتيجة موجودة - سيتم تحديثها)'
  } else {
    existingResultId = null
    clearResultForm()
    const statusEl = document.getElementById('result-status')
    if (statusEl) statusEl.textContent = '(لا توجد نتيجة - سيتم إضافة نتيجة جديدة)'
  }
}

function populateForm(result) {
  const fields = ['attendance', 'good_behavior', 'new_memorization', 'tajweed', 'final_exam', 'percentage', 'grade']
  fields.forEach(field => {
    const el = document.getElementById(`field-${field}`)
    if (el) el.value = result[field] ?? ''
  })
  // Recalculate to ensure legacy records without grade get it auto-filled
  calculateResult()
}

function clearResultForm() {
  const fields = ['attendance', 'good_behavior', 'new_memorization', 'tajweed', 'final_exam', 'percentage', 'grade']
  fields.forEach(field => {
    const el = document.getElementById(`field-${field}`)
    if (el) el.value = ''
  })
  existingResultId = null
  calculateResult()
}

// Calculate percentage and grade dynamically
const calcFields = ['attendance', 'good_behavior', 'new_memorization', 'tajweed', 'final_exam']
calcFields.forEach(field => {
  const el = document.getElementById(`field-${field}`)
  if (el) el.addEventListener('input', calculateResult)
})

function calculateResult() {
  const attendance = Number(document.getElementById('field-attendance').value) || 0
  const good_behavior = Number(document.getElementById('field-good_behavior').value) || 0
  const new_memorization = Number(document.getElementById('field-new_memorization').value) || 0
  const tajweed = Number(document.getElementById('field-tajweed').value) || 0
  const final_exam = Number(document.getElementById('field-final_exam').value) || 0

  const total = attendance + good_behavior + new_memorization + tajweed + final_exam
  
  const percentageEl = document.getElementById('field-percentage')
  const gradeEl = document.getElementById('field-grade')
  
  if (percentageEl) percentageEl.value = total

  if (gradeEl) {
    let grade = ''
    if (total >= 85) grade = 'ممتاز'
    else if (total >= 75) grade = 'جيد جداً'
    else if (total >= 65) grade = 'جيد'
    else if (total >= 50) grade = 'مقبول'
    else grade = 'ضعيف وارجو الاهتمام اكثر'
    
    gradeEl.value = grade
  }
}

// Save result
const saveBtn = document.getElementById('save-result-btn')
const resultForm = document.getElementById('result-form')

if (resultForm) {
  resultForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    if (!currentStudentId) {
      showToast('يرجى اختيار طالب أولاً.', 'warning')
      return
    }

    const btn = document.getElementById('save-result-btn')
    const errorEl = document.getElementById('form-error')

    // Collect values
    const attendance = document.getElementById('field-attendance').value.trim()
    const good_behavior = document.getElementById('field-good_behavior').value.trim()
    const new_memorization = document.getElementById('field-new_memorization').value.trim()
    const tajweed = document.getElementById('field-tajweed').value.trim()
    const final_exam = document.getElementById('field-final_exam').value.trim()
    const percentage = document.getElementById('field-percentage').value.trim()
    const grade = document.getElementById('field-grade').value.trim()

    // Basic numeric validation
    const numericFields = { attendance, good_behavior, new_memorization, tajweed, final_exam, percentage }
    for (const [key, val] of Object.entries(numericFields)) {
      if (val !== '' && isNaN(Number(val))) {
        showFormError(errorEl, 'جميع الدرجات يجب أن تكون أرقاماً.')
        return
      }
    }

    hideFormError(errorEl)
    setButtonLoading(btn, true, 'جاري الحفظ...')

    const payload = {
      student_id: currentStudentId,
      attendance: attendance !== '' ? Number(attendance) : null,
      good_behavior: good_behavior !== '' ? Number(good_behavior) : null,
      new_memorization: new_memorization !== '' ? Number(new_memorization) : null,
      tajweed: tajweed !== '' ? Number(tajweed) : null,
      final_exam: final_exam !== '' ? Number(final_exam) : null,
      percentage: percentage !== '' ? Number(percentage) : null,
      grade: grade || null
      // updated_at managed by DB trigger
    }

    let error

    if (existingResultId) {
      // UPDATE
      const result = await supabase
        .from('results')
        .update(payload)
        .eq('id', existingResultId)
      error = result.error
    } else {
      // INSERT
      const result = await supabase
        .from('results')
        .insert([payload])
        .select()
      error = result.error
      if (!error && result.data) existingResultId = result.data[0]?.id
    }

    setButtonLoading(btn, false)

    if (error) {
      showFormError(errorEl, 'تعذر تحديث البيانات. ' + getErrorMessage(error))
    } else {
      showToast('تم حفظ النتيجة بنجاح! ✅', 'success')
      const statusEl = document.getElementById('result-status')
      if (statusEl) statusEl.textContent = '(نتيجة موجودة - سيتم تحديثها)'
    }
  })
}

function showFormError(el, msg) {
  if (el) { el.textContent = msg; el.style.display = 'block' }
}

function hideFormError(el) {
  if (el) { el.textContent = ''; el.style.display = 'none' }
}

init()
