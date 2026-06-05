import { useEffect, useState } from 'react'
import { api } from '../lib/api'

type Category = { id: string; name: string }
type Brand = { id: string; name: string }
type ProductDetail = {
  id: string; category_id: string; category_name: string
  brand_id: string; brand_name: string; name: string; model: string
  spec: object; use_unit: string; purchase_unit: string | null
  units_per_purchase: string | null
}
type Form = {
  category_id: string; brand_id: string; name: string; model: string
  use_unit: string; purchase_unit: string; units_per_purchase: string
}
const emptyForm: Form = { category_id: '', brand_id: '', name: '', model: '', use_unit: '', purchase_unit: '', units_per_purchase: '' }

export default function ProductsPage() {
  const [items, setItems] = useState<ProductDetail[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Form>(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = () => api.get<ProductDetail[]>('/products').then(setItems)

  useEffect(() => {
    load()
    api.get<Category[]>('/categories').then(setCategories)
    api.get<Brand[]>('/brands').then(setBrands)
  }, [])

  const toPayload = (f: Form) => ({
    category_id: f.category_id,
    brand_id: f.brand_id,
    name: f.name,
    model: f.model,
    spec: {},
    use_unit: f.use_unit,
    purchase_unit: f.purchase_unit || null,
    units_per_purchase: f.units_per_purchase ? Number(f.units_per_purchase) : null,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (editId) {
        await api.put(`/products/${editId}`, toPayload(form))
      } else {
        await api.post('/products', toPayload(form))
      }
      setForm(emptyForm)
      setEditId(null)
      setShowForm(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    }
  }

  const startEdit = (item: ProductDetail) => {
    setForm({
      category_id: item.category_id,
      brand_id: item.brand_id,
      name: item.name,
      model: item.model,
      use_unit: item.use_unit,
      purchase_unit: item.purchase_unit ?? '',
      units_per_purchase: item.units_per_purchase ?? '',
    })
    setEditId(item.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ลบวัสดุ/อุปกรณ์นี้?')) return
    try {
      await api.delete(`/products/${id}`)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    }
  }

  const sel = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const inp = sel

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">วัสดุ/อุปกรณ์</h2>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm) }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + เพิ่มวัสดุ/อุปกรณ์
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 mb-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">{editId ? 'แก้ไขวัสดุ/อุปกรณ์' : 'เพิ่มวัสดุ/อุปกรณ์ใหม่'}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">หมวดหมู่ *</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required className={sel}>
                <option value="">เลือกหมวดหมู่</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">แบรนด์ *</label>
              <select value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value })} required className={sel}>
                <option value="">เลือกแบรนด์</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ชื่อวัสดุ/อุปกรณ์ *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inp} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">รุ่น</label>
              <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className={inp} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">หน่วยใช้งาน * <span className="text-gray-400">(เช่น ตัว, เมตร, แผ่น)</span></label>
              <input value={form.use_unit} onChange={(e) => setForm({ ...form, use_unit: e.target.value })} required className={inp} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">หน่วยซื้อ <span className="text-gray-400">(เว้นว่างถ้าซื้อ-ใช้หน่วยเดียวกัน)</span></label>
              <input value={form.purchase_unit} onChange={(e) => setForm({ ...form, purchase_unit: e.target.value })} placeholder="เช่น ม้วน, กล่อง" className={inp} />
            </div>
            {form.purchase_unit && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">จำนวนหน่วยใช้งานต่อหน่วยซื้อ *</label>
                <input
                  type="number" min="0" step="any"
                  value={form.units_per_purchase}
                  onChange={(e) => setForm({ ...form, units_per_purchase: e.target.value })}
                  required
                  placeholder="เช่น 100"
                  className={inp}
                />
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              {editId ? 'บันทึก' : 'เพิ่ม'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null) }} className="text-sm text-gray-500 hover:underline">
              ยกเลิก
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">ชื่อวัสดุ/อุปกรณ์</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">หมวดหมู่</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">แบรนด์</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">หน่วย</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 && (
              <tr><td colSpan={5} className="text-center text-gray-400 py-8">ยังไม่มีวัสดุ/อุปกรณ์</td></tr>
            )}
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{item.name}</p>
                  {item.model && <p className="text-xs text-gray-400">{item.model}</p>}
                </td>
                <td className="px-4 py-3 text-gray-600">{item.category_name}</td>
                <td className="px-4 py-3 text-gray-600">{item.brand_name}</td>
                <td className="px-4 py-3 text-gray-600">
                  {item.purchase_unit
                    ? `${item.use_unit} (${item.units_per_purchase} ${item.use_unit}/${item.purchase_unit})`
                    : item.use_unit}
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button onClick={() => startEdit(item)} className="text-gray-400 hover:text-blue-600">แก้ไข</button>
                  <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-600">ลบ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
