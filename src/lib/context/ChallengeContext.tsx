'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { Challenge, DayLog } from '@/lib/types'
import { useAuthContext } from './AuthContext'
import { 
  getChallengesByUser, 
  createChallenge as createChallengeLocal,
  updateChallenge as updateChallengeLocal,
  getDayLogsByChallenge,
  create,
  update,
} from '@/lib/indexeddb/operations'
import { 
  queryDocuments,
  createDocument,
  updateDocument,
} from '@/lib/firebase/firestore'
import { COLLECTIONS, STORES } from '@/lib/constants'

interface ChallengeContextType {
  currentChallenge: Challenge | null
  challenges: Challenge[]
  dayLogs: DayLog[]
  loading: boolean
  createChallenge: (challenge: Omit<Challenge, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'synced'>) => Promise<Challenge>
  updateChallenge: (challengeId: string, updates: Partial<Challenge>) => Promise<void>
  setCurrentChallenge: (challenge: Challenge | null) => void
  refreshChallenges: () => Promise<void>
  refreshDayLogs: () => Promise<void>
}

const ChallengeContext = createContext<ChallengeContextType | undefined>(undefined)

export function ChallengeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext()
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [dayLogs, setDayLogs] = useState<DayLog[]>([])
  const [loading, setLoading] = useState(true)

  // Load challenges when user changes
  useEffect(() => {
    if (user) {
      loadChallenges()
    } else {
      setChallenges([])
      setCurrentChallenge(null)
      setDayLogs([])
      setLoading(false)
    }
  }, [user])

  // Load day logs when current challenge changes
  useEffect(() => {
    if (currentChallenge) {
      loadDayLogs(currentChallenge.id)
    } else {
      setDayLogs([])
    }
  }, [currentChallenge])

  const loadChallenges = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // PRIMEIRO: Buscar do Firebase (fonte da verdade)
      const firebaseChallenges = await queryDocuments<Challenge>(
        COLLECTIONS.CHALLENGES,
        [{ field: 'userId', operator: '==', value: user.id }]
      )
      
      // Salvar localmente para cache offline
      for (const challenge of firebaseChallenges) {
        await createChallengeLocal(challenge)
      }
      
      setChallenges(firebaseChallenges)

      // Set current challenge (active or most recent)
      const activeChallenge = firebaseChallenges.find(c => c.status === 'active')
      if (activeChallenge) {
        setCurrentChallenge(activeChallenge)
      } else if (firebaseChallenges.length > 0) {
        setCurrentChallenge(firebaseChallenges[0])
      }
    } catch (error) {
      console.error('Error loading challenges from Firebase:', error)
      // Fallback para local se offline
      const localChallenges = await getChallengesByUser(user.id)
      setChallenges(localChallenges as Challenge[])
      if (localChallenges.length > 0) {
        setCurrentChallenge(localChallenges[0] as Challenge)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadDayLogs = async (challengeId: string) => {
    try {
      // Load from Firebase first for fresh data
      const firebaseLogs = await queryDocuments(COLLECTIONS.DAY_LOGS, [
        { field: 'challengeId', operator: '==', value: challengeId }
      ])
      
      // Cache in IndexedDB and update state
      if (firebaseLogs.length > 0) {
        for (const log of firebaseLogs) {
          await update<DayLog>(STORES.DAY_LOGS, log as DayLog)
        }
        setDayLogs(firebaseLogs as DayLog[])
      } else {
        // Fallback to local if Firebase is empty
        const logs = await getDayLogsByChallenge(challengeId)
        setDayLogs(logs as DayLog[])
      }
    } catch (error) {
      console.error('Error loading day logs from Firebase, using local:', error)
      // Fallback to local on error
      try {
        const logs = await getDayLogsByChallenge(challengeId)
        setDayLogs(logs as DayLog[])
      } catch (localError) {
        console.error('Error loading day logs from local:', localError)
      }
    }
  }

  const createChallenge = async (
    challengeData: Omit<Challenge, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'synced'>
  ): Promise<Challenge> => {
    if (!user) throw new Error('User not authenticated')

    try {
      // Criar ID único
      const id = `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date()
      
      const newChallenge: Challenge = {
        ...challengeData,
        id,
        userId: user.id,
        createdAt: now,
        updatedAt: now,
      }
      
      // PRIMEIRO: Salvar no Firebase (fonte da verdade)
      await createDocument(COLLECTIONS.CHALLENGES, id, newChallenge)
      
      // DEPOIS: Salvar localmente para cache
      await createChallengeLocal(newChallenge)
      
      await loadChallenges()
      return newChallenge
    } catch (error) {
      console.error('Error creating challenge:', error)
      throw error
    }
  }

  const updateChallenge = async (challengeId: string, updates: Partial<Challenge>): Promise<void> => {
    try {
      // Atualizar no Firebase primeiro
      await updateDocument(COLLECTIONS.CHALLENGES, challengeId, updates)
      
      // Atualizar localmente
      await updateChallengeLocal(challengeId, updates)
      
      await loadChallenges()
      
      if (currentChallenge?.id === challengeId) {
        setCurrentChallenge({ ...currentChallenge, ...updates })
      }
    } catch (error) {
      console.error('Error updating challenge:', error)
      throw error
    }
  }

  const refreshChallenges = async () => {
    await loadChallenges()
  }

  const refreshDayLogs = async () => {
    if (currentChallenge) {
      await loadDayLogs(currentChallenge.id)
    }
  }

  const value: ChallengeContextType = {
    currentChallenge,
    challenges,
    dayLogs,
    loading,
    createChallenge,
    updateChallenge,
    setCurrentChallenge,
    refreshChallenges,
    refreshDayLogs,
  }

  return <ChallengeContext.Provider value={value}>{children}</ChallengeContext.Provider>
}

export function useChallengeContext() {
  const context = useContext(ChallengeContext)
  if (context === undefined) {
    throw new Error('useChallengeContext must be used within a ChallengeProvider')
  }
  return context
}
