import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  WhereFilterOp,
  DocumentData,
} from 'firebase/firestore'
import { db } from './config'

/**
 * Generic Firestore operations
 */

export interface QueryConstraint {
  field: string
  operator: WhereFilterOp
  value: any
}

export interface OrderByConstraint {
  field: string
  direction?: 'asc' | 'desc'
}

/**
 * Clean data recursively: remove undefined values and internal fields
 */
function cleanDataForFirebase(obj: any): any {
  if (obj === null || obj === undefined) {
    return null
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanDataForFirebase(item))
  }
  
  if (obj instanceof Date) {
    return obj
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {}
    for (const [key, value] of Object.entries(obj)) {
      // Skip internal fields
      if (key === 'synced' || key === 'lastSyncedAt') {
        continue
      }
      // Recursively clean nested objects
      cleaned[key] = cleanDataForFirebase(value)
    }
    return cleaned
  }
  
  return obj
}

/**
 * Create a new document
 */
export async function createDocument<T extends DocumentData>(
  collectionName: string,
  documentId: string,
  data: T
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, documentId)
    const cleanData = cleanDataForFirebase(data)
    
    await setDoc(docRef, {
      ...cleanData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error)
    throw error
  }
}

/**
 * Get a document by ID
 */
export async function getDocument<T>(
  collectionName: string,
  documentId: string
): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, documentId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    return {
      id: docSnap.id,
      ...convertTimestamps(docSnap.data()),
    } as T
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error)
    throw error
  }
}

/**
 * Update a document
 */
export async function updateDocument<T extends Partial<DocumentData>>(
  collectionName: string,
  documentId: string,
  data: T
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, documentId)
    const cleanData = cleanDataForFirebase(data)
    
    // Use setDoc with merge instead of updateDoc to create if doesn't exist
    await setDoc(docRef, {
      ...cleanData,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error)
    throw error
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(
  collectionName: string,
  documentId: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, documentId)
    await deleteDoc(docRef)
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error)
    throw error
  }
}

/**
 * Convert Firestore Timestamps to Dates recursively
 */
function convertTimestamps(obj: any): any {
  if (!obj) return obj
  
  if (obj instanceof Timestamp) {
    return obj.toDate()
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertTimestamps(item))
  }
  
  if (typeof obj === 'object') {
    const converted: any = {}
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertTimestamps(value)
    }
    return converted
  }
  
  return obj
}

/**
 * Query documents with filters
 */
export async function queryDocuments<T>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  orderByConstraint?: OrderByConstraint,
  limitCount?: number
): Promise<T[]> {
  try {
    const collectionRef = collection(db, collectionName)
    
    let q = query(collectionRef)

    // Apply where constraints
    constraints.forEach(({ field, operator, value }) => {
      q = query(q, where(field, operator, value))
    })

    // Apply orderBy
    if (orderByConstraint) {
      q = query(q, orderBy(orderByConstraint.field, orderByConstraint.direction || 'asc'))
    }

    // Apply limit
    if (limitCount) {
      q = query(q, limit(limitCount))
    }

    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as T[]
  } catch (error) {
    console.error(`Error querying documents from ${collectionName}:`, error)
    throw error
  }
}

/**
 * Get all documents from a collection
 */
export async function getAllDocuments<T>(collectionName: string): Promise<T[]> {
  try {
    const collectionRef = collection(db, collectionName)
    const querySnapshot = await getDocs(collectionRef)
    
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate(),
      updatedAt: (doc.data().updatedAt as Timestamp)?.toDate(),
    })) as T[]
  } catch (error) {
    console.error(`Error getting all documents from ${collectionName}:`, error)
    throw error
  }
}

/**
 * Check if document exists
 */
export async function documentExists(
  collectionName: string,
  documentId: string
): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, documentId)
    const docSnap = await getDoc(docRef)
    return docSnap.exists()
  } catch (error) {
    console.error(`Error checking document existence in ${collectionName}:`, error)
    throw error
  }
}

/**
 * Batch operations helper
 */
export async function batchCreate<T extends DocumentData>(
  collectionName: string,
  documents: Array<{ id: string; data: T }>
): Promise<void> {
  try {
    const promises = documents.map(({ id, data }) =>
      createDocument(collectionName, id, data)
    )
    await Promise.all(promises)
  } catch (error) {
    console.error(`Error in batch create for ${collectionName}:`, error)
    throw error
  }
}
