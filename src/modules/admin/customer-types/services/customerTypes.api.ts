import { where, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore'
import {
  assertUniqueByField,
  createDocument,
  getDocumentById,
  listDocuments,
  softDeleteDocument,
  toggleBooleanField,
  updateDocument,
} from '../../../../lib/firestore'

const COLLECTION = 'customerTypes'

export type CustomerType = {
  id: string
  nombre: string
  nombreLower: string
  descripcion?: string
  descuentoPorcentaje: number
  activo: boolean
  isDeleted: boolean
  createdAt?: unknown
  updatedAt?: unknown
  createdBy?: string
  updatedBy?: string
}

type ListParams = {
  search?: string
  limit?: number
  cursor?: QueryDocumentSnapshot<DocumentData> | null
  includeInactive?: boolean
}

const normalize = (value: string) => value.trim().toLowerCase()

export async function listCustomerTypes({
  search = '',
  limit: limitValue = 20,
  cursor = null,
  includeInactive = true,
}: ListParams = {}) {
  const filters = [where('isDeleted', '==', false)]
  if (!includeInactive) {
    filters.push(where('activo', '==', true))
  }
  return listDocuments<CustomerType>(COLLECTION, {
    search,
    searchField: 'nombreLower',
    limit: limitValue,
    startAfter: cursor,
    filters,
  })
}

export async function getCustomerTypeById(id: string) {
  return getDocumentById<CustomerType>(COLLECTION, id)
}

export async function createCustomerType(data: {
  nombre: string
  descripcion?: string
  descuentoPorcentaje: number
  activo: boolean
}) {
  const nombreLower = normalize(data.nombre)
  await assertUniqueByField(COLLECTION, 'nombreLower', nombreLower)
  const id = await createDocument({
    collectionPath: COLLECTION,
    data: {
      nombre: data.nombre,
      nombreLower,
      descripcion: data.descripcion ?? '',
      descuentoPorcentaje: data.descuentoPorcentaje,
      activo: data.activo,
      isDeleted: false,
    },
  })
  return id
}

export async function updateCustomerType(
  id: string,
  data: Partial<{
    nombre: string
    descripcion?: string
    descuentoPorcentaje: number
    activo: boolean
  }>,
) {
  const payload: Record<string, unknown> = {}
  if (data.nombre !== undefined) {
    const nombreLower = normalize(data.nombre)
    await assertUniqueByField(COLLECTION, 'nombreLower', nombreLower, { excludeId: id })
    payload.nombre = data.nombre
    payload.nombreLower = nombreLower
  }
  if (data.descripcion !== undefined) {
    payload.descripcion = data.descripcion ?? ''
  }
  if (data.descuentoPorcentaje !== undefined) {
    payload.descuentoPorcentaje = data.descuentoPorcentaje
  }
  if (data.activo !== undefined) {
    payload.activo = data.activo
  }
  await updateDocument({ collectionPath: COLLECTION, id, data: payload })
}

export async function toggleCustomerTypeActive(id: string, active: boolean) {
  await toggleBooleanField(COLLECTION, id, 'activo', active)
}

export async function softDeleteCustomerType(id: string) {
  await softDeleteDocument(COLLECTION, id)
}
