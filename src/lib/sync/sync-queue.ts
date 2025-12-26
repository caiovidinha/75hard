import { getDB } from '../indexeddb/db'
import { STORES, SYNC_MAX_RETRIES, SYNC_RETRY_DELAY, SYNC_EXPONENTIAL_BACKOFF } from '@/lib/constants'
import type { SyncQueueItem, SyncOperation, SyncStatus } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

/**
 * Sync Queue Management
 * Manages pending operations for offline-first sync
 */

// ==================== ADD TO QUEUE ====================

export async function addToSyncQueue(
  operation: SyncOperation,
  collection: string,
  data: any,
  documentId?: string
): Promise<SyncQueueItem> {
  const db = await getDB()
  
  const queueItem: SyncQueueItem = {
    id: uuidv4(),
    operation,
    collection,
    documentId,
    data,
    timestamp: Date.now(),
    status: 'pending',
    retryCount: 0,
  }
  
  await db.put(STORES.SYNC_QUEUE, queueItem)
  
  return queueItem
}

// ==================== GET QUEUE ====================

export async function getPendingItems(): Promise<SyncQueueItem[]> {
  const db = await getDB()
  const items = await db.getAllFromIndex(
    STORES.SYNC_QUEUE,
    'status',
    'pending'
  )
  
  // Sort by timestamp (oldest first)
  return items.sort((a, b) => a.timestamp - b.timestamp)
}

export async function getFailedItems(): Promise<SyncQueueItem[]> {
  const db = await getDB()
  return await db.getAllFromIndex(STORES.SYNC_QUEUE, 'status', 'error')
}

export async function getAllQueueItems(): Promise<SyncQueueItem[]> {
  const db = await getDB()
  return await db.getAll(STORES.SYNC_QUEUE)
}

// ==================== UPDATE QUEUE ITEM ====================

export async function updateQueueItemStatus(
  id: string,
  status: SyncStatus,
  error?: string
): Promise<void> {
  const db = await getDB()
  const item = await db.get(STORES.SYNC_QUEUE, id)
  
  if (item) {
    item.status = status
    if (error) {
      item.error = error
    }
    
    await db.put(STORES.SYNC_QUEUE, item)
  }
}

export async function incrementRetryCount(id: string): Promise<number> {
  const db = await getDB()
  const item = await db.get(STORES.SYNC_QUEUE, id)
  
  if (item) {
    item.retryCount += 1
    await db.put(STORES.SYNC_QUEUE, item)
    return item.retryCount
  }
  
  return 0
}

// ==================== REMOVE FROM QUEUE ====================

export async function removeFromQueue(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORES.SYNC_QUEUE, id)
}

export async function clearSuccessfulItems(): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite')
  const index = tx.store.index('status')
  
  let cursor = await index.openCursor(IDBKeyRange.only('success'))
  
  while (cursor) {
    await cursor.delete()
    cursor = await cursor.continue()
  }
  
  await tx.done
}

export async function clearErrorItems(): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite')
  const index = tx.store.index('status')
  
  let cursor = await index.openCursor(IDBKeyRange.only('error'))
  let count = 0
  
  while (cursor) {
    await cursor.delete()
    count++
    cursor = await cursor.continue()
  }
  
  await tx.done
  console.log(`🗑️ Limpou ${count} itens com erro da fila`)
}

export async function retryAllErrors(): Promise<void> {
  const db = await getDB()
  const items = await db.getAllFromIndex(STORES.SYNC_QUEUE, 'status', 'error')
  
  console.log(`🔄 Reativando ${items.length} itens com erro para retry`)
  for (const item of items) {
    item.status = 'pending'
    item.retryCount = 0
    delete item.error
    await db.put(STORES.SYNC_QUEUE, item)
  }
}

export async function clearAllQueue(): Promise<void> {
  const db = await getDB()
  await db.clear(STORES.SYNC_QUEUE)
}

// ==================== RETRY LOGIC ====================

export async function shouldRetry(item: SyncQueueItem): Promise<boolean> {
  return item.retryCount < SYNC_MAX_RETRIES
}

export function getRetryDelay(retryCount: number): number {
  return SYNC_RETRY_DELAY * Math.pow(SYNC_EXPONENTIAL_BACKOFF, retryCount)
}

export async function markForRetry(id: string): Promise<void> {
  const db = await getDB()
  const item = await db.get(STORES.SYNC_QUEUE, id)
  
  if (item && (await shouldRetry(item))) {
    item.status = 'pending'
    await db.put(STORES.SYNC_QUEUE, item)
  } else if (item) {
    // Max retries reached, mark as permanent error
    item.status = 'error'
    item.error = 'Max retries reached'
    await db.put(STORES.SYNC_QUEUE, item)
  }
}

// ==================== QUEUE STATS ====================

export async function getQueueStats() {
  const db = await getDB()
  const all = await db.getAll(STORES.SYNC_QUEUE)
  
  return {
    total: all.length,
    pending: all.filter((item) => item.status === 'pending').length,
    syncing: all.filter((item) => item.status === 'syncing').length,
    success: all.filter((item) => item.status === 'success').length,
    error: all.filter((item) => item.status === 'error').length,
  }
}
