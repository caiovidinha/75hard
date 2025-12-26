'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Check, X, Clock, MapPin, Zap } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useChallenge } from '@/lib/hooks/useChallenge'
import { useDailyData } from '@/lib/hooks/useDailyData'
import { useToast } from '@/lib/hooks/useToast'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ToastContainer } from '@/components/Toast'
import { formatDateToString, formatDateForDisplay } from '@/lib/utils/date'
import { STORES, COLLECTIONS, WORKOUT_TYPES, WORKOUT_INTENSITIES, WORKOUT_MIN_DURATION, WORKOUTS_DAILY_TARGET, OUTDOOR_WORKOUTS_TARGET } from '@/lib/constants'
import { deleteById } from '@/lib/indexeddb/operations'
import { addToSyncQueue } from '@/lib/sync/sync-queue'
import { calculateWorkoutsCompliance } from '@/lib/utils/compliance'

export default function WorkoutsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')
  const date = dateParam || formatDateToString(new Date())
  
  const { user, loading: authLoading } = useAuth()
  const { currentChallenge, loading: challengeLoading } = useChallenge()
  const { workouts, refreshAll, addWorkout } = useDailyData(date)
  const { toasts, removeToast, success, error } = useToast()

  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    workoutType: '',
    duration: '',
    isOutdoor: false,
    intensity: 'moderada' as const,
    description: ''
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
    return <LoadingSpinner fullScreen text="Carregando treinos..." size="lg" />
  }

  if (!user || !currentChallenge) {
    return null
  }

  // Calculate compliance
  const compliance = calculateWorkoutsCompliance(workouts)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.workoutType) {
      error('Selecione o tipo de treino')
      return
    }

    try {
      setLoading(true)

      const workout = {
        dayLogId: '',
        date,
        timestamp: new Date(),
        type: formData.workoutType as any,
        duration: parseInt(formData.duration) || 0,
        outdoor: formData.isOutdoor,
        intensity: formData.intensity,
        notes: formData.description,
      }

      await addWorkout(workout)

      // Reset form
      setFormData({
        workoutType: '',
        duration: '',
        isOutdoor: false,
        intensity: 'moderada',
        description: ''
      })
      setShowForm(false)
      await refreshAll()
      
      const workoutName = WORKOUT_TYPES.find(w => w.value === formData.workoutType)?.label || 'Treino'
      success(`💪 ${workoutName} adicionado com sucesso!`)
    } catch (err) {
      console.error('Error adding workout:', err)
      error('Erro ao adicionar treino. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    // Primeiro clique: pede confirmação
    if (deletingId !== id) {
      setDeletingId(id)
      error('Clique novamente para confirmar a exclusão')
      // Auto-cancela após 3 segundos
      setTimeout(() => setDeletingId(null), 3000)
      return
    }

    try {
      // Delete from IndexedDB
      await deleteById(STORES.WORKOUTS, id)
      
      // Add to sync queue to delete from Firebase
      await addToSyncQueue('delete', COLLECTIONS.WORKOUTS, { id }, id)
      
      setDeletingId(null)
      await refreshAll()
      success('Treino removido com sucesso!')
    } catch (err) {
      console.error('Error deleting workout:', err)
      setDeletingId(null)
      error('Erro ao deletar treino.')
    }
  }

  const getWorkoutEmoji = (type: string) => {
    const workout = WORKOUT_TYPES.find(w => w.value === type)
    return workout?.emoji || '✨'
  }

  const getWorkoutLabel = (type: string) => {
    const workout = WORKOUT_TYPES.find(w => w.value === type)
    return workout?.label || type
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
              Treinos - {formatDateForDisplay(date)}
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Compliance Card */}
        <div className={`mb-6 p-6 rounded-lg border-2 ${
          compliance.isCompliant 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-yellow-500/10 border-yellow-500/30'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-xl font-bold flex items-center gap-2">
              {compliance.isCompliant ? '✅' : '⚠️'} Status do Dia
            </h2>
            <span className={`text-sm font-semibold ${compliance.isCompliant ? 'text-green-300' : 'text-yellow-300'}`}>
              {compliance.isCompliant ? 'COMPLETO' : 'INCOMPLETO'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatusItem 
              label="Treinos" 
              value={`${compliance.totalWorkouts}/${WORKOUTS_DAILY_TARGET}`}
              isCompliant={compliance.totalWorkouts >= WORKOUTS_DAILY_TARGET}
            />
            <StatusItem 
              label="45+ min" 
              value={`${compliance.validWorkouts}/${WORKOUTS_DAILY_TARGET}`}
              isCompliant={compliance.validWorkouts >= WORKOUTS_DAILY_TARGET}
            />
            <StatusItem 
              label="Outdoor" 
              value={`${compliance.outdoorWorkouts}/${OUTDOOR_WORKOUTS_TARGET}`}
              isCompliant={compliance.outdoorWorkouts >= OUTDOOR_WORKOUTS_TARGET}
            />
            <StatusItem 
              label="Duração Total" 
              value={`${compliance.totalDuration} min`}
              isCompliant={true}
            />
          </div>

          {!compliance.isCompliant && compliance.violations.length > 0 && (
            <div className="mt-4 p-3 bg-black/20 rounded-lg space-y-1">
              {compliance.violations.map((violation, i) => (
                <p key={i} className="text-yellow-200 text-sm">⚠️ {violation}</p>
              ))}
            </div>
          )}
        </div>

        {/* Add Workout Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full mb-6 py-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Adicionar Treino
          </button>
        )}

        {/* Add Workout Form */}
        {showForm && (
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-xl font-bold">Novo Treino</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Workout Type */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Tipo de Treino *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {WORKOUT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, workoutType: type.value }))}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.workoutType === type.value
                          ? 'bg-orange-600 border-orange-500 text-white'
                          : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-2xl mb-1">{type.emoji}</div>
                      <div className="text-xs font-medium">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration and Location */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Duração (minutos) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="45"
                    required
                  />
                  {formData.duration && parseInt(formData.duration) < WORKOUT_MIN_DURATION && (
                    <p className="text-yellow-300 text-xs mt-1">
                      ⚠️ Mínimo recomendado: {WORKOUT_MIN_DURATION} minutos
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Localização *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, isOutdoor: false }))}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        !formData.isOutdoor
                          ? 'bg-orange-600 border-orange-500 text-white'
                          : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-xl mb-1">🏠</div>
                      <div className="text-xs font-medium">Indoor</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, isOutdoor: true }))}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.isOutdoor
                          ? 'bg-orange-600 border-orange-500 text-white'
                          : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-xl mb-1">🌳</div>
                      <div className="text-xs font-medium">Outdoor</div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Intensity */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Intensidade
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {WORKOUT_INTENSITIES.map((intensity) => (
                    <button
                      key={intensity.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, intensity: intensity.value as any }))}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.intensity === intensity.value
                          ? 'bg-orange-600 border-orange-500 text-white'
                          : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-sm font-medium">{intensity.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: 5km corrida, treino de pernas, etc..."
                  rows={3}
                />
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
                      Salvar Treino
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

        {/* Workouts List */}
        <div className="space-y-3">
          <h2 className="text-white text-xl font-bold mb-4">Treinos do Dia</h2>
          
          {workouts.length === 0 ? (
            <div className="bg-white/5 rounded-lg p-8 text-center border border-white/10">
              <p className="text-gray-400">Nenhum treino registrado ainda.</p>
              <p className="text-gray-500 text-sm mt-2">Clique em "Adicionar Treino" para começar.</p>
            </div>
          ) : (
            workouts.map((workout) => (
              <div
                key={workout.id}
                className="bg-white/10 backdrop-blur-lg rounded-lg p-5 border border-white/20 hover:border-white/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{getWorkoutEmoji(workout.type)}</span>
                      <div>
                        <h3 className="text-white font-semibold text-lg">{getWorkoutLabel(workout.type)}</h3>
                        <p className="text-gray-400 text-sm">
                          {new Date(workout.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 mt-3">
                      <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full">
                        <Clock className="w-4 h-4 text-orange-400" />
                        <span className="text-white text-sm font-medium">{workout.duration} min</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <span className="text-white text-sm">{workout.outdoor ? '🌳 Outdoor' : '🏠 Indoor'}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-white text-sm capitalize">{workout.intensity}</span>
                      </div>
                      {workout.duration >= WORKOUT_MIN_DURATION && (
                        <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-full border border-green-500/30">
                          <Check className="w-4 h-4 text-green-400" />
                          <span className="text-green-300 text-sm font-medium">45+ min</span>
                        </div>
                      )}
                    </div>

                    {workout.notes && (
                      <p className="text-gray-300 text-sm mt-3 italic">"{workout.notes}"</p>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(workout.id)}
                    className={`ml-4 p-2 rounded-lg transition-colors ${
                      deletingId === workout.id
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                    }`}
                    title={deletingId === workout.id ? 'Clique novamente para confirmar' : 'Deletar treino'}
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

function StatusItem({ label, value, isCompliant }: { label: string; value: string; isCompliant: boolean }) {
  return (
    <div className={`p-3 rounded-lg ${isCompliant ? 'bg-green-500/20' : 'bg-white/5'}`}>
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className={`font-bold ${isCompliant ? 'text-green-300' : 'text-white'}`}>
        {value} {isCompliant && '✓'}
      </p>
    </div>
  )
}
