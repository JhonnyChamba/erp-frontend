// SVG avatar data URI fallback que NUNCA falla, no depende de red ni servidor
export const FALLBACK_AVATAR_SVG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><circle cx="64" cy="64" r="64" fill="%230085db"/><circle cx="64" cy="48" r="24" fill="%23ffffff"/><path d="M24 112c0-22.091 17.909-40 40-40s40 17.909 40 40z" fill="%23ffffff"/></svg>'

export const DEFAULT_AVATAR_PATH = '/controller/images/profile/user-1.jpg'

/**
 * Normaliza y valida una URL de avatar para que funcione en desarrollo y producción
 */
export function resolveAvatarUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') {
    return DEFAULT_AVATAR_PATH
  }
  const clean = url.trim()
  if (!clean) return DEFAULT_AVATAR_PATH

  // 1. Data URIs (base64) funcionan en cualquier entorno
  if (clean.startsWith('data:image/')) {
    return clean
  }

  // 2. Si apunta a localhost pero estamos en producción (ej. deskounta.vercel.app o HTTPS)
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
  const isProdHost = typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname)

  if (clean.includes('localhost:') || clean.includes('127.0.0.1:')) {
    if (isHttps || isProdHost) {
      // Intentar reescribir con VITE_API_URL si está en /storage/uploads/
      const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
      if (apiBase && clean.includes('/storage/uploads/')) {
        const subPath = clean.split('/storage/uploads/')[1]
        // Si el backend es de producción pero no tiene el archivo (ej. Vercel serverless), usar avatar por defecto
        if (apiBase.includes('vercel.app')) {
          return DEFAULT_AVATAR_PATH
        }
        return `${apiBase}/storage/uploads/${subPath}`
      }
      return DEFAULT_AVATAR_PATH
    }
  }

  // 3. URLs relativas
  if (clean.startsWith('/')) {
    return clean
  }

  // 4. URLs HTTPS
  if (clean.startsWith('https://')) {
    return clean
  }

  // 5. URLs HTTP en entorno HTTPS provocan bloqueo por contenido mixto
  if (clean.startsWith('http://') && isHttps) {
    return clean.replace(/^http:\/\//i, 'https://')
  }

  return clean
}

/**
 * Handler de evento @error para etiquetas <img> de avatar
 */
export function handleAvatarError(e: Event) {
  const target = e.target as HTMLImageElement | null
  if (!target) return
  // Si falló una URL personalizada, intentar primero el asset estático por defecto
  if (!target.src.includes(DEFAULT_AVATAR_PATH) && target.src !== FALLBACK_AVATAR_SVG) {
    target.src = DEFAULT_AVATAR_PATH
  } else if (target.src !== FALLBACK_AVATAR_SVG) {
    // Si incluso el archivo estático falla, usar el SVG embebido
    target.src = FALLBACK_AVATAR_SVG
  }
}
