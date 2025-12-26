'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Wine, AlertTriangle, CheckCircle } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useChallenge } from '@/lib/hooks/useChallenge'
import { useDailyData } from '@/lib/hooks/useDailyData'
import { useToast } from '@/lib/hooks/useToast'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ToastContainer } from '@/components/Toast'
import { formatDateToString, formatDateForDisplay, parseDate } from '@/lib/utils/date'

export default function AlcoholPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')
  const date = dateParam || formatDateToString(new Date())
  
  const { user, loading: authLoading } = useAuth()
  const { currentChallenge, loading: challengeLoading } = useChallenge()
  const { dayLog, markAlcoholConsumed, undoAlcoholConsumption, refreshAll } = useDailyData(date)
  const { toasts, removeToast, success, error, warning } = useToast()

  const [loading, setLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showUndoConfirmation, setShowUndoConfirmation] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Refresh data when date changes
  useEffect(() => {
    if (user && currentChallenge) {
      refreshAll()
    }
  }, [user, currentChallenge, date, refreshAll])

  if (authLoading || challengeLoading) {
    return <LoadingSpinner fullScreen text="Carregando..." size="lg" />
  }

  if (!user || !currentChallenge) {
    return null
  }

  const hasConsumedAlcohol = dayLog ? !dayLog.validations.noAlcohol : false
  const isToday = date === formatDateToString(new Date())

  const handleMarkConsumed = async () => {
    try {
      setLoading(true)
      await markAlcoholConsumed()
      await refreshAll()
      warning('⚠️ Álcool marcado - Dia invalidado!')
      setShowConfirmation(false)
      
      // Redirect after a moment
      setTimeout(() => {
        router.push(`/daily?date=${date}`)
      }, 2000)
    } catch (err) {
      console.error('Error marking alcohol:', err)
      error('Erro ao marcar consumo de álcool')
    } finally {
      setLoading(false)
    }
  }

  const handleUndoConsumption = async () => {
    try {
      setLoading(true)
      await undoAlcoholConsumption()
      await refreshAll()
      success('✅ Consumo de álcool desmarcado!')
      setShowUndoConfirmation(false)
    } catch (err) {
      console.error('Error undoing alcohol:', err)
      error('Erro ao desmarcar consumo')
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
            <div className="flex-1 text-right">
              <p className="text-gray-400 text-xs sm:text-sm truncate">{formatDateForDisplay(parseDate(date))}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-rose-600 mb-4">
              <Wine className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Zero Álcool</h1>
            <p className="text-gray-300">Regra essencial do 75 Hard Challenge</p>
          </div>

          {/* Status Card */}
          <div className={`rounded-2xl p-8 border-2 mb-8 ${
            hasConsumedAlcohol 
              ? 'bg-red-500/10 border-red-500/30' 
              : 'bg-green-500/10 border-green-500/30'
          }`}>
            <div className="flex items-center justify-center gap-4 mb-6">
              {hasConsumedAlcohol ? (
                <>
                  <AlertTriangle className="w-12 h-12 text-red-400" />
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-red-300 mb-2">Álcool Consumido</h2>
                    <p className="text-red-200">Dia marcado como não-compliant</p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle className="w-12 h-12 text-green-400" />
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-green-300 mb-2">Compliant</h2>
                    <p className="text-green-200">Continue assim! 💪</p>
                  </div>
                </>
              )}
            </div>

            {/* Warning Box */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-yellow-300 font-semibold mb-1">Atenção!</h3>
                  <p className="text-yellow-200 text-sm">
                    Consumir álcool durante o desafio marca o dia como <strong>não-compliant</strong>. 
                    Esta falha ficará registrada permanentemente no seu histórico. Pense bem antes de marcar.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            {!hasConsumedAlcohol && isToday && (
              <div className="text-center">
                <button
                  onClick={() => setShowConfirmation(true)}
                  className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                >
                  Marcar Consumo de Álcool
                </button>
              </div>
            )}

            {hasConsumedAlcohol && (
              <div className="text-center space-y-4">
                <p className="text-red-300 mb-2">
                  Este dia foi marcado como <strong>não-compliant</strong> devido ao consumo de álcool.
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  A falha ficará registrada no seu histórico.
                </p>
                
                {/* Undo button - only for today */}
                {isToday && (
                  <button
                    onClick={() => setShowUndoConfirmation(true)}
                    className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Desfazer Consumo
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Rules Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">🚫 Regra do Álcool</h3>
            <div className="space-y-3 text-gray-300">
              <p>• <strong>Zero álcool</strong> por 75 dias consecutivos</p>
              <p>• Inclui cerveja, vinho, destilados e qualquer bebida alcoólica</p>
              <p>• Não há "dias de folga" ou exceções</p>
              <p>• Consumo de álcool = dia marcado como não-compliant</p>
              <p>• Seja honesto consigo mesmo - é parte do desafio mental</p>
              <p>• As falhas ficam registradas no seu histórico</p>
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl p-8 max-w-md w-full border-2 border-red-500/30">
            <div className="text-center mb-6">
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Tem certeza absoluta?</h2>
              <p className="text-gray-300">
                Esta ação <strong className="text-red-400">marcará o dia de hoje como não-compliant</strong>.
                A falha ficará registrada permanentemente no seu histórico.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleMarkConsumed}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Marcando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Undo Confirmation Modal */}
      {showUndoConfirmation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl p-8 max-w-md w-full border-2 border-yellow-500/30">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Desfazer Consumo?</h2>
              <p className="text-gray-300">
                Isso irá <strong className="text-yellow-400">remover a marcação de álcool</strong> e 
                recalcular o status do dia com base nas outras tarefas.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUndoConfirmation(false)}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUndoConsumption}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Desfazendo...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
