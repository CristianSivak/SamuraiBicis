import { useEffect, useState } from 'react'
import { listProductTypesPublic, type ProductType } from '../../admin/product-types/services/productTypes.api'

type State = {
  items: ProductType[]
  loading: boolean
  error: string | null
}

const initialState: State = {
  items: [],
  loading: true,
  error: null,
}

export function useProductTypesPublic() {
  const [state, setState] = useState<State>(initialState)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        if (active) {
          setState((prev) => ({ ...prev, loading: true, error: null }))
        }
        const { items } = await listProductTypesPublic()
        const sorted = [...items].sort((a, b) => a.nombre.localeCompare(b.nombre))
        if (active) {
          setState({ items: sorted, loading: false, error: null })
        }
      } catch (error) {
        console.error('Error fetching product types', error)
        if (active) {
          setState({ items: [], loading: false, error: (error as Error).message })
        }
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  return state
}
