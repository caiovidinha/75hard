import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'
import { COLLECTIONS } from '@/lib/constants'
import type { AppUser } from '@/lib/types'

/**
 * Sign up a new user with email and password
 */
export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<AppUser> {
  try {
    // Garante persistência LOCAL antes do registro
    await setPersistence(auth, browserLocalPersistence)
    
    // Create auth user
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    )

    // Update profile with display name
    await updateProfile(userCredential.user, { displayName })

    // Create user document in Firestore
    const userDoc = {
      email,
      displayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    await setDoc(doc(db, COLLECTIONS.USERS, userCredential.user.uid), userDoc)

    console.log('✅ Usuário criado com persistência LOCAL')

    return {
      id: userCredential.user.uid,
      email,
      displayName,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  } catch (error: any) {
    console.error('Error signing up:', error)
    throw new Error(getAuthErrorMessage(error.code))
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<AppUser> {
  try {
    // Garante persistência LOCAL antes do login
    await setPersistence(auth, browserLocalPersistence)
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    
    console.log('✅ Login realizado com persistência LOCAL')
    
    // Fetch user data from Firestore
    const userDocRef = doc(db, COLLECTIONS.USERS, userCredential.user.uid)
    const userDocSnap = await getDoc(userDocRef)

    if (!userDocSnap.exists()) {
      throw new Error('Dados do usuário não encontrados')
    }

    const userData = userDocSnap.data()

    return {
      id: userCredential.user.uid,
      email: userData.email,
      displayName: userData.displayName,
      createdAt: userData.createdAt?.toDate() || new Date(),
      updatedAt: userData.updatedAt?.toDate() || new Date(),
    }
  } catch (error: any) {
    console.error('Error signing in:', error)
    throw new Error(getAuthErrorMessage(error.code))
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth)
  } catch (error: any) {
    console.error('Error signing out:', error)
    throw new Error('Erro ao fazer logout')
  }
}

/**
 * Get current Firebase user
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser
}

/**
 * Get current app user data from Firestore
 */
export async function getCurrentUserData(): Promise<AppUser | null> {
  const firebaseUser = auth.currentUser
  
  if (!firebaseUser) {
    return null
  }

  try {
    const userDocRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid)
    const userDocSnap = await getDoc(userDocRef)

    if (!userDocSnap.exists()) {
      return null
    }

    const userData = userDocSnap.data()
    
    return {
      id: firebaseUser.uid,
      email: userData.email,
      displayName: userData.displayName,
      createdAt: userData.createdAt?.toDate() || new Date(),
      updatedAt: userData.updatedAt?.toDate() || new Date(),
    }
  } catch (error) {
    console.error('Error fetching user data:', error)
    return null
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback: (user: AppUser | null) => void) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const userDocRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid)
        const userDocSnap = await getDoc(userDocRef)

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data()
          callback({
            id: firebaseUser.uid,
            email: userData.email,
            displayName: userData.displayName,
            createdAt: userData.createdAt?.toDate() || new Date(),
            updatedAt: userData.updatedAt?.toDate() || new Date(),
          })
        } else {
          callback(null)
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        callback(null)
      }
    } else {
      callback(null)
    }
  })
}

/**
 * Get user-friendly error messages
 */
function getAuthErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    'auth/email-already-in-use': 'Este email já está em uso',
    'auth/invalid-email': 'Email inválido',
    'auth/operation-not-allowed': 'Operação não permitida',
    'auth/weak-password': 'Senha muito fraca. Use pelo menos 6 caracteres',
    'auth/user-disabled': 'Usuário desabilitado',
    'auth/user-not-found': 'Usuário não encontrado',
    'auth/wrong-password': 'Email ou senha incorretos',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
    'auth/network-request-failed': 'Erro de rede. Verifique sua conexão',
    'auth/invalid-credential': 'Credenciais inválidas',
  }

  return errorMessages[errorCode] || 'Erro ao autenticar. Tente novamente'
}
