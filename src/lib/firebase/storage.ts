import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  UploadMetadata,
} from 'firebase/storage'
import { getStorageInstance } from './config'
import { MAX_PHOTO_SIZE, ALLOWED_IMAGE_TYPES } from '@/lib/constants'

/**
 * Remove EXIF data from image
 */
async function removeExifData(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        
        ctx.drawImage(img, 0, 0)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to create blob'))
            }
          },
          file.type,
          0.85
        )
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de arquivo não suportado. Use JPEG, PNG ou WebP.',
    }
  }

  if (file.size > MAX_PHOTO_SIZE) {
    return {
      valid: false,
      error: 'Arquivo muito grande. Tamanho máximo: 5MB.',
    }
  }

  return { valid: true }
}

/**
 * Upload progress photo
 */
export async function uploadProgressPhoto(
  userId: string,
  date: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ storagePath: string; url: string }> {
  try {
    console.log('🔥 uploadProgressPhoto - Iniciando...')
    const storage = await getStorageInstance()
    console.log('🔥 Storage instance obtida')
    
    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      throw new Error(validation.error)
    }
    console.log('🔥 Arquivo validado')

    // Remove EXIF data
    const sanitizedBlob = await removeExifData(file)
    console.log('🔥 EXIF removido, blob size:', sanitizedBlob.size)

    // Create storage path
    const timestamp = Date.now()
    const storagePath = `users/${userId}/progress_photos/${date}_${timestamp}.jpg`
    const storageRef = ref(storage, storagePath)
    console.log('🔥 Storage path:', storagePath)

    // Metadata
    const metadata: UploadMetadata = {
      contentType: 'image/jpeg',
      customMetadata: {
        userId,
        date,
        uploadedAt: new Date().toISOString(),
      },
    }

    // Upload file
    console.log('🔥 Iniciando upload para Firebase Storage...')
    const snapshot = await uploadBytes(storageRef, sanitizedBlob, metadata)
    console.log('🔥 Upload concluído!')

    // Get download URL
    console.log('🔥 Obtendo URL de download...')
    const url = await getDownloadURL(snapshot.ref)
    console.log('🔥 URL obtida:', url)

    const result = {
      storagePath,
      url,
    }
    
    console.log('🔥 ===== RETORNO DO UPLOAD =====')
    console.log('🔥 storagePath:', result.storagePath)
    console.log('🔥 url:', result.url)
    console.log('🔥 url length:', result.url.length)
    
    return result
  } catch (error) {
    console.error('❌ Error uploading progress photo:', error)
    throw error
  }
}

/**
 * Delete progress photo
 */
export async function deleteProgressPhoto(storagePath: string): Promise<void> {
  try {
    const storage = await getStorageInstance()
    const storageRef = ref(storage, storagePath)
    await deleteObject(storageRef)
  } catch (error) {
    console.error('Error deleting progress photo:', error)
    throw error
  }
}

/**
 * Get download URL from storage path
 */
export async function getPhotoURL(storagePath: string): Promise<string> {
  try {
    const storage = await getStorageInstance()
    const storageRef = ref(storage, storagePath)
    return await getDownloadURL(storageRef)
  } catch (error) {
    console.error('Error getting photo URL:', error)
    throw error
  }
}
