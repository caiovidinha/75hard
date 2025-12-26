'use client'

import { useSyncContext } from '@/lib/context/SyncContext'
import { syncManager } from '@/lib/sync/sync-manager'
import { useState } from 'react'
import { RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export function SyncStatus() {
  const { status, pendingCount, isOnline } = useSyncContext()
  const [syncing, setSyncing] = useState(false)

  const handleForceSync = async () => {
    if (syncing) return
    
    setSyncing(true)
    try {
      const result = await syncManager.forceSyncNow()
      console.log('✅ Sync forçado completo:', result)
      alert(`✅ Sincronizado!\n${result.success} sucesso\n${result.failed} falhas`)
    } catch (error) {
      console.error('❌ Erro ao forçar sync:', error)
      alert('❌ Erro ao sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  const getStatusIcon = () => {
    if (!isOnline) return <XCircle className="w-4 h-4 text-red-500" />
    if (status === 'syncing' || syncing) return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
    if (pendingCount > 0) return <RefreshCw className="w-4 h-4 text-yellow-500" />
    return <CheckCircle className="w-4 h-4 text-green-500" />
  }

  const getStatusText = () => {
    if (!isOnline) return 'Offline'
    if (status === 'syncing' || syncing) return 'Sincronizando...'
    if (pendingCount > 0) return `${pendingCount} pendente${pendingCount > 1 ? 's' : ''}`
    return 'Sincronizado'
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleForceSync}
        disabled={!isOnline || syncing}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full
          backdrop-blur-md border
          transition-all duration-200
          ${!isOnline 
            ? 'bg-red-500/20 border-red-500/30 cursor-not-allowed' 
            : 'bg-white/10 border-white/20 hover:bg-white/20 active:scale-95'
          }
        `}
        title="Clique para forçar sincronização"
      >
        {getStatusIcon()}
        <span className="text-sm font-medium text-white">
          {getStatusText()}
        </span>
      </button>
    </div>
  )
}
