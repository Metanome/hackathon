import { useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import StockBadge from '../components/StockBadge'
import { useInventory } from '../hooks/useInventory'

export default function Inventory() {
  const { products, loading, error, patch, create, upload } = useInventory()
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const [editId, setEditId] = useState(null)
  const [editQty, setEditQty] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editThreshold, setEditThreshold] = useState('')
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')

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
    await patch(id, { 
      stock_quantity: qty, 
      category: editCategory || 'General', 
      unit_price: price,
      reorder_threshold: threshold
    })
    setSaving(false)
    setEditId(null)
  }

  if (loading) return <div className="text-slate-500 text-sm">Loading inventory...</div>
  if (error) return <div className="text-red-400 text-sm">Error: {error}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Inventory</h1>
          <p className="text-slate-500 text-sm mt-1">
            {products.length} total products
            {q && <span className="ml-2 text-teal-400">· Filtering by "{q}"</span>}
          </p>
        </div>
        <div className="flex gap-2">
          {['all', 'critical', 'low', 'ok'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn-ghost capitalize ${filter === f ? 'text-teal-400 bg-teal-900/20' : ''}`}
            >
              {f}
            </button>
          ))}
          <div className="w-px h-6 bg-slate-800 mx-2 self-center"></div>
          <button onClick={() => fileInputRef.current?.click()} className="btn-ghost" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Import CSV'}
          </button>
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={async (e) => {
              if (e.target.files?.[0]) {
                setUploading(true)
                try {
                  const res = await upload(e.target.files[0])
                  alert(`Successfully imported ${res.added_count} products.`)
                } catch (err) {
                  alert(`Upload failed: ${err.response?.data?.detail || err.message}`)
                }
                setUploading(false)
                e.target.value = ''
              }
            }} 
          />
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + Add Product
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              {['Product', 'SKU', 'Category', 'Price', 'Stock', 'Threshold', 'Status', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 text-slate-200 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-3 text-slate-400">
                  {editId === p.id ? (
                    <input
                      type="text"
                      value={editCategory}
                      onChange={e => setEditCategory(e.target.value)}
                      className="input w-28 py-1 text-sm"
                    />
                  ) : (
                    p.category
                  )}
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {editId === p.id ? (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editPrice}
                      onChange={e => setEditPrice(e.target.value)}
                      className="input w-20 py-1 text-sm"
                    />
                  ) : (
                    `${import.meta.env.VITE_CURRENCY_SYMBOL || '$'}${p.unit_price.toFixed(2)}`
                  )}
                </td>
                <td className="px-4 py-3">
                  {editId === p.id ? (
                    <input
                      type="number"
                      min="0"
                      value={editQty}
                      onChange={e => setEditQty(e.target.value)}
                      className="input w-20 text-center py-1 text-sm"
                    />
                  ) : (
                    <span className="text-slate-200 font-semibold">{p.stock_quantity}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editId === p.id ? (
                    <input
                      type="number"
                      min="0"
                      value={editThreshold}
                      onChange={e => setEditThreshold(e.target.value)}
                      className="input w-20 text-center py-1 text-sm"
                    />
                  ) : (
                    <span className="text-slate-500">{p.reorder_threshold}</span>
                  )}
                </td>
                <td className="px-4 py-3"><StockBadge status={p.status} /></td>
                <td className="px-4 py-3 text-right">
                  {editId === p.id ? (
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => handleSave(p.id)} disabled={saving} className="btn-primary py-1 px-3 text-xs">
                        {saving ? '...' : 'Save'}
                      </button>
                      <button onClick={() => setEditId(null)} className="btn-ghost py-1 px-3 text-xs">Cancel</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { 
                        setEditId(p.id); 
                        setEditQty(String(p.stock_quantity));
                        setEditCategory(p.category);
                        setEditPrice(String(p.unit_price));
                        setEditThreshold(String(p.reorder_threshold));
                      }}
                      className="btn-ghost text-xs"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Add New Product</h2>
              <p className="text-sm text-slate-500 mt-1">Enter product details to add to inventory.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">Name</label>
                <input 
                  type="text" 
                  className="input" 
                  value={newProduct.name} 
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})} 
                  placeholder="e.g. Premium Coffee"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">Category</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={newProduct.category} 
                    onChange={e => setNewProduct({...newProduct, category: e.target.value})} 
                    placeholder="e.g. Beverages"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">Price</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="input" 
                    value={newProduct.price} 
                    onChange={e => setNewProduct({...newProduct, price: e.target.value})} 
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">Initial Stock</label>
                  <input 
                    type="number" 
                    className="input" 
                    value={newProduct.stock} 
                    onChange={e => setNewProduct({...newProduct, stock: e.target.value})} 
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">Threshold</label>
                  <input 
                    type="number" 
                    className="input" 
                    value={newProduct.threshold} 
                    onChange={e => setNewProduct({...newProduct, threshold: e.target.value})} 
                    placeholder="10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">Supplier Name</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={newProduct.supplierName} 
                    onChange={e => setNewProduct({...newProduct, supplierName: e.target.value})} 
                    placeholder="e.g. Anadolu Tarım"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">Supplier Email</label>
                  <input 
                    type="email" 
                    className="input" 
                    value={newProduct.supplierEmail} 
                    onChange={e => setNewProduct({...newProduct, supplierEmail: e.target.value})} 
                    placeholder="contact@anadolu.com"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
              <button 
                onClick={() => setShowModal(false)} 
                className="btn-ghost"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!newProduct.name) return alert('Name is required')
                  setSaving(true)
                  try {
                    await create({
                      name: newProduct.name,
                      category: newProduct.category || 'General',
                      unit_price: parseFloat(newProduct.price || 0),
                      stock_quantity: parseInt(newProduct.stock || 0, 10),
                      reorder_threshold: parseInt(newProduct.threshold || 10, 10),
                      supplier_name: newProduct.supplierName || '',
                      supplier_email: newProduct.supplierEmail || ''
                    })
                    setShowModal(false)
                    setNewProduct({ name: '', category: '', price: '', stock: '', threshold: '10', supplierName: '', supplierEmail: '' })
                  } catch (e) {
                    alert('Error creating product')
                  }
                  setSaving(false)
                }}
                disabled={saving || !newProduct.name}
                className="btn-primary"
              >
                {saving ? 'Saving...' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
