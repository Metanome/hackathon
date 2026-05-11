import { useState, useEffect } from 'react'
import { getOrders, updateOrderStatus } from '../api/orders'
import { SOURCE_LABELS, STATUS_LABELS } from '../constants'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(null)

  const fetchOrders = () => {
    setLoading(true)
    getOrders()
      .then(setOrders)
      .catch(e => setError(e.response?.data?.detail || e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateOrderStatus(id, status)
      setOrders(orders.map(o => o.id === id ? { ...o, status } : o))
    } catch (e) {
      alert(`Error updating order: ${e.response?.data?.detail || e.message}`)
    }
  }

  if (loading) return <div className="text-slate-500 text-sm">Loading orders...</div>
  if (error) return <div className="text-red-400 text-sm">Error: {error}</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Orders</h1>
        <p className="text-slate-500 text-sm mt-1">{orders.length} total orders</p>
      </div>

      <div className="space-y-2">
        {orders.map(order => (
          <div key={order.id} className="card">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpanded(expanded === order.id ? null : order.id)}
            >
              <div className="flex items-center gap-3">
                <span className="text-slate-500 font-mono text-xs">#{order.id}</span>
                <span className="text-slate-200 font-medium">{order.customer_name}</span>
                <span className="badge badge-source">
                  {SOURCE_LABELS[order.source] ?? order.source}
                </span>
                <span className={`badge ${
                  order.status === 'fulfilled' ? 'badge-ok' :
                  order.status === 'cancelled' ? 'badge-critical' : 'badge-low'
                }`}>
                  {STATUS_LABELS[order.status]}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">
                  {new Date(order.created_at).toLocaleDateString()}
                </span>
                <span className="text-slate-600">{expanded === order.id ? '▲' : '▼'}</span>
              </div>
            </div>

            {expanded === order.id && order.items.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500">
                      <th className="text-left py-1">Product</th>
                      <th className="text-right py-1">Qty</th>
                      <th className="text-right py-1">Unit Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map(item => (
                      <tr key={item.id} className="text-slate-300">
                        <td className="py-1">{item.product_name}</td>
                        <td className="text-right py-1">{item.quantity}</td>
                        <td className="text-right py-1">{import.meta.env.VITE_CURRENCY_SYMBOL || '$'}{item.unit_price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
                {order.status === 'pending' && (
                  <div className="mt-4 flex gap-2 justify-end">
                    <button 
                      onClick={() => handleUpdateStatus(order.id, 'cancelled')} 
                      className="btn-ghost py-1 text-xs text-red-400 hover:text-red-300"
                    >
                      Cancel Order
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(order.id, 'fulfilled')} 
                      className="btn-primary py-1 px-4 text-xs"
                    >
                      Fulfill Order
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
