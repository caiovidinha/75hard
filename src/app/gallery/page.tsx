'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, ImageIcon, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useChallenge } from '@/lib/hooks/useChallenge'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { formatDateForDisplay } from '@/lib/utils/date'
import { getAll } from '@/lib/indexeddb/operations'
import { getDB } from '@/lib/indexeddb/db'
import { STORES } from '@/lib/constants'
import type { ProgressPhoto } from '@/lib/types'

export default function GalleryPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { currentChallenge, loading: challengeLoading } = useChallenge()
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  const handleImageError = (photoId: string) => {
    console.error('❌ Erro ao carregar imagem:', photoId)
    setImageErrors(prev => new Set(prev).add(photoId))
  }

  const cleanInvalidPhotos = async () => {
    if (!window.confirm('Remover todas as fotos sem URL válida do IndexedDB?')) return
    
    try {
      const db = await getDB()
      const allPhotos = await db.getAll(STORES.PROGRESS_PHOTOS)
      
      let removed = 0
      for (const photo of allPhotos) {
        if (!photo.photoUrl) {
          await db.delete(STORES.PROGRESS_PHOTOS, photo.id)
          removed++
          console.log('🗑️ Foto removida:', photo.id)
        }
      }
      
      alert(`${removed} foto(s) inválida(s) removida(s). Recarregue a página.`)
      window.location.reload()
    } catch (error) {
      console.error('Erro ao limpar fotos:', error)
      alert('Erro ao limpar fotos inválidas')
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const loadPhotos = async () => {
      if (!user || !currentChallenge) return
      
      try {
        const allPhotos = await getAll<ProgressPhoto>(STORES.PROGRESS_PHOTOS)
        console.log('📸 ===== DEBUG GALERIA =====')
        console.log('📸 Total de fotos no IndexedDB:', allPhotos.length)
        console.log('📸 UserId atual:', user.id)
        console.log('📸 ChallengeId atual:', currentChallenge.id)
        
        allPhotos.forEach((p, index) => {
          console.log(`📸 Foto #${index + 1}:`, {
            id: p.id,
            userId: p.userId,
            challengeId: (p as any).challengeId,
            date: p.date,
            photoUrl: p.photoUrl,
            hasPhotoUrl: !!p.photoUrl,
            photoUrlLength: p.photoUrl?.length || 0
          })
        })
        
        // Filter by userId (and optionally challengeId if it exists)
        const userPhotos = allPhotos
          .filter(p => {
            const matchesUser = p.userId === user.id
            const photoWithChallenge = p as any
            const matchesChallenge = !photoWithChallenge.challengeId || photoWithChallenge.challengeId === currentChallenge.id
            console.log(`📸 Filtro - Foto ${p.id}: user=${matchesUser}, challenge=${matchesChallenge}`)
            return matchesUser && matchesChallenge
          })
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        
        console.log('📸 Fotos após filtro:', userPhotos.length)
        console.log('📸 ===== FIM DEBUG =====')
        setPhotos(userPhotos)
      } catch (error) {
        console.error('❌ Error loading photos:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user && currentChallenge) {
      loadPhotos()
    }
  }, [user, currentChallenge])

  if (authLoading || challengeLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user || !currentChallenge) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-purple-300 hover:text-purple-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
            
            {/* Debug button - only show if there are invalid photos */}
            {photos.some(p => !p.photoUrl) && (
              <button
                onClick={cleanInvalidPhotos}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
              >
                🗑️ Limpar Fotos Inválidas
              </button>
            )}
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-2">
            Galeria de Progresso
          </h1>
          <p className="text-gray-300">
            {photos.length} {photos.length === 1 ? 'foto registrada' : 'fotos registradas'}
          </p>
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 inline-block">
              <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300 text-lg mb-4">Nenhuma foto registrada ainda</p>
              <Link
                href="/daily/photo"
                className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Registrar Primeira Foto
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Grid de Fotos */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-white/10 backdrop-blur-lg border border-white/20 hover:border-purple-400 transition-all hover:scale-105"
                >
                  {photo.photoUrl && !imageErrors.has(photo.id) ? (
                    <img
                      src={photo.photoUrl}
                      alt={`Foto de ${formatDateForDisplay(photo.date)}`}
                      className="object-cover w-full h-full"
                      loading="lazy"
                      onError={() => handleImageError(photo.id)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full text-gray-500">
                      {imageErrors.has(photo.id) ? (
                        <>
                          <AlertCircle className="w-12 h-12 mb-2" />
                          <span className="text-xs">Erro ao carregar</span>
                        </>
                      ) : (
                        <ImageIcon className="w-12 h-12" />
                      )}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <div className="flex items-center text-white text-sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDateForDisplay(photo.date)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Modal de Foto */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">
                      {formatDateForDisplay(selectedPhoto.date)}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedPhoto(null)}
                    className="text-white hover:text-gray-300 text-3xl"
                  >
                    ×
                  </button>
                </div>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-black">
                  {selectedPhoto.photoUrl && !imageErrors.has(selectedPhoto.id) ? (
                    <img
                      src={selectedPhoto.photoUrl}
                      alt={`Foto de ${formatDateForDisplay(selectedPhoto.date)}`}
                      className="object-contain w-full h-full"
                      onError={() => handleImageError(selectedPhoto.id)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full text-gray-500">
                      {imageErrors.has(selectedPhoto.id) ? (
                        <>
                          <AlertCircle className="w-24 h-24 mb-4" />
                          <p className="text-lg">Erro ao carregar imagem</p>
                          <p className="text-sm text-gray-400 mt-2">URL: {selectedPhoto.photoUrl}</p>
                        </>
                      ) : (
                        <ImageIcon className="w-24 h-24" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
