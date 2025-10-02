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

const COLLECTION = 'productTypes'

export type ProductType = {
  id: string
  nombre: string
  nombreLower: string
  descripcion?: string
  activo: boolean
  isDeleted: boolean
  createdAt?: unknown
  updatedAt?: unknown
}

type ListParams = {
  search?: string
  limit?: number
  cursor?: QueryDocumentSnapshot<DocumentData> | null
  includeInactive?: boolean
}

const normalize = (value: string) => value.trim().toLowerCase()

export async function listProductTypes({
  search = '',
  limit: limitValue = 20,
  cursor = null,
  includeInactive = true,
}: ListParams = {}) {
  const filters = [where('isDeleted', '==', false)]
  if (!includeInactive) {
    filters.push(where('activo', '==', true))
  }
  return listDocuments<ProductType>(COLLECTION, {
    search,
    searchField: 'nombreLower',
    limit: limitValue,
    startAfter: cursor,
    filters,
  })
}

export async function listProductTypesPublic() {
  return listProductTypes({ includeInactive: false })
}

export async function getProductTypeById(id: string) {
  return getDocumentById<ProductType>(COLLECTION, id)
}

export async function createProductType(data: {
  nombre: string
  descripcion?: string
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
      activo: data.activo,
      isDeleted: false,
    },
    withUserMeta: false,
  })
  return id
}

export async function updateProductType(
  id: string,
  data: Partial<{
    nombre: string
    descripcion?: string
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
  if (data.activo !== undefined) {
    payload.activo = data.activo
  }
  await updateDocument({ collectionPath: COLLECTION, id, data: payload, withUserMeta: false })
}

export async function toggleProductTypeActive(id: string, active: boolean) {
  await toggleBooleanField(COLLECTION, id, 'activo', active)
}

export async function softDeleteProductType(id: string) {
  await softDeleteDocument(COLLECTION, id, { withUserMeta: false })
}
