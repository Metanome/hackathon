import { useState, useEffect, useCallback } from 'react'
import { getInventory, updateStock, createProduct, uploadCSV } from '../api/inventory'

export function useInventory() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setProducts(await getInventory())
    } catch (e) {
      setError(e.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const patch = useCallback(async (id, data) => {
    const updated = await updateStock(id, data)
    setProducts(prev => prev.map(p => p.id === id ? updated : p))
    return updated
  }, [])

  const create = useCallback(async (data) => {
    const newProd = await createProduct(data)
    setProducts(prev => [...prev, newProd].sort((a, b) => a.name.localeCompare(b.name)))
    return newProd
  }, [])

  const upload = useCallback(async (file) => {
    const res = await uploadCSV(file)
    await refresh()
    return res
  }, [refresh])

  return { products, loading, error, refresh, patch, create, upload }
}
