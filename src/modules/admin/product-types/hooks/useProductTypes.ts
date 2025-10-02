import { useCallback, useEffect, useReducer } from 'react'
import type { ProductType } from '../services/productTypes.api'
import {
  createProductType,
  listProductTypes,
  softDeleteProductType,
  toggleProductTypeActive,
  updateProductType,
} from '../services/productTypes.api'
import type { ProductTypeFormValues } from '../schema/productType.schema'

type State = {
  items: ProductType[]
  loading: boolean
  error: string | null
}

type Action =
  | { type: 'loading' }
  | { type: 'success'; payload: ProductType[] }
  | { type: 'error'; payload: string }

const initialState: State = {
  items: [],
  loading: true,
  error: null,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'loading':
      return { ...state, loading: true, error: null }
    case 'success':
      return { items: action.payload, loading: false, error: null }
    case 'error':
      return { ...state, loading: false, error: action.payload }
    default:
      return state
  }
}

export function useProductTypes(search: string) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const fetchItems = useCallback(async () => {
    dispatch({ type: 'loading' })
    try {
      const { items } = await listProductTypes({ search })
      dispatch({ type: 'success', payload: items })
    } catch (error) {
      console.error('Error fetching product types', error)
      dispatch({ type: 'error', payload: (error as Error).message })
    }
  }, [search])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleCreate = useCallback(
    async (values: ProductTypeFormValues) => {
      await createProductType(values)
      await fetchItems()
    },
    [fetchItems],
  )

  const handleUpdate = useCallback(
    async (id: string, values: Partial<ProductTypeFormValues>) => {
      await updateProductType(id, values)
      await fetchItems()
    },
    [fetchItems],
  )

  const handleToggle = useCallback(
    async (id: string, active: boolean) => {
      await toggleProductTypeActive(id, active)
      await fetchItems()
    },
    [fetchItems],
  )

  const handleDelete = useCallback(
    async (id: string) => {
      await softDeleteProductType(id)
      await fetchItems()
    },
    [fetchItems],
  )

  return {
    ...state,
    refetch: fetchItems,
    create: handleCreate,
    update: handleUpdate,
    toggle: handleToggle,
    remove: handleDelete,
  }
}
