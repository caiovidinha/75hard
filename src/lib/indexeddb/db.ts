import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { DB_NAME, DB_VERSION, STORES } from '@/lib/constants'
import type {
  Challenge,
  DayLog,
  NutritionLog,
  Workout,
  WeightLog,
  ReadingLog,
  WaterLog,
  DiaryEntry,
  ProgressPhoto,
  SyncQueueItem,
} from '@/lib/types'

// ==================== DATABASE SCHEMA ====================

interface SeventyFiveHardDB extends DBSchema {
  [STORES.CHALLENGES]: {
    key: string
    value: Challenge
    indexes: { userId: string; status: string }
  }
  [STORES.DAY_LOGS]: {
    key: string
    value: DayLog
    indexes: { userId: string; challengeId: string; date: string }
  }
  [STORES.NUTRITION_LOGS]: {
    key: string
    value: NutritionLog
    indexes: { userId: string; dayLogId: string; date: string }
  }
  [STORES.WORKOUTS]: {
    key: string
    value: Workout
    indexes: { userId: string; dayLogId: string; date: string }
  }
  [STORES.WEIGHT_LOGS]: {
    key: string
    value: WeightLog
    indexes: { userId: string; date: string }
  }
  [STORES.READING_LOGS]: {
    key: string
    value: ReadingLog
    indexes: { userId: string; dayLogId: string; date: string }
  }
  [STORES.WATER_LOGS]: {
    key: string
    value: WaterLog
    indexes: { userId: string; dayLogId: string; date: string }
  }
  [STORES.DIARY_ENTRIES]: {
    key: string
    value: DiaryEntry
    indexes: { userId: string; dayLogId: string; date: string }
  }
  [STORES.PROGRESS_PHOTOS]: {
    key: string
    value: ProgressPhoto
    indexes: { userId: string; dayLogId: string; date: string }
  }
  [STORES.SYNC_QUEUE]: {
    key: string
    value: SyncQueueItem
    indexes: { status: string; timestamp: number }
  }
}

let db: IDBPDatabase<SeventyFiveHardDB> | null = null

// ==================== INITIALIZATION ====================

/**
 * Initialize IndexedDB
 */
export async function initDB(): Promise<IDBPDatabase<SeventyFiveHardDB>> {
  if (db) return db

  db = await openDB<SeventyFiveHardDB>(DB_NAME, DB_VERSION, {
    upgrade(database, oldVersion, newVersion, transaction) {
      console.log(`Upgrading database from ${oldVersion} to ${newVersion}`)

      // Challenges store
      if (!database.objectStoreNames.contains(STORES.CHALLENGES)) {
        const challengeStore = database.createObjectStore(STORES.CHALLENGES, {
          keyPath: 'id',
        })
        challengeStore.createIndex('userId', 'userId', { unique: false })
        challengeStore.createIndex('status', 'status', { unique: false })
      }

      // Day logs store
      if (!database.objectStoreNames.contains(STORES.DAY_LOGS)) {
        const dayLogStore = database.createObjectStore(STORES.DAY_LOGS, {
          keyPath: 'id',
        })
        dayLogStore.createIndex('userId', 'userId', { unique: false })
        dayLogStore.createIndex('challengeId', 'challengeId', { unique: false })
        dayLogStore.createIndex('date', 'date', { unique: false })
      }

      // Nutrition logs store
      if (!database.objectStoreNames.contains(STORES.NUTRITION_LOGS)) {
        const nutritionStore = database.createObjectStore(STORES.NUTRITION_LOGS, {
          keyPath: 'id',
        })
        nutritionStore.createIndex('userId', 'userId', { unique: false })
        nutritionStore.createIndex('dayLogId', 'dayLogId', { unique: false })
        nutritionStore.createIndex('date', 'date', { unique: false })
      }

      // Workouts store
      if (!database.objectStoreNames.contains(STORES.WORKOUTS)) {
        const workoutStore = database.createObjectStore(STORES.WORKOUTS, {
          keyPath: 'id',
        })
        workoutStore.createIndex('userId', 'userId', { unique: false })
        workoutStore.createIndex('dayLogId', 'dayLogId', { unique: false })
        workoutStore.createIndex('date', 'date', { unique: false })
      }

      // Weight logs store
      if (!database.objectStoreNames.contains(STORES.WEIGHT_LOGS)) {
        const weightStore = database.createObjectStore(STORES.WEIGHT_LOGS, {
          keyPath: 'id',
        })
        weightStore.createIndex('userId', 'userId', { unique: false })
        weightStore.createIndex('date', 'date', { unique: false })
      }

      // Reading logs store
      if (!database.objectStoreNames.contains(STORES.READING_LOGS)) {
        const readingStore = database.createObjectStore(STORES.READING_LOGS, {
          keyPath: 'id',
        })
        readingStore.createIndex('userId', 'userId', { unique: false })
        readingStore.createIndex('dayLogId', 'dayLogId', { unique: false })
        readingStore.createIndex('date', 'date', { unique: false })
      }

      // Water logs store
      if (!database.objectStoreNames.contains(STORES.WATER_LOGS)) {
        const waterStore = database.createObjectStore(STORES.WATER_LOGS, {
          keyPath: 'id',
        })
        waterStore.createIndex('userId', 'userId', { unique: false })
        waterStore.createIndex('dayLogId', 'dayLogId', { unique: false })
        waterStore.createIndex('date', 'date', { unique: false })
      }

      // Diary entries store
      if (!database.objectStoreNames.contains(STORES.DIARY_ENTRIES)) {
        const diaryStore = database.createObjectStore(STORES.DIARY_ENTRIES, {
          keyPath: 'id',
        })
        diaryStore.createIndex('userId', 'userId', { unique: false })
        diaryStore.createIndex('dayLogId', 'dayLogId', { unique: false })
        diaryStore.createIndex('date', 'date', { unique: false })
      }

      // Progress photos store
      if (!database.objectStoreNames.contains(STORES.PROGRESS_PHOTOS)) {
        const photoStore = database.createObjectStore(STORES.PROGRESS_PHOTOS, {
          keyPath: 'id',
        })
        photoStore.createIndex('userId', 'userId', { unique: false })
        photoStore.createIndex('dayLogId', 'dayLogId', { unique: false })
        photoStore.createIndex('date', 'date', { unique: false })
      }

      // Sync queue store
      if (!database.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = database.createObjectStore(STORES.SYNC_QUEUE, {
          keyPath: 'id',
        })
        syncStore.createIndex('status', 'status', { unique: false })
        syncStore.createIndex('timestamp', 'timestamp', { unique: false })
      }
    },
  })

  return db
}

/**
 * Get database instance
 */
export async function getDB(): Promise<IDBPDatabase<SeventyFiveHardDB>> {
  if (!db) {
    return await initDB()
  }
  return db
}

/**
 * Close database connection
 */
export function closeDB(): void {
  if (db) {
    db.close()
    db = null
  }
}

/**
 * Clear all data (use with caution)
 */
export async function clearAllData(): Promise<void> {
  const database = await getDB()
  const storeNames = Object.values(STORES)
  
  for (const storeName of storeNames) {
    await database.clear(storeName as any)
  }
}

/**
 * Clear user-specific data
 */
export async function clearUserData(userId: string): Promise<void> {
  const database = await getDB()
  
  // Clear all stores except sync queue
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
  
  for (const storeName of stores) {
    const tx = database.transaction(storeName as any, 'readwrite')
    const store = tx.objectStore(storeName as any) as any
    const index = store.index('userId')
    
    let cursor = await index.openCursor(IDBKeyRange.only(userId))
    
    while (cursor) {
      await cursor.delete()
      cursor = await cursor.continue()
    }
    
    await tx.done
  }
}
