import { useEffect, useState } from 'react'
import type { CustomerType } from '../../admin/customer-types/services/customerTypes.api'
import { getCustomerTypeById } from '../../admin/customer-types/services/customerTypes.api'

const cache = new Map<string, CustomerType | null>()

type State = {
  customerType: CustomerType | null
  loading: boolean
  error: string | null
}

const initialState: State = {
  customerType: null,
  loading: false,
  error: null,
}

export function useCustomerTypeOfUser(customerTypeId?: string | null) {
  const [state, setState] = useState<State>(initialState)

  useEffect(() => {
    let active = true
    async function load() {
      if (!customerTypeId) {
        if (active) {
          setState(initialState)
        }
        return
      }
      if (cache.has(customerTypeId)) {
        const cached = cache.get(customerTypeId) ?? null
        if (active) {
          setState({ customerType: cached, loading: false, error: null })
        }
        return
      }
      try {
        if (active) {
          setState((prev) => ({ ...prev, loading: true, error: null }))
        }
        const data = await getCustomerTypeById(customerTypeId)
        const valid = data && !data.isDeleted && data.activo ? data : null
        cache.set(customerTypeId, valid)
        if (active) {
          setState({ customerType: valid, loading: false, error: null })
        }
      } catch (error) {
        console.error('Error fetching customer type', error)
        if (active) {
          setState({ customerType: null, loading: false, error: (error as Error).message })
        }
      }
    }
    load()
    return () => {
      active = false
    }
  }, [customerTypeId])

  return state
}
