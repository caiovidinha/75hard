'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Check, X } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useChallenge } from '@/lib/hooks/useChallenge'
import { useDailyData } from '@/lib/hooks/useDailyData'
import { useToast } from '@/lib/hooks/useToast'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ToastContainer } from '@/components/Toast'
import { formatDateToString, formatDateForDisplay } from '@/lib/utils/date'
import { STORES } from '@/lib/constants'
import { deleteById } from '@/lib/indexeddb/operations'
import { calculateDietCompliance } from '@/lib/utils/compliance'

export default function NutritionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')
  const date = dateParam || formatDateToString(new Date())
  
  const { user, loading: authLoading } = useAuth()
  const { currentChallenge, loading: challengeLoading } = useChallenge()
  const { nutritionLogs, refreshAll, addNutritionLog } = useDailyData(date)
  const { toasts, removeToast, success, error } = useToast()

  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    mealName: '',
    protein: '',
    carbs: '',
    fat: ''
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

  if (authLoading || challengeLoading) {
    return <LoadingSpinner fullScreen text="Carregando nutrição..." size="lg" />
  }

  if (!user || !currentChallenge) {
    return null
  }

  // Calculate compliance
  const compliance = calculateDietCompliance(nutritionLogs, currentChallenge.dietConfig)
  const goals = currentChallenge.dietConfig
  const caloriesFromMacros = (goals.protein * 4) + (goals.carbs * 4) + (goals.fat * 9)

  // Calculate calories from form
  const formCalories = ((parseFloat(formData.protein) || 0) * 4) + 
                       ((parseFloat(formData.carbs) || 0) * 4) + 
                       ((parseFloat(formData.fat) || 0) * 9)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)

      const nutritionLog = {
        dayLogId: '',
        date,
        timestamp: new Date(),
        mealName: formData.mealName,
        mealType: 'other' as const,
        calories: Math.round(formCalories),
        protein: parseFloat(formData.protein) || 0,
        carbs: parseFloat(formData.carbs) || 0,
        fat: parseFloat(formData.fat) || 0,
      }

      await addNutritionLog(nutritionLog)

      // Reset form
      setFormData({
        mealName: '',
        protein: '',
        carbs: '',
        fat: ''
      })
      setShowForm(false)
      await refreshAll()
      success(`🍽️ ${formData.mealName} adicionada com sucesso!`)
    } catch (err) {
      console.error('Error adding nutrition log:', err)
      error('Erro ao adicionar refeição. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta refeição?')) return

    try {
      await deleteById(STORES.NUTRITION_LOGS, id)
      await refreshAll()
      success('Refeição removida com sucesso!')
    } catch (err) {
      console.error('Error deleting nutrition log:', err)
      error('Erro ao deletar refeição.')
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
              Nutrição - {formatDateForDisplay(date)}
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Compliance Status */}
        <div className={`mb-6 p-4 rounded-lg border-2 ${
          compliance.isCompliant 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-yellow-500/10 border-yellow-500/30'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-white text-lg font-bold flex items-center gap-2">
              {compliance.isCompliant ? '✅' : '⚠️'} Status da Dieta
            </h2>
            <span className={`text-sm font-semibold ${compliance.isCompliant ? 'text-green-300' : 'text-yellow-300'}`}>
              {compliance.isCompliant ? 'COMPLIANT' : 'FORA DA META'}
            </span>
          </div>
          
          {!compliance.isCompliant && compliance.violations.length > 0 && (
            <div className="mt-2 space-y-1">
              {compliance.violations.map((violation, i) => (
                <p key={i} className="text-yellow-200 text-sm">⚠️ {violation}</p>
              ))}
            </div>
          )}

          <div className="mt-3 text-xs text-gray-400">
            Faixa permitida: {compliance.limits.caloriesMin} - {compliance.limits.caloriesMax} kcal (±{goals.tolerance}%)
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MacroCard 
            label="Calorias" 
            value={compliance.totals.calories} 
            min={compliance.limits.caloriesMin}
            max={compliance.limits.caloriesMax}
            unit="" 
          />
          <MacroCard 
            label="Proteína" 
            value={compliance.totals.protein} 
            max={compliance.limits.proteinMax}
            unit="g" 
          />
          <MacroCard 
            label="Carboidratos" 
            value={compliance.totals.carbs} 
            max={compliance.limits.carbsMax}
            unit="g" 
          />
          <MacroCard 
            label="Gordura" 
            value={compliance.totals.fat} 
            max={compliance.limits.fatMax}
            unit="g" 
          />
        </div>

        {/* Add Meal Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full mb-6 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Adicionar Refeição
          </button>
        )}

        {/* Add Meal Form */}
        {showForm && (
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-xl font-bold">Nova Refeição</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Nome da Refeição
                </label>
                <input
                  type="text"
                  value={formData.mealName}
                  onChange={(e) => setFormData(prev => ({ ...prev, mealName: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: Café da manhã, Almoço..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Proteína (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.protein}
                    onChange={(e) => setFormData(prev => ({ ...prev, protein: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Carboidratos (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.carbs}
                    onChange={(e) => setFormData(prev => ({ ...prev, carbs: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Gordura (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.fat}
                    onChange={(e) => setFormData(prev => ({ ...prev, fat: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Calorias (calculado automaticamente)
                </label>
                <input
                  type="number"
                  value={Math.round(formCalories)}
                  readOnly
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Proteína: 4kcal/g | Carboidratos: 4kcal/g | Gordura: 9kcal/g
                </p>
              </div>

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

        {/* Meals List */}
        <div className="space-y-3">
          <h2 className="text-white text-xl font-bold mb-4">Refeições do Dia</h2>
          
          {nutritionLogs.length === 0 ? (
            <div className="bg-white/5 rounded-lg p-8 text-center border border-white/10">
              <p className="text-gray-400">Nenhuma refeição registrada ainda.</p>
              <p className="text-gray-500 text-sm mt-2">Clique em "Adicionar Refeição" para começar.</p>
            </div>
          ) : (
            nutritionLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20 hover:border-white/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg">{log.mealName}</h3>
                    <p className="text-gray-400 text-sm">{new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    
                    <div className="grid grid-cols-4 gap-3 mt-3">
                      <div>
                        <p className="text-gray-400 text-xs">Calorias</p>
                        <p className="text-white font-semibold">{log.calories}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Proteína</p>
                        <p className="text-white font-semibold">{log.protein}g</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Carboidratos</p>
                        <p className="text-white font-semibold">{log.carbs}g</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Gordura</p>
                        <p className="text-white font-semibold">{log.fat}g</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(log.id)}
                    className="ml-4 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function MacroCard({ 
  label, 
  value, 
  min, 
  max, 
  unit 
}: { 
  label: string
  value: number
  min?: number
  max: number
  unit: string 
}) {
  const isInRange = min ? (value >= min && value <= max) : (value <= max)
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0
  
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20">
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-white text-2xl font-bold">{value.toFixed(0)}{unit}</p>
      {min ? (
        <p className="text-gray-400 text-xs">Faixa: {min} - {max}{unit}</p>
      ) : (
        <p className="text-gray-400 text-xs">Máx: {max}{unit}</p>
      )}
      <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all ${
            isInRange 
              ? 'bg-green-500' 
              : value > max 
                ? 'bg-red-500' 
                : 'bg-yellow-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
