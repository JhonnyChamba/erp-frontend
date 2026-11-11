/**
 * Toastr Notification Service for Deskounta ERP
 * Conforms to Spike Admin Toastr:
 * https://bootstrapdemos.wrappixel.com/spike/dist/dark/component-toastr.html
 */

export interface ToastOptions {
  timeOut?: number
  extendedTimeOut?: number
  closeButton?: boolean
  progressBar?: boolean
  positionClass?: string
  newestOnTop?: boolean
  showMethod?: string
  hideMethod?: string
}

const DEFAULT_OPTIONS: ToastOptions = {
  closeButton: true,
  progressBar: true,
  newestOnTop: true,
  positionClass: 'toast-top-right',
  timeOut: 4500,
  extendedTimeOut: 1500,
  showMethod: 'fadeIn',
  hideMethod: 'fadeOut'
}

function getToastr(): any {
  if (typeof window !== 'undefined' && (window as any).toastr) {
    const t = (window as any).toastr
    t.options = { ...DEFAULT_OPTIONS, ...(t.options || {}) }
    return t
  }
  return null
}

/**
 * Fallback DOM-based toast renderer if window.toastr is not yet attached by jQuery.
 * Generates the identical DOM hierarchy and classes as Toastr.js.
 */
function fallbackToast(
  type: 'success' | 'error' | 'warning' | 'info',
  message: string,
  title?: string,
  options?: ToastOptions
) {
  if (typeof document === 'undefined') return

  const opts = { ...DEFAULT_OPTIONS, ...(options || {}) }
  let container = document.getElementById('toast-container')
  if (!container) {
    container = document.createElement('div')
    container.id = 'toast-container'
    container.className = opts.positionClass || 'toast-top-right'
    document.body.appendChild(container)
  }

  const toastEl = document.createElement('div')
  toastEl.className = `toast toast-${type}`
  toastEl.setAttribute('role', 'alert')
  toastEl.style.opacity = '0'
  toastEl.style.transform = 'translateY(-8px)'
  toastEl.style.transition = 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'

  let innerHTML = ''
  if (opts.closeButton) {
    innerHTML += `<button type="button" class="toast-close-button" aria-label="Cerrar">&times;</button>`
  }
  if (title) {
    innerHTML += `<div class="toast-title">${escapeHtml(title)}</div>`
  }
  if (message) {
    innerHTML += `<div class="toast-message">${escapeHtml(message)}</div>`
  }
  if (opts.progressBar) {
    innerHTML += `<div class="toast-progress"></div>`
  }
  toastEl.innerHTML = innerHTML

  if (opts.newestOnTop && container.firstChild) {
    container.insertBefore(toastEl, container.firstChild)
  } else {
    container.appendChild(toastEl)
  }

  // Trigger fadeIn
  requestAnimationFrame(() => {
    toastEl.style.opacity = '1'
    toastEl.style.transform = 'translateY(0)'
  })

  // Close button click
  const closeBtn = toastEl.querySelector('.toast-close-button')
  const dismiss = () => {
    toastEl.style.opacity = '0'
    toastEl.style.transform = 'translateY(-8px)'
    setTimeout(() => {
      toastEl.remove()
      if (container && container.childNodes.length === 0) {
        container.remove()
      }
    }, 250)
  }
  if (closeBtn) closeBtn.addEventListener('click', dismiss)

  // Progress animation
  const progressEl = toastEl.querySelector('.toast-progress') as HTMLElement | null
  const duration = opts.timeOut || 4500
  let startTime = Date.now()

  let progressInterval: any = null
  if (progressEl) {
    progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remainingPct = Math.max(0, 100 - (elapsed / duration) * 100)
      progressEl.style.width = `${remainingPct}%`
      if (elapsed >= duration) clearInterval(progressInterval)
    }, 25)
  }

  // Auto dismiss timeout
  const timeoutId = setTimeout(() => {
    if (progressInterval) clearInterval(progressInterval)
    dismiss()
  }, duration)

  // Hover to pause
  toastEl.addEventListener('mouseenter', () => {
    clearTimeout(timeoutId)
    if (progressInterval) clearInterval(progressInterval)
  })
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.innerText = text
  return div.innerHTML
}

export const toast = {
  success(message: string, title?: string, options?: ToastOptions) {
    const t = getToastr()
    if (t) {
      t.success(message, title || 'Éxito', options)
    } else {
      fallbackToast('success', message, title || 'Éxito', options)
    }
  },

  error(message: string, title?: string, options?: ToastOptions) {
    const t = getToastr()
    if (t) {
      t.error(message, title || 'Error', options)
    } else {
      fallbackToast('error', message, title || 'Error', options)
    }
  },

  warning(message: string, title?: string, options?: ToastOptions) {
    const t = getToastr()
    if (t) {
      t.warning(message, title || 'Atención', options)
    } else {
      fallbackToast('warning', message, title || 'Atención', options)
    }
  },

  info(message: string, title?: string, options?: ToastOptions) {
    const t = getToastr()
    if (t) {
      t.info(message, title || 'Información', options)
    } else {
      fallbackToast('info', message, title || 'Información', options)
    }
  },

  clear() {
    const t = getToastr()
    if (t) {
      t.clear()
    } else {
      const container = document.getElementById('toast-container')
      if (container) container.remove()
    }
  }
}

export default toast

