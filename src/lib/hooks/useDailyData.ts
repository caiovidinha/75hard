import { useState, useEffect, useCallback } from 'react'
import { 
  DayLog, 
  NutritionLog, 
  Workout, 
  WeightLog, 
  ReadingLog, 
  WaterLog, 
  DiaryEntry, 
  ProgressPhoto 
} from '@/lib/types'
import { useAuth } from './useAuth'
import { useChallenge } from './useChallenge'
import {
  getDayLog,
  createDayLog,
  updateDayLog,
  getNutritionLogsByDay,
  createNutritionLog,
  getWorkoutsByDay,
  createWorkout,
  getWeightLogByDate,
  createWeightLog,
  getReadingLogByDate,
  createReadingLog,
  getWaterLogByDate,
  createWaterLog,
  getDiaryEntryByDate,
  createDiaryEntry,
  getProgressPhotoByDate,
  createProgressPhoto,
  update,
} from '@/lib/indexeddb/operations'
import { queryDocuments } from '@/lib/firebase/firestore'
import { addToSyncQueue } from '@/lib/sync/sync-queue'
import { formatDateToString } from '@/lib/utils/date'
import { validateDayCompliance } from '@/lib/services/validation.service'
import { calculateDailyNutritionTotal } from '@/lib/utils/calculations'
import { STORES, COLLECTIONS } from '@/lib/constants'

interface UseDailyDataReturn {
  date: string
  dayLog: DayLog | null
  nutritionLogs: NutritionLog[]
  workouts: Workout[]
  weightLog: WeightLog | null
  readingLog: ReadingLog | null
  waterLog: WaterLog | null
  diaryEntry: DiaryEntry | null
  progressPhoto: ProgressPhoto | null
  loading: boolean
  refreshAll: () => Promise<void>
  addNutritionLog: (log: Omit<NutritionLog, 'id' | 'userId' | 'challengeId' | 'createdAt' | 'updatedAt' | 'synced'>) => Promise<void>
  addWorkout: (workout: Omit<Workout, 'id' | 'userId' | 'challengeId' | 'createdAt' | 'updatedAt' | 'synced'>) => Promise<void>
  updateWeight: (weight: number) => Promise<void>
  updateReading: (pages: number, bookTitle?: string) => Promise<void>
  updateWater: (amountMl: number) => Promise<void>
  updateDiary: (content: string, mood?: string) => Promise<void>
  updatePhoto: (photoUrl: string, notes?: string) => Promise<void>
  markAlcoholConsumed: () => Promise<void>
  undoAlcoholConsumption: () => Promise<void>
}

export function useDailyData(dateString?: string): UseDailyDataReturn {
  const { user } = useAuth()
  const { currentChallenge } = useChallenge()
  const [date] = useState(dateString || formatDateToString(new Date()))
  
  const [dayLog, setDayLog] = useState<DayLog | null>(null)
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [weightLog, setWeightLog] = useState<WeightLog | null>(null)
  const [readingLog, setReadingLog] = useState<ReadingLog | null>(null)
  const [waterLog, setWaterLog] = useState<WaterLog | null>(null)
  const [diaryEntry, setDiaryEntry] = useState<DiaryEntry | null>(null)
  const [progressPhoto, setProgressPhoto] = useState<ProgressPhoto | null>(null)
  const [loading, setLoading] = useState(true)

  // Helper functions to load from Firebase first, fallback to local
  const loadNutritionLogsFromFirebase = async (challengeId: string, date: string): Promise<NutritionLog[]> => {
    try {
      const logs = await queryDocuments<NutritionLog>(
        COLLECTIONS.NUTRITION_LOGS,
        [
          { field: 'challengeId', operator: '==', value: challengeId },
          { field: 'date', operator: '==', value: date }
        ]
      )
      // Cache in IndexedDB
      for (const log of logs) {
        await update(STORES.NUTRITION_LOGS, log)
      }
      return logs
    } catch (error) {
      console.log('Firebase offline, using local data for nutrition logs')
      return getNutritionLogsByDay(challengeId, date) as Promise<NutritionLog[]>
    }
  }

  const loadWorkoutsFromFirebase = async (challengeId: string, date: string): Promise<Workout[]> => {
    try {
      const workouts = await queryDocuments<Workout>(
        COLLECTIONS.WORKOUTS,
        [
          { field: 'challengeId', operator: '==', value: challengeId },
          { field: 'date', operator: '==', value: date }
        ]
      )
      // Cache in IndexedDB
      for (const workout of workouts) {
        await update(STORES.WORKOUTS, workout)
      }
      return workouts
    } catch (error) {
      console.log('Firebase offline, using local data for workouts')
      return getWorkoutsByDay(challengeId, date) as Promise<Workout[]>
    }
  }

  const loadSingleRecordFromFirebase = async <T extends { id: string }>(
    collection: string,
    store: string,
    userId: string,
    date: string,
    getLocalFn: (userId: string, date: string) => Promise<T | null>
  ): Promise<T | null> => {
    try {
      const records = await queryDocuments<T>(
        collection,
        [
          { field: 'userId', operator: '==', value: userId },
          { field: 'date', operator: '==', value: date }
        ],
        undefined,
        1
      )
      const record = records[0] || null
      // Cache in IndexedDB
      if (record) {
        await update(store, record)
      }
      return record
    } catch (error) {
      console.log(`Firebase offline, using local data for ${collection}`)
      return getLocalFn(userId, date)
    }
  }

  const loadDayLogFromFirebase = async (challengeId: string, date: string): Promise<DayLog | null> => {
    try {
      const logs = await queryDocuments<DayLog>(
        COLLECTIONS.DAY_LOGS,
        [
          { field: 'challengeId', operator: '==', value: challengeId },
          { field: 'date', operator: '==', value: date }
        ],
        undefined,
        1
      )
      const log = logs[0] || null
      // Cache in IndexedDB
      if (log) {
        await update(STORES.DAY_LOGS, log)
      }
      return log
    } catch (error) {
      console.log('Firebase offline, using local data for day log')
      return getDayLog(challengeId, date) as Promise<DayLog | null>
    }
  }

  const loadAllData = useCallback(async () => {
    if (!user || !currentChallenge) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Load or create day log from Firebase first
      let log = await loadDayLogFromFirebase(currentChallenge.id, date)
      if (!log) {
        const newLog = await createDayLog({
          userId: user.id,
          challengeId: currentChallenge.id,
          date,
          dayNumber: 1, // TODO: Calculate from challenge start date
          compliant: false,
          validations: {
            dietFollowed: false,
            twoWorkoutsCompleted: false,
            oneOutdoorWorkout: false,
            waterConsumed: false,
            readingCompleted: false,
            photoTaken: false,
            noAlcohol: true,
          },
        })
        // Add new day log to sync queue
        await addToSyncQueue('create', COLLECTIONS.DAY_LOGS, newLog, newLog.id)
        log = newLog
      }
      setDayLog(log as DayLog)

      // Load all related data from Firebase first, fallback to local
      const [nutrition, workoutsData, weight, reading, water, diary, photo] = await Promise.all([
        loadNutritionLogsFromFirebase(currentChallenge.id, date),
        loadWorkoutsFromFirebase(currentChallenge.id, date),
        loadSingleRecordFromFirebase<WeightLog>(COLLECTIONS.WEIGHT_LOGS, STORES.WEIGHT_LOGS, user.id, date, (uid, d) => getWeightLogByDate(uid, d) as Promise<WeightLog | null>),
        loadSingleRecordFromFirebase<ReadingLog>(COLLECTIONS.READING_LOGS, STORES.READING_LOGS, user.id, date, (uid, d) => getReadingLogByDate(uid, d) as Promise<ReadingLog | null>),
        loadSingleRecordFromFirebase<WaterLog>(COLLECTIONS.WATER_LOGS, STORES.WATER_LOGS, user.id, date, (uid, d) => getWaterLogByDate(uid, d) as Promise<WaterLog | null>),
        loadSingleRecordFromFirebase<DiaryEntry>(COLLECTIONS.DIARY_ENTRIES, STORES.DIARY_ENTRIES, user.id, date, (uid, d) => getDiaryEntryByDate(uid, d) as Promise<DiaryEntry | null>),
        loadSingleRecordFromFirebase<ProgressPhoto>(COLLECTIONS.PROGRESS_PHOTOS, STORES.PROGRESS_PHOTOS, user.id, date, (uid, d) => getProgressPhotoByDate(uid, d) as Promise<ProgressPhoto | null>),
      ])

      setNutritionLogs(nutrition)
      setWorkouts(workoutsData)
      setWeightLog(weight)
      setReadingLog(reading)
      setWaterLog(water)
      setDiaryEntry(diary)
      setProgressPhoto(photo)
    } catch (error) {
      console.error('Error loading daily data:', error)
    } finally {
      setLoading(false)
    }
  }, [user, currentChallenge, date])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // Recalculate compliance whenever data changes
  useEffect(() => {
    if (!dayLog || !currentChallenge) return

    const recalculateCompliance = async () => {
      const nutritionTotal = calculateDailyNutritionTotal(nutritionLogs)
      
      // Build a proper DailySummary for validation
      const summary = {
        date: dayLog.date,
        dayNumber: dayLog.dayNumber,
        challenge: currentChallenge,
        dayLog,
        nutrition: {
          logs: nutritionLogs,
          total: nutritionTotal,
          compliance: {
            isCompliant: false,
            calories: {
              consumed: nutritionTotal.calories,
              limit: currentChallenge.dietConfig.dailyCalories,
              remaining: currentChallenge.dietConfig.dailyCalories - nutritionTotal.calories,
              percentage: (nutritionTotal.calories / currentChallenge.dietConfig.dailyCalories) * 100,
              exceeded: nutritionTotal.calories > currentChallenge.dietConfig.dailyCalories,
            },
            protein: {
              consumed: nutritionTotal.protein,
              limit: currentChallenge.dietConfig.protein,
              remaining: currentChallenge.dietConfig.protein - nutritionTotal.protein,
              percentage: (nutritionTotal.protein / currentChallenge.dietConfig.protein) * 100,
              exceeded: nutritionTotal.protein > currentChallenge.dietConfig.protein,
            },
            carbs: {
              consumed: nutritionTotal.carbs,
              limit: currentChallenge.dietConfig.carbs,
              remaining: currentChallenge.dietConfig.carbs - nutritionTotal.carbs,
              percentage: (nutritionTotal.carbs / currentChallenge.dietConfig.carbs) * 100,
              exceeded: nutritionTotal.carbs > currentChallenge.dietConfig.carbs,
            },
            fat: {
              consumed: nutritionTotal.fat,
              limit: currentChallenge.dietConfig.fat,
              remaining: currentChallenge.dietConfig.fat - nutritionTotal.fat,
              percentage: (nutritionTotal.fat / currentChallenge.dietConfig.fat) * 100,
              exceeded: nutritionTotal.fat > currentChallenge.dietConfig.fat,
            },
          },
        },
        workouts: {
          logs: workouts,
          compliance: {
            isCompliant: false,
            totalWorkouts: workouts.length,
            validWorkouts: 0,
            outdoorWorkouts: 0,
            totalDuration: 0,
            requirements: { minWorkouts: 2, minDuration: 45, minOutdoor: 1 },
            validation: { hasEnoughWorkouts: false, hasValidDurations: false, hasOutdoorWorkout: false },
          },
        },
        water: {
          logs: waterLog ? [waterLog] : [],
          compliance: { 
            isCompliant: false, 
            consumed: waterLog?.amount || 0, 
            target: 3780,
            remaining: 3780 - (waterLog?.amount || 0),
            percentage: ((waterLog?.amount || 0) / 3780) * 100,
          },
        },
        reading: {
          logs: readingLog ? [readingLog] : [],
          totalPages: readingLog?.pages || 0,
          isCompliant: false,
        },
        photo: progressPhoto || undefined,
        diary: diaryEntry || undefined,
        weight: weightLog || undefined,
        overallCompliance: false,
      }
      
      const compliance = validateDayCompliance(summary)

      // Preserve noAlcohol state - it's set manually by user
      const updatedValidations = {
        ...compliance.validations,
        noAlcohol: dayLog.validations.noAlcohol, // Don't overwrite alcohol status
      }

      const isCompliant = Object.values(updatedValidations).every(v => v === true)

      if (
        isCompliant !== dayLog.compliant ||
        JSON.stringify(updatedValidations) !== JSON.stringify(dayLog.validations)
      ) {
        const updatedLog = {
          ...dayLog,
          compliant: isCompliant,
          validations: updatedValidations,
          updatedAt: new Date(),
        }
        await updateDayLog(dayLog.id, updatedLog)
        await addToSyncQueue('update', COLLECTIONS.DAY_LOGS, updatedLog, updatedLog.id)
        setDayLog(updatedLog)
      }
    }

    recalculateCompliance()
  }, [dayLog, currentChallenge, nutritionLogs, workouts, waterLog, readingLog, progressPhoto])

  const addNutritionLog = async (
    log: Omit<NutritionLog, 'id' | 'userId' | 'challengeId' | 'createdAt' | 'updatedAt' | 'synced'>
  ) => {
    if (!user || !currentChallenge) throw new Error('Not authenticated')

    const newLog = await createNutritionLog({
      ...log,
      userId: user.id,
      challengeId: currentChallenge.id,
    })
    
    // Add to sync queue
    await addToSyncQueue('create', COLLECTIONS.NUTRITION_LOGS, newLog, newLog.id)
    
    await loadAllData()
  }

  const addWorkout = async (
    workout: Omit<Workout, 'id' | 'userId' | 'challengeId' | 'createdAt' | 'updatedAt' | 'synced'>
  ) => {
    if (!user || !currentChallenge) throw new Error('Not authenticated')

    const newWorkout = await createWorkout({
      ...workout,
      userId: user.id,
      challengeId: currentChallenge.id,
    })
    
    // Add to sync queue
    await addToSyncQueue('create', COLLECTIONS.WORKOUTS, newWorkout, newWorkout.id)
    
    await loadAllData()
  }

  const updateWeight = async (weight: number) => {
    if (!user) throw new Error('Not authenticated')

    if (weightLog) {
      // Update existing weight log
      const updatedLog = { ...weightLog, weight: weight, updatedAt: new Date() }
      await update<WeightLog>(STORES.WEIGHT_LOGS, updatedLog)
      await addToSyncQueue('update', COLLECTIONS.WEIGHT_LOGS, updatedLog, updatedLog.id)
    } else {
      const newLog = await createWeightLog({
        userId: user.id,
        date,
        weight: weight,
      })
      await addToSyncQueue('create', COLLECTIONS.WEIGHT_LOGS, newLog, newLog.id)
    }
    await loadAllData()
  }

  const updateReading = async (pages: number, bookTitle?: string) => {
    if (!user || !dayLog) throw new Error('Not authenticated or no day log')

    if (readingLog) {
      // Update existing reading log
      const updatedLog = {
        ...readingLog,
        pages,
        bookTitle: bookTitle || readingLog.bookTitle,
        updatedAt: new Date(),
      }
      await update<ReadingLog>(STORES.READING_LOGS, updatedLog)
      await addToSyncQueue('update', COLLECTIONS.READING_LOGS, updatedLog, updatedLog.id)
    } else {
      const newLog = await createReadingLog({
        dayLogId: dayLog.id,
        userId: user.id,
        date,
        pages,
        bookTitle: bookTitle || 'Livro',
      })
      await addToSyncQueue('create', COLLECTIONS.READING_LOGS, newLog, newLog.id)
    }
    await loadAllData()
  }

  const updateWater = async (amountMl: number) => {
    if (!user || !dayLog) throw new Error('Not authenticated or no day log')

    if (waterLog) {
      // Update existing water log
      const updatedLog = {
        ...waterLog,
        amount: amountMl,
        timestamp: new Date(),
      }
      await update<WaterLog>(STORES.WATER_LOGS, updatedLog)
      await addToSyncQueue('update', COLLECTIONS.WATER_LOGS, updatedLog, updatedLog.id)
    } else {
      const newLog = await createWaterLog({
        dayLogId: dayLog.id,
        userId: user.id,
        date,
        amount: amountMl,
        timestamp: new Date(),
      })
      await addToSyncQueue('create', COLLECTIONS.WATER_LOGS, newLog, newLog.id)
    }
    await loadAllData()
  }

  const updateDiary = async (content: string, mood?: string) => {
    if (!user || !dayLog) throw new Error('Not authenticated or no day log')

    if (diaryEntry) {
      // Update existing diary entry
      const updatedEntry = {
        ...diaryEntry,
        text: content,
        mood: mood as any,
        updatedAt: new Date(),
      }
      await update<DiaryEntry>(STORES.DIARY_ENTRIES, updatedEntry)
      await addToSyncQueue('update', COLLECTIONS.DIARY_ENTRIES, updatedEntry, updatedEntry.id)
    } else {
      const newEntry = await createDiaryEntry({
        dayLogId: dayLog.id,
        userId: user.id,
        date,
        text: content,
        mood,
      })
      await addToSyncQueue('create', COLLECTIONS.DIARY_ENTRIES, newEntry, newEntry.id)
    }
    await loadAllData()
  }

  const updatePhoto = async (photoUrl: string, notes?: string) => {
    if (!user || !currentChallenge) throw new Error('Not authenticated')

    const newPhoto = await createProgressPhoto({
      userId: user.id,
      challengeId: currentChallenge.id,
      date,
      photoUrl,
      notes,
    })
    await addToSyncQueue('create', COLLECTIONS.PROGRESS_PHOTOS, newPhoto, newPhoto.id)
    await loadAllData()
  }

  const markAlcoholConsumed = async () => {
    if (!dayLog) throw new Error('Day log not found')

    const updatedLog = {
      ...dayLog,
      validations: {
        ...dayLog.validations,
        noAlcohol: false,
      },
      compliant: false,
      updatedAt: new Date(),
    }
    await updateDayLog(dayLog.id, updatedLog)
    await addToSyncQueue('update', COLLECTIONS.DAY_LOGS, updatedLog, updatedLog.id)
    await loadAllData()
  }

  const undoAlcoholConsumption = async () => {
    if (!dayLog) throw new Error('Day log not found')

    // Restore noAlcohol to true
    const updatedLog = {
      ...dayLog,
      validations: {
        ...dayLog.validations,
        noAlcohol: true,
      },
      updatedAt: new Date(),
    }
    await updateDayLog(dayLog.id, updatedLog)
    await addToSyncQueue('update', COLLECTIONS.DAY_LOGS, updatedLog, updatedLog.id)
    // Let the useEffect recalculate compliance based on other tasks
    await loadAllData()
  }

  return {
    date,
    dayLog,
    nutritionLogs,
    workouts,
    weightLog,
    readingLog,
    waterLog,
    diaryEntry,
    progressPhoto,
    loading,
    refreshAll: loadAllData,
    addNutritionLog,
    addWorkout,
    updateWeight,
    updateReading,
    updateWater,
    updateDiary,
    updatePhoto,
    markAlcoholConsumed,
    undoAlcoholConsumption,
  }
}
