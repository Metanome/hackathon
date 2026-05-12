import { useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import StockBadge from '../components/StockBadge'
import { useInventory } from '../hooks/useInventory'
import { useToast } from '../providers/ToastProvider'
import { useTheme } from '../providers/ThemeProvider'
import { T } from '../constants'
import ConfirmDialog from '../components/ConfirmDialog'
import { EditIcon, SettingsIcon, TrashIcon, CheckIcon, XIcon, UploadIcon, PlusIcon } from '../components/Icons'

export default function Inventory() {
  const { products, loading, error, patch, create, upload, remove } = useInventory()
  const { lang } = useTheme()
  const t = T[lang]
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const [editId, setEditId] = useState(null)
  const [editQty, setEditQty] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editThreshold, setEditThreshold] = useState('')
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')
  const toast = useToast()
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', category: '', price: '', stock: '', threshold: '10', supplierName: '', supplierEmail: '' })
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const filtered = products.filter(p => {
    const matchesStatus = filter === 'all' || p.status === filter
    const matchesQuery = q === '' || p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase())
    return matchesStatus && matchesQuery
  })

  const handleSave = async (id) => {
    const qty = parseInt(editQty, 10)
    const price = parseFloat(editPrice)
    const threshold = parseInt(editThreshold, 10)
    if (isNaN(qty) || qty < 0 || isNaN(price) || price < 0 || isNaN(threshold) || threshold < 0) return
    setSaving(true)
    await patch(id, { stock_quantity: qty, category: editCategory || 'Genel', unit_price: price, reorder_threshold: threshold })
    setSaving(false)
    setEditId(null)
  }

  const filterLabels = { all: t.all, critical: t.filterCritical, low: t.filterLow, ok: t.filterNormal }

  if (loading) return <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{t.loading}</div>
  if (error) return <div className="text-sm" style={{ color: '#f87171' }}>{t.error}: {error}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t.inventory}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {products.length} {t.totalProducts}
            {q && <span className="ml-2" style={{ color: 'var(--accent)' }}>· "{q}" {t.searchFilter}</span>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'critical', 'low', 'ok'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="btn-ghost capitalize"
              style={filter === f ? { color: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 10%, transparent)' } : {}}>
              {filterLabels[f]}
            </button>
          ))}
          <div className="w-px h-6 mx-2 self-center" style={{ background: 'var(--border-color)' }}></div>
          <button onClick={() => fileInputRef.current?.click()} className="btn-ghost flex items-center gap-2" disabled={uploading}>
            <UploadIcon size={16} />
            {uploading ? t.loading : t.importCsv}
          </button>
          <input type="file" accept=".csv" ref={fileInputRef} className="hidden"
            onChange={async (e) => {
              if (e.target.files?.[0]) {
                setUploading(true)
                try {
                  const res = await upload(e.target.files[0])
                  toast(`${res.added_count} ${t.importedSuffix}`, 'success')
                } catch (err) {
                  toast(err.response?.data?.detail || err.message, 'error')
                }
                setUploading(false)
                e.target.value = ''
              }
            }}
          />
          <button onClick={() => { setNewProduct({ name: '', category: '', price: '', stock: '', threshold: '10', supplierName: '', supplierEmail: '' }); setShowModal(true) }}
            className="btn-primary flex items-center gap-2">
            <PlusIcon size={16} />
            {t.addProduct}
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {[t.product, t.sku, t.category, t.price, t.stock, t.threshold, t.status, ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-color)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 5%, transparent)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--accent)' }}>{p.name}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{p.sku}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                    {editId === p.id ? <input type="text" value={editCategory} onChange={e => setEditCategory(e.target.value)} className="input w-24 py-1 text-sm" /> : p.category}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                    {editId === p.id ? <input type="number" step="0.01" min="0" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="input w-16 py-1 text-sm" /> : `${import.meta.env.VITE_CURRENCY_SYMBOL || '₺'}${p.unit_price.toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3">
                    {editId === p.id ? <input type="number" min="0" value={editQty} onChange={e => setEditQty(e.target.value)} className="input w-16 text-center py-1 text-sm" /> : <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{p.stock_quantity}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {editId === p.id ? <input type="number" min="0" value={editThreshold} onChange={e => setEditThreshold(e.target.value)} className="input w-16 text-center py-1 text-sm" /> : <span style={{ color: 'var(--text-muted)' }}>{p.reorder_threshold}</span>}
                  </td>
                  <td className="px-4 py-3"><StockBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-right">
                    {editId === p.id ? (
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => handleSave(p.id)} disabled={saving} className="p-1.5 rounded transition-colors" style={{ background: 'color-mix(in srgb, var(--accent) 20%, transparent)', color: 'var(--accent)' }}>
                          {saving ? '...' : <CheckIcon />}
                        </button>
                        <button onClick={() => setEditId(null)} className="p-1.5 rounded transition-colors" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                          <XIcon />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => { setEditId(p.id); setEditQty(String(p.stock_quantity)); setEditCategory(p.category); setEditPrice(String(p.unit_price)); setEditThreshold(String(p.reorder_threshold)) }}
                          className="p-1.5 rounded transition-colors" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                          <EditIcon />
                        </button>
                        <button onClick={() => { setNewProduct({ id: p.id, name: p.name, category: p.category, price: String(p.unit_price), stock: String(p.stock_quantity), threshold: String(p.reorder_threshold), supplierName: p.supplier_name || '', supplierEmail: p.supplier_email || '' }); setShowModal(true) }}
                          className="p-1.5 rounded transition-colors" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}>
                          <SettingsIcon />
                        </button>
                        <button onClick={() => setConfirmDelete({ id: p.id, name: p.name })}
                          className="p-1.5 rounded transition-colors" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                          <TrashIcon />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="card w-full max-w-md space-y-6">
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{newProduct.id ? t.editProduct : t.addProductTitle}</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{newProduct.id ? t.editProductDesc : t.addProductDesc}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{t.productName}</label>
                <input type="text" className="input" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="ör. Premium Kahve" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{t.category}</label>
                  <input type="text" className="input" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} placeholder="ör. İçecekler" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{t.price}</label>
                  <input type="number" step="0.01" className="input" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{t.initialStock}</label>
                  <input type="number" className="input" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{t.threshold}</label>
                  <input type="number" className="input" value={newProduct.threshold} onChange={e => setNewProduct({...newProduct, threshold: e.target.value})} placeholder="10" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{t.supplierName}</label>
                  <input type="text" className="input" value={newProduct.supplierName} onChange={e => setNewProduct({...newProduct, supplierName: e.target.value})} placeholder="ör. Anadolu Tarım" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{t.supplierEmail}</label>
                  <input type="email" className="input" value={newProduct.supplierEmail} onChange={e => setNewProduct({...newProduct, supplierEmail: e.target.value})} placeholder="iletisim@anadolu.com" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button onClick={() => setShowModal(false)} className="btn-ghost">{t.cancel}</button>
              <button onClick={async () => {
                if (!newProduct.name) return toast(t.nameRequired, 'warning')
                setSaving(true)
                try {
                  const payload = { name: newProduct.name, category: newProduct.category || 'Genel', unit_price: parseFloat(newProduct.price || 0), stock_quantity: parseInt(newProduct.stock || 0, 10), reorder_threshold: parseInt(newProduct.threshold || 10, 10), supplier_name: newProduct.supplierName || '', supplier_email: newProduct.supplierEmail || '' }
                  if (newProduct.id) { await patch(newProduct.id, payload); toast(t.productUpdated, 'success') }
                  else { await create(payload); toast(t.productAdded, 'success') }
                  setShowModal(false)
                  setNewProduct({ name: '', category: '', price: '', stock: '', threshold: '10', supplierName: '', supplierEmail: '' })
                } catch (e) { toast(e.response?.data?.detail || t.productSaveFailed, 'error') }
                setSaving(false)
              }} disabled={saving || !newProduct.name} className="btn-primary">
                {saving ? t.saving : (newProduct.id ? t.saveChanges : t.addProduct)}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title={t.deleteProduct}
        message={lang === 'tr'
          ? `"${confirmDelete?.name}" ürününü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
          : `Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
        danger
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          await remove(confirmDelete.id)
          toast(`"${confirmDelete.name}" ${t.deletedSuffix}`, 'warning')
          setConfirmDelete(null)
        }}
      />
    </div>
  )
}
