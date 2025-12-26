// ==================== USER ====================
export interface AppUser {
  id: string
  email: string
  displayName: string
  createdAt: Date
  updatedAt: Date
}

// ==================== CHALLENGE ====================
export type ChallengeStatus = 'active' | 'failed' | 'completed'

export interface DietConfig {
  dailyCalories: number
  protein: number // gramas
  carbs: number // gramas
  fat: number // gramas
  tolerance: number // porcentagem (ex: 10 = 10%)
}

export interface Challenge {
  id: string
  userId: string
  startDate: Date
  endDate?: Date
  status: ChallengeStatus
  currentDay: number
  failedOnDay?: number
  failedReason?: string
  dietConfig: DietConfig
  createdAt: Date
  updatedAt: Date
}

// ==================== DAY LOG ====================
export interface DayValidations {
  diet: boolean
  workouts: boolean
  water: boolean
  reading: boolean
  photo: boolean
  noAlcohol: boolean
}

export interface DayLog {
  id: string
  challengeId: string
  userId: string
  date: string // YYYY-MM-DD
  dayNumber: number
  completed: boolean
  compliant: boolean
  failedReason?: string
  validations: DayValidations
  createdAt: Date
  updatedAt: Date
}

// ==================== NUTRITION ====================
export interface NutritionLog {
  id: string
  dayLogId: string
  userId: string
  date: string
  mealName?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  timestamp: Date
  createdAt: Date
}

export interface DailyNutritionTotal {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface NutritionCompliance {
  isCompliant: boolean
  calories: {
    consumed: number
    limit: number
    remaining: number
    percentage: number
    exceeded: boolean
  }
  protein: {
    consumed: number
    limit: number
    remaining: number
    percentage: number
    exceeded: boolean
  }
  carbs: {
    consumed: number
    limit: number
    remaining: number
    percentage: number
    exceeded: boolean
  }
  fat: {
    consumed: number
    limit: number
    remaining: number
    percentage: number
    exceeded: boolean
  }
}

// ==================== WORKOUT ====================
export type WorkoutType = 'musculacao' | 'cardio' | 'mobilidade' | 'funcional' | 'outro'
export type WorkoutIntensity = 'leve' | 'moderada' | 'alta'

export interface Workout {
  id: string
  dayLogId: string
  userId: string
  date: string
  type: WorkoutType
  customType?: string
  duration: number // minutos
  intensity: WorkoutIntensity
  outdoor: boolean
  notes?: string
  startTime?: Date
  createdAt: Date
  updatedAt: Date
}

export interface WorkoutCompliance {
  isCompliant: boolean
  totalWorkouts: number
  validWorkouts: number // >= 45min
  outdoorWorkouts: number
  totalDuration: number
  requirements: {
    minWorkouts: number
    minDuration: number
    minOutdoor: number
  }
  validation: {
    hasEnoughWorkouts: boolean
    hasValidDurations: boolean
    hasOutdoorWorkout: boolean
  }
}

// ==================== WEIGHT ====================
export interface WeightLog {
  id: string
  userId: string
  challengeId?: string
  date: string
  weight: number // kg
  createdAt: Date
}

export interface WeightProgress {
  current: number
  initial: number
  difference: number
  percentageChange: number
  movingAverage7Days?: number
}

// ==================== READING ====================
export interface ReadingLog {
  id: string
  dayLogId: string
  userId: string
  date: string
  bookTitle: string
  pages: number
  totalPages?: number
  createdAt: Date
  updatedAt: Date
}

// ==================== WATER ====================
export interface WaterLog {
  id: string
  dayLogId: string
  userId: string
  date: string
  amount: number // ml
  timestamp: Date
  createdAt: Date
}

export interface WaterCompliance {
  isCompliant: boolean
  consumed: number
  target: number
  remaining: number
  percentage: number
}

// ==================== DIARY ====================
export type Mood = 'great' | 'good' | 'neutral' | 'bad' | 'terrible'

export interface DiaryEntry {
  id: string
  dayLogId: string
  userId: string
  date: string
  text: string
  mood?: Mood
  createdAt: Date
  updatedAt: Date
}

// ==================== PROGRESS PHOTO ====================
export interface ProgressPhoto {
  id: string
  dayLogId?: string
  userId: string
  challengeId?: string
  date: string
  photoUrl: string
  notes?: string | null
  createdAt: Date
  updatedAt?: Date
}

// ==================== SYNC ====================
export type SyncOperation = 'create' | 'update' | 'delete'
export type SyncStatus = 'pending' | 'syncing' | 'success' | 'error'

export interface SyncQueueItem {
  id: string
  operation: SyncOperation
  collection: string
  documentId?: string
  data: any
  timestamp: number
  status: SyncStatus
  retryCount: number
  error?: string
}

// ==================== DAILY SUMMARY ====================
export interface DailySummary {
  date: string
  dayNumber: number
  challenge: Challenge
  dayLog: DayLog
  nutrition: {
    logs: NutritionLog[]
    total: DailyNutritionTotal
    compliance: NutritionCompliance
  }
  workouts: {
    logs: Workout[]
    compliance: WorkoutCompliance
  }
  water: {
    logs: WaterLog[]
    compliance: WaterCompliance
  }
  reading: {
    logs: ReadingLog[]
    totalPages: number
    isCompliant: boolean
  }
  photo?: ProgressPhoto
  diary?: DiaryEntry
  weight?: WeightLog
  overallCompliance: boolean
}

// ==================== FORMS ====================
export interface CreateChallengeForm {
  startDate: Date
  dietConfig: DietConfig
}

export interface NutritionLogForm {
  mealName?: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface WorkoutForm {
  type: WorkoutType
  customType?: string
  duration: number
  intensity: WorkoutIntensity
  outdoor: boolean
  notes?: string
  startTime?: Date
}

export interface WeightLogForm {
  weight: number
  date: string
}

export interface WaterLogForm {
  amount: number
}

export interface ReadingLogForm {
  bookTitle: string
  pages: number
  totalPages?: number
}

export interface DiaryEntryForm {
  text: string
  mood?: Mood
}

// ==================== CONTEXT ====================
export interface AuthContextType {
  user: AppUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signOut: () => Promise<void>
}

export interface ChallengeContextType {
  activeChallenge: Challenge | null
  challenges: Challenge[]
  loading: boolean
  createChallenge: (data: CreateChallengeForm) => Promise<Challenge>
  failChallenge: (reason: string) => Promise<void>
  completeChallenge: () => Promise<void>
  refreshChallenge: () => Promise<void>
}

export interface SyncContextType {
  isOnline: boolean
  isSyncing: boolean
  pendingItems: number
  lastSyncTime?: Date
  sync: () => Promise<void>
}

// ==================== UTILITIES ====================
export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface ComplianceCheck {
  field: string
  required: boolean | number
  actual: boolean | number
  passed: boolean
  message: string
}
