'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as FirebaseUser } from 'firebase/auth'
import { signUp, signIn, signOut, onAuthChange, getCurrentUserData } from '@/lib/firebase/auth'
import { AppUser } from '@/lib/types'

interface AuthContextType {
  user: AppUser | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  signUp: (email: string, password: string, displayName: string) => Promise<AppUser>
  signIn: (email: string, password: string) => Promise<AppUser>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthChange(async (fbUser) => {
      setFirebaseUser(fbUser ? fbUser as any as FirebaseUser : null)
      
      if (fbUser) {
        try {
          const userData = await getCurrentUserData()
          setUser(userData)
        } catch (error) {
          console.error('Error fetching user data:', error)
          setUser(null)
        }
      } else {
        setUser(null)
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleSignUp = async (email: string, password: string, displayName: string): Promise<AppUser> => {
    try {
      const newUser = await signUp(email, password, displayName)
      setUser(newUser)
      return newUser
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }

  const handleSignIn = async (email: string, password: string): Promise<AppUser> => {
    try {
      const userData = await signIn(email, password)
      setUser(userData)
      return userData
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut()
      setUser(null)
      setFirebaseUser(null)
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  const refreshUser = async (): Promise<void> => {
    if (firebaseUser) {
      try {
        const userData = await getCurrentUserData()
        setUser(userData)
      } catch (error) {
        console.error('Error refreshing user:', error)
      }
    }
  }

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
