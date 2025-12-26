import { getDB } from './db'
import { STORES } from '@/lib/constants'
import type { IDBPDatabase } from 'idb'

/**
 * Generic CRUD operations for IndexedDB
 */

// ==================== CREATE ====================

export async function create<T extends { id: string }>(
  storeName: string,
  item: T
): Promise<T> {
  const db = await getDB()
  await db.put(storeName as any, item)
  return item
}

export async function createMany<T extends { id: string }>(
  storeName: string,
  items: T[]
): Promise<T[]> {
  const db = await getDB()
  const tx = db.transaction(storeName as any, 'readwrite')
  
  await Promise.all(items.map((item) => tx.store.put(item)))
  await tx.done
  
  return items
}

// ==================== READ ====================

export async function getById<T>(
  storeName: string,
  id: string
): Promise<T | undefined> {
  const db = await getDB()
  return await db.get(storeName as any, id)
}

export async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await getDB()
  const result = await db.getAll(storeName as any)
  return result as T[]
}

export async function getByIndex<T>(
  storeName: string,
  indexName: string,
  value: string | number
): Promise<T[]> {
  const db = await getDB()
  const result = await (db as any).getAllFromIndex(storeName, indexName, value)
  return result as T[]
}

export async function getByIndexRange<T>(
  storeName: string,
  indexName: string,
  range: IDBKeyRange
): Promise<T[]> {
  const db = await getDB() as any
  const tx = db.transaction(storeName, 'readonly')
  const index = tx.store.index(indexName)
  
  const results: T[] = []
  let cursor = await index.openCursor(range)
  
  while (cursor) {
    results.push(cursor.value as T)
    cursor = await cursor.continue()
  }
  
  return results
}

// ==================== UPDATE ====================

export async function update<T extends { id: string }>(
  storeName: string,
  item: T
): Promise<T> {
  const db = await getDB()
  await db.put(storeName as any, item)
  return item
}

export async function updateMany<T extends { id: string }>(
  storeName: string,
  items: T[]
): Promise<T[]> {
  const db = await getDB()
  const tx = db.transaction(storeName as any, 'readwrite')
  
  await Promise.all(items.map((item) => tx.store.put(item)))
  await tx.done
  
  return items
}

// ==================== DELETE ====================

export async function deleteById(storeName: string, id: string): Promise<void> {
  const db = await getDB()
  await db.delete(storeName as any, id)
}

export async function deleteMany(storeName: string, ids: string[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(storeName as any, 'readwrite')
  
  await Promise.all(ids.map((id) => tx.store.delete(id)))
  await tx.done
}

export async function deleteByIndex(
  storeName: string,
  indexName: string,
  value: string | number
): Promise<void> {
  const db = await getDB() as any
  const tx = db.transaction(storeName, 'readwrite')
  const index = tx.store.index(indexName)
  
  let cursor = await index.openCursor(IDBKeyRange.only(value))
  
  while (cursor) {
    await cursor.delete()
    cursor = await cursor.continue()
  }
  
  await tx.done
}

// ==================== COUNT ====================

export async function count(storeName: string): Promise<number> {
  const db = await getDB()
  return await db.count(storeName as any)
}

export async function countByIndex(
  storeName: string,
  indexName: string,
  value: string | number
): Promise<number> {
  const db = await getDB() as any
  return await db.countFromIndex(storeName, indexName, value)
}

// ==================== CLEAR ====================

export async function clear(storeName: string): Promise<void> {
  const db = await getDB()
  await db.clear(storeName as any)
}

// ==================== SPECIFIC QUERIES ====================

/**
 * Get active challenge for user
 */
export async function getActiveChallenge(userId: string) {
  const db = await getDB()
  const tx = db.transaction(STORES.CHALLENGES, 'readonly')
  const index = tx.store.index('userId')
  
  let cursor = await index.openCursor(IDBKeyRange.only(userId))
  
  while (cursor) {
    if (cursor.value.status === 'active') {
      return cursor.value
    }
    cursor = await cursor.continue()
  }
  
  return null
}

/**
 * Get day log for specific date
 */
export async function getDayLogByDate(userId: string, date: string) {
  const db = await getDB()
  const logs = await getByIndex(STORES.DAY_LOGS, 'date', date)
  return logs.find((log: any) => log.userId === userId)
}

/**
 * Get all logs for a specific day
 */
export async function getDayData(userId: string, date: string) {
  const [
    dayLog,
    nutritionLogs,
    workouts,
    waterLogs,
    readingLogs,
    diaryEntry,
    photo,
    weight,
  ] = await Promise.all([
    getDayLogByDate(userId, date),
    getByIndex(STORES.NUTRITION_LOGS, 'date', date),
    getByIndex(STORES.WORKOUTS, 'date', date),
    getByIndex(STORES.WATER_LOGS, 'date', date),
    getByIndex(STORES.READING_LOGS, 'date', date),
    getByIndex(STORES.DIARY_ENTRIES, 'date', date).then(
      (entries: any[]) => entries.find((e) => e.userId === userId)
    ),
    getByIndex(STORES.PROGRESS_PHOTOS, 'date', date).then(
      (photos: any[]) => photos.find((p) => p.userId === userId)
    ),
    getByIndex(STORES.WEIGHT_LOGS, 'date', date).then(
      (weights: any[]) => weights.find((w) => w.userId === userId)
    ),
  ])

  return {
    dayLog,
    nutritionLogs: nutritionLogs.filter((n: any) => n.userId === userId),
    workouts: workouts.filter((w: any) => w.userId === userId),
    waterLogs: waterLogs.filter((w: any) => w.userId === userId),
    readingLogs: readingLogs.filter((r: any) => r.userId === userId),
    diaryEntry,
    photo,
    weight,
  }
}

/**
 * Get weight history for user
 */
export async function getWeightHistory(
  userId: string,
  limit?: number
): Promise<any[]> {
  const weights = await getByIndex(STORES.WEIGHT_LOGS, 'userId', userId)
  
  const sorted = weights.sort((a: any, b: any) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })
  
  return limit ? sorted.slice(0, limit) : sorted
}

// ==================== CHALLENGE OPERATIONS ====================

export async function getChallengesByUser(userId: string) {
  return await getByIndex(STORES.CHALLENGES, 'userId', userId)
}

export async function createChallenge(challenge: any) {
  const id = `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  
  const newChallenge = {
    ...challenge,
    id,
    createdAt: now,
    updatedAt: now,
    synced: false,
  }
  
  return await create(STORES.CHALLENGES, newChallenge)
}

export async function updateChallenge(challengeId: string, updates: any) {
  const challenge = await getById(STORES.CHALLENGES, challengeId)
  if (!challenge) throw new Error('Challenge not found')
  
  const updated = {
    ...challenge,
    ...updates,
    updatedAt: new Date().toISOString(),
    synced: false,
  }
  
  return await update(STORES.CHALLENGES, updated)
}

// ==================== DAY LOG OPERATIONS ====================

export async function getDayLog(challengeId: string, date: string) {
  const logs = await getByIndex(STORES.DAY_LOGS, 'date', date)
  return logs.find((log: any) => log.challengeId === challengeId)
}

export async function getDayLogsByChallenge(challengeId: string) {
  return await getByIndex(STORES.DAY_LOGS, 'challengeId', challengeId)
}

export async function createDayLog(dayLog: any) {
  const id = `daylog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  
  const newDayLog = {
    ...dayLog,
    id,
    createdAt: now,
    updatedAt: now,
    synced: false,
  }
  
  return await create(STORES.DAY_LOGS, newDayLog)
}

export async function updateDayLog(dayLogId: string, updates: any) {
  const dayLog = await getById(STORES.DAY_LOGS, dayLogId)
  if (!dayLog) throw new Error('Day log not found')
  
  const updated = {
    ...dayLog,
    ...updates,
    updatedAt: new Date().toISOString(),
    synced: false,
  }
  
  return await update(STORES.DAY_LOGS, updated)
}

// ==================== NUTRITION OPERATIONS ====================

export async function getNutritionLogsByDay(challengeId: string, date: string) {
  const logs = await getByIndex(STORES.NUTRITION_LOGS, 'date', date)
  return logs.filter((log: any) => log.challengeId === challengeId)
}

export async function createNutritionLog(nutritionLog: any) {
  const id = `nutrition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  
  const newLog = {
    ...nutritionLog,
    id,
    createdAt: now,
    updatedAt: now,
    synced: false,
  }
  
  return await create(STORES.NUTRITION_LOGS, newLog)
}

// ==================== WORKOUT OPERATIONS ====================

export async function getWorkoutsByDay(challengeId: string, date: string) {
  const workouts = await getByIndex(STORES.WORKOUTS, 'date', date)
  return workouts.filter((workout: any) => workout.challengeId === challengeId)
}

export async function createWorkout(workout: any) {
  const id = `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  
  const newWorkout = {
    ...workout,
    id,
    createdAt: now,
    updatedAt: now,
    synced: false,
  }
  
  return await create(STORES.WORKOUTS, newWorkout)
}

// ==================== WEIGHT LOG OPERATIONS ====================

export async function getWeightLogByDate(userId: string, date: string) {
  const logs = await getByIndex(STORES.WEIGHT_LOGS, 'date', date)
  return logs.find((log: any) => log.userId === userId)
}

export async function createWeightLog(weightLog: any) {
  const id = `weight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  
  const newLog = {
    ...weightLog,
    id,
    createdAt: now,
    updatedAt: now,
    synced: false,
  }
  
  return await create(STORES.WEIGHT_LOGS, newLog)
}

// ==================== READING LOG OPERATIONS ====================

export async function getReadingLogByDate(userId: string, date: string) {
  const logs = await getByIndex(STORES.READING_LOGS, 'date', date)
  return logs.find((log: any) => log.userId === userId)
}

export async function createReadingLog(readingLog: any) {
  const id = `reading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  
  const newLog = {
    ...readingLog,
    id,
    createdAt: now,
    updatedAt: now,
    synced: false,
  }
  
  return await create(STORES.READING_LOGS, newLog)
}

// ==================== WATER LOG OPERATIONS ====================

export async function getWaterLogByDate(userId: string, date: string) {
  const logs = await getByIndex(STORES.WATER_LOGS, 'date', date)
  return logs.find((log: any) => log.userId === userId)
}

export async function createWaterLog(waterLog: any) {
  const id = `water_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  
  const newLog = {
    ...waterLog,
    id,
    createdAt: now,
    updatedAt: now,
    synced: false,
  }
  
  return await create(STORES.WATER_LOGS, newLog)
}

// ==================== DIARY ENTRY OPERATIONS ====================

export async function getDiaryEntryByDate(userId: string, date: string) {
  const entries = await getByIndex(STORES.DIARY_ENTRIES, 'date', date)
  return entries.find((entry: any) => entry.userId === userId)
}

export async function createDiaryEntry(diaryEntry: any) {
  const id = `diary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  
  const newEntry = {
    ...diaryEntry,
    id,
    createdAt: now,
    updatedAt: now,
    synced: false,
  }
  
  return await create(STORES.DIARY_ENTRIES, newEntry)
}

// ==================== PROGRESS PHOTO OPERATIONS ====================

export async function getProgressPhotoByDate(challengeId: string, date: string) {
  const photos = await getByIndex(STORES.PROGRESS_PHOTOS, 'date', date)
  return photos.find((photo: any) => photo.challengeId === challengeId)
}

export async function createProgressPhoto(photo: any) {
  const id = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  
  const newPhoto = {
    ...photo,
    id,
    createdAt: now,
    updatedAt: now,
    synced: false,
  }
  
  return await create(STORES.PROGRESS_PHOTOS, newPhoto)
}
