// js/main.js
// Global utilities: Toast, Modal, Loading, Helpers

// ---- Toast Notifications ----
export function showToast(message, type = 'info', duration = 4000) {
  let container = document.getElementById('toast-container')
  if (!container) {
    container = document.createElement('div')
    container.id = 'toast-container'
    container.className = 'toast-container'
    document.body.appendChild(container)
  }

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }

  const toast = document.createElement('div')
  toast.className = `toast ${type}`
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
  `

  container.appendChild(toast)

  setTimeout(() => {
    toast.style.animation = 'toast-out 0.3s ease forwards'
    setTimeout(() => toast.remove(), 300)
  }, duration)
}

// ---- Loading Overlay ----
export function showLoading(text = 'جاري تحميل البيانات...') {
  let overlay = document.getElementById('loading-overlay')
  if (!overlay) {
    overlay = document.createElement('div')
    overlay.id = 'loading-overlay'
    overlay.className = 'loading-overlay'
    overlay.innerHTML = `
      <div class="spinner"></div>
      <p class="loading-text">${text}</p>
    `
    document.body.appendChild(overlay)
  } else {
    overlay.querySelector('.loading-text').textContent = text
  }
  requestAnimationFrame(() => overlay.classList.add('active'))
}

export function hideLoading() {
  const overlay = document.getElementById('loading-overlay')
  if (overlay) {
    overlay.classList.remove('active')
  }
}

// ---- Modal ----
export function showModal(id) {
  const modal = document.getElementById(id)
  if (modal) {
    modal.classList.add('active')
    document.body.style.overflow = 'hidden'
  }
}

export function hideModal(id) {
  const modal = document.getElementById(id)
  if (modal) {
    modal.classList.remove('active')
    document.body.style.overflow = ''
  }
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active')
    document.body.style.overflow = ''
  }
})

// Close modal on close button click
document.addEventListener('click', (e) => {
  if (e.target.closest('.modal-close')) {
    const overlay = e.target.closest('.modal-overlay')
    if (overlay) {
      overlay.classList.remove('active')
      document.body.style.overflow = ''
    }
  }
})

// ---- Confirmation Dialog ----
export function showConfirm(message, title = 'تأكيد') {
  return new Promise((resolve) => {
    const id = 'confirm-modal-' + Date.now()
    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay'
    overlay.id = id
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" type="button">✕</button>
        </div>
        <div class="modal-body">
          <p style="font-size: 1.05rem; color: var(--gray-700); line-height: 1.7;">${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="${id}-cancel">إلغاء</button>
          <button class="btn btn-danger" id="${id}-confirm">تأكيد الحذف</button>
        </div>
      </div>
    `
    document.body.appendChild(overlay)
    requestAnimationFrame(() => overlay.classList.add('active'))

    const cleanup = (result) => {
      overlay.classList.remove('active')
      setTimeout(() => overlay.remove(), 300)
      resolve(result)
    }

    document.getElementById(`${id}-confirm`).addEventListener('click', () => cleanup(true))
    document.getElementById(`${id}-cancel`).addEventListener('click', () => cleanup(false))
    overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(false) })
  })
}

// ---- Format Date ----
export function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} - ${hours}:${minutes}`
}

// ---- Grade CSS Class ----
export function getGradeClass(grade) {
  if (!grade) return 'badge-gray'
  const g = grade.trim()
  if (g === 'ممتاز' || g === 'امتياز') return 'grade-excellent'
  if (g === 'جيد جداً' || g === 'جيد جدا') return 'grade-very-good'
  if (g === 'جيد') return 'grade-good'
  if (g === 'مقبول') return 'grade-pass'
  if (g.includes('ضعيف') || g.includes('راسب')) return 'grade-fail'
  return 'grade-good'
}

// ---- Disable/Enable Button ----
export function setButtonLoading(btn, loading, text = null) {
  if (loading) {
    btn.disabled = true
    btn._originalText = btn.innerHTML
    btn.innerHTML = `<span class="spinner spinner-sm" style="border-top-color: currentColor; display:inline-block; width:18px; height:18px; border-width:2.5px;"></span> ${text || 'جاري المعالجة...'}`
  } else {
    btn.disabled = false
    if (btn._originalText) btn.innerHTML = btn._originalText
  }
}

// ---- Handle Supabase Error ----
export function getErrorMessage(error) {
  if (!error) return 'حدث خطأ غير معروف'
  if (error.code === '23505') return 'رقم القيد مستخدم مسبقاً.'
  if (error.code === '23503') return 'لا يمكن حذف هذا السجل بسبب ارتباطه ببيانات أخرى.'
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return 'حدث خطأ في الاتصال بقاعدة البيانات.'
  }
  return error.message || 'حدث خطأ غير متوقع.'
}
