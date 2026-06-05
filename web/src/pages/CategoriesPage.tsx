import { useEffect, useState } from 'react'
import { api } from '../lib/api'

type Category = { id: string; name: string }

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')

  const load = () => api.get<Category[]>('/categories').then(setItems)

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/categories', { name })
      setName('')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    }
  }

  const handleUpdate = async (id: string) => {
    setError('')
    try {
      await api.put(`/categories/${id}`, { name: editName })
      setEditId(null)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ลบหมวดหมู่นี้?')) return
    try {
      await api.delete(`/categories/${id}`)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-6">หมวดหมู่</h2>

      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ชื่อหมวดหมู่"
          required
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          เพิ่ม
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {items.length === 0 && (
          <p className="text-sm text-gray-400 p-4 text-center">ยังไม่มีข้อมูล</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-4 py-3">
            {editId === item.id ? (
              <>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={() => handleUpdate(item.id)} className="text-sm text-blue-600 hover:underline">บันทึก</button>
                <button onClick={() => setEditId(null)} className="text-sm text-gray-400 hover:underline">ยกเลิก</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-gray-800">{item.name}</span>
                <button onClick={() => { setEditId(item.id); setEditName(item.name) }} className="text-sm text-gray-400 hover:text-blue-600">แก้ไข</button>
                <button onClick={() => handleDelete(item.id)} className="text-sm text-gray-400 hover:text-red-600">ลบ</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
