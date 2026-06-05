import { useEffect, useState } from 'react'
import { api } from '../lib/api'

type Supplier = { id: string; name: string; contact: string | null; note: string | null }

type Form = { name: string; contact: string; note: string }
const emptyForm: Form = { name: '', contact: '', note: '' }

export default function SuppliersPage() {
  const [items, setItems] = useState<Supplier[]>([])
  const [form, setForm] = useState<Form>(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Form>(emptyForm)
  const [error, setError] = useState('')

  const load = () => api.get<Supplier[]>('/suppliers').then(setItems)

  useEffect(() => { load() }, [])

  const toPayload = (f: Form) => ({
    name: f.name,
    contact: f.contact || null,
    note: f.note || null,
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/suppliers', toPayload(form))
      setForm(emptyForm)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    }
  }

  const handleUpdate = async (id: string) => {
    setError('')
    try {
      await api.put(`/suppliers/${id}`, toPayload(editForm))
      setEditId(null)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ลบซัพพลายเออร์นี้?')) return
    try {
      await api.delete(`/suppliers/${id}`)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    }
  }

  const Field = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <div className="flex-1 min-w-32">
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-6">ซัพพลายเออร์</h2>

      <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-4 mb-6 space-y-3">
        <div className="flex flex-wrap gap-3">
          <Field label="ชื่อ *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="ชื่อร้าน / บริษัท" />
          <Field label="เบอร์ / Line" value={form.contact} onChange={(v) => setForm({ ...form, contact: v })} />
          <Field label="หมายเหตุ" value={form.note} onChange={(v) => setForm({ ...form, note: v })} />
        </div>
        <button
          type="submit"
          disabled={!form.name}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          เพิ่ม
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {items.length === 0 && <p className="text-sm text-gray-400 p-4 text-center">ยังไม่มีข้อมูล</p>}
        {items.map((item) => (
          <div key={item.id} className="px-4 py-3">
            {editId === item.id ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-3">
                  <Field label="ชื่อ" value={editForm.name} onChange={(v) => setEditForm({ ...editForm, name: v })} />
                  <Field label="เบอร์ / Line" value={editForm.contact} onChange={(v) => setEditForm({ ...editForm, contact: v })} />
                  <Field label="หมายเหตุ" value={editForm.note} onChange={(v) => setEditForm({ ...editForm, note: v })} />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleUpdate(item.id)} className="text-sm text-blue-600 hover:underline">บันทึก</button>
                  <button onClick={() => setEditId(null)} className="text-sm text-gray-400 hover:underline">ยกเลิก</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{item.name}</p>
                  {item.contact && <p className="text-xs text-gray-500">{item.contact}</p>}
                  {item.note && <p className="text-xs text-gray-400">{item.note}</p>}
                </div>
                <button onClick={() => { setEditId(item.id); setEditForm({ name: item.name, contact: item.contact ?? '', note: item.note ?? '' }) }} className="text-sm text-gray-400 hover:text-blue-600">แก้ไข</button>
                <button onClick={() => handleDelete(item.id)} className="text-sm text-gray-400 hover:text-red-600">ลบ</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
