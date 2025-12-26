'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Scale, TrendingDown, TrendingUp } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useChallenge } from '@/lib/hooks/useChallenge'
import { useDailyData } from '@/lib/hooks/useDailyData'
import { useToast } from '@/lib/hooks/useToast'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ToastContainer } from '@/components/Toast'
import { formatDateToString, formatDateForDisplay } from '@/lib/utils/date'

export default function WeightPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')
  const date = dateParam || formatDateToString(new Date())
  
  const { user, loading: authLoading } = useAuth()
  const { currentChallenge, loading: challengeLoading } = useChallenge()
  const { weightLog, updateWeight, refreshAll } = useDailyData(date)
  const { toasts, removeToast, success, error } = useToast()

  const [weight, setWeight] = useState('')
  const [loading, setLoading] = useState(false)

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
    if (weightLog?.weight) {
      setWeight(weightLog.weight.toString())
    }
  }, [weightLog])

  if (authLoading || challengeLoading) {
    return <LoadingSpinner fullScreen text="Carregando peso..." size="lg" />
  }

  if (!user || !currentChallenge) {
    return null
  }

  const currentWeight = weightLog?.weight || null
  const hasWeight = currentWeight !== null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const weightValue = parseFloat(weight)
    if (!weightValue || weightValue <= 0 || weightValue > 500) {
      error('Digite um peso válido entre 0 e 500 kg')
      return
    }

    try {
      setLoading(true)
      await updateWeight(weightValue)
      await refreshAll()
      success(`⚖️ Peso registrado: ${weightValue}kg`)
    } catch (err) {
      console.error('Error updating weight:', err)
      error('Erro ao registrar peso. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

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
              Peso - {formatDateForDisplay(date)}
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Status Card */}
        <div className={`mb-6 p-6 rounded-lg border-2 ${
          hasWeight 
            ? 'bg-green-500/10 border-green-500/50' 
            : 'bg-yellow-500/10 border-yellow-500/50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="text-3xl">{hasWeight ? '✅' : '⚖️'}</div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg">
                {hasWeight ? 'Peso Registrado!' : 'Registre seu Peso de Hoje'}
              </h3>
              <p className="text-sm text-gray-300 mt-1">
                {hasWeight 
                  ? `Seu peso atual: ${currentWeight}kg`
                  : 'Acompanhe sua evolução ao longo do desafio'}
              </p>
            </div>
          </div>
        </div>

        {/* Weight Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-6 h-6 text-purple-400" />
            <h2 className="text-white text-xl font-bold">Registro de Peso</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Peso (kg)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Ex: 75.5"
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white text-2xl font-bold text-center placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 text-lg font-semibold">
                  kg
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                💡 Dica: Pese-se sempre no mesmo horário para resultados mais precisos
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !weight}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Scale className="w-5 h-5" />
              {loading ? 'Salvando...' : hasWeight ? 'Atualizar Peso' : 'Registrar Peso'}
            </button>
          </form>
        </div>

        {/* Info Card */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <h3 className="text-blue-200 font-semibold mb-2">📊 Sobre o Registro de Peso</h3>
          <ul className="text-sm text-blue-100 space-y-1">
            <li>• Registre seu peso diariamente para acompanhar sua evolução</li>
            <li>• O peso não é obrigatório para o desafio, mas ajuda no acompanhamento</li>
            <li>• Você pode visualizar gráficos de evolução na página de Progresso</li>
            <li>• Variações de até 1-2kg são normais ao longo do dia</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
