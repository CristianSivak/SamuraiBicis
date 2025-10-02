import { useCallback, useEffect, useReducer } from 'react'
import type { CustomerType } from '../services/customerTypes.api'
import {
  createCustomerType,
  listCustomerTypes,
  softDeleteCustomerType,
  toggleCustomerTypeActive,
  updateCustomerType,
} from '../services/customerTypes.api'
import type { CustomerTypeFormValues } from '../schema/customerType.schema'

type State = {
  items: CustomerType[]
  loading: boolean
  error: string | null
}

type Action =
  | { type: 'loading' }
  | { type: 'success'; payload: CustomerType[] }
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

export function useCustomerTypes(search: string) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const fetchItems = useCallback(async () => {
    dispatch({ type: 'loading' })
    try {
      const { items } = await listCustomerTypes({ search })
      dispatch({ type: 'success', payload: items })
    } catch (error) {
      console.error('Error fetching customer types', error)
      dispatch({ type: 'error', payload: (error as Error).message })
    }
  }, [search])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleCreate = useCallback(
    async (values: CustomerTypeFormValues) => {
      await createCustomerType(values)
      await fetchItems()
    },
    [fetchItems],
  )

  const handleUpdate = useCallback(
    async (id: string, values: Partial<CustomerTypeFormValues>) => {
      await updateCustomerType(id, values)
      await fetchItems()
    },
    [fetchItems],
  )

  const handleToggle = useCallback(
    async (id: string, active: boolean) => {
      await toggleCustomerTypeActive(id, active)
      await fetchItems()
    },
    [fetchItems],
  )

  const handleDelete = useCallback(
    async (id: string) => {
      await softDeleteCustomerType(id)
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
