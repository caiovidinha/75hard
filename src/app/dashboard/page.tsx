'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Calendar, TrendingUp, CheckCircle2, AlertCircle, Trophy, Flame, Plus, Utensils, Dumbbell, Droplets, Book, Camera, RotateCcw } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useChallenge } from '@/lib/hooks/useChallenge'
import { useSync } from '@/lib/hooks/useSync'
import { useDailyData } from '@/lib/hooks/useDailyData'
import { formatDateToString, formatDateForDisplay } from '@/lib/utils/date'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { calculateDayCompliance } from '@/lib/utils/compliance'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading, signOut: handleSignOut } = useAuth()
  const { currentChallenge, challenges, loading: challengeLoading } = useChallenge()
  const { status: syncStatus, pendingCount, isOnline } = useSync()
  const [showFabMenu, setShowFabMenu] = useState(false)
  const [showRestartModal, setShowRestartModal] = useState(false)

  const today = formatDateToString(new Date())
  
  // Get today's data
  const { 
    dayLog,
    nutritionLogs, 
    workouts, 
    waterLog, 
    readingLog, 
    progressPhoto,
    loading: dailyLoading 
  } = useDailyData(today)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const handleRestartChallenge = () => {
    setShowRestartModal(true)
  }

  const confirmRestartChallenge = async () => {
    if (!currentChallenge || !user) return
    
    try {
      console.log('🔄 Iniciando reset completo do desafio...')
      
      // Importar funções necessárias
      const { queryDocuments, deleteDocument } = await import('@/lib/firebase/firestore')
      const { COLLECTIONS } = await import('@/lib/constants')
      const { getDB } = await import('@/lib/indexeddb/db')
      
      const challengeId = currentChallenge.id
      
      // 1. Deletar todos os dayLogs
      console.log('🗑️ Deletando dayLogs...')
      const dayLogs = await queryDocuments(
        COLLECTIONS.DAY_LOGS,
        [{ field: 'challengeId', operator: '==', value: challengeId }]
      )
      for (const log of dayLogs) {
        await deleteDocument(COLLECTIONS.DAY_LOGS, (log as any).id)
      }
      
      // 2. Deletar todas as nutrition logs
      console.log('🗑️ Deletando nutrition logs...')
      const nutritionLogs = await queryDocuments(
        COLLECTIONS.NUTRITION_LOGS,
        [{ field: 'challengeId', operator: '==', value: challengeId }]
      )
      for (const log of nutritionLogs) {
        await deleteDocument(COLLECTIONS.NUTRITION_LOGS, (log as any).id)
      }
      
      // 3. Deletar workouts
      console.log('🗑️ Deletando workouts...')
      const workouts = await queryDocuments(
        COLLECTIONS.WORKOUTS,
        [{ field: 'challengeId', operator: '==', value: challengeId }]
      )
      for (const workout of workouts) {
        await deleteDocument(COLLECTIONS.WORKOUTS, (workout as any).id)
      }
      
      // 4. Deletar weight logs
      console.log('🗑️ Deletando weight logs...')
      const weightLogs = await queryDocuments(
        COLLECTIONS.WEIGHT_LOGS,
        [{ field: 'challengeId', operator: '==', value: challengeId }]
      )
      for (const log of weightLogs) {
        await deleteDocument(COLLECTIONS.WEIGHT_LOGS, (log as any).id)
      }
      
      // 5. Deletar reading logs
      console.log('🗑️ Deletando reading logs...')
      const readingLogs = await queryDocuments(
        COLLECTIONS.READING_LOGS,
        [{ field: 'challengeId', operator: '==', value: challengeId }]
      )
      for (const log of readingLogs) {
        await deleteDocument(COLLECTIONS.READING_LOGS, (log as any).id)
      }
      
      // 6. Deletar water logs
      console.log('🗑️ Deletando water logs...')
      const waterLogs = await queryDocuments(
        COLLECTIONS.WATER_LOGS,
        [{ field: 'challengeId', operator: '==', value: challengeId }]
      )
      for (const log of waterLogs) {
        await deleteDocument(COLLECTIONS.WATER_LOGS, (log as any).id)
      }
      
      // 7. Deletar diary entries
      console.log('🗑️ Deletando diary entries...')
      const diaryEntries = await queryDocuments(
        COLLECTIONS.DIARY_ENTRIES,
        [{ field: 'challengeId', operator: '==', value: challengeId }]
      )
      for (const entry of diaryEntries) {
        await deleteDocument(COLLECTIONS.DIARY_ENTRIES, (entry as any).id)
      }
      
      // 8. Deletar progress photos
      console.log('🗑️ Deletando progress photos...')
      const photos = await queryDocuments(
        COLLECTIONS.PROGRESS_PHOTOS,
        [{ field: 'challengeId', operator: '==', value: challengeId }]
      )
      for (const photo of photos) {
        await deleteDocument(COLLECTIONS.PROGRESS_PHOTOS, (photo as any).id)
      }
      
      // 9. Deletar o challenge
      console.log('🗑️ Deletando challenge...')
      await deleteDocument(COLLECTIONS.CHALLENGES, challengeId)
      
      // 10. Limpar IndexedDB
      console.log('🗑️ Limpando IndexedDB...')
      const db = await getDB()
      await db.clear('dayLogs')
      await db.clear('nutritionLogs')
      await db.clear('workouts')
      await db.clear('weightLogs')
      await db.clear('readingLogs')
      await db.clear('waterLogs')
      await db.clear('diaryEntries')
      await db.clear('progressPhotos')
      await db.clear('challenges')
      await db.clear('syncQueue')
      
      console.log('✅ Reset completo!')
      
      // Recarregar a página para refletir as mudanças
      window.location.href = '/challenge/new'
    } catch (error) {
      console.error('❌ Erro ao reiniciar desafio:', error)
      alert('Erro ao reiniciar desafio. Tente novamente.')
    }
  }

  if (authLoading || challengeLoading) {
    return <LoadingSpinner fullScreen text="Carregando dashboard..." size="lg" />
  }

  if (!user) {
    return null
  }

  // Calculate today's compliance if we have a challenge
  let dayCompliance = null
  if (currentChallenge && !dailyLoading) {
    dayCompliance = calculateDayCompliance({
      nutritionLogs,
      workouts,
      waterAmount: waterLog?.amount || 0,
      pagesRead: readingLog?.pages || 0,
      hasPhoto: !!progressPhoto,
      hasAlcohol: dayLog ? !dayLog.validations.noAlcohol : false,
      dietConfig: currentChallenge.dietConfig,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-purple-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">75 Hard Challenge</h1>
                <p className="text-gray-400 text-sm">Olá, {user.displayName}!</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Sync Status */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-gray-300 text-sm">
                  {isOnline ? 'Online' : 'Offline'}
                  {pendingCount > 0 && ` (${pendingCount} pendentes)`}
                </span>
              </div>

              {/* Restart Challenge Button */}
              {currentChallenge && (
                <button
                  onClick={handleRestartChallenge}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 rounded-lg transition-colors border border-orange-500/30"
                  title="Reiniciar Desafio"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden md:inline">Reiniciar</span>
                </button>
              )}

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!currentChallenge ? (
          /* No Challenge State */
          <div className="max-w-2xl mx-auto text-center py-16">
            <Flame className="w-16 h-16 text-purple-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Comece Seu Desafio 75 Hard
            </h2>
            <p className="text-gray-300 mb-8">
              Você ainda não iniciou um desafio. Pronto para transformar sua vida em 75 dias?
            </p>
            <Link
              href="/challenge/new"
              className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              <Trophy className="w-5 h-5" />
              Iniciar Desafio
            </Link>
          </div>
        ) : (
          /* Challenge Active */
          <div className="space-y-6">
            {/* Challenge Progress Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Dia {currentChallenge.currentDay} / 75
                  </h2>
                  <p className="text-gray-300">
                    Status: <span className="text-purple-300 font-semibold">{currentChallenge.status}</span>
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold text-purple-400">
                    {Math.round((currentChallenge.currentDay / 75) * 100)}%
                  </div>
                  <p className="text-gray-400">Completo</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/10 rounded-full h-4 mb-4">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${(currentChallenge.currentDay / 75) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>Iniciado em {formatDateForDisplay(currentChallenge.startDate)}</span>
                <span>{75 - currentChallenge.currentDay} dias restantes</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link
                href="/daily"
                className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-8 hover:shadow-2xl hover:scale-105 transition-all border border-white/20"
              >
                <Calendar className="w-12 h-12 text-white mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Registro Diário</h3>
                <p className="text-purple-100">Registre seu progresso de hoje</p>
              </Link>

              <Link
                href="/progress"
                className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-8 hover:shadow-2xl hover:scale-105 transition-all border border-white/20"
              >
                <TrendingUp className="w-12 h-12 text-white mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Progresso</h3>
                <p className="text-blue-100">Veja gráficos e estatísticas</p>
              </Link>

              <Link
                href="/gallery"
                className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-8 hover:shadow-2xl hover:scale-105 transition-all border border-white/20"
              >
                <Camera className="w-12 h-12 text-white mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Galeria</h3>
                <p className="text-green-100">Veja suas fotos de progresso</p>
              </Link>
            </div>

            {/* Today's Status */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {dayCompliance?.isCompliant ? (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                      Status de Hoje - Dia Compliant ✅
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-6 h-6 text-red-400" />
                      Status de Hoje - Dia com Falha ⚠️
                    </>
                  )}
                </h3>
                
                {dayCompliance && !dayCompliance.isCompliant && (
                  <div className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <p className="text-red-300 text-sm font-medium">Não está compliant hoje</p>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <StatusCard 
                  icon={<CheckCircle2 />} 
                  label="Dieta" 
                  status={dayCompliance?.validations.diet ? "completed" : "pending"} 
                />
                <StatusCard 
                  icon={<CheckCircle2 />} 
                  label="Treinos" 
                  status={dayCompliance?.validations.workouts ? "completed" : "pending"} 
                />
                <StatusCard 
                  icon={<CheckCircle2 />} 
                  label="Água" 
                  status={dayCompliance?.validations.water ? "completed" : "pending"} 
                />
                <StatusCard 
                  icon={<CheckCircle2 />} 
                  label="Leitura" 
                  status={dayCompliance?.validations.reading ? "completed" : "pending"} 
                />
                <StatusCard 
                  icon={<CheckCircle2 />} 
                  label="Foto" 
                  status={dayCompliance?.validations.photo ? "completed" : "pending"} 
                />
                <StatusCard 
                  icon={<CheckCircle2 />} 
                  label="Sem Álcool" 
                  status={dayCompliance?.validations.noAlcohol ? "completed" : "failed"} 
                />
              </div>

              <div className="mt-6 text-center">
                <Link
                  href="/daily"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Ir para Registro Diário
                </Link>
              </div>
            </div>

            {/* Diet Configuration */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Configuração de Dieta</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Calorias</p>
                  <p className="text-2xl font-bold text-white">{currentChallenge.dietConfig.dailyCalories}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Proteína</p>
                  <p className="text-2xl font-bold text-purple-400">{currentChallenge.dietConfig.protein}g</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Carboidratos</p>
                  <p className="text-2xl font-bold text-blue-400">{currentChallenge.dietConfig.carbs}g</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Gordura</p>
                  <p className="text-2xl font-bold text-yellow-400">{currentChallenge.dietConfig.fat}g</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Quick Menu */}
        {showFabMenu && (
          <div className="absolute bottom-20 right-0 space-y-3 mb-2">
            <FabMenuItem
              icon={<Utensils className="w-5 h-5" />}
              label="Refeição"
              href={`/daily/nutrition?date=${today}`}
              color="from-green-500 to-emerald-500"
            />
            <FabMenuItem
              icon={<Dumbbell className="w-5 h-5" />}
              label="Treino"
              href={`/daily/workouts?date=${today}`}
              color="from-orange-500 to-red-500"
            />
            <FabMenuItem
              icon={<Droplets className="w-5 h-5" />}
              label="Água"
              href={`/daily/water?date=${today}`}
              color="from-blue-500 to-cyan-500"
            />
            <FabMenuItem
              icon={<Book className="w-5 h-5" />}
              label="Leitura"
              href={`/daily/reading?date=${today}`}
              color="from-purple-500 to-violet-500"
            />
            <FabMenuItem
              icon={<Camera className="w-5 h-5" />}
              label="Foto"
              href={`/daily/photo?date=${today}`}
              color="from-pink-500 to-rose-500"
            />
          </div>
        )}

        {/* Main FAB Button */}
        <button
          onClick={() => setShowFabMenu(!showFabMenu)}
          className={`
            w-16 h-16 rounded-full shadow-2xl
            bg-gradient-to-br from-purple-600 to-pink-600
            hover:from-purple-700 hover:to-pink-700
            flex items-center justify-center
            transition-all duration-300 transform hover:scale-110
            ${showFabMenu ? 'rotate-45' : 'rotate-0'}
          `}
        >
          <Plus className="w-8 h-8 text-white" />
        </button>
      </div>

      {/* Restart Challenge Modal */}
      {showRestartModal && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowRestartModal(false)}
        >
          <div 
            className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl p-8 max-w-md w-full border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <RotateCcw className="w-8 h-8 text-orange-400" />
              <h2 className="text-2xl font-bold text-white">Reiniciar Desafio</h2>
            </div>
            
            <p className="text-gray-300 mb-6">
              Você tem certeza que deseja reiniciar o desafio? 
              <strong className="text-white block mt-2">
                Todo o progresso atual será perdido e um novo desafio será iniciado.
              </strong>
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRestartModal(false)}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmRestartChallenge}
                className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-semibold"
              >
                Sim, Reiniciar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusCard({ icon, label, status }: { icon: React.ReactNode; label: string; status: 'completed' | 'pending' | 'failed' }) {
  const colors = {
    completed: 'bg-green-500/20 border-green-500/30 text-green-300',
    pending: 'bg-gray-500/20 border-gray-500/30 text-gray-300',
    failed: 'bg-red-500/20 border-red-500/30 text-red-300',
  }

  return (
    <div className={`${colors[status]} border rounded-lg p-4 flex items-center gap-3`}>
      <div className="text-inherit">{icon}</div>
      <span className="font-medium">{label}</span>
    </div>
  )
}

function FabMenuItem({ icon, label, href, color }: {
  icon: React.ReactNode
  label: string
  href: string
  color: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 group"
    >
      <span className="text-white text-sm font-medium bg-black/80 backdrop-blur-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {label}
      </span>
      <div className={`
        w-12 h-12 rounded-full shadow-xl
        bg-gradient-to-br ${color}
        hover:scale-110 transition-transform
        flex items-center justify-center text-white
      `}>
        {icon}
      </div>
    </Link>
  )
}
