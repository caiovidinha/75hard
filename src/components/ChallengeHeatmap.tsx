'use client'

import { DayLog } from '@/lib/types'
import { formatDateForDisplay } from '@/lib/utils/date'
import { CheckCircle2, XCircle, Circle } from 'lucide-react'

interface ChallengeHeatmapProps {
  dayLogs: DayLog[]
  totalDays?: number
}

export default function ChallengeHeatmap({ dayLogs, totalDays = 75 }: ChallengeHeatmapProps) {
  // Criar array de 75 dias
  const days = Array.from({ length: totalDays }, (_, i) => i + 1)
  
  // Mapear dayLogs por dayNumber
  const logsByDay = new Map<number, DayLog>()
  dayLogs.forEach(log => {
    logsByDay.set(log.dayNumber, log)
  })

  const getDayStatus = (dayNumber: number): 'completed' | 'failed' | 'pending' => {
    const log = logsByDay.get(dayNumber)
    if (!log) return 'pending'
    return log.compliant ? 'completed' : 'failed'
  }

  const getDayIcon = (status: 'completed' | 'failed' | 'pending') => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-full h-full" />
      case 'failed':
        return <XCircle className="w-full h-full" />
      case 'pending':
        return <Circle className="w-full h-full" />
    }
  }

  const getDayColor = (status: 'completed' | 'failed' | 'pending') => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 border-green-500 text-green-400'
      case 'failed':
        return 'bg-red-500/20 border-red-500 text-red-400'
      case 'pending':
        return 'bg-gray-500/10 border-gray-500/30 text-gray-500'
    }
  }

  const completedDays = dayLogs.filter(log => log.compliant).length
  const failedDays = dayLogs.filter(log => !log.compliant).length
  const pendingDays = totalDays - dayLogs.length

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Mapa do Desafio</h2>
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500"></div>
            <span className="text-gray-300">{completedDays} Completos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500"></div>
            <span className="text-gray-300">{failedDays} Falhados</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-500/10 border border-gray-500/30"></div>
            <span className="text-gray-300">{pendingDays} Pendentes</span>
          </div>
        </div>
      </div>

      {/* Grid de dias */}
      <div className="grid grid-cols-10 sm:grid-cols-15 gap-2">
        {days.map(dayNumber => {
          const status = getDayStatus(dayNumber)
          const log = logsByDay.get(dayNumber)
          
          return (
            <div
              key={dayNumber}
              className={`
                aspect-square rounded border-2 flex items-center justify-center
                transition-all hover:scale-110 cursor-pointer
                ${getDayColor(status)}
                group relative
              `}
              title={log ? `Dia ${dayNumber} - ${formatDateForDisplay(log.date)}` : `Dia ${dayNumber}`}
            >
              <span className="text-xs font-bold">{dayNumber}</span>
              
              {/* Tooltip on hover */}
              {log && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                  <div className="bg-black/90 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                    <div className="font-bold">Dia {dayNumber}</div>
                    <div>{formatDateForDisplay(log.date)}</div>
                    <div className={status === 'completed' ? 'text-green-400' : 'text-red-400'}>
                      {Object.values(log.validations).filter(Boolean).length}/
                      {Object.keys(log.validations).length} tarefas
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
