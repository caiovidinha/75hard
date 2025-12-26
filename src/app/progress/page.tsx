'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Calendar, Target, Award, Book, Dumbbell, Droplets, Utensils, ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useAuth } from '@/lib/hooks/useAuth'
import { useChallenge } from '@/lib/hooks/useChallenge'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import ChallengeHeatmap from '@/components/ChallengeHeatmap'
import { formatDateForDisplay } from '@/lib/utils/date'
import { getAll } from '@/lib/indexeddb/operations'
import { STORES } from '@/lib/constants'
import type { WeightLog, ReadingLog, WaterLog, Workout } from '@/lib/types'

export default function ProgressPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { currentChallenge, dayLogs, loading: challengeLoading } = useChallenge()
  const [weightData, setWeightData] = useState<WeightLog[]>([])
  const [readingData, setReadingData] = useState<ReadingLog[]>([])
  const [waterData, setWaterData] = useState<WaterLog[]>([])
  const [workoutData, setWorkoutData] = useState<Workout[]>([])
  const [loadingWeight, setLoadingWeight] = useState(true)
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())

  const toggleDayDetails = (logId: string) => {
    const newExpanded = new Set(expandedDays)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedDays(newExpanded)
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const loadAllData = async () => {
      if (!user) return
      try {
        const [weights, readings, waters, workouts] = await Promise.all([
          getAll(STORES.WEIGHT_LOGS) as Promise<WeightLog[]>,
          getAll(STORES.READING_LOGS) as Promise<ReadingLog[]>,
          getAll(STORES.WATER_LOGS) as Promise<WaterLog[]>,
          getAll(STORES.WORKOUTS) as Promise<Workout[]>,
        ])
        
        const userWeights = weights
          .filter(w => w.userId === user.id)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        
        const userReadings = readings.filter(r => r.userId === user.id)
        const userWaters = waters.filter(w => w.userId === user.id)
        const userWorkouts = workouts.filter(w => w.userId === user.id)
        
        setWeightData(userWeights)
        setReadingData(userReadings)
        setWaterData(userWaters)
        setWorkoutData(userWorkouts)
      } catch (err) {
        console.error('Error loading data:', err)
      } finally {
        setLoadingWeight(false)
      }
    }
    
    if (user && currentChallenge) {
      loadAllData()
    }
  }, [user, currentChallenge])

  if (authLoading || challengeLoading) {
    return <LoadingSpinner fullScreen text="Carregando progresso..." size="lg" />
  }

  if (!user || !currentChallenge) {
    return null
  }

  const compliantDays = dayLogs.filter(log => log.compliant).length
  const totalDays = dayLogs.length
  const complianceRate = totalDays > 0 ? Math.round((compliantDays / totalDays) * 100) : 0

  // Calculate general statistics
  const totalPagesRead = readingData.reduce((sum, r) => sum + (r.pages || 0), 0)
  const totalWaterLiters = waterData.reduce((sum, w) => sum + (w.amount || 0), 0) / 1000
  const totalWorkouts = workoutData.length
  const uniqueBooks = new Set(readingData.map(r => r.bookTitle).filter(Boolean)).size

  // Prepare compliance chart data
  const complianceChartData = dayLogs
    .slice(-30) // Last 30 days
    .map(log => ({
      day: `Dia ${log.dayNumber}`,
      completo: log.compliant ? 1 : 0,
      falha: log.compliant ? 0 : 1,
      tarefas: Object.values(log.validations).filter(Boolean).length,
    }))

  // Prepare weight chart data
  const weightChartData = weightData.map(w => ({
    date: formatDateForDisplay(w.date),
    peso: w.weight,
  }))

  const hasWeightData = weightData.length > 0
  const initialWeight = hasWeightData ? weightData[0].weight : 0
  const currentWeight = hasWeightData ? weightData[weightData.length - 1].weight : 0
  const weightDiff = hasWeightData ? (currentWeight - initialWeight).toFixed(1) : '0'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Progresso do Desafio</h1>
            <p className="text-gray-300">
              Acompanhe seu progresso e estatísticas ao longo dos 75 dias
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={<Calendar className="w-8 h-8" />}
              label="Dias Completos"
              value={`${compliantDays}/${totalDays}`}
              color="from-blue-600 to-cyan-600"
            />
            <StatCard
              icon={<Target className="w-8 h-8" />}
              label="Taxa de Sucesso"
              value={`${complianceRate}%`}
              color="from-green-600 to-emerald-600"
            />
            <StatCard
              icon={<TrendingUp className="w-8 h-8" />}
              label="Dia Atual"
              value={`${currentChallenge.currentDay}/75`}
              color="from-purple-600 to-pink-600"
            />
            <StatCard
              icon={<Award className="w-8 h-8" />}
              label="Sequência"
              value={`${compliantDays} dias`}
              color="from-yellow-600 to-amber-600"
            />
          </div>

          {/* General Stats */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Estatísticas Acumuladas</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={<Book className="w-7 h-7" />}
                label="Páginas Lidas"
                value={totalPagesRead.toLocaleString()}
                color="from-indigo-600 to-purple-600"
              />
              <StatCard
                icon={<Book className="w-7 h-7" />}
                label="Livros Lidos"
                value={uniqueBooks.toString()}
                color="from-purple-600 to-pink-600"
              />
              <StatCard
                icon={<Droplets className="w-7 h-7" />}
                label="Água Consumida"
                value={`${totalWaterLiters.toFixed(1)}L`}
                color="from-cyan-600 to-blue-600"
              />
              <StatCard
                icon={<Dumbbell className="w-7 h-7" />}
                label="Treinos Realizados"
                value={totalWorkouts.toString()}
                color="from-orange-600 to-red-600"
              />
            </div>
          </div>

          {/* Challenge Heatmap */}
          <div className="mb-8">
            <ChallengeHeatmap dayLogs={dayLogs} totalDays={75} />
          </div>

          {/* Progress Chart */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-8 border border-white/20 mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Progresso Diário {dayLogs.length > 1 ? `(Últimos ${Math.min(dayLogs.length, 30)} Dias)` : ''}</h2>
            {dayLogs.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={complianceChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="day" 
                    stroke="rgba(255,255,255,0.5)"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.5)"
                    style={{ fontSize: '12px' }}
                    domain={[0, 6]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="tarefas" fill="#8b5cf6" name="Tarefas Completas" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-white/20 rounded-lg">
                <div className="text-center">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 text-lg">Nenhum dado ainda</p>
                  <p className="text-gray-400 text-sm">Complete alguns dias para ver o progresso</p>
                </div>
              </div>
            )}
          </div>

          {/* Weight Progress */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-8 border border-white/20 mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Evolução de Peso</h2>
            {hasWeightData ? (
              <>
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-white/5 rounded-lg p-3 sm:p-4">
                    <p className="text-gray-300 text-xs sm:text-sm mb-1">Inicial</p>
                    <p className="text-lg sm:text-2xl font-bold text-white whitespace-nowrap">{initialWeight.toFixed(1)}kg</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 sm:p-4">
                    <p className="text-gray-300 text-xs sm:text-sm mb-1">Atual</p>
                    <p className="text-lg sm:text-2xl font-bold text-white whitespace-nowrap">{currentWeight.toFixed(1)}kg</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 sm:p-4">
                    <p className="text-gray-300 text-xs sm:text-sm mb-1">Diferença</p>
                    <p className={`text-lg sm:text-2xl font-bold whitespace-nowrap ${parseFloat(weightDiff) < 0 ? 'text-green-400' : parseFloat(weightDiff) > 0 ? 'text-yellow-400' : 'text-white'}`}>
                      {parseFloat(weightDiff) > 0 ? '+' : ''}{weightDiff}kg
                    </p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weightChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="rgba(255,255,255,0.5)"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.5)"
                      style={{ fontSize: '12px' }}
                      domain={['dataMin - 1', 'dataMax + 1']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="peso" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      name="Peso (kg)"
                      dot={{ fill: '#10b981', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-white/20 rounded-lg">
                <div className="text-center">
                  <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 text-lg">Nenhum registro de peso</p>
                  <p className="text-gray-400 text-sm">Comece a registrar seu peso diário</p>
                  <Link
                    href="/daily/weight"
                    className="inline-block mt-4 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                  >
                    Registrar Peso
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Recent Days */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Últimos Dias</h2>
            
            {dayLogs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-300">Nenhum registro ainda</p>
                <Link
                  href="/daily"
                  className="inline-block mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Começar Registro
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {dayLogs.slice(-10).reverse().map((log) => {
                  const isExpanded = expandedDays.has(log.id)
                  const taskLabels: Record<keyof typeof log.validations, string> = {
                    diet: 'Dieta',
                    workouts: 'Treinos',
                    water: 'Água',
                    reading: 'Leitura',
                    photo: 'Foto',
                    noAlcohol: 'Sem Álcool'
                  }
                  
                  return (
                    <div
                      key={log.id}
                      className={`rounded-lg border ${
                        log.compliant
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-red-500/10 border-red-500/30'
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-semibold">Dia {log.dayNumber}</p>
                            <p className="text-gray-300 text-sm">
                              {formatDateForDisplay(log.date)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className={`font-semibold ${log.compliant ? 'text-green-300' : 'text-red-300'}`}>
                                {log.compliant ? '✓ Completo' : '✗ Falhou'}
                              </p>
                              <p className="text-gray-400 text-sm">
                                {Object.values(log.validations).filter(Boolean).length}/{Object.keys(log.validations).length} tarefas
                              </p>
                            </div>
                            <button
                              onClick={() => toggleDayDetails(log.id)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                              aria-label={isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-300" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-300" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {(Object.keys(log.validations) as Array<keyof typeof log.validations>).map((key) => (
                                <div
                                  key={key}
                                  className={`flex items-center gap-2 p-2 rounded-lg ${
                                    log.validations[key]
                                      ? 'bg-green-500/20'
                                      : 'bg-red-500/20'
                                  }`}
                                >
                                  {log.validations[key] ? (
                                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                                  ) : (
                                    <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                                  )}
                                  <span className={`text-sm ${
                                    log.validations[key] ? 'text-green-200' : 'text-red-200'
                                  }`}>
                                    {taskLabels[key]}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <div className={`inline-flex p-3 bg-gradient-to-br ${color} rounded-xl mb-4`}>
        <div className="text-white">{icon}</div>
      </div>
      <p className="text-gray-300 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  )
}
