// js/student-management.js
// Add and Edit student pages
import { supabase } from './supabase.js'
import { showToast, showLoading, hideLoading, setButtonLoading, getErrorMessage } from './main.js'
import { requireAdmin } from './auth.js'

const page = document.body.dataset.page // 'add' or 'edit'

async function init() {
  showLoading()
  const auth = await requireAdmin()
  if (!auth) return
  hideLoading()

  if (page === 'edit') {
    await loadStudentForEdit()
  }
}

// ---- ADD STUDENT ----
const addForm = document.getElementById('add-student-form')
if (addForm) {
  addForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const btn = addForm.querySelector('button[type="submit"]')
    const errorEl = document.getElementById('form-error')

    const regNum = document.getElementById('registration_number').value.trim()
    const fullName = document.getElementById('full_name').value.trim()
    const birthYear = document.getElementById('birth_year').value.trim()

    // Validation
    if (!regNum) { showFormError(errorEl, 'يرجى إدخال رقم القيد.'); return }
    if (!fullName) { showFormError(errorEl, 'يرجى إدخال اسم الطالب.'); return }
    if (birthYear && isNaN(Number(birthYear))) { showFormError(errorEl, 'سنة الميلاد يجب أن تكون رقماً.'); return }

    hideFormError(errorEl)
    setButtonLoading(btn, true, 'جاري الإضافة...')

    const { data, error } = await supabase
      .from('students')
      .insert([{
        registration_number: regNum,
        full_name: fullName,
        birth_year: birthYear ? Number(birthYear) : null
      }])
      .select()

    setButtonLoading(btn, false)

    if (error) {
      if (error.code === '23505') {
        showFormError(errorEl, 'رقم القيد مستخدم مسبقاً.')
      } else {
        showFormError(errorEl, 'تعذر إضافة الطالب. ' + getErrorMessage(error))
      }
      return
    }

    showToast('تمت إضافة الطالب بنجاح! ✅', 'success')
    addForm.reset()
    setTimeout(() => { window.location.href = '/students.html' }, 1200)
  })
}

// ---- EDIT STUDENT ----
async function loadStudentForEdit() {
  const params = new URLSearchParams(window.location.search)
  const id = params.get('id')

  if (!id) {
    showToast('معرف الطالب غير موجود.', 'error')
    window.location.href = '/students.html'
    return
  }

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    showToast('الطالب غير موجود.', 'error')
    window.location.href = '/students.html'
    return
  }

  // Populate form
  const regInput = document.getElementById('registration_number')
  const nameInput = document.getElementById('full_name')
  const birthInput = document.getElementById('birth_year')

  if (regInput) regInput.value = data.registration_number || ''
  if (nameInput) nameInput.value = data.full_name || ''
  if (birthInput) birthInput.value = data.birth_year || ''

  // Store ID in hidden field
  const idField = document.getElementById('student-id')
  if (idField) idField.value = id
}

const editForm = document.getElementById('edit-student-form')
if (editForm) {
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const btn = editForm.querySelector('button[type="submit"]')
    const errorEl = document.getElementById('form-error')

    const id = document.getElementById('student-id')?.value
    const regNum = document.getElementById('registration_number').value.trim()
    const fullName = document.getElementById('full_name').value.trim()
    const birthYear = document.getElementById('birth_year').value.trim()

    if (!id) { showFormError(errorEl, 'خطأ: معرف الطالب مفقود.'); return }
    if (!regNum) { showFormError(errorEl, 'يرجى إدخال رقم القيد.'); return }
    if (!fullName) { showFormError(errorEl, 'يرجى إدخال اسم الطالب.'); return }
    if (birthYear && isNaN(Number(birthYear))) { showFormError(errorEl, 'سنة الميلاد يجب أن تكون رقماً.'); return }

    hideFormError(errorEl)
    setButtonLoading(btn, true, 'جاري الحفظ...')

    const { error } = await supabase
      .from('students')
      .update({
        registration_number: regNum,
        full_name: fullName,
        birth_year: birthYear ? Number(birthYear) : null
        // updated_at is managed by DB trigger
      })
      .eq('id', id)

    setButtonLoading(btn, false)

    if (error) {
      if (error.code === '23505') {
        showFormError(errorEl, 'رقم القيد مستخدم مسبقاً.')
      } else {
        showFormError(errorEl, 'تعذر تحديث البيانات. ' + getErrorMessage(error))
      }
      return
    }

    showToast('تم تحديث بيانات الطالب بنجاح! ✅', 'success')
    setTimeout(() => { window.location.href = '/students.html' }, 1200)
  })
}

// ---- Helpers ----
function showFormError(el, msg) {
  if (el) {
    el.textContent = msg
    el.style.display = 'block'
    el.classList.add('show')
  }
}

function hideFormError(el) {
  if (el) {
    el.textContent = ''
    el.style.display = 'none'
    el.classList.remove('show')
  }
}

init()
