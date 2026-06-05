import { useEffect, useState, useMemo } from 'react'
import { Button, Input, Card, Select, Dialog, toast, Notification } from '@/components/ui'
import { HiOutlineTrash, HiOutlinePlus, HiOutlineSearch } from 'react-icons/hi'
import { PiCheckCircleDuotone } from 'react-icons/pi'
import AxiosBase from '@/services/axios/AxiosBase'

type ProductOption = { id: string; name: string; model: string; use_unit: string; purchase_unit: string | null; units_per_purchase: string | null }
type Supplier = { id: string; name: string }
type PriceEntry = {
    id: string
    supplier_id: string
    supplier_name: string
    price: string
    price_per_use_unit: string
    use_unit: string
    purchase_unit: string | null
    units_per_purchase: string | null
    note: string | null
    effective_date: string | null
    is_cheapest: boolean
}
type Form = { supplier_id: string; price: string; note: string; effective_date: string }
const emptyForm: Form = { supplier_id: '', price: '', note: '', effective_date: '' }

const notify = (type: 'success' | 'danger', msg: string) =>
    toast.push(<Notification type={type}>{msg}</Notification>)

const fmt = (n: string) => parseFloat(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function PricesPage() {
    const [products, setProducts] = useState<ProductOption[]>([])
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null)
    const [entries, setEntries] = useState<PriceEntry[]>([])
    const [form, setForm] = useState<Form>(emptyForm)
    const [deleteTarget, setDeleteTarget] = useState<PriceEntry | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [supplierSearch, setSupplierSearch] = useState('')

    const filteredEntries = useMemo(() => {
        const q = supplierSearch.toLowerCase()
        return !q ? entries : entries.filter((e) => e.supplier_name.toLowerCase().includes(q))
    }, [entries, supplierSearch])

    useEffect(() => {
        AxiosBase.get<ProductOption[]>('/products').then((r) => setProducts(r.data))
        AxiosBase.get<Supplier[]>('/suppliers').then((r) => setSuppliers(r.data))
    }, [])

    const loadPrices = async (productId: string) => {
        const r = await AxiosBase.get<PriceEntry[]>(`/products/${productId}/prices`)
        setEntries(r.data)
    }

    const handleSelectProduct = (opt: { value: string; label: string } | null) => {
        if (!opt) { setSelectedProduct(null); setEntries([]); setSupplierSearch(''); return }
        const p = products.find((x) => x.id === opt.value) ?? null
        setSelectedProduct(p)
        setSupplierSearch('')
        if (p) loadPrices(p.id)
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedProduct) return
        try {
            await AxiosBase.post(`/products/${selectedProduct.id}/prices`, {
                supplier_id: form.supplier_id,
                price: parseFloat(form.price),
                note: form.note || null,
                effective_date: form.effective_date || null,
            })
            setForm(emptyForm)
            setShowForm(false)
            loadPrices(selectedProduct.id)
            notify('success', 'เพิ่มราคาแล้ว')
        } catch {
            notify('danger', 'เกิดข้อผิดพลาด')
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget || !selectedProduct) return
        try {
            await AxiosBase.delete(`/prices/${deleteTarget.id}`)
            setDeleteTarget(null)
            loadPrices(selectedProduct.id)
            notify('success', 'ลบแล้ว')
        } catch {
            notify('danger', 'เกิดข้อผิดพลาด')
        }
    }

    const productOptions = products.map((p) => ({
        value: p.id,
        label: p.model ? `${p.name} (${p.model})` : p.name,
    }))
    const supplierOptions = suppliers.map((s) => ({ value: s.id, label: s.name }))

    return (
        <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">เปรียบเทียบราคา</h2>
                {selectedProduct && (
                    <Button variant="solid" icon={<HiOutlinePlus />} onClick={() => { setForm(emptyForm); setShowForm(true) }}>
                        เพิ่มราคา
                    </Button>
                )}
            </div>

            <Card className="mb-6">
                <div className="max-w-md">
                    <label className="block text-sm font-medium mb-2">เลือกวัสดุ/อุปกรณ์</label>
                    <Select
                        options={productOptions}
                        value={selectedProduct ? productOptions.find((o) => o.value === selectedProduct.id) ?? null : null}
                        onChange={handleSelectProduct}
                        placeholder="พิมพ์ชื่อเพื่อค้นหา..."
                        isClearable
                    />
                </div>
            </Card>

            {selectedProduct && (
                <Card>
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-500 flex-1 min-w-48">
                            <span>หน่วยใช้งาน: <strong className="text-gray-800">{selectedProduct.use_unit}</strong></span>
                            {selectedProduct.purchase_unit && (
                                <>
                                    <span>·</span>
                                    <span>ซื้อเป็น: <strong className="text-gray-800">{selectedProduct.purchase_unit}</strong> ({selectedProduct.units_per_purchase} {selectedProduct.use_unit}/{selectedProduct.purchase_unit})</span>
                                </>
                            )}
                        </div>
                        <div className="w-52 shrink-0">
                            <Input
                                prefix={<HiOutlineSearch />}
                                placeholder="ค้นหาซัพพลายเออร์..."
                                value={supplierSearch}
                                onChange={(e) => setSupplierSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                    <table className="w-full min-w-160">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">ซัพพลายเออร์</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                                    ราคาที่ซื้อ
                                    {selectedProduct.purchase_unit && <span className="font-normal text-xs ml-1">({selectedProduct.purchase_unit})</span>}
                                </th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                                    ราคาต่อ {selectedProduct.use_unit}
                                </th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">หมายเหตุ</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">วันที่</th>
                                <th className="py-3 px-4" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {entries.length === 0 && (
                                <tr><td colSpan={6} className="text-center py-8 text-gray-400">ยังไม่มีราคา — กด "+ เพิ่มราคา" เพื่อเริ่ม</td></tr>
                            )}
                            {entries.length > 0 && filteredEntries.length === 0 && (
                                <tr><td colSpan={6} className="text-center py-8 text-gray-400">ไม่พบซัพพลายเออร์ที่ค้นหา</td></tr>
                            )}
                            {filteredEntries.map((entry) => (
                                <tr
                                    key={entry.id}
                                    className={entry.is_cheapest
                                        ? 'bg-green-50 dark:bg-green-900/20'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}
                                >
                                    <td className="py-3 px-4 font-medium flex items-center gap-2">
                                        {entry.is_cheapest && (
                                            <PiCheckCircleDuotone className="text-green-500 text-lg shrink-0" />
                                        )}
                                        {entry.supplier_name}
                                    </td>
                                    <td className="py-3 px-4 text-right tabular-nums">{fmt(entry.price)}</td>
                                    <td className={`py-3 px-4 text-right tabular-nums font-semibold ${entry.is_cheapest ? 'text-green-600' : ''}`}>
                                        {fmt(entry.price_per_use_unit)}
                                    </td>
                                    <td className="py-3 px-4 text-gray-500 text-sm">{entry.note ?? '—'}</td>
                                    <td className="py-3 px-4 text-gray-500 text-sm">{entry.effective_date ?? '—'}</td>
                                    <td className="py-3 px-4">
                                        <div className="flex justify-end">
                                            <Button size="xs" variant="plain" icon={<HiOutlineTrash />} customColorClass={() => 'text-red-500 hover:bg-red-50'} onClick={() => setDeleteTarget(entry)} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </Card>
            )}

            <Dialog isOpen={showForm} onClose={() => setShowForm(false)} onRequestClose={() => setShowForm(false)}>
                <h5 className="mb-4 font-semibold">เพิ่มราคาวัสดุ/อุปกรณ์</h5>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">ซัพพลายเออร์ *</label>
                        <Select
                            options={supplierOptions}
                            value={supplierOptions.find((o) => o.value === form.supplier_id) ?? null}
                            onChange={(opt) => setForm({ ...form, supplier_id: opt?.value ?? '' })}
                            placeholder="เลือกซัพพลายเออร์"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            ราคา *
                            {selectedProduct?.purchase_unit
                                ? <span className="font-normal text-gray-400 ml-1 text-xs">(ต่อ {selectedProduct.purchase_unit})</span>
                                : <span className="font-normal text-gray-400 ml-1 text-xs">(ต่อ {selectedProduct?.use_unit})</span>
                            }
                        </label>
                        <Input
                            type="number"
                            min="0"
                            step="any"
                            value={form.price}
                            onChange={(e) => setForm({ ...form, price: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">หมายเหตุ</label>
                        <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="เช่น ราคาโปร, ส่งฟรี" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">วันที่มีผล</label>
                        <Input type="date" value={form.effective_date} onChange={(e) => setForm({ ...form, effective_date: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" onClick={() => setShowForm(false)}>ยกเลิก</Button>
                        <Button type="submit" variant="solid" disabled={!form.supplier_id || !form.price}>เพิ่ม</Button>
                    </div>
                </form>
            </Dialog>

            <Dialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onRequestClose={() => setDeleteTarget(null)}>
                <h5 className="mb-2 font-semibold">ยืนยันการลบ</h5>
                <p className="mb-4 text-gray-500">
                    ลบราคาของ "{deleteTarget?.supplier_name}" ใช่ไหม?
                </p>
                <div className="flex justify-end gap-2">
                    <Button onClick={() => setDeleteTarget(null)}>ยกเลิก</Button>
                    <Button variant="solid" customColorClass={() => 'bg-red-500 hover:bg-red-600 text-white'} onClick={handleDelete}>ลบ</Button>
                </div>
            </Dialog>
        </div>
    )
}
