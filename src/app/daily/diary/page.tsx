'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookText, Save } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useChallenge } from '@/lib/hooks/useChallenge'
import { useDailyData } from '@/lib/hooks/useDailyData'
import { useToast } from '@/lib/hooks/useToast'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ToastContainer } from '@/components/Toast'
import { formatDateToString, formatDateForDisplay } from '@/lib/utils/date'
import { MOOD_OPTIONS } from '@/lib/constants'

export default function DiaryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')
  const date = dateParam || formatDateToString(new Date())
  
  const { user, loading: authLoading } = useAuth()
  const { currentChallenge, loading: challengeLoading } = useChallenge()
  const { diaryEntry, updateDiary, refreshAll } = useDailyData(date)
  const { toasts, removeToast, success, error } = useToast()

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    mood: 'neutral' as const,
    entry: ''
  })
  const [isSaved, setIsSaved] = useState(false)

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
    if (diaryEntry) {
      setFormData({
        mood: (diaryEntry.mood as any) || 'neutral',
        entry: diaryEntry.text || ''
      })
      setIsSaved(true)
    }
  }, [diaryEntry])

  if (authLoading || challengeLoading) {
    return <LoadingSpinner fullScreen text="Carregando diário..." size="lg" />
  }

  if (!user || !currentChallenge) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      await updateDiary(formData.entry, formData.mood)
      setIsSaved(true)
      success(`📝 Diário salvo com sucesso! ${selectedMood.emoji}`)
      await refreshAll()
      
      // Show success message
      setTimeout(() => setIsSaved(false), 3000)
    } catch (err) {
      console.error('Error updating diary:', err)
      error('Erro ao salvar diário. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const selectedMood = MOOD_OPTIONS.find(m => m.value === formData.mood) || MOOD_OPTIONS[2]
  const wordCount = formData.entry.trim().split(/\s+/).filter(w => w.length > 0).length

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
              Diário - {formatDateForDisplay(date)}
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Mood Display */}
        <div className="mb-6 bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 text-center">
          <div className="text-8xl mb-4">{selectedMood.emoji}</div>
          <h2 className="text-2xl font-bold text-white mb-2">Como você está se sentindo?</h2>
          <p className="text-gray-300">{selectedMood.label}</p>
        </div>

        {/* Diary Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mood Selector */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <label className="block text-white text-lg font-bold mb-4">
              😊 Como foi seu dia?
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {MOOD_OPTIONS.map((mood) => (
                <button
                  key={mood.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, mood: mood.value as any }))}
                  className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                    formData.mood === mood.value
                      ? 'bg-purple-600 border-purple-500 scale-110'
                      : 'bg-white/5 border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">{mood.emoji}</div>
                  <div className="text-xs text-white font-medium">{mood.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Diary Entry */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <label className="text-white text-lg font-bold flex items-center gap-2">
                <BookText className="w-5 h-5" />
                Reflexão do Dia
              </label>
              <span className="text-sm text-gray-400">
                {wordCount} palavra{wordCount !== 1 ? 's' : ''}
              </span>
            </div>
            <textarea
              value={formData.entry}
              onChange={(e) => setFormData(prev => ({ ...prev, entry: e.target.value }))}
              className="w-full px-4 py-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[300px] resize-y"
              placeholder="Escreva sobre seu dia, seus desafios, suas conquistas, aprendizados...&#10;&#10;O que deu certo hoje?&#10;Quais foram seus maiores desafios?&#10;O que você aprendeu?&#10;Como você pode melhorar amanhã?"
              required
            />
            <p className="text-xs text-gray-400 mt-2">
              💡 Use este espaço para refletir sobre seu progresso, desafios e aprendizados do dia.
            </p>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              isSaved
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            } disabled:opacity-50`}
          >
            {loading ? (
              'Salvando...'
            ) : isSaved ? (
              <>
                ✓ Salvo com Sucesso!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar Diário
              </>
            )}
          </button>
        </form>

        {/* Tips */}
        <div className="mt-6 bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
          <h4 className="text-purple-300 font-semibold mb-2">📝 Dicas para o Diário</h4>
          <ul className="text-purple-200 text-sm space-y-1">
            <li>• Seja honesto e autêntico em suas reflexões</li>
            <li>• Escreva sobre seus desafios e como os superou</li>
            <li>• Celebre suas pequenas vitórias do dia</li>
            <li>• Reflita sobre o que pode melhorar amanhã</li>
            <li>• Use este espaço para processar suas emoções</li>
          </ul>
        </div>

        {/* Previous Entry Preview */}
        {diaryEntry && (
          <div className="mt-6 bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Última atualização</p>
              <p className="text-gray-400 text-xs">
                {new Date(diaryEntry.updatedAt).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
