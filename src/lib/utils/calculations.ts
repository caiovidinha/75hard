import type {
  DailyNutritionTotal,
  NutritionCompliance,
  DietConfig,
  NutritionLog,
  Workout,
  WorkoutCompliance,
  WaterLog,
  WaterCompliance,
} from '@/lib/types'
import {
  WATER_DAILY_TARGET,
  READING_DAILY_TARGET,
  WORKOUTS_DAILY_TARGET,
  WORKOUT_MIN_DURATION,
  OUTDOOR_WORKOUTS_TARGET,
} from '@/lib/constants'

/**
 * Calculation utility functions for nutrition, workouts, and compliance
 */

// ==================== NUTRITION CALCULATIONS ====================

/**
 * Calculate total daily nutrition from logs
 */
export function calculateDailyNutritionTotal(logs: NutritionLog[]): DailyNutritionTotal {
  return logs.reduce(
    (total, log) => ({
      calories: total.calories + log.calories,
      protein: total.protein + log.protein,
      carbs: total.carbs + log.carbs,
      fat: total.fat + log.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

/**
 * Calculate nutrition compliance against diet config
 */
export function calculateNutritionCompliance(
  total: DailyNutritionTotal,
  config: DietConfig
): NutritionCompliance {
  const calories = {
    consumed: total.calories,
    limit: config.dailyCalories,
    remaining: Math.max(0, config.dailyCalories - total.calories),
    percentage: Math.min(100, (total.calories / config.dailyCalories) * 100),
    exceeded: total.calories > config.dailyCalories,
  }

  const protein = {
    consumed: total.protein,
    limit: config.protein,
    remaining: Math.max(0, config.protein - total.protein),
    percentage: Math.min(100, (total.protein / config.protein) * 100),
    exceeded: total.protein > config.protein,
  }

  const carbs = {
    consumed: total.carbs,
    limit: config.carbs,
    remaining: Math.max(0, config.carbs - total.carbs),
    percentage: Math.min(100, (total.carbs / config.carbs) * 100),
    exceeded: total.carbs > config.carbs,
  }

  const fat = {
    consumed: total.fat,
    limit: config.fat,
    remaining: Math.max(0, config.fat - total.fat),
    percentage: Math.min(100, (total.fat / config.fat) * 100),
    exceeded: total.fat > config.fat,
  }

  const isCompliant =
    !calories.exceeded && !protein.exceeded && !carbs.exceeded && !fat.exceeded

  return {
    isCompliant,
    calories,
    protein,
    carbs,
    fat,
  }
}

// ==================== WORKOUT CALCULATIONS ====================

/**
 * Calculate workout compliance
 */
export function calculateWorkoutCompliance(workouts: Workout[]): WorkoutCompliance {
  const totalWorkouts = workouts.length
  const validWorkouts = workouts.filter((w) => w.duration >= WORKOUT_MIN_DURATION)
  const outdoorWorkouts = workouts.filter((w) => w.outdoor)
  const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0)

  const hasEnoughWorkouts = totalWorkouts >= WORKOUTS_DAILY_TARGET
  const hasValidDurations = validWorkouts.length >= WORKOUTS_DAILY_TARGET
  const hasOutdoorWorkout = outdoorWorkouts.length >= OUTDOOR_WORKOUTS_TARGET

  const isCompliant = hasEnoughWorkouts && hasValidDurations && hasOutdoorWorkout

  return {
    isCompliant,
    totalWorkouts,
    validWorkouts: validWorkouts.length,
    outdoorWorkouts: outdoorWorkouts.length,
    totalDuration,
    requirements: {
      minWorkouts: WORKOUTS_DAILY_TARGET,
      minDuration: WORKOUT_MIN_DURATION,
      minOutdoor: OUTDOOR_WORKOUTS_TARGET,
    },
    validation: {
      hasEnoughWorkouts,
      hasValidDurations,
      hasOutdoorWorkout,
    },
  }
}

// ==================== WATER CALCULATIONS ====================

/**
 * Calculate water consumption compliance
 */
export function calculateWaterCompliance(waterLogs: WaterLog[]): WaterCompliance {
  const consumed = waterLogs.reduce((sum, log) => sum + log.amount, 0)
  const target = WATER_DAILY_TARGET
  const remaining = Math.max(0, target - consumed)
  const percentage = Math.min(100, (consumed / target) * 100)
  const isCompliant = consumed >= target

  return {
    isCompliant,
    consumed,
    target,
    remaining,
    percentage,
  }
}

// ==================== READING CALCULATIONS ====================

/**
 * Calculate total pages read
 */
export function calculateTotalPages(readingLogs: { pages: number }[]): number {
  return readingLogs.reduce((sum, log) => sum + log.pages, 0)
}

/**
 * Check reading compliance
 */
export function isReadingCompliant(totalPages: number): boolean {
  return totalPages >= READING_DAILY_TARGET
}

// ==================== WEIGHT CALCULATIONS ====================

/**
 * Calculate weight change
 */
export function calculateWeightChange(initial: number, current: number) {
  const difference = current - initial
  const percentageChange = ((difference / initial) * 100).toFixed(1)

  return {
    difference: Number(difference.toFixed(1)),
    percentageChange: Number(percentageChange),
    direction: difference > 0 ? 'gain' : difference < 0 ? 'loss' : 'stable',
  }
}

/**
 * Calculate moving average for weight
 */
export function calculateMovingAverage(weights: number[], period: number = 7): number {
  if (weights.length === 0) return 0
  
  const relevantWeights = weights.slice(-period)
  const sum = relevantWeights.reduce((acc, weight) => acc + weight, 0)
  
  return Number((sum / relevantWeights.length).toFixed(1))
}

// ==================== PERCENTAGE HELPERS ====================

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.min(100, Math.round((value / total) * 100))
}

/**
 * Get percentage color class
 */
export function getPercentageColorClass(percentage: number): string {
  if (percentage >= 100) return 'text-destructive'
  if (percentage >= 90) return 'text-warning'
  if (percentage >= 70) return 'text-yellow-600'
  return 'text-success'
}

/**
 * Get compliance status text
 */
export function getComplianceStatusText(isCompliant: boolean): string {
  return isCompliant ? 'Em compliance' : 'Fora do limite'
}

/**
 * Get compliance status color
 */
export function getComplianceStatusColor(isCompliant: boolean): string {
  return isCompliant ? 'text-success' : 'text-destructive'
}
