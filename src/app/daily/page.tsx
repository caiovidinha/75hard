'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Utensils, Dumbbell, Droplets, Book, Camera, Plus, X, ChevronLeft, ChevronRight, Check, BookText, Calendar, Wine, AlertCircle, Scale } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useChallenge } from '@/lib/hooks/useChallenge'
import { useDailyData } from '@/lib/hooks/useDailyData'
import { formatDateToString, formatDateForDisplay, parseDate } from '@/lib/utils/date'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { calculateDayCompliance } from '@/lib/utils/compliance'

export default function DailyLogPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')
  const today = formatDateToString(new Date())
  const currentDate = dateParam || today
  
  const { user, loading: authLoading } = useAuth()
  const { currentChallenge, loading: challengeLoading } = useChallenge()
  const [showFabMenu, setShowFabMenu] = useState(false)
  
  // Get data for current date
  const { 
    dayLog,
    nutritionLogs, 
    workouts, 
    waterLog, 
    readingLog, 
    progressPhoto,
    diaryEntry,
    weightLog,
    loading: dailyLoading 
  } = useDailyData(currentDate)

  // Navigation functions
  const goToPreviousDay = () => {
    const date = parseDate(currentDate)
    date.setDate(date.getDate() - 1)
    const newDate = formatDateToString(date)
    router.push(`/daily?date=${newDate}`)
  }

  const goToNextDay = () => {
    const date = parseDate(currentDate)
    date.setDate(date.getDate() + 1)
    const newDate = formatDateToString(date)
    const todayDate = formatDateToString(new Date())
    // Don't allow going beyond today
    if (newDate <= todayDate) {
      router.push(`/daily?date=${newDate}`)
    }
  }

  const goToToday = () => {
    router.push('/daily')
  }

  const isToday = currentDate === today
  const canGoNext = currentDate < today

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  if (authLoading || challengeLoading) {
    return <LoadingSpinner fullScreen text="Carregando log diário..." size="lg" />
  }

  if (!user || !currentChallenge) {
    return null
  }

  // Calculate today's compliance
  const dayCompliance = !dailyLoading ? calculateDayCompliance({
    nutritionLogs,
    workouts,
    waterAmount: waterLog?.amount || 0,
    pagesRead: readingLog?.pages || 0,
    hasPhoto: !!progressPhoto,
    hasAlcohol: dayLog ? !dayLog.validations.noAlcohol : false,
    dietConfig: currentChallenge.dietConfig,
  }) : null

  const completedCount = dayCompliance ? Object.values(dayCompliance.validations).filter(v => v).length : 0
  const totalTasks = 6
  const progressPercentage = Math.round((completedCount / totalTasks) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>

            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousDay}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Dia anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {!isToday && (
                <button
                  onClick={goToToday}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Hoje
                </button>
              )}

              <button
                onClick={goToNextDay}
                disabled={!canGoNext}
                className={`p-2 rounded-lg transition-colors ${
                  canGoNext
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                }`}
                title="Próximo dia"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Registro Diário</h1>
                <p className="text-gray-300">
                  Dia {currentChallenge.currentDay} • {formatDateForDisplay(parseDate(currentDate))}
                </p>
              </div>
              {!isToday && (
                <div className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-200 text-sm font-medium">📅 Visualizando: {formatDateForDisplay(parseDate(currentDate))}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tasks Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Diet */}
            <TaskCard
              icon={<Utensils className="w-8 h-8" />}
              title="Dieta"
              description="Registrar refeições e macros"
              href={`/daily/nutrition?date=${currentDate}`}
              color="from-green-600 to-emerald-600"
              isCompleted={dayCompliance?.validations.diet || false}
            />

            {/* Workouts */}
            <TaskCard
              icon={<Dumbbell className="w-8 h-8" />}
              title="Treinos"
              description="Adicionar 2 treinos (45min cada)"
              href={`/daily/workouts?date=${currentDate}`}
              color="from-orange-600 to-red-600"
              isCompleted={dayCompliance?.validations.workouts || false}
            />

            {/* Water */}
            <TaskCard
              icon={<Droplets className="w-8 h-8" />}
              title="Água"
              description="Registrar consumo (3780ml)"
              href={`/daily/water?date=${currentDate}`}
              color="from-blue-600 to-cyan-600"
              isCompleted={dayCompliance?.validations.water || false}
            />

            {/* Reading */}
            <TaskCard
              icon={<Book className="w-8 h-8" />}
              title="Leitura"
              description="Marcar 10 páginas"
              href={`/daily/reading?date=${currentDate}`}
              color="from-purple-600 to-pink-600"
              isCompleted={dayCompliance?.validations.reading || false}
            />

            {/* Photo */}
            <TaskCard
              icon={<Camera className="w-8 h-8" />}
              title="Foto de Progresso"
              description="Tirar foto do dia"
              href={`/daily/photo?date=${currentDate}`}
              color="from-yellow-600 to-amber-600"
              isCompleted={dayCompliance?.validations.photo || false}
            />

            {/* Diary */}
            <TaskCard
              icon={<BookText className="w-8 h-8" />}
              title="Diário"
              description="Reflexão do dia"
              href={`/daily/diary?date=${currentDate}`}
              color="from-indigo-600 to-purple-600"
              isCompleted={!!diaryEntry}
            />

            {/* Weight */}
            <TaskCard
              icon={<Scale className="w-8 h-8" />}
              title="Peso"
              description="Registrar peso do dia"
              href={`/daily/weight?date=${currentDate}`}
              color="from-teal-600 to-cyan-600"
              isCompleted={!!weightLog}
            />
          </div>

          {/* Alcohol Warning Card */}
          <div className="mt-6">
            <Link
              href={`/daily/alcohol?date=${currentDate}`}
              className={`block rounded-2xl p-6 border-2 transition-all hover:scale-[1.02] ${
                dayCompliance?.validations.noAlcohol
                  ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/15'
                  : 'bg-red-500/10 border-red-500/30 hover:bg-red-500/15'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    dayCompliance?.validations.noAlcohol
                      ? 'bg-gradient-to-br from-green-600 to-emerald-600'
                      : 'bg-gradient-to-br from-red-600 to-rose-600'
                  }`}>
                    <Wine className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Zero Álcool</h3>
                    <p className={`text-sm font-medium ${
                      dayCompliance?.validations.noAlcohol
                        ? 'text-green-300'
                        : 'text-red-300'
                    }`}>
                      {dayCompliance?.validations.noAlcohol
                        ? '✓ Compliant - Sem consumo'
                        : '✗ Álcool consumido - Dia invalidado'
                      }
                    </p>
                  </div>
                </div>
                <div className={`text-3xl ${
                  dayCompliance?.validations.noAlcohol ? '' : 'animate-pulse'
                }`}>
                  {dayCompliance?.validations.noAlcohol ? '✅' : '⚠️'}
                </div>
              </div>
            </Link>
          </div>

          {/* Daily Summary */}
          <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-white">Resumo do Dia</h3>
              {dayCompliance && !dayCompliance.isCompliant && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-300" />
                  <span className="text-red-300 font-semibold">Dia com Falha</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-gray-400 text-sm">Completo</p>
                <p className="text-3xl font-bold text-white">{completedCount}/{totalTasks}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">Progresso</p>
                <p className="text-3xl font-bold text-purple-400">{progressPercentage}%</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">Status</p>
                <p className="text-3xl font-bold">
                  {dayCompliance?.isCompliant ? '✅' : progressPercentage > 0 ? '⚠️' : '❌'}
                </p>
              </div>
            </div>
            
            <div className="w-full bg-white/10 rounded-full h-3 mb-4">
              <div 
                className={`h-3 rounded-full transition-all ${
                  dayCompliance?.isCompliant 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                    : 'bg-gradient-to-r from-red-500 to-rose-500'
                }`}
                style={{ width: `${progressPercentage}%` }} 
              />
            </div>
            
            {/* Failure Message */}
            {dayCompliance && !dayCompliance.isCompliant && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-200 text-sm">
                  <strong>⚠️ Atenção:</strong> Este dia não está compliant. 
                  {!dayCompliance.validations.noAlcohol && ' Você marcou consumo de álcool.'}
                  {!dayCompliance.validations.diet && ' A dieta não está dentro da tolerância.'}
                  {!dayCompliance.validations.workouts && ' Você não completou os 2 treinos de 45min.'}
                  {!dayCompliance.validations.water && ' Você não atingiu a meta de água (3780ml).'}
                  {!dayCompliance.validations.reading && ' Você não leu as 10 páginas.'}
                  {!dayCompliance.validations.photo && ' Você não tirou a foto de progresso.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Button - Only show on today's page */}
      {isToday && (
        <div className="fixed bottom-6 right-6 z-50">
          {/* Quick Menu */}
          {showFabMenu && (
            <div className="absolute bottom-20 right-0 space-y-3 mb-2">
              <FabMenuItem
                icon={<Utensils className="w-5 h-5" />}
                label="Refeição"
                href={`/daily/nutrition?date=${currentDate}`}
                color="from-green-500 to-emerald-500"
              />
              <FabMenuItem
                icon={<Dumbbell className="w-5 h-5" />}
                label="Treino"
                href={`/daily/workouts?date=${currentDate}`}
                color="from-orange-500 to-red-500"
              />
              <FabMenuItem
                icon={<Droplets className="w-5 h-5" />}
                label="Água"
                href={`/daily/water?date=${currentDate}`}
                color="from-blue-500 to-cyan-500"
              />
              <FabMenuItem
                icon={<Book className="w-5 h-5" />}
                label="Leitura"
                href={`/daily/reading?date=${currentDate}`}
                color="from-purple-500 to-violet-500"
              />
              <FabMenuItem
                icon={<Camera className="w-5 h-5" />}
                label="Foto"
                href={`/daily/photo?date=${currentDate}`}
                color="from-pink-500 to-rose-500"
              />
              <FabMenuItem
                icon={<BookText className="w-5 h-5" />}
                label="Diário"
                href={`/daily/diary?date=${currentDate}`}
                color="from-indigo-500 to-purple-500"
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
      )}
    </div>
  )
}

function TaskCard({ icon, title, description, href, color, isCompleted }: {
  icon: React.ReactNode
  title: string
  description: string
  href: string
  color: string
  isCompleted: boolean
}) {
  return (
    <Link
      href={href}
      className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 hover:scale-105 transition-all relative"
    >
      {/* Completion Badge */}
      {isCompleted && (
        <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
          <Check className="w-5 h-5 text-white" />
        </div>
      )}
      
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 bg-gradient-to-br ${color} rounded-xl`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <p className="text-gray-300 text-sm">{description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className={isCompleted ? "text-green-300 font-medium" : "text-gray-400"}>
          {isCompleted ? '✓ Completo' : 'Clique para registrar'}
        </span>
        <span className="text-purple-300">→</span>
      </div>
    </Link>
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
