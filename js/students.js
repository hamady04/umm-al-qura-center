// js/students.js
// Students list page
import { supabase } from './supabase.js'
import { showToast, showLoading, hideLoading, showConfirm, getErrorMessage } from './main.js'
import { requireAdmin } from './auth.js'

let allStudents = []

async function init() {
  showLoading()
  const auth = await requireAdmin()
  if (!auth) return
  hideLoading()
  await loadStudents()
}

async function loadStudents() {
  const tableBody = document.getElementById('students-table-body')
  const emptyState = document.getElementById('empty-state')
  const errorState = document.getElementById('error-state')

  if (!tableBody) return

  tableBody.innerHTML = `
    <tr>
      <td colspan="5">
        <div class="loading-inline">
          <div class="spinner spinner-sm" style="border-top-color: var(--primary);"></div>
          <span>جاري تحميل البيانات...</span>
        </div>
      </td>
    </tr>
  `

  const { data, error } = await supabase
    .from('students')
    .select('id, registration_number, full_name, birth_year, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    tableBody.innerHTML = ''
    if (errorState) errorState.style.display = 'block'
    showToast('حدث خطأ في تحميل بيانات الطلاب.', 'error')
    return
  }

  allStudents = data || []
  renderStudents(allStudents)
}

function renderStudents(students) {
  const tableBody = document.getElementById('students-table-body')
  const emptyState = document.getElementById('empty-state')
  const countEl = document.getElementById('students-count')

  if (countEl) countEl.textContent = `(${students.length})`

  if (!students.length) {
    tableBody.innerHTML = ''
    if (emptyState) emptyState.style.display = 'block'
    return
  }

  if (emptyState) emptyState.style.display = 'none'

  tableBody.innerHTML = students.map(s => `
    <tr>
      <td>${s.registration_number || '-'}</td>
      <td>${s.full_name || '-'}</td>
      <td>${s.birth_year || '-'}</td>
      <td>
        <div class="actions-cell">
          <a href="/edit-student.html?id=${s.id}" class="btn btn-outline btn-sm">✏️ تعديل</a>
          <a href="/results-management.html?student_id=${s.id}&name=${encodeURIComponent(s.full_name)}" class="btn btn-ghost btn-sm">📋 النتيجة</a>
          <a href="/student-result-admin.html?id=${s.id}" class="btn btn-ghost btn-sm">👁️ عرض</a>
          <button class="btn btn-danger btn-sm" onclick="deleteStudent('${s.id}', '${s.full_name.replace(/'/g, "\\'")}')">🗑️ حذف</button>
        </div>
      </td>
    </tr>
  `).join('')
}

// Search
const searchInput = document.getElementById('search-input')
if (searchInput) {
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase()
    if (!q) {
      renderStudents(allStudents)
      return
    }
    const filtered = allStudents.filter(s =>
      (s.full_name || '').toLowerCase().includes(q) ||
      (s.registration_number || '').toLowerCase().includes(q)
    )
    renderStudents(filtered)
  })
}

// Delete student
window.deleteStudent = async function(id, name) {
  const confirmed = await showConfirm(`هل أنت متأكد من حذف الطالب "<strong>${name}</strong>"؟ سيتم حذف نتيجته تلقائياً.`, 'تأكيد الحذف')
  if (!confirmed) return

  showLoading('جاري حذف الطالب...')

  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id)

  hideLoading()

  if (error) {
    showToast(getErrorMessage(error), 'error')
  } else {
    showToast('تم حذف الطالب بنجاح.', 'success')
    await loadStudents()
  }
}

init()
