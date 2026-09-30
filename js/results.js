// js/results.js
// Results search page logic
import { supabase } from './supabase.js'
import { showToast, setButtonLoading } from './main.js'

const form = document.getElementById('search-form')
const registrationInput = document.getElementById('registration-number')
const resultMessage = document.getElementById('result-message')

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const registrationNumber = registrationInput.value.trim()
    const btn = form.querySelector('button[type="submit"]')

    // Validation
    if (!registrationNumber) {
      showFieldError('يرجى إدخال رقم القيد.')
      return
    }

    clearMessage()
    setButtonLoading(btn, true, 'جاري البحث...')

    try {
      // Call the Supabase DB function
      const { data, error } = await supabase.rpc('get_student_result', {
        p_registration_number: registrationNumber
      })

      if (error) {
        console.error('Supabase error:', error)
        showMessage('حدث خطأ في الاتصال بقاعدة البيانات.', 'error')
        return
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        showMessage('رقم القيد غير موجود، يرجى التأكد من الرقم والمحاولة مرة أخرى.', 'not-found')
        return
      }

      // Store result in sessionStorage and redirect
      const result = Array.isArray(data) ? data[0] : data
      sessionStorage.setItem('studentResult', JSON.stringify(result))
      window.location.href = '/student-result.html'

    } catch (err) {
      console.error('Unexpected error:', err)
      showMessage('حدث خطأ في الاتصال بقاعدة البيانات.', 'error')
    } finally {
      setButtonLoading(btn, false)
    }
  })
}

function showFieldError(msg) {
  resultMessage.innerHTML = `
    <div class="alert alert-warning">
      <span>⚠️</span>
      <span>${msg}</span>
    </div>
  `
}

function showMessage(msg, type) {
  const icon = type === 'error' ? '❌' : type === 'not-found' ? '🔍' : 'ℹ️'
  const cls = type === 'error' ? 'alert-error' : 'alert-warning'
  resultMessage.innerHTML = `
    <div class="alert ${cls}">
      <span>${icon}</span>
      <span>${msg}</span>
    </div>
  `
}

function clearMessage() {
  if (resultMessage) resultMessage.innerHTML = ''
}
