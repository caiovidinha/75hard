import type {
  DayLog,
  DayValidations,
  Challenge,
  DailySummary,
  ValidationResult,
  ComplianceCheck,
} from '@/lib/types'
import {
  calculateDailyNutritionTotal,
  calculateNutritionCompliance,
  calculateWorkoutCompliance,
  calculateWaterCompliance,
  calculateTotalPages,
  isReadingCompliant,
} from '@/lib/utils/calculations'
import { VALIDATION_MESSAGES } from '@/lib/constants'

/**
 * Validation service for 75 Hard compliance
 */

// ==================== DAILY VALIDATION ====================

/**
 * Validate complete day compliance
 */
export function validateDayCompliance(summary: DailySummary): {
  compliant: boolean
  validations: DayValidations
  checks: ComplianceCheck[]
  failedReasons: string[]
} {
  const checks: ComplianceCheck[] = []
  const failedReasons: string[] = []

  // 1. Diet compliance
  const dietCheck: ComplianceCheck = {
    field: 'diet',
    required: true,
    actual: summary.nutrition.compliance.isCompliant,
    passed: summary.nutrition.compliance.isCompliant,
    message: summary.nutrition.compliance.isCompliant
      ? VALIDATION_MESSAGES.DIET.COMPLIANT
      : getDietFailureReason(summary.nutrition.compliance),
  }
  checks.push(dietCheck)
  if (!dietCheck.passed) failedReasons.push(dietCheck.message)

  // 2. Workouts compliance
  const workoutsCheck: ComplianceCheck = {
    field: 'workouts',
    required: true,
    actual: summary.workouts.compliance.isCompliant,
    passed: summary.workouts.compliance.isCompliant,
    message: summary.workouts.compliance.isCompliant
      ? VALIDATION_MESSAGES.WORKOUTS.COMPLIANT
      : getWorkoutsFailureReason(summary.workouts.compliance),
  }
  checks.push(workoutsCheck)
  if (!workoutsCheck.passed) failedReasons.push(workoutsCheck.message)

  // 3. Water compliance
  const waterCheck: ComplianceCheck = {
    field: 'water',
    required: true,
    actual: summary.water.compliance.isCompliant,
    passed: summary.water.compliance.isCompliant,
    message: summary.water.compliance.isCompliant
      ? VALIDATION_MESSAGES.WATER.COMPLIANT
      : VALIDATION_MESSAGES.WATER.NOT_ENOUGH,
  }
  checks.push(waterCheck)
  if (!waterCheck.passed) failedReasons.push(waterCheck.message)

  // 4. Reading compliance
  const readingCheck: ComplianceCheck = {
    field: 'reading',
    required: true,
    actual: summary.reading.isCompliant,
    passed: summary.reading.isCompliant,
    message: summary.reading.isCompliant
      ? VALIDATION_MESSAGES.READING.COMPLIANT
      : VALIDATION_MESSAGES.READING.NOT_ENOUGH,
  }
  checks.push(readingCheck)
  if (!readingCheck.passed) failedReasons.push(readingCheck.message)

  // 5. Photo compliance
  const photoCheck: ComplianceCheck = {
    field: 'photo',
    required: true,
    actual: !!summary.photo,
    passed: !!summary.photo,
    message: summary.photo
      ? VALIDATION_MESSAGES.PHOTO.COMPLIANT
      : VALIDATION_MESSAGES.PHOTO.MISSING,
  }
  checks.push(photoCheck)
  if (!photoCheck.passed) failedReasons.push(photoCheck.message)

  // Note: Alcohol is handled separately at day completion

  const compliant = checks.every((check) => check.passed)

  const validations: DayValidations = {
    diet: dietCheck.passed,
    workouts: workoutsCheck.passed,
    water: waterCheck.passed,
    reading: readingCheck.passed,
    photo: photoCheck.passed,
    noAlcohol: true, // Will be set explicitly by user
  }

  return {
    compliant,
    validations,
    checks,
    failedReasons,
  }
}

/**
 * Get diet failure reason
 */
function getDietFailureReason(compliance: any): string {
  const reasons: string[] = []

  if (compliance.calories.exceeded) {
    reasons.push(VALIDATION_MESSAGES.DIET.EXCEEDED_CALORIES)
  }
  if (compliance.protein.exceeded) {
    reasons.push(VALIDATION_MESSAGES.DIET.EXCEEDED_PROTEIN)
  }
  if (compliance.carbs.exceeded) {
    reasons.push(VALIDATION_MESSAGES.DIET.EXCEEDED_CARBS)
  }
  if (compliance.fat.exceeded) {
    reasons.push(VALIDATION_MESSAGES.DIET.EXCEEDED_FAT)
  }

  return reasons.join(', ')
}

/**
 * Get workouts failure reason
 */
function getWorkoutsFailureReason(compliance: any): string {
  const reasons: string[] = []

  if (!compliance.validation.hasEnoughWorkouts) {
    reasons.push(VALIDATION_MESSAGES.WORKOUTS.NOT_ENOUGH)
  }
  if (!compliance.validation.hasValidDurations) {
    reasons.push(VALIDATION_MESSAGES.WORKOUTS.DURATION_TOO_SHORT)
  }
  if (!compliance.validation.hasOutdoorWorkout) {
    reasons.push(VALIDATION_MESSAGES.WORKOUTS.NO_OUTDOOR)
  }

  return reasons.join(', ')
}

// ==================== CHALLENGE VALIDATION ====================

/**
 * Check if challenge should fail based on day log
 */
export function shouldChallengeFailFromDay(
  dayLog: DayLog,
  alcoholConsumed: boolean
): {
  shouldFail: boolean
  reason?: string
} {
  // If alcohol was consumed, immediate failure
  if (alcoholConsumed) {
    return {
      shouldFail: true,
      reason: VALIDATION_MESSAGES.ALCOHOL.CONSUMED,
    }
  }

  // If day is not compliant, challenge fails
  if (!dayLog.compliant) {
    return {
      shouldFail: true,
      reason: dayLog.failedReason || VALIDATION_MESSAGES.DAY.FAILED,
    }
  }

  return { shouldFail: false }
}

/**
 * Check if challenge can be completed
 */
export function canCompleteChallenge(challenge: Challenge): ValidationResult {
  const errors: string[] = []

  if (challenge.status !== 'active') {
    errors.push('Desafio não está ativo')
  }

  if (challenge.currentDay < 75) {
    errors.push(`Desafio incompleto. Dia atual: ${challenge.currentDay}/75`)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// ==================== DATA VALIDATION ====================

/**
 * Validate diet config
 */
export function validateDietConfig(config: any): ValidationResult {
  const errors: string[] = []

  if (!config.dailyCalories || config.dailyCalories <= 0) {
    errors.push('Calorias diárias deve ser maior que zero')
  }

  if (!config.protein || config.protein <= 0) {
    errors.push('Proteína deve ser maior que zero')
  }

  if (!config.carbs || config.carbs <= 0) {
    errors.push('Carboidratos devem ser maiores que zero')
  }

  if (!config.fat || config.fat <= 0) {
    errors.push('Gordura deve ser maior que zero')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate nutrition log
 */
export function validateNutritionLog(log: any): ValidationResult {
  const errors: string[] = []

  if (!log.calories || log.calories < 0) {
    errors.push('Calorias inválidas')
  }

  if (log.protein < 0) {
    errors.push('Proteína não pode ser negativa')
  }

  if (log.carbs < 0) {
    errors.push('Carboidratos não podem ser negativos')
  }

  if (log.fat < 0) {
    errors.push('Gordura não pode ser negativa')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate workout
 */
export function validateWorkout(workout: any): ValidationResult {
  const errors: string[] = []

  if (!workout.type) {
    errors.push('Tipo de treino é obrigatório')
  }

  if (!workout.duration || workout.duration <= 0) {
    errors.push('Duração deve ser maior que zero')
  }

  if (!workout.intensity) {
    errors.push('Intensidade é obrigatória')
  }

  if (workout.outdoor === undefined || workout.outdoor === null) {
    errors.push('Indicação de outdoor/indoor é obrigatória')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate weight log
 */
export function validateWeightLog(weight: any): ValidationResult {
  const errors: string[] = []

  if (!weight.weight || weight.weight <= 0) {
    errors.push('Peso deve ser maior que zero')
  }

  if (weight.weight > 500) {
    errors.push('Peso inválido')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
