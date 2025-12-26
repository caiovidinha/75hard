'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { syncManager, SyncStatus } from '@/lib/sync/sync-manager'
import { useAuthContext } from './AuthContext'

interface SyncContextType {
  status: SyncStatus
  pendingCount: number
  lastSyncTime: Date | null
  isOnline: boolean
  sync: () => Promise<void>
  clearQueue: () => Promise<void>
}

const SyncContext = createContext<SyncContextType | undefined>(undefined)

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext()
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [pendingCount, setPendingCount] = useState(0)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Subscribe to sync status changes
    const unsubscribe = syncManager.subscribe((newStatus, count) => {
      setStatus(newStatus)
      setPendingCount(count)
      
      if (newStatus === 'success') {
        setLastSyncTime(new Date())
      }
    })

    // Initial sync if user is authenticated
    if (user && isOnline) {
      syncManager.sync()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      unsubscribe()
    }
  }, [user, isOnline])

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && user && pendingCount > 0) {
      syncManager.sync()
    }
  }, [isOnline, user, pendingCount])

  const handleSync = async () => {
    if (!user) {
      throw new Error('User not authenticated')
    }
    await syncManager.sync()
  }

  const clearQueue = async () => {
    // TODO: Implement clear queue functionality
    console.warn('Clear queue not implemented yet')
  }

  const value: SyncContextType = {
    status,
    pendingCount,
    lastSyncTime,
    isOnline,
    sync: handleSync,
    clearQueue,
  }

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
}

export function useSyncContext() {
  const context = useContext(SyncContext)
  if (context === undefined) {
    throw new Error('useSyncContext must be used within a SyncProvider')
  }
  return context
}
