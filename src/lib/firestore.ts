import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { auth, db } from '../firebase'

type ListOptions = {
  search?: string
  searchField?: string
  limit?: number
  startAfter?: QueryDocumentSnapshot<DocumentData> | null
  filters?: QueryConstraint[]
}

export async function listDocuments<T = DocumentData>(
  collectionPath: string,
  { search = '', searchField = 'nombreLower', limit: limitValue = 20, startAfter: cursor = null, filters = [] }: ListOptions = {},
): Promise<{ items: T[]; nextCursor: QueryDocumentSnapshot<DocumentData> | null }> {
  const constraints: QueryConstraint[] = [...filters]
  if (search && searchField) {
    const normalized = search.trim().toLowerCase()
    constraints.push(where(searchField, '>=', normalized))
    constraints.push(where(searchField, '<=', `${normalized}\uf8ff`))
  }
  if (limitValue) {
    constraints.push(limit(limitValue))
  }

  const colRef = collection(db, collectionPath)
  const q = query(colRef, orderBy(searchField), ...constraints)
  const paged = cursor ? query(q, startAfter(cursor)) : q
  const snap = await getDocs(paged)
  const items = snap.docs.map((document) => ({ id: document.id, ...document.data() }) as T)
  const nextCursor = snap.docs.length ? snap.docs[snap.docs.length - 1] : null
  return { items, nextCursor }
}

export async function getDocumentById<T = DocumentData>(collectionPath: string, id: string): Promise<T | null> {
  const ref = doc(db, collectionPath, id)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    return null
  }
  return { id: snap.id, ...snap.data() } as T
}

type CreateOptions<T> = {
  collectionPath: string
  data: T
  withUserMeta?: boolean
}

export async function createDocument<T extends Record<string, unknown>>({
  collectionPath,
  data,
  withUserMeta = true,
}: CreateOptions<T>): Promise<string> {
  const colRef = collection(db, collectionPath)
  const now = serverTimestamp()
  const payload: Record<string, unknown> = {
    ...data,
    createdAt: now,
    updatedAt: now,
  }
  if (withUserMeta) {
    const user = auth.currentUser
    if (!user) {
      throw new Error('Debe haber un usuario autenticado para realizar esta acción')
    }
    payload.createdBy = user.uid
    payload.updatedBy = user.uid
  }
  const docRef = await addDoc(colRef, payload)
  return docRef.id
}

type UpdateOptions<T> = {
  collectionPath: string
  id: string
  data: Partial<T>
  withUserMeta?: boolean
}

export async function updateDocument<T extends Record<string, unknown>>({
  collectionPath,
  id,
  data,
  withUserMeta = true,
}: UpdateOptions<T>): Promise<void> {
  const ref = doc(db, collectionPath, id)
  const payload: Record<string, unknown> = {
    ...data,
    updatedAt: serverTimestamp(),
  }
  if (withUserMeta) {
    const user = auth.currentUser
    if (!user) {
      throw new Error('Debe haber un usuario autenticado para realizar esta acción')
    }
    payload.updatedBy = user.uid
  }
  await updateDoc(ref, payload)
}

export async function softDeleteDocument(collectionPath: string, id: string, { withUserMeta = true } = {}): Promise<void> {
  const ref = doc(db, collectionPath, id)
  const payload: Record<string, unknown> = {
    isDeleted: true,
    updatedAt: serverTimestamp(),
  }
  if (withUserMeta) {
    const user = auth.currentUser
    if (!user) {
      throw new Error('Debe haber un usuario autenticado para realizar esta acción')
    }
    payload.updatedBy = user.uid
  }
  await updateDoc(ref, payload)
}

export async function toggleBooleanField(collectionPath: string, id: string, field: string, value: boolean): Promise<void> {
  const ref = doc(db, collectionPath, id)
  const payload: Record<string, unknown> = {
    [field]: value,
    updatedAt: serverTimestamp(),
  }
  const user = auth.currentUser
  if (user) {
    payload.updatedBy = user.uid
  }
  await updateDoc(ref, payload)
}

export async function assertUniqueByField(
  collectionPath: string,
  field: string,
  value: string,
  { excludeId, caseInsensitive = true }: { excludeId?: string; caseInsensitive?: boolean } = {},
): Promise<void> {
  const normalized = caseInsensitive ? value.trim().toLowerCase() : value
  const filters: QueryConstraint[] = [where(field, '==', normalized), where('isDeleted', '==', false)]
  const colRef = collection(db, collectionPath)
  const q = query(colRef, ...filters)
  const snap = await getDocs(q)
  const exists = snap.docs.some((docSnap) => docSnap.id !== excludeId)
  if (exists) {
    throw new Error('Ya existe un registro con ese nombre')
  }
}

export type FirestoreListResult<T> = Awaited<ReturnType<typeof listDocuments<T>>>
