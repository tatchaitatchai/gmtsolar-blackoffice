import { useEffect, useState } from 'react'
import { Button, Input, Card, Dialog, Select, toast, Notification } from '@/components/ui'
import { HiOutlinePencil, HiOutlineTrash, HiOutlinePlus } from 'react-icons/hi'
import AxiosBase from '@/services/axios/AxiosBase'

type Category = { id: string; name: string }
type Brand = { id: string; name: string }
type ProductDetail = {
    id: string
    category_id: string; category_name: string
    brand_id: string; brand_name: string
    name: string; model: string
    spec: object
    use_unit: string
    purchase_unit: string | null
    units_per_purchase: string | null
}
type Form = {
    category_id: string; brand_id: string
    name: string; model: string
    use_unit: string; purchase_unit: string; units_per_purchase: string
}

const emptyForm: Form = {
    category_id: '', brand_id: '', name: '', model: '',
    use_unit: '', purchase_unit: '', units_per_purchase: '',
}

const notify = (type: 'success' | 'danger', msg: string) =>
    toast.push(<Notification type={type}>{msg}</Notification>)

export default function ProductsPage() {
    const [items, setItems] = useState<ProductDetail[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [brands, setBrands] = useState<Brand[]>([])
    const [form, setForm] = useState<Form>(emptyForm)
    const [editItem, setEditItem] = useState<ProductDetail | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<ProductDetail | null>(null)

    const load = async () => {
        const res = await AxiosBase.get<ProductDetail[]>('/products')
        setItems(res.data)
    }

    useEffect(() => {
        load()
        AxiosBase.get<Category[]>('/categories').then((r) => setCategories(r.data))
        AxiosBase.get<Brand[]>('/brands').then((r) => setBrands(r.data))
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

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await AxiosBase.post('/products', toPayload(form))
            setForm(emptyForm)
            setShowForm(false)
            load()
            notify('success', 'เพิ่มวัสดุ/อุปกรณ์แล้ว')
        } catch {
            notify('danger', 'เกิดข้อผิดพลาด')
        }
    }

    const handleUpdate = async () => {
        if (!editItem) return
        try {
            await AxiosBase.put(`/products/${editItem.id}`, toPayload(form))
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
            await AxiosBase.delete(`/products/${deleteTarget.id}`)
            setDeleteTarget(null)
            load()
            notify('success', 'ลบแล้ว')
        } catch {
            notify('danger', 'เกิดข้อผิดพลาด')
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
        setEditItem(item)
    }

    const catOptions = categories.map((c) => ({ value: c.id, label: c.name }))
    const brandOptions = brands.map((b) => ({ value: b.id, label: b.name }))

    const FormFields = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium mb-1">หมวดหมู่ *</label>
                <Select
                    options={catOptions}
                    value={catOptions.find((o) => o.value === form.category_id) ?? null}
                    onChange={(opt) => setForm({ ...form, category_id: opt?.value ?? '' })}
                    placeholder="เลือกหมวดหมู่"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">แบรนด์ *</label>
                <Select
                    options={brandOptions}
                    value={brandOptions.find((o) => o.value === form.brand_id) ?? null}
                    onChange={(opt) => setForm({ ...form, brand_id: opt?.value ?? '' })}
                    placeholder="เลือกแบรนด์"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">ชื่อวัสดุ/อุปกรณ์ *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">รุ่น</label>
                <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">
                    หน่วยใช้งาน * <span className="text-gray-400 font-normal text-xs">(เช่น ตัว, เมตร)</span>
                </label>
                <Input value={form.use_unit} onChange={(e) => setForm({ ...form, use_unit: e.target.value })} required />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">
                    หน่วยซื้อ <span className="text-gray-400 font-normal text-xs">(เว้นว่างถ้าซื้อ-ใช้หน่วยเดียวกัน)</span>
                </label>
                <Input value={form.purchase_unit} onChange={(e) => setForm({ ...form, purchase_unit: e.target.value })} placeholder="เช่น ม้วน, กล่อง" />
            </div>
            {form.purchase_unit && (
                <div>
                    <label className="block text-sm font-medium mb-1">จำนวนหน่วยใช้งานต่อหน่วยซื้อ *</label>
                    <Input
                        type="number"
                        value={form.units_per_purchase}
                        onChange={(e) => setForm({ ...form, units_per_purchase: e.target.value })}
                        required
                        placeholder="เช่น 100"
                    />
                </div>
            )}
        </div>
    )

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">วัสดุ/อุปกรณ์</h2>
                <Button variant="solid" icon={<HiOutlinePlus />} onClick={() => { setForm(emptyForm); setShowForm(true) }}>
                    เพิ่มวัสดุ/อุปกรณ์
                </Button>
            </div>

            <Card>
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">ชื่อวัสดุ/อุปกรณ์</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">หมวดหมู่</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">แบรนด์</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">หน่วย</th>
                            <th className="py-3 px-4" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {items.length === 0 && (
                            <tr><td colSpan={5} className="text-center py-8 text-gray-400">ยังไม่มีข้อมูล</td></tr>
                        )}
                        {items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                <td className="py-3 px-4">
                                    <p className="font-medium">{item.name}</p>
                                    {item.model && <p className="text-xs text-gray-400">{item.model}</p>}
                                </td>
                                <td className="py-3 px-4 text-gray-600">{item.category_name}</td>
                                <td className="py-3 px-4 text-gray-600">{item.brand_name}</td>
                                <td className="py-3 px-4 text-gray-600 text-sm">
                                    {item.purchase_unit
                                        ? `${item.use_unit} (${item.units_per_purchase} ${item.use_unit}/${item.purchase_unit})`
                                        : item.use_unit}
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex justify-end gap-2">
                                        <Button size="xs" variant="plain" icon={<HiOutlinePencil />} onClick={() => startEdit(item)} />
                                        <Button size="xs" variant="plain" icon={<HiOutlineTrash />} customColorClass={() => 'text-red-500 hover:bg-red-50'} onClick={() => setDeleteTarget(item)} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            <Dialog isOpen={showForm} onClose={() => setShowForm(false)} onRequestClose={() => setShowForm(false)}>
                <h5 className="mb-4 font-semibold">เพิ่มวัสดุ/อุปกรณ์ใหม่</h5>
                <form onSubmit={handleCreate}>
                    <FormFields />
                    <div className="flex justify-end gap-2 mt-4">
                        <Button onClick={() => setShowForm(false)}>ยกเลิก</Button>
                        <Button type="submit" variant="solid">เพิ่ม</Button>
                    </div>
                </form>
            </Dialog>

            <Dialog isOpen={!!editItem} onClose={() => setEditItem(null)} onRequestClose={() => setEditItem(null)}>
                <h5 className="mb-4 font-semibold">แก้ไขวัสดุ/อุปกรณ์</h5>
                <FormFields />
                <div className="flex justify-end gap-2 mt-4">
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
