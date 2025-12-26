import {
  getPendingItems,
  updateQueueItemStatus,
  removeFromQueue,
  incrementRetryCount,
  getRetryDelay,
  shouldRetry,
  clearSuccessfulItems,
  clearErrorItems,
  retryAllErrors,
  getQueueStats,
} from './sync-queue'
import { syncAllExistingData, getLocalDataStats } from './bulk-sync'
import {
  createDocument,
  updateDocument,
  deleteDocument,
} from '../firebase/firestore'
import { SYNC_INTERVAL } from '@/lib/constants'
import type { SyncQueueItem } from '@/lib/types'

/**
 * Sync status type
 */
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

/**
 * Sync Manager
 * Handles automatic synchronization between IndexedDB and Firestore
 */

class SyncManager {
  private isSyncing: boolean = false
  private syncInterval: NodeJS.Timeout | null = null
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true
  private listeners: Set<(status: SyncStatus, pendingCount: number) => void> = new Set()

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline())
      window.addEventListener('offline', () => this.handleOffline())
      
      // Start periodic sync
      this.startPeriodicSync()
    }
  }

  // ==================== NETWORK STATUS ====================

  private handleOnline() {
    console.log('Network: Online')
    this.isOnline = true
    this.notifyListeners()
    this.sync() // Sync immediately when coming online
  }

  private handleOffline() {
    console.log('Network: Offline')
    this.isOnline = false
    this.notifyListeners()
  }

  public getIsOnline(): boolean {
    return this.isOnline
  }

  public getIsSyncing(): boolean {
    return this.isSyncing
  }

  // ==================== LISTENERS ====================

  public subscribe(listener: (status: SyncStatus, pendingCount: number) => void) {
    this.listeners.add(listener)
    
    // Immediately notify with current state
    listener('idle', 0)
    
    return () => {
      this.listeners.delete(listener)
    }
  }

  private async notifyListeners() {
    const pendingItems = await getPendingItems()
    const status: SyncStatus = this.isSyncing ? 'syncing' : 'idle'
    
    this.listeners.forEach((listener) => {
      listener(status, pendingItems.length)
    })
  }

  // ==================== PERIODIC SYNC ====================

  private startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.sync()
      }
    }, SYNC_INTERVAL)
  }

  public stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  // ==================== SYNC PROCESS ====================

  public async sync(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping')
      return { success: 0, failed: 0 }
    }

    if (!this.isOnline) {
      console.log('Offline, skipping sync')
      return { success: 0, failed: 0 }
    }

    this.isSyncing = true
    this.notifyListeners()

    let successCount = 0
    let failedCount = 0

    try {
      const pendingItems = await getPendingItems()
      
      if (pendingItems.length === 0) {
        console.log('No pending items to sync')
        return { success: 0, failed: 0 }
      }

      console.log(`Syncing ${pendingItems.length} pending items`)

      for (const item of pendingItems) {
        try {
          await this.syncItem(item)
          await removeFromQueue(item.id)
          successCount++
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error)
          await this.handleSyncError(item, error)
          failedCount++
        }
      }

      // Clean up old successful items
      await clearSuccessfulItems()

      console.log(`Sync complete: ${successCount} success, ${failedCount} failed`)
    } catch (error) {
      console.error('Sync process error:', error)
    } finally {
      this.isSyncing = false
      this.notifyListeners()
    }

    return { success: successCount, failed: failedCount }
  }

  // ==================== SYNC INDIVIDUAL ITEM ====================

  private async syncItem(item: SyncQueueItem): Promise<void> {
    await updateQueueItemStatus(item.id, 'syncing')

    try {
      switch (item.operation) {
        case 'create':
          await createDocument(
            item.collection,
            item.documentId || item.data.id,
            item.data
          )
          break

        case 'update':
          await updateDocument(
            item.collection,
            item.documentId || item.data.id,
            item.data
          )
          break

        case 'delete':
          if (item.documentId) {
            await deleteDocument(item.collection, item.documentId)
          }
          break

        default:
          throw new Error(`Unknown operation: ${item.operation}`)
      }

      await updateQueueItemStatus(item.id, 'success')
    } catch (error) {
      throw error
    }
  }

  // ==================== ERROR HANDLING ====================

  private async handleSyncError(item: SyncQueueItem, error: any): Promise<void> {
    const retryCount = await incrementRetryCount(item.id)
    const canRetry = await shouldRetry(item)

    if (canRetry) {
      const delay = getRetryDelay(retryCount)
      console.log(`Will retry item ${item.id} after ${delay}ms (attempt ${retryCount + 1})`)
      
      await updateQueueItemStatus(item.id, 'pending')
      
      // Schedule retry
      setTimeout(() => {
        if (this.isOnline && !this.isSyncing) {
          this.sync()
        }
      }, delay)
    } else {
      console.error(`Max retries reached for item ${item.id}`)
      await updateQueueItemStatus(
        item.id,
        'error',
        error?.message || 'Unknown error'
      )
    }
  }

  // ==================== MANUAL CONTROLS ====================

  public async forceSyncNow(): Promise<{ success: number; failed: number }> {
    return await this.sync()
  }

  public async retryFailed(): Promise<{ success: number; failed: number }> {
    await retryAllErrors()
    return await this.sync()
  }

  public async clearErrors(): Promise<void> {
    await clearErrorItems()
    this.notifyListeners()
  }

  public async getStats() {
    return await getQueueStats()
  }

  public async syncAllExisting(): Promise<{ total: number; byCollection: Record<string, number> }> {
    console.log('🚀 Iniciando sincronização em massa de dados existentes...')
    const result = await syncAllExistingData()
    console.log('📊 Dados adicionados à fila. Iniciando sync...')
    await this.sync()
    return result
  }

  public async getLocalStats() {
    return await getLocalDataStats()
  }
}

// Export singleton instance
export const syncManager = new SyncManager()

// Expose syncManager globally for debugging
if (typeof window !== 'undefined') {
  ;(window as any).syncManager = syncManager
  console.log('🔧 SyncManager disponível globalmente: window.syncManager')
  console.log('📌 Use: await window.syncManager.forceSyncNow()')
}

// Service Worker registration for background sync (if available)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    if ('sync' in registration) {
      // Register for background sync
      ;(registration as any).sync.register('75hard-sync').catch((error: any) => {
        console.error('Background sync registration failed:', error)
      })
    }
  })
}
