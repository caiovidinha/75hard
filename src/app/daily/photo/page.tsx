'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Camera, Upload, Trash2, Image as ImageIcon } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useChallenge } from '@/lib/hooks/useChallenge'
import { useDailyData } from '@/lib/hooks/useDailyData'
import { useToast } from '@/lib/hooks/useToast'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ToastContainer } from '@/components/Toast'
import { formatDateToString, formatDateForDisplay } from '@/lib/utils/date'
import { uploadProgressPhoto } from '@/lib/firebase/storage'

export default function PhotoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')
  const date = dateParam || formatDateToString(new Date())
  
  const { user, loading: authLoading } = useAuth()
  const { currentChallenge, loading: challengeLoading } = useChallenge()
  const { progressPhoto, updatePhoto, refreshAll } = useDailyData(date)
  const { toasts, removeToast, success, error } = useToast()

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && currentChallenge) {
      refreshAll()
    }
  }, [user, currentChallenge, date])

  useEffect(() => {
    if (progressPhoto) {
      setPreviewUrl(progressPhoto.photoUrl)
    }
  }, [progressPhoto])

  if (authLoading || challengeLoading) {
    return <LoadingSpinner fullScreen text="Carregando foto..." size="lg" />
  }

  if (!user || !currentChallenge) {
    return null
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      error('Por favor, selecione uma imagem válida.')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      error('A imagem deve ter no máximo 5MB.')
      return
    }

    setSelectedFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile || !user || !currentChallenge) return

    try {
      setUploading(true)

      console.log('📸 Iniciando upload...')
      console.log('📸 UserId:', user.id)
      console.log('📸 Date:', date)
      console.log('📸 File:', selectedFile.name, selectedFile.size, 'bytes')

      // Upload to Firebase Storage
      const result = await uploadProgressPhoto(
        user.id,
        date,
        selectedFile
      )

      console.log('📸 ===== RESULTADO DO UPLOAD =====')
      console.log('📸 URL:', result.url)
      console.log('📸 StoragePath:', result.storagePath)

      if (!result.url) {
        throw new Error('Upload retornou URL inválida!')
      }

      // Save to IndexedDB (using photoUrl field as standard)
      console.log('📸 Salvando no IndexedDB...')
      await updatePhoto(result.url)
      
      console.log('📸 Atualizando dados...')
      await refreshAll()

      setSelectedFile(null)
      success('✅ Foto enviada com sucesso!')
    } catch (err) {
      console.error('❌ Error uploading photo:', err)
      error('Erro ao enviar foto. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja remover esta foto?')) {
      setSelectedFile(null)
      setPreviewUrl(progressPhoto?.photoUrl || null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const hasPhoto = !!progressPhoto
  const hasNewPhoto = !!selectedFile

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/daily?date=${date}`}
              className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar</span>
            </Link>
            <h1 className="text-base sm:text-xl font-bold text-white truncate">
              Foto - {formatDateForDisplay(date)}
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Status Card */}
        <div className={`mb-6 rounded-lg p-6 border-2 ${
          hasPhoto 
            ? 'bg-green-500/10 border-green-500/50' 
            : 'bg-yellow-500/10 border-yellow-500/50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="text-3xl">{hasPhoto ? '✅' : '📷'}</div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg">
                {hasPhoto ? 'Foto Registrada!' : 'Adicione sua Foto de Progresso'}
              </h3>
              <p className="text-sm text-gray-300 mt-1">
                {hasPhoto 
                  ? 'Você já registrou sua foto de progresso hoje.'
                  : 'Tire uma foto para registrar seu progresso visual.'}
              </p>
            </div>
          </div>
        </div>

        {/* Photo Preview */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 mb-6">
          <div className="text-center">
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Foto de progresso"
                  className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                />
                {hasNewPhoto && (
                  <button
                    onClick={handleDelete}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <ImageIcon className="w-24 h-24 mb-4 opacity-50" />
                <p className="text-lg">Nenhuma foto registrada ainda</p>
              </div>
            )}
          </div>
        </div>

        {/* Upload Section */}
        {!hasPhoto && (
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 mb-6">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Enviar Foto
            </h3>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="space-y-4">
              {!hasNewPhoto ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Selecionar Foto
                </button>
              ) : (
                <>
                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Upload className="w-5 h-5" />
                      {uploading ? 'Enviando...' : 'Enviar Foto'}
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={uploading}
                      className="px-6 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Existing Photo Info */}
        {hasPhoto && (
          <div className="bg-white/5 rounded-lg p-4 border border-white/10 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-400 text-sm mb-1">Foto enviada em</p>
                <p className="text-white font-medium">
                  {new Date(progressPhoto.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
          <h4 className="text-purple-300 font-semibold mb-2">📸 Dicas para Fotos de Progresso</h4>
          <ul className="text-purple-200 text-sm space-y-1">
            <li>• Tire a foto no mesmo horário todos os dias</li>
            <li>• Use o mesmo local e iluminação</li>
            <li>• Mantenha a mesma pose e ângulo</li>
            <li>• Vista roupas que permitam ver seu corpo</li>
            <li>• Tire fotos de frente, lado e costas</li>
            <li>• Seja consistente para comparações precisas</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
