'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Droplets, Plus, Minus, Trash2 } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useChallenge } from '@/lib/hooks/useChallenge'
import { useDailyData } from '@/lib/hooks/useDailyData'
import { useToast } from '@/lib/hooks/useToast'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ToastContainer } from '@/components/Toast'
import { formatDateToString, formatDateForDisplay } from '@/lib/utils/date'
import { WATER_DAILY_TARGET } from '@/lib/constants'
import { calculateWaterCompliance } from '@/lib/utils/compliance'

const QUICK_AMOUNTS = [250, 500, 750, 1000]

export default function WaterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')
  const date = dateParam || formatDateToString(new Date())
  
  const { user, loading: authLoading } = useAuth()
  const { currentChallenge, loading: challengeLoading } = useChallenge()
  const { waterLog, updateWater, refreshAll } = useDailyData(date)
  const { toasts, removeToast, success, error } = useToast()

  const [customAmount, setCustomAmount] = useState('')
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

  if (authLoading || challengeLoading) {
    return <LoadingSpinner fullScreen text="Carregando água..." size="lg" />
  }

  if (!user || !currentChallenge) {
    return null
  }

  const currentAmount = waterLog?.amount || 0
  const compliance = calculateWaterCompliance(currentAmount)
  const percentage = Math.min((currentAmount / WATER_DAILY_TARGET) * 100, 100)

  const handleAddWater = async (amount: number) => {
    try {
      setLoading(true)
      const newAmount = currentAmount + amount
      await updateWater(newAmount)
      await refreshAll()
      success(`💧 ${amount}ml adicionado com sucesso!`)
    } catch (err) {
      console.error('Error adding water:', err)
      error('Erro ao adicionar água. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveWater = async (amount: number) => {
    try {
      setLoading(true)
      const newAmount = Math.max(0, currentAmount - amount)
      await updateWater(newAmount)
      await refreshAll()
      success(`💧 ${amount}ml removido com sucesso!`)
    } catch (err) {
      console.error('Error removing water:', err)
      error('Erro ao remover água. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleCustomAdd = async () => {
    const amount = parseInt(customAmount)
    if (!amount || amount <= 0) {
      error('Digite uma quantidade válida')
      return
    }
    await handleAddWater(amount)
    setCustomAmount('')
  }

  const handleReset = async () => {
    if (!confirm('Tem certeza que deseja resetar o consumo de água do dia?')) return
    try {
      setLoading(true)
      await updateWater(0)
      await refreshAll()
      success('Consumo de água resetado!')
    } catch (err) {
      console.error('Error resetting water:', err)
      error('Erro ao resetar água.')
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
              Água - {formatDateForDisplay(date)}
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Compliance Status */}
        <div className={`mb-6 p-6 rounded-lg border-2 ${
          compliance.isCompliant 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-blue-500/10 border-blue-500/30'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-xl font-bold flex items-center gap-2">
              {compliance.isCompliant ? '✅' : '💧'} Status de Hidratação
            </h2>
            <span className={`text-sm font-semibold ${compliance.isCompliant ? 'text-green-300' : 'text-blue-300'}`}>
              {compliance.percentage}%
            </span>
          </div>

          {/* Big Water Display */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-48 h-48 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 mb-4 relative overflow-hidden">
              {/* Water fill animation */}
              <div 
                className="absolute bottom-0 left-0 right-0 bg-blue-400/50 transition-all duration-500"
                style={{ height: `${percentage}%` }}
              />
              <div className="relative z-10 text-center">
                <Droplets className="w-16 h-16 text-white mb-2 mx-auto" />
                <p className="text-5xl font-bold text-white">{currentAmount}</p>
                <p className="text-white text-sm">ml</p>
              </div>
            </div>
            <p className="text-gray-300 text-lg">
              Meta: {WATER_DAILY_TARGET}ml (1 galão)
            </p>
            <p className={`text-2xl font-bold mt-2 ${
              compliance.isCompliant ? 'text-green-300' : 'text-blue-300'
            }`}>
              Faltam {Math.max(0, WATER_DAILY_TARGET - currentAmount)}ml
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/10 rounded-full h-6 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                compliance.isCompliant 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500'
              }`}
              style={{ width: `${percentage}%` }}
            >
              <div className="h-full flex items-center justify-center">
                <span className="text-white text-xs font-semibold">{percentage.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Add Buttons */}
        <div className="mb-6">
          <h3 className="text-white text-lg font-bold mb-4">⚡ Adicionar Rápido</h3>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => handleAddWater(amount)}
                disabled={loading}
                className="p-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {amount}ml
              </button>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <div className="mb-6 bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
          <h3 className="text-white text-lg font-bold mb-4">Quantidade Personalizada</h3>
          <div className="flex gap-3">
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="ml"
              className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
            <button
              onClick={handleCustomAdd}
              disabled={loading || !customAmount}
              className="px-4 sm:px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Adicionar</span>
            </button>
          </div>
        </div>

        {/* Quick Remove */}
        {currentAmount > 0 && (
          <div className="mb-6">
            <h3 className="text-white text-lg font-bold mb-4">➖ Remover</h3>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_AMOUNTS.filter(a => a <= currentAmount).map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleRemoveWater(amount)}
                  disabled={loading}
                  className="p-4 bg-red-600/20 hover:bg-red-600/30 text-red-300 font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 border border-red-500/30"
                >
                  <Minus className="w-5 h-5" />
                  {amount}ml
                </button>
              ))}
              <button
                onClick={handleReset}
                disabled={loading}
                className="col-span-2 p-4 bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 border border-gray-500/30"
              >
                <Trash2 className="w-5 h-5" />
                Resetar Tudo
              </button>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
          <h4 className="text-blue-300 font-semibold mb-2">💡 Dicas de Hidratação</h4>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>• Beba água assim que acordar</li>
            <li>• Mantenha uma garrafa sempre por perto</li>
            <li>• Beba antes, durante e depois dos treinos</li>
            <li>• 1 galão = 3780ml = Aproximadamente 15 copos de 250ml</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
