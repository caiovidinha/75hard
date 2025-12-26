// ==================== 75 HARD CONSTANTS ====================

export const CHALLENGE_NAME = '75 Hard'

// ==================== MOOD OPTIONS ====================

export const MOOD_OPTIONS = [
  { value: 'terrible', label: 'Péssimo', emoji: '😢' },
  { value: 'bad', label: 'Ruim', emoji: '😞' },
  { value: 'neutral', label: 'Neutro', emoji: '😐' },
  { value: 'good', label: 'Bom', emoji: '🙂' },
  { value: 'great', label: 'Ótimo', emoji: '😄' },
] as const
export const CHALLENGE_DURATION = 75 // days

// ==================== COMPLIANCE REQUIREMENTS ====================

export const WATER_DAILY_TARGET = 3780 // ml (1 gallon)
export const READING_DAILY_TARGET = 10 // pages
export const WORKOUTS_DAILY_TARGET = 2 // workouts
export const WORKOUT_MIN_DURATION = 45 // minutes
export const OUTDOOR_WORKOUTS_TARGET = 1 // workout

// ==================== VALIDATION MESSAGES ====================

export const VALIDATION_MESSAGES = {
  DIET: {
    EXCEEDED_CALORIES: 'Calorias excederam o limite diário',
    EXCEEDED_PROTEIN: 'Proteína excedeu o limite diário',
    EXCEEDED_CARBS: 'Carboidratos excederam o limite diário',
    EXCEEDED_FAT: 'Gordura excedeu o limite diário',
    COMPLIANT: 'Dieta em compliance',
  },
  WORKOUTS: {
    NOT_ENOUGH: 'Mínimo de 2 treinos não atingido',
    DURATION_TOO_SHORT: 'Treino(s) com menos de 45 minutos',
    NO_OUTDOOR: 'Nenhum treino outdoor realizado',
    COMPLIANT: 'Treinos em compliance',
  },
  WATER: {
    NOT_ENOUGH: 'Meta de água não atingida',
    COMPLIANT: 'Meta de água atingida',
  },
  READING: {
    NOT_ENOUGH: 'Mínimo de 10 páginas não atingido',
    COMPLIANT: 'Meta de leitura atingida',
  },
  PHOTO: {
    MISSING: 'Foto de progresso não enviada',
    COMPLIANT: 'Foto de progresso enviada',
  },
  ALCOHOL: {
    CONSUMED: 'Álcool consumido - dia falhado',
    COMPLIANT: 'Zero álcool',
  },
  DAY: {
    FAILED: 'Dia falhado - um ou mais requisitos não cumpridos',
    COMPLIANT: 'Dia completo com sucesso',
  },
  CHALLENGE: {
    FAILED: 'Desafio falhado - necessário reiniciar do dia 1',
    COMPLETED: 'Parabéns! Desafio 75 Hard completo!',
  },
}

// ==================== WORKOUT TYPES ====================

export const WORKOUT_TYPES = [
  { value: 'musculacao', label: 'Musculação', emoji: '🏋️' },
  { value: 'corrida', label: 'Corrida', emoji: '🏃' },
  { value: 'caminhada', label: 'Caminhada', emoji: '🚶' },
  { value: 'ciclismo', label: 'Ciclismo', emoji: '🚴' },
  { value: 'natacao', label: 'Natação', emoji: '🏊' },
  { value: 'crossfit', label: 'CrossFit', emoji: '💪' },
  { value: 'yoga', label: 'Yoga', emoji: '🧘' },
  { value: 'pilates', label: 'Pilates', emoji: '🤸' },
  { value: 'funcional', label: 'Funcional', emoji: '⚡' },
  { value: 'boxe', label: 'Boxe/Muay Thai', emoji: '🥊' },
  { value: 'danca', label: 'Dança', emoji: '💃' },
  { value: 'escalada', label: 'Escalada', emoji: '🧗' },
  { value: 'futebol', label: 'Futebol', emoji: '⚽' },
  { value: 'basquete', label: 'Basquete', emoji: '🏀' },
  { value: 'volei', label: 'Vôlei', emoji: '🏐' },
  { value: 'tenis', label: 'Tênis', emoji: '🎾' },
  { value: 'mobilidade', label: 'Mobilidade/Alongamento', emoji: '🤸' },
  { value: 'hiit', label: 'HIIT', emoji: '🔥' },
  { value: 'spinning', label: 'Spinning', emoji: '🚴' },
  { value: 'remo', label: 'Remo', emoji: '🚣' },
  { value: 'outro', label: 'Outro', emoji: '✨' },
] as const

export const WORKOUT_INTENSITIES = [
  { value: 'leve', label: 'Leve' },
  { value: 'moderada', label: 'Moderada' },
  { value: 'alta', label: 'Alta' },
] as const

// ==================== MOOD OPTIONS ====================



// ==================== DATE FORMATS ====================

export const DATE_FORMAT = 'yyyy-MM-dd'
export const DISPLAY_DATE_FORMAT = 'dd/MM/yyyy'
export const DISPLAY_DATETIME_FORMAT = 'dd/MM/yyyy HH:mm'

// ==================== SYNC ====================

export const SYNC_INTERVAL = 30000 // 30 seconds
export const SYNC_MAX_RETRIES = 3
export const SYNC_RETRY_DELAY = 5000 // 5 seconds
export const SYNC_EXPONENTIAL_BACKOFF = 2

// ==================== STORAGE ====================

export const MAX_PHOTO_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
export const PHOTO_COMPRESSION_QUALITY = 0.8

// ==================== INDEXEDDB ====================

export const DB_NAME = '75hard-db'
export const DB_VERSION = 1

export const STORES = {
  CHALLENGES: 'challenges',
  DAY_LOGS: 'dayLogs',
  NUTRITION_LOGS: 'nutritionLogs',
  WORKOUTS: 'workouts',
  WEIGHT_LOGS: 'weightLogs',
  READING_LOGS: 'readingLogs',
  WATER_LOGS: 'waterLogs',
  DIARY_ENTRIES: 'diaryEntries',
  PROGRESS_PHOTOS: 'progressPhotos',
  SYNC_QUEUE: 'syncQueue',
} as const

// ==================== FIRESTORE COLLECTIONS ====================

export const COLLECTIONS = {
  USERS: 'users',
  CHALLENGES: 'challenges',
  DAY_LOGS: 'day_logs',
  NUTRITION_LOGS: 'nutrition_logs',
  WORKOUTS: 'workouts',
  WEIGHT_LOGS: 'weight_logs',
  READING_LOGS: 'reading_logs',
  WATER_LOGS: 'water_logs',
  DIARY_ENTRIES: 'diary_entries',
  PROGRESS_PHOTOS: 'progress_photos',
} as const

// ==================== MACRONUTRIENTS ====================

export const CALORIES_PER_GRAM = {
  PROTEIN: 4,
  CARBS: 4,
  FAT: 9,
} as const

// ==================== DEFAULT VALUES ====================

export const DEFAULT_DIET_CONFIG = {
  dailyCalories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
}

// ==================== CHART COLORS ====================

export const CHART_COLORS = {
  PROTEIN: 'hsl(142, 76%, 36%)',
  CARBS: 'hsl(38, 92%, 50%)',
  FAT: 'hsl(346, 77%, 50%)',
  CALORIES: 'hsl(221, 83%, 53%)',
  WATER: 'hsl(199, 89%, 48%)',
  WEIGHT: 'hsl(262, 83%, 58%)',
}

// ==================== NOTIFICATIONS ====================

export const NOTIFICATION_DURATION = 5000 // 5 seconds
