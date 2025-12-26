/**
 * Bulk Sync - Sincroniza todos os dados locais existentes para o Firebase
 * Útil para migrar dados antigos que nunca foram sincronizados
 */

import { getDB } from '../indexeddb/db'
import { STORES, COLLECTIONS } from '../constants'
import { addToSyncQueue } from './sync-queue'

/**
 * Sincroniza todos os dados de todas as stores para o Firebase
 */
export async function syncAllExistingData(): Promise<{
  total: number
  byCollection: Record<string, number>
}> {
  console.log('🔄 Iniciando sincronização em massa de todos os dados...')
  
  const db = await getDB()
  let totalQueued = 0
  const byCollection: Record<string, number> = {}

  // Mapeia IndexedDB stores para Firestore collections
  const storeToCollection: Record<string, string> = {
    [STORES.CHALLENGES]: COLLECTIONS.CHALLENGES,
    [STORES.DAY_LOGS]: COLLECTIONS.DAY_LOGS,
    [STORES.NUTRITION_LOGS]: COLLECTIONS.NUTRITION_LOGS,
    [STORES.WORKOUTS]: COLLECTIONS.WORKOUTS,
    [STORES.WEIGHT_LOGS]: COLLECTIONS.WEIGHT_LOGS,
    [STORES.READING_LOGS]: COLLECTIONS.READING_LOGS,
    [STORES.WATER_LOGS]: COLLECTIONS.WATER_LOGS,
    [STORES.DIARY_ENTRIES]: COLLECTIONS.DIARY_ENTRIES,
    [STORES.PROGRESS_PHOTOS]: COLLECTIONS.PROGRESS_PHOTOS,
  }

  // Itera por todas as stores
  for (const [storeName, collectionName] of Object.entries(storeToCollection)) {
    try {
      const items = await db.getAll(storeName as any)
      
      if (items.length === 0) {
        console.log(`⏭️  ${storeName}: 0 itens`)
        continue
      }

      console.log(`📦 ${storeName}: ${items.length} itens encontrados`)
      
      // Adiciona cada item à fila de sync
      for (const item of items) {
        if (item.id) {
          // Usa 'create' para garantir que cria se não existir
          // O setDoc com merge no Firebase vai lidar com isso
          await addToSyncQueue('update', collectionName, item, item.id)
          totalQueued++
        }
      }

      byCollection[collectionName] = items.length
    } catch (error) {
      console.error(`❌ Erro ao processar ${storeName}:`, error)
    }
  }

  console.log(`✅ Total de ${totalQueued} itens adicionados à fila de sincronização`)
  console.log('📊 Detalhes:', byCollection)

  return { total: totalQueued, byCollection }
}

/**
 * Sincroniza apenas uma coleção específica
 */
export async function syncCollection(storeName: string, collectionName: string): Promise<number> {
  console.log(`🔄 Sincronizando ${storeName} → ${collectionName}...`)
  
  const db = await getDB()
  const items = await db.getAll(storeName as any)
  
  let queued = 0
  for (const item of items) {
    if (item.id) {
      await addToSyncQueue('update', collectionName, item, item.id)
      queued++
    }
  }

  console.log(`✅ ${queued} itens de ${storeName} adicionados à fila`)
  return queued
}

/**
 * Estatísticas dos dados locais
 */
export async function getLocalDataStats(): Promise<Record<string, number>> {
  const db = await getDB()
  const stats: Record<string, number> = {}

  const stores = [
    STORES.CHALLENGES,
    STORES.DAY_LOGS,
    STORES.NUTRITION_LOGS,
    STORES.WORKOUTS,
    STORES.WEIGHT_LOGS,
    STORES.READING_LOGS,
    STORES.WATER_LOGS,
    STORES.DIARY_ENTRIES,
    STORES.PROGRESS_PHOTOS,
  ]

  for (const store of stores) {
    try {
      const count = await db.count(store as any)
      stats[store] = count
    } catch (error) {
      stats[store] = 0
    }
  }

  return stats
}
