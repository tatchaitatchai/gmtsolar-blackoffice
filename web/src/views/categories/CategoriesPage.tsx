import { useEffect, useState } from 'react'
import { Button, Input, Card, Dialog, toast, Notification } from '@/components/ui'
import { HiOutlinePencil, HiOutlineTrash, HiOutlinePlus } from 'react-icons/hi'
import AxiosBase from '@/services/axios/AxiosBase'

type Category = { id: string; name: string }

const notify = (type: 'success' | 'danger', msg: string) =>
    toast.push(<Notification type={type}>{msg}</Notification>)

export default function CategoriesPage() {
    const [items, setItems] = useState<Category[]>([])
    const [name, setName] = useState('')
    const [editItem, setEditItem] = useState<Category | null>(null)
    const [editName, setEditName] = useState('')
    const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

    const load = async () => {
        const res = await AxiosBase.get<Category[]>('/categories')
        setItems(res.data)
    }

    useEffect(() => { load() }, [])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await AxiosBase.post('/categories', { name })
            setName('')
            load()
            notify('success', 'เพิ่มหมวดหมู่แล้ว')
        } catch {
            notify('danger', 'เกิดข้อผิดพลาด')
        }
    }

    const handleUpdate = async () => {
        if (!editItem) return
        try {
            await AxiosBase.put(`/categories/${editItem.id}`, { name: editName })
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
            await AxiosBase.delete(`/categories/${deleteTarget.id}`)
            setDeleteTarget(null)
            load()
            notify('success', 'ลบแล้ว')
        } catch {
            notify('danger', 'เกิดข้อผิดพลาด')
        }
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">หมวดหมู่</h2>
            </div>

            <Card className="mb-6">
                <form onSubmit={handleCreate} className="flex gap-3 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">ชื่อหมวดหมู่</label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น อินเวอร์เตอร์" required />
                    </div>
                    <Button type="submit" variant="solid" icon={<HiOutlinePlus />}>เพิ่ม</Button>
                </form>
            </Card>

            <Card>
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">ชื่อ</th>
                            <th className="py-3 px-4" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {items.length === 0 && (
                            <tr><td colSpan={2} className="text-center py-8 text-gray-400">ยังไม่มีข้อมูล</td></tr>
                        )}
                        {items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                <td className="py-3 px-4">{item.name}</td>
                                <td className="py-3 px-4">
                                    <div className="flex justify-end gap-2">
                                        <Button size="xs" variant="plain" icon={<HiOutlinePencil />} onClick={() => { setEditItem(item); setEditName(item.name) }} />
                                        <Button size="xs" variant="plain" icon={<HiOutlineTrash />} customColorClass={() => 'text-red-500 hover:bg-red-50'} onClick={() => setDeleteTarget(item)} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            <Dialog isOpen={!!editItem} onClose={() => setEditItem(null)} onRequestClose={() => setEditItem(null)}>
                <h5 className="mb-4 font-semibold">แก้ไขหมวดหมู่</h5>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="mb-4" />
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
