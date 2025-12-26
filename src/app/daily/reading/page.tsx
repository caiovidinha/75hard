'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Book, Plus, Check, X } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useChallenge } from '@/lib/hooks/useChallenge'
import { useDailyData } from '@/lib/hooks/useDailyData'
import { useToast } from '@/lib/hooks/useToast'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ToastContainer } from '@/components/Toast'
import { formatDateToString, formatDateForDisplay } from '@/lib/utils/date'
import { READING_DAILY_TARGET } from '@/lib/constants'
import { calculateReadingCompliance } from '@/lib/utils/compliance'

export default function ReadingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')
  const date = dateParam || formatDateToString(new Date())
  
  const { user, loading: authLoading } = useAuth()
  const { currentChallenge, loading: challengeLoading } = useChallenge()
  const { readingLog, updateReading, refreshAll } = useDailyData(date)
  const { toasts, removeToast, success, error } = useToast()

  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    bookTitle: '',
    pages: '',
    totalPages: ''
  })

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
    // Pre-fill form with existing data
    if (readingLog && !formData.bookTitle) {
      setFormData({
        bookTitle: readingLog.bookTitle || '',
        pages: readingLog.pages?.toString() || '',
        totalPages: readingLog.totalPages?.toString() || ''
      })
    }
  }, [readingLog])

  if (authLoading || challengeLoading) {
    return <LoadingSpinner fullScreen text="Carregando leitura..." size="lg" />
  }

  if (!user || !currentChallenge) {
    return null
  }

  const currentPages = readingLog?.pages || 0
  const compliance = calculateReadingCompliance(currentPages)
  const percentage = Math.min((currentPages / READING_DAILY_TARGET) * 100, 100)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.bookTitle.trim()) {
      error('Digite o título do livro')
      return
    }

    const pages = parseInt(formData.pages)
    if (!pages || pages <= 0) {
      error('Digite uma quantidade válida de páginas')
      return
    }

    try {
      setLoading(true)
      await updateReading(pages, formData.bookTitle)
      success(`📚 ${formData.bookTitle} - ${pages} páginas registradas!`)
      setShowForm(false)
      await refreshAll()
    } catch (err) {
      console.error('Error updating reading:', err)
      error('Erro ao atualizar leitura. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAdd = async (additionalPages: number) => {
    try {
      setLoading(true)
      const newPages = currentPages + additionalPages
      await updateReading(newPages, readingLog?.bookTitle || 'Livro')
      success(`📚 +${additionalPages} páginas adicionadas!`)
      await refreshAll()
    } catch (err) {
      console.error('Error adding pages:', err)
      error('Erro ao adicionar páginas.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
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
              Leitura - {formatDateForDisplay(date)}
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Compliance Status */}
        <div className={`mb-6 p-6 rounded-lg border-2 ${
          compliance.isCompliant 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-purple-500/10 border-purple-500/30'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-xl font-bold flex items-center gap-2">
              {compliance.isCompliant ? '✅' : '📚'} Status de Leitura
            </h2>
            <span className={`text-sm font-semibold ${compliance.isCompliant ? 'text-green-300' : 'text-purple-300'}`}>
              {currentPages}/{READING_DAILY_TARGET} páginas
            </span>
          </div>

          {/* Big Book Display */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
              <Book className="w-16 h-16 text-white" />
            </div>
            <p className="text-5xl font-bold text-white mb-2">{currentPages}</p>
            <p className="text-gray-300 text-lg">páginas lidas hoje</p>
            {!compliance.isCompliant && (
              <p className="text-purple-300 text-xl font-bold mt-2">
                Faltam {READING_DAILY_TARGET - currentPages} páginas
              </p>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                compliance.isCompliant 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                  : 'bg-gradient-to-r from-purple-500 to-pink-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Current Book Info */}
        {readingLog && readingLog.bookTitle && (
          <div className="mb-6 bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <h3 className="text-white text-lg font-bold mb-3">📖 Livro Atual</h3>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-white text-xl font-semibold mb-2">{readingLog.bookTitle}</p>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>{currentPages} páginas lidas hoje</span>
                  {readingLog.totalPages && (
                    <span>Total: {readingLog.totalPages} páginas</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Add Pages */}
        {readingLog && readingLog.bookTitle && (
          <div className="mb-6">
            <h3 className="text-white text-lg font-bold mb-4">⚡ Adicionar Páginas</h3>
            <div className="grid grid-cols-3 gap-3">
              {[5, 10, 15].map((pages) => (
                <button
                  key={pages}
                  onClick={() => handleQuickAdd(pages)}
                  disabled={loading}
                  className="p-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  +{pages}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Update Reading Form */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full mb-6 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {readingLog ? 'Atualizar Leitura' : 'Registrar Leitura'}
          </button>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-xl font-bold">
                {readingLog ? 'Atualizar Leitura' : 'Registrar Leitura'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Book Title */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Título do Livro *
                </label>
                <input
                  type="text"
                  value={formData.bookTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, bookTitle: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: Hábitos Atômicos"
                  required
                />
              </div>

              {/* Pages Read */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Páginas Lidas Hoje *
                </label>
                <input
                  type="number"
                  value={formData.pages}
                  onChange={(e) => setFormData(prev => ({ ...prev, pages: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="10"
                  min="1"
                  required
                />
                {formData.pages && parseInt(formData.pages) < READING_DAILY_TARGET && (
                  <p className="text-yellow-300 text-xs mt-1">
                    ⚠️ Mínimo recomendado: {READING_DAILY_TARGET} páginas
                  </p>
                )}
              </div>

              {/* Total Pages (optional) */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Total de Páginas do Livro (opcional)
                </label>
                <input
                  type="number"
                  value={formData.totalPages}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalPages: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="300"
                  min="1"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Para acompanhar seu progresso no livro
                </p>
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Salvando...' : (
                    <>
                      <Check className="w-5 h-5" />
                      Salvar
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tips */}
        <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
          <h4 className="text-purple-300 font-semibold mb-2">💡 Dicas de Leitura</h4>
          <ul className="text-purple-200 text-sm space-y-1">
            <li>• Escolha livros de desenvolvimento pessoal ou negócios</li>
            <li>• Leia 10 páginas todos os dias, sem exceção</li>
            <li>• Leia livros físicos ou digitais (não audiobooks)</li>
            <li>• Faça anotações sobre insights importantes</li>
            <li>• Use o tempo antes de dormir para ler</li>
          </ul>
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
