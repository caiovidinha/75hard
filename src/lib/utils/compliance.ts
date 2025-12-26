import type { DietConfig, NutritionLog, Workout } from '@/lib/types'
import { 
  WORKOUT_MIN_DURATION, 
  WORKOUTS_DAILY_TARGET, 
  OUTDOOR_WORKOUTS_TARGET,
  WATER_DAILY_TARGET,
  READING_DAILY_TARGET
} from '@/lib/constants'

/**
 * Calcula se a dieta está em compliance
 */
export function calculateDietCompliance(
  nutritionLogs: NutritionLog[],
  dietConfig: DietConfig
): {
  isCompliant: boolean
  totals: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  limits: {
    caloriesMin: number
    caloriesMax: number
    proteinMax: number
    carbsMax: number
    fatMax: number
  }
  violations: string[]
} {
  // Calcular totais
  const totals = nutritionLogs.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      protein: acc.protein + log.protein,
      carbs: acc.carbs + log.carbs,
      fat: acc.fat + log.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  // Calcular limites com tolerância
  const targetCalories = (dietConfig.protein * 4) + (dietConfig.carbs * 4) + (dietConfig.fat * 9)
  const toleranceMultiplier = dietConfig.tolerance / 100

  const limits = {
    caloriesMin: Math.round(targetCalories * (1 - toleranceMultiplier)),
    caloriesMax: Math.round(targetCalories * (1 + toleranceMultiplier)),
    proteinMax: Math.round(dietConfig.protein * (1 + toleranceMultiplier)),
    carbsMax: Math.round(dietConfig.carbs * (1 + toleranceMultiplier)),
    fatMax: Math.round(dietConfig.fat * (1 + toleranceMultiplier)),
  }

  // Verificar violações
  const violations: string[] = []
  
  if (totals.calories < limits.caloriesMin) {
    violations.push(`Calorias abaixo do mínimo (${totals.calories} < ${limits.caloriesMin})`)
  }
  if (totals.calories > limits.caloriesMax) {
    violations.push(`Calorias acima do máximo (${totals.calories} > ${limits.caloriesMax})`)
  }
  if (totals.protein > limits.proteinMax) {
    violations.push(`Proteína acima do máximo (${totals.protein}g > ${limits.proteinMax}g)`)
  }
  if (totals.carbs > limits.carbsMax) {
    violations.push(`Carboidratos acima do máximo (${totals.carbs}g > ${limits.carbsMax}g)`)
  }
  if (totals.fat > limits.fatMax) {
    violations.push(`Gordura acima do máximo (${totals.fat}g > ${limits.fatMax}g)`)
  }

  return {
    isCompliant: violations.length === 0 && nutritionLogs.length > 0,
    totals,
    limits,
    violations,
  }
}

/**
 * Calcula se os treinos estão em compliance
 */
export function calculateWorkoutsCompliance(workouts: Workout[]): {
  isCompliant: boolean
  totalWorkouts: number
  validWorkouts: number
  outdoorWorkouts: number
  totalDuration: number
  violations: string[]
} {
  const totalWorkouts = workouts.length
  const validWorkouts = workouts.filter(w => w.duration >= WORKOUT_MIN_DURATION).length
  const outdoorWorkouts = workouts.filter(w => w.outdoor).length
  const totalDuration = workouts.reduce((acc, w) => acc + w.duration, 0)

  const violations: string[] = []

  if (totalWorkouts < WORKOUTS_DAILY_TARGET) {
    violations.push(`Treinos insuficientes (${totalWorkouts}/${WORKOUTS_DAILY_TARGET})`)
  }
  if (validWorkouts < WORKOUTS_DAILY_TARGET) {
    violations.push(`Treinos com 45+ min insuficientes (${validWorkouts}/${WORKOUTS_DAILY_TARGET})`)
  }
  if (outdoorWorkouts < OUTDOOR_WORKOUTS_TARGET) {
    violations.push(`Treino outdoor não realizado (${outdoorWorkouts}/${OUTDOOR_WORKOUTS_TARGET})`)
  }

  return {
    isCompliant: violations.length === 0,
    totalWorkouts,
    validWorkouts,
    outdoorWorkouts,
    totalDuration,
    violations,
  }
}

/**
 * Calcula se a água está em compliance
 */
export function calculateWaterCompliance(waterAmount: number): {
  isCompliant: boolean
  amount: number
  target: number
  percentage: number
} {
  return {
    isCompliant: waterAmount >= WATER_DAILY_TARGET,
    amount: waterAmount,
    target: WATER_DAILY_TARGET,
    percentage: Math.round((waterAmount / WATER_DAILY_TARGET) * 100),
  }
}

/**
 * Calcula se a leitura está em compliance
 */
export function calculateReadingCompliance(pagesRead: number): {
  isCompliant: boolean
  pages: number
  target: number
} {
  return {
    isCompliant: pagesRead >= READING_DAILY_TARGET,
    pages: pagesRead,
    target: READING_DAILY_TARGET,
  }
}

/**
 * Calcula compliance geral do dia
 */
export function calculateDayCompliance(params: {
  nutritionLogs: NutritionLog[]
  workouts: Workout[]
  waterAmount: number
  pagesRead: number
  hasPhoto: boolean
  hasAlcohol: boolean
  dietConfig: DietConfig
}): {
  isCompliant: boolean
  validations: {
    diet: boolean
    workouts: boolean
    water: boolean
    reading: boolean
    photo: boolean
    noAlcohol: boolean
  }
  details: {
    diet: ReturnType<typeof calculateDietCompliance>
    workouts: ReturnType<typeof calculateWorkoutsCompliance>
    water: ReturnType<typeof calculateWaterCompliance>
    reading: ReturnType<typeof calculateReadingCompliance>
  }
} {
  const diet = calculateDietCompliance(params.nutritionLogs, params.dietConfig)
  const workouts = calculateWorkoutsCompliance(params.workouts)
  const water = calculateWaterCompliance(params.waterAmount)
  const reading = calculateReadingCompliance(params.pagesRead)

  const validations = {
    diet: diet.isCompliant,
    workouts: workouts.isCompliant,
    water: water.isCompliant,
    reading: reading.isCompliant,
    photo: params.hasPhoto,
    noAlcohol: !params.hasAlcohol,
  }

  const isCompliant = Object.values(validations).every(v => v === true)

  return {
    isCompliant,
    validations,
    details: {
      diet,
      workouts,
      water,
      reading,
    },
  }
}
