import { useEffect, useState, useMemo } from 'react'
import { Button, Input, Card, Dialog, toast, Notification, Pagination } from '@/components/ui'
import { HiOutlinePencil, HiOutlineTrash, HiOutlinePlus, HiOutlineSearch } from 'react-icons/hi'
import AxiosBase from '@/services/axios/AxiosBase'
import { usePagination } from '@/lib/usePagination'

const PAGE_SIZE = 10

type Supplier = { id: string; name: string; contact: string | null; note: string | null }
type Form = { name: string; contact: string; note: string }
const empty: Form = { name: '', contact: '', note: '' }

const notify = (type: 'success' | 'danger', msg: string) =>
    toast.push(<Notification type={type}>{msg}</Notification>)

export default function SuppliersPage() {
    const [items, setItems] = useState<Supplier[]>([])
    const [form, setForm] = useState<Form>(empty)
    const [editItem, setEditItem] = useState<Supplier | null>(null)
    const [editForm, setEditForm] = useState<Form>(empty)
    const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null)

    const [search, setSearch] = useState('')

    const filteredItems = useMemo(() => {
        const q = search.toLowerCase()
        return !q ? items : items.filter((item) =>
            item.name.toLowerCase().includes(q) || (item.contact ?? '').toLowerCase().includes(q)
        )
    }, [items, search])

    const { paged, page, setPage, total } = usePagination(filteredItems, PAGE_SIZE)

    const load = async () => {
        const res = await AxiosBase.get<Supplier[]>('/suppliers')
        setItems(res.data)
    }

    useEffect(() => { load() }, [])

    const toPayload = (f: Form) => ({ name: f.name, contact: f.contact || null, note: f.note || null })

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await AxiosBase.post('/suppliers', toPayload(form))
            setForm(empty)
            load()
            notify('success', 'เพิ่มซัพพลายเออร์แล้ว')
        } catch {
            notify('danger', 'เกิดข้อผิดพลาด')
        }
    }

    const handleUpdate = async () => {
        if (!editItem) return
        try {
            await AxiosBase.put(`/suppliers/${editItem.id}`, toPayload(editForm))
            setEditItem(null)
            load()
            notify('success', 'แก้ไขแล้ว')
        } catch {
            notify('danger', 'เกิดข้อผิดพลาด')
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        try {
            await AxiosBase.delete(`/suppliers/${deleteTarget.id}`)
            setDeleteTarget(null)
            load()
            notify('success', 'ลบแล้ว')
        } catch {
            notify('danger', 'เกิดข้อผิดพลาด')
        }
    }

    const F = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
        <div className="flex-1 min-w-40">
            <label className="block text-sm font-medium mb-1">{label}</label>
            <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
        </div>
    )

    return (
        <div className="p-4 md:p-6">
            <h2 className="text-xl font-bold mb-6">ซัพพลายเออร์</h2>

            <Card className="mb-4">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="flex flex-wrap gap-4">
                        <F label="ชื่อ *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="ชื่อร้าน / บริษัท" />
                        <F label="เบอร์ / Line" value={form.contact} onChange={(v) => setForm({ ...form, contact: v })} />
                        <F label="หมายเหตุ" value={form.note} onChange={(v) => setForm({ ...form, note: v })} />
                    </div>
                    <div>
                        <Button type="submit" variant="solid" disabled={!form.name} icon={<HiOutlinePlus />}>เพิ่ม</Button>
                    </div>
                </form>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <Input
                        prefix={<HiOutlineSearch />}
                        placeholder="ค้นหาชื่อร้าน / เบอร์..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {filteredItems.length < items.length && (
                        <p className="text-sm text-gray-400 mt-2">แสดง {filteredItems.length} จาก {items.length} รายการ</p>
                    )}
                </div>
            </Card>

            <Card bodyClass="p-0">
                <div className="overflow-x-auto">
                <table className="w-full min-w-120">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">ชื่อ</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">เบอร์ / Line</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">หมายเหตุ</th>
                            <th className="py-3 px-4" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {items.length === 0 && (
                            <tr><td colSpan={4} className="text-center py-8 text-gray-400">ยังไม่มีข้อมูล</td></tr>
                        )}
                        {paged.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                <td className="py-3 px-4 font-medium">{item.name}</td>
                                <td className="py-3 px-4 text-gray-500">{item.contact ?? '—'}</td>
                                <td className="py-3 px-4 text-gray-500">{item.note ?? '—'}</td>
                                <td className="py-3 px-4">
                                    <div className="flex justify-end gap-2">
                                        <Button size="xs" variant="plain" icon={<HiOutlinePencil />} onClick={() => { setEditItem(item); setEditForm({ name: item.name, contact: item.contact ?? '', note: item.note ?? '' }) }} />
                                        <Button size="xs" variant="plain" icon={<HiOutlineTrash />} customColorClass={() => 'text-red-500 hover:bg-red-50'} onClick={() => setDeleteTarget(item)} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </Card>

            {total > PAGE_SIZE && (
                <div className="mt-4 flex justify-center">
                    <Pagination currentPage={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
                </div>
            )}

            <Dialog isOpen={!!editItem} onClose={() => setEditItem(null)} onRequestClose={() => setEditItem(null)}>
                <h5 className="mb-4 font-semibold">แก้ไขซัพพลายเออร์</h5>
                <div className="space-y-3 mb-4">
                    <F label="ชื่อ" value={editForm.name} onChange={(v) => setEditForm({ ...editForm, name: v })} />
                    <F label="เบอร์ / Line" value={editForm.contact} onChange={(v) => setEditForm({ ...editForm, contact: v })} />
                    <F label="หมายเหตุ" value={editForm.note} onChange={(v) => setEditForm({ ...editForm, note: v })} />
                </div>
                <div className="flex justify-end gap-2">
                    <Button onClick={() => setEditItem(null)}>ยกเลิก</Button>
                    <Button variant="solid" onClick={handleUpdate}>บันทึก</Button>
                </div>
            </Dialog>

            <Dialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onRequestClose={() => setDeleteTarget(null)}>
                <h5 className="mb-2 font-semibold">ยืนยันการลบ</h5>
                <p className="mb-4 text-gray-500">ต้องการลบ "{deleteTarget?.name}" ใช่ไหม?</p>
                <div className="flex justify-end gap-2">
                    <Button onClick={() => setDeleteTarget(null)}>ยกเลิก</Button>
                    <Button variant="solid" customColorClass={() => 'bg-red-500 hover:bg-red-600 text-white'} onClick={handleDelete}>ลบ</Button>
                </div>
            </Dialog>
        </div>
    )
}
