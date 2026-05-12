import { useState, useEffect, useCallback } from 'react'
import { getOrders, updateOrderStatus } from '../api/orders'
import { useSSE } from '../providers/SSEProvider'
import { useToast } from '../providers/ToastProvider'
import { useTheme } from '../providers/ThemeProvider'
import { T } from '../constants'
import { ChevronUpIcon, ChevronDownIcon, CheckCircleIcon, XCircleIcon, ShoppingCartIcon } from '../components/Icons'
import SkeletonCard from '../components/SkeletonCard'
import EmptyState from '../components/EmptyState'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const { lastUpdate } = useSSE()
  const { lang } = useTheme()
  const t = T[lang]

  const fetchOrders = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    getOrders()
      .then(setOrders)
      .catch(e => { if (!silent) setError(e.response?.data?.detail || e.message) })
      .finally(() => { if (!silent) setLoading(false) })
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])
  useEffect(() => { if (lastUpdate) fetchOrders(true) }, [lastUpdate, fetchOrders])

  const toast = useToast()

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateOrderStatus(id, status)
      setOrders(orders.map(o => o.id === id ? { ...o, status } : o))
      toast(status === 'fulfilled' ? t.orderFulfilled : t.orderCancelled, status === 'fulfilled' ? 'success' : 'warning')
    } catch (e) {
      toast(e.response?.data?.detail || e.message, 'error')
    }
  }

  if (loading) return (
    <div className="space-y-3">
      <SkeletonCard /><SkeletonCard /><SkeletonCard />
    </div>
  )
  if (error) return <div className="text-sm" style={{ color: 'var(--danger)' }}>{t.error}: {error}</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t.orders}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{orders.length} {t.totalOrders}</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingCartIcon size={48} />}
          title={t.noOrders}
          description={t.noOrdersDesc}
        />
      ) : (
      <div className="space-y-2">
        {orders.map(order => (
          <div key={order.id} className="card">
            <div className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>#{order.id}</span>
                <span className="font-medium" style={{ color: 'var(--accent)' }}>{order.customer_name}</span>
                <span className="badge badge-source">
                  {t.sourceLabels[order.source] ?? order.source}
                </span>
                <span className={`badge ${
                  order.status === 'fulfilled' ? 'badge-ok' :
                  order.status === 'cancelled' ? 'badge-critical' : 'badge-low'
                }`}>
                  {t.statusLabels[order.status]}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {new Date(order.created_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {expanded === order.id ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
                </span>
              </div>
            </div>

            {expanded === order.id && order.items.length > 0 && (
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ color: 'var(--text-muted)' }}>
                        <th className="text-left py-1">{t.product}</th>
                        <th className="text-right py-1">{t.qty}</th>
                        <th className="text-right py-1">{t.unitPrice}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map(item => (
                        <tr key={item.id} style={{ color: 'var(--text-secondary)' }}>
                          <td className="py-1">{item.product_name}</td>
                          <td className="text-right py-1">{item.quantity}</td>
                          <td className="text-right py-1">{import.meta.env.VITE_CURRENCY_SYMBOL || '₺'}{item.unit_price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {order.status === 'pending' && (
                  <div className="mt-4 flex gap-2 justify-end">
                    <button onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                      className="btn-ghost py-1 text-xs flex items-center gap-1.5" style={{ color: 'var(--danger)' }}>
                      <XCircleIcon size={14} />
                      {t.cancelOrder}
                    </button>
                    <button onClick={() => handleUpdateStatus(order.id, 'fulfilled')}
                      className="btn-primary py-1 px-4 text-xs flex items-center gap-1.5">
                      <CheckCircleIcon size={14} />
                      {t.fulfillOrder}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      )}
    </div>
  )
}
