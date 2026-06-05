import { useEffect, useState, useMemo } from 'react'
import { Button, Input, Card, Dialog, toast, Notification, Pagination } from '@/components/ui'
import { HiOutlinePencil, HiOutlineTrash, HiOutlinePlus, HiOutlineSearch } from 'react-icons/hi'
import AxiosBase from '@/services/axios/AxiosBase'
import { usePagination } from '@/lib/usePagination'

const PAGE_SIZE = 10

type Brand = { id: string; name: string }

const notify = (type: 'success' | 'danger', msg: string) =>
    toast.push(<Notification type={type}>{msg}</Notification>)

export default function BrandsPage() {
    const [items, setItems] = useState<Brand[]>([])
    const [name, setName] = useState('')
    const [editItem, setEditItem] = useState<Brand | null>(null)
    const [editName, setEditName] = useState('')
    const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null)

    const [search, setSearch] = useState('')

    const filteredItems = useMemo(() => {
        const q = search.toLowerCase()
        return !q ? items : items.filter((item) => item.name.toLowerCase().includes(q))
    }, [items, search])

    const { paged, page, setPage, total } = usePagination(filteredItems, PAGE_SIZE)

    const load = async () => {
        const res = await AxiosBase.get<Brand[]>('/brands')
        setItems(res.data)
    }

    useEffect(() => { load() }, [])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await AxiosBase.post('/brands', { name })
            setName('')
            load()
            notify('success', 'เพิ่มแบรนด์แล้ว')
        } catch {
            notify('danger', 'เกิดข้อผิดพลาด')
        }
    }

    const handleUpdate = async () => {
        if (!editItem) return
        try {
            await AxiosBase.put(`/brands/${editItem.id}`, { name: editName })
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
            await AxiosBase.delete(`/brands/${deleteTarget.id}`)
            setDeleteTarget(null)
            load()
            notify('success', 'ลบแล้ว')
        } catch {
            notify('danger', 'เกิดข้อผิดพลาด')
        }
    }

    return (
        <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">แบรนด์</h2>
            </div>

            <Card className="mb-4">
                <form onSubmit={handleCreate} className="flex gap-3 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">ชื่อแบรนด์</label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น Huawei, Deye" required />
                    </div>
                    <Button type="submit" variant="solid" icon={<HiOutlinePlus />}>เพิ่ม</Button>
                </form>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <Input
                        prefix={<HiOutlineSearch />}
                        placeholder="ค้นหาแบรนด์..."
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
                <table className="w-full min-w-64">
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
                        {paged.map((item) => (
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
                </div>
            </Card>

            {total > PAGE_SIZE && (
                <div className="mt-4 flex justify-center">
                    <Pagination currentPage={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
                </div>
            )}

            <Dialog isOpen={!!editItem} onClose={() => setEditItem(null)} onRequestClose={() => setEditItem(null)}>
                <h5 className="mb-4 font-semibold">แก้ไขแบรนด์</h5>
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
