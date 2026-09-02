/**
 * Utilidad optimizada para subida de archivos PDF (diseños personalizados)
 * con reporte de progreso en tiempo real (XHR), soporte de timeouts y manejo seguro de errores.
 */

export interface UploadProgress {
  percent: number
  stage: 'uploading' | 'processing' | 'completed' | 'error'
  loaded: number
  total: number
}

export interface UploadDesignResult {
  success: boolean
  url: string
  id: string
  filename: string
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void
  signal?: AbortSignal
  timeoutMs?: number
}

/**
 * Formatea un tamaño en bytes a texto legible (ej: 4.5 MB)
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Sube un archivo PDF de diseño de forma directa y optimizada
 */
export function uploadPdfDesign(
  file: File,
  options: UploadOptions = {}
): Promise<UploadDesignResult> {
  return new Promise((resolve, reject) => {
    const { onProgress, signal, timeoutMs = 90000 } = options

    // Validaciones preliminares
    if (!file) {
      return reject(new Error('No se ha seleccionado ningún archivo.'))
    }

    const filename = file.name || 'diseno-personalizado.pdf'
    const isPdf =
      filename.toLowerCase().endsWith('.pdf') ||
      (file.type && file.type.toLowerCase().includes('pdf'))

    if (!isPdf) {
      return reject(new Error('El archivo debe estar en formato PDF (.pdf).'))
    }

    const MAX_SIZE = 50 * 1024 * 1024 // 50MB
    if (file.size > MAX_SIZE) {
      return reject(
        new Error(
          `El archivo excede el tamaño máximo permitido de 50 MB (peso actual: ${formatFileSize(file.size)}).`
        )
      )
    }

    const xhr = new XMLHttpRequest()
    const targetUrl = `/api/upload-design?filename=${encodeURIComponent(filename)}`

    xhr.open('POST', targetUrl, true)
    xhr.timeout = timeoutMs

    // Si el archivo tiene tipo, lo enviamos, sino application/pdf
    const contentType = file.type || 'application/pdf'
    xhr.setRequestHeader('Content-Type', contentType)
    xhr.setRequestHeader('X-Filename', encodeURIComponent(filename))

    // Escuchar cancelación si se provee un signal
    if (signal) {
      if (signal.aborted) {
        xhr.abort()
        return reject(new Error('La subida fue cancelada.'))
      }
      signal.addEventListener('abort', () => {
        xhr.abort()
        reject(new Error('La subida fue cancelada.'))
      })
    }

    xhr.onabort = () => {
      reject(new Error('La subida fue cancelada.'))
    }

    // Monitoreo de progreso en tiempo real
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.min(
          99,
          Math.round((event.loaded / event.total) * 100)
        )
        const stage = percent >= 99 ? 'processing' : 'uploading'
        onProgress({
          percent,
          stage,
          loaded: event.loaded,
          total: event.total,
        })
      }
    }

    // Respuesta del servidor
    xhr.onload = () => {
      if (signal?.aborted) return

      let responseJson: any = null
      try {
        if (xhr.responseText) {
          responseJson = JSON.parse(xhr.responseText)
        }
      } catch {
        // En caso de que la respuesta sea HTML o texto plano
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        if (responseJson && responseJson.url) {
          if (onProgress) {
            onProgress({
              percent: 100,
              stage: 'completed',
              loaded: file.size,
              total: file.size,
            })
          }
          resolve({
            success: true,
            url: responseJson.url,
            id: responseJson.id || responseJson.document?._id,
            filename: responseJson.filename || filename,
          })
        } else {
          reject(
            new Error(
              responseJson?.error ||
                'Respuesta inesperada del servidor al guardar el archivo.'
            )
          )
        }
      } else if (xhr.status === 413) {
        reject(
          new Error(
            `El archivo es demasiado grande para el servidor (${formatFileSize(file.size)}). Intenta optimizarlo o reducir su peso.`
          )
        )
      } else if (xhr.status === 504 || xhr.status === 408) {
        reject(
          new Error(
            'El tiempo de espera se agotó mientras se transfería el archivo. Por favor verifica tu conexión a internet e inténtalo de nuevo.'
          )
        )
      } else {
        const errorMsg =
          responseJson?.error ||
          `Error al subir el diseño (${xhr.status}: ${xhr.statusText || 'Error del servidor'}).`
        reject(new Error(errorMsg))
      }
    }

    xhr.onerror = () => {
      if (signal?.aborted) return
      reject(
        new Error(
          'Error de conexión al subir el archivo. Revisa tu conexión a internet e inténtalo de nuevo.'
        )
      )
    }

    xhr.ontimeout = () => {
      if (signal?.aborted) return
      reject(
        new Error(
          'La subida tardó demasiado tiempo. Por favor intenta con un archivo más ligero o una conexión más estable.'
        )
      )
    }

    // Iniciar el envío directo del binario
    xhr.send(file)
  })
}
