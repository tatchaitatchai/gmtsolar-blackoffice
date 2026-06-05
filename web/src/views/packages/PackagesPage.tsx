import { useEffect, useState, useMemo } from 'react'
import { Button, Input, Card, Select, Dialog, toast, Notification } from '@/components/ui'
import { HiOutlineTrash, HiOutlinePlus, HiOutlinePencil, HiOutlineCalculator, HiOutlineChevronRight, HiOutlineSearch } from 'react-icons/hi'
import AxiosBase from '@/services/axios/AxiosBase'

type Package = { id: string; name: string; description: string | null; created_at: string }
type PackageItemDetail = { id: string; product_id: string; product_name: string; product_model: string; use_unit: string; quantity: string }
type PackageWithItems = Package & { items: PackageItemDetail[] }
type ProductOption = { id: string; name: string; model: string; use_unit: string }
type PackageItemCost = {
    item_id: string
    product_name: string
    product_model: string
    quantity: string
    use_unit: string
    price_per_use_unit: string | null
    cost: string | null
    supplier_name: string | null
    has_price: boolean
}
type PackageCost = { package_id: string; package_name: string; total_cost: string; items: PackageItemCost[] }

type PkgForm = { name: string; description: string }
const emptyPkgForm: PkgForm = { name: '', description: '' }

const notify = (type: 'success' | 'danger', msg: string) =>
    toast.push(<Notification type={type}>{msg}</Notification>)

const fmt = (n: string | null) =>
    n == null ? '—' : parseFloat(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function PackagesPage() {
    const [packages, setPackages] = useState<Package[]>([])
    const [selected, setSelected] = useState<PackageWithItems | null>(null)
    const [products, setProducts] = useState<ProductOption[]>([])

    const [pkgForm, setPkgForm] = useState<PkgForm>(emptyPkgForm)
    const [showPkgForm, setShowPkgForm] = useState(false)
    const [editTarget, setEditTarget] = useState<Package | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Package | null>(null)

    const [addItemProductId, setAddItemProductId] = useState('')
    const [addItemQty, setAddItemQty] = useState('')
    const [showAddItem, setShowAddItem] = useState(false)
    const [deleteItemTarget, setDeleteItemTarget] = useState<PackageItemDetail | null>(null)

    const [costData, setCostData] = useState<PackageCost | null>(null)
    const [showCost, setShowCost] = useState(false)

    const [search, setSearch] = useState('')

    const filteredPackages = useMemo(() => {
        const q = search.toLowerCase()
        return !q ? packages : packages.filter((p) =>
            p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)
        )
    }, [packages, search])

    const loadPackages = async () => {
        const r = await AxiosBase.get<Package[]>('/packages')
        setPackages(r.data)
    }

    const loadDetail = async (id: string) => {
        const r = await AxiosBase.get<PackageWithItems>(`/packages/${id}`)
        setSelected(r.data)
    }

    useEffect(() => {
        loadPackages()
        AxiosBase.get<ProductOption[]>('/products').then((r) => setProducts(r.data))
    }, [])

    const handleOpenCreate = () => {
        setEditTarget(null)
        setPkgForm(emptyPkgForm)
        setShowPkgForm(true)
    }

    const handleOpenEdit = (pkg: Package) => {
        setEditTarget(pkg)
        setPkgForm({ name: pkg.name, description: pkg.description ?? '' })
        setShowPkgForm(true)
    }

    const handleSavePkg = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editTarget) {
                await AxiosBase.put(`/packages/${editTarget.id}`, { name: pkgForm.name, description: pkgForm.description || null })
                notify('success', 'แก้ไขแล้ว')
            } else {
                await AxiosBase.post('/packages', { name: pkgForm.name, description: pkgForm.description || null })
                notify('success', 'สร้างแพ็กเกจแล้ว')
            }
            setShowPkgForm(false)
            await loadPackages()
            if (editTarget && selected?.id === editTarget.id) loadDetail(editTarget.id)
        } catch {
            notify('danger', 'เกิดข้อผิดพลาด')
        }
    }

    const handleDeletePkg = async () => {
        if (!deleteTarget) return
        try {
            await AxiosBase.delete(`/packages/${deleteTarget.id}`)
            setDeleteTarget(null)
            if (selected?.id === deleteTarget.id) setSelected(null)
            await loadPackages()
            notify('success', 'ลบแพ็กเกจแล้ว')
        } catch {
            notify('danger', 'เกิดข้อผิดพลาด')
        }
    }

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selected) return
        try {
            await AxiosBase.post(`/packages/${selected.id}/items`, {
                product_id: addItemProductId,
                quantity: parseFloat(addItemQty),
            })
            setAddItemProductId('')
            setAddItemQty('')
            setShowAddItem(false)
            loadDetail(selected.id)
            notify('success', 'เพิ่มรายการแล้ว')
        } catch {
            notify('danger', 'เกิดข้อผิดพลาด')
        }
    }

    const handleRemoveItem = async () => {
        if (!deleteItemTarget || !selected) return
        try {
            await AxiosBase.delete(`/package_items/${deleteItemTarget.id}`)
            setDeleteItemTarget(null)
            loadDetail(selected.id)
            notify('success', 'ลบรายการแล้ว')
        } catch {
            notify('danger', 'เกิดข้อผิดพลาด')
        }
    }

    const handleShowCost = async () => {
        if (!selected) return
        try {
            const r = await AxiosBase.get<PackageCost>(`/packages/${selected.id}/cost`)
            setCostData(r.data)
            setShowCost(true)
        } catch {
            notify('danger', 'เกิดข้อผิดพลาด')
        }
    }

    const productOptions = products.map((p) => ({
        value: p.id,
        label: p.model ? `${p.name} (${p.model}) — ${p.use_unit}` : `${p.name} — ${p.use_unit}`,
    }))

    const selectedProductForAdd = productOptions.find((o) => o.value === addItemProductId) ?? null

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-72 shrink-0 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">แพ็กเกจ</h2>
                    <Button size="sm" variant="solid" icon={<HiOutlinePlus />} onClick={handleOpenCreate}>
                        สร้าง
                    </Button>
                </div>

                <Input
                    prefix={<HiOutlineSearch />}
                    placeholder="ค้นหาแพ็กเกจ..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                {filteredPackages.length === 0 && (
                    <p className="text-sm text-gray-400 mt-2">
                        {packages.length === 0 ? 'ยังไม่มีแพ็กเกจ' : 'ไม่พบ'}
                    </p>
                )}

                {filteredPackages.map((pkg) => (
                    <Card
                        key={pkg.id}
                        className={`cursor-pointer transition-all ${selected?.id === pkg.id ? 'ring-2 ring-indigo-500' : 'hover:shadow-md'}`}
                        onClick={() => loadDetail(pkg.id)}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="font-medium truncate">{pkg.name}</p>
                                {pkg.description && (
                                    <p className="text-xs text-gray-400 truncate mt-0.5">{pkg.description}</p>
                                )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                                <Button
                                    size="xs"
                                    variant="plain"
                                    icon={<HiOutlinePencil />}
                                    onClick={(e) => { e.stopPropagation(); handleOpenEdit(pkg) }}
                                />
                                <Button
                                    size="xs"
                                    variant="plain"
                                    icon={<HiOutlineTrash />}
                                    customColorClass={() => 'text-red-500 hover:bg-red-50'}
                                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(pkg) }}
                                />
                            </div>
                        </div>
                        {selected?.id === pkg.id && (
                            <HiOutlineChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-500" />
                        )}
                    </Card>
                ))}
            </div>

            <div className="flex-1 min-w-0">
                {!selected ? (
                    <div className="flex items-center justify-center h-64 text-gray-400">
                        เลือกแพ็กเกจทางซ้ายเพื่อดูรายละเอียด
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h3 className="text-lg font-bold">{selected.name}</h3>
                                {selected.description && (
                                    <p className="text-sm text-gray-500">{selected.description}</p>
                                )}
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Button
                                    variant="default"
                                    icon={<HiOutlineCalculator />}
                                    onClick={handleShowCost}
                                    disabled={selected.items.length === 0}
                                >
                                    คำนวณต้นทุน
                                </Button>
                                <Button
                                    variant="solid"
                                    icon={<HiOutlinePlus />}
                                    onClick={() => { setShowAddItem(true); setAddItemProductId(''); setAddItemQty('') }}
                                >
                                    เพิ่มรายการ
                                </Button>
                            </div>
                        </div>

                        <Card bodyClass="p-0">
                            {selected.items.length === 0 ? (
                                <p className="text-center py-8 text-gray-400">ยังไม่มีรายการ — กด "+ เพิ่มรายการ" เพื่อเริ่ม</p>
                            ) : (
                                <div className="overflow-x-auto">
                                <table className="w-full min-w-96">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">วัสดุ/อุปกรณ์</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">โมเดล</th>
                                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">จำนวน</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">หน่วย</th>
                                            <th className="py-3 px-4" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {selected.items.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                <td className="py-3 px-4 font-medium">{item.product_name}</td>
                                                <td className="py-3 px-4 text-gray-500">{item.product_model || '—'}</td>
                                                <td className="py-3 px-4 text-right tabular-nums">{parseFloat(item.quantity).toLocaleString('th-TH')}</td>
                                                <td className="py-3 px-4 text-gray-500">{item.use_unit}</td>
                                                <td className="py-3 px-4">
                                                    <div className="flex justify-end">
                                                        <Button
                                                            size="xs"
                                                            variant="plain"
                                                            icon={<HiOutlineTrash />}
                                                            customColorClass={() => 'text-red-500 hover:bg-red-50'}
                                                            onClick={() => setDeleteItemTarget(item)}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                </div>
                            )}
                        </Card>
                    </div>
                )}
            </div>

            <Dialog isOpen={showPkgForm} onClose={() => setShowPkgForm(false)} onRequestClose={() => setShowPkgForm(false)}>
                <h5 className="mb-4 font-semibold">{editTarget ? 'แก้ไขแพ็กเกจ' : 'สร้างแพ็กเกจใหม่'}</h5>
                <form onSubmit={handleSavePkg} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">ชื่อแพ็กเกจ *</label>
                        <Input
                            value={pkgForm.name}
                            onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })}
                            placeholder="เช่น Huawei 5kW Standard"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">รายละเอียด</label>
                        <Input
                            value={pkgForm.description}
                            onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })}
                            placeholder="อธิบายสั้นๆ (ไม่บังคับ)"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" onClick={() => setShowPkgForm(false)}>ยกเลิก</Button>
                        <Button type="submit" variant="solid" disabled={!pkgForm.name}>{editTarget ? 'บันทึก' : 'สร้าง'}</Button>
                    </div>
                </form>
            </Dialog>

            <Dialog isOpen={showAddItem} onClose={() => setShowAddItem(false)} onRequestClose={() => setShowAddItem(false)}>
                <h5 className="mb-4 font-semibold">เพิ่มรายการใน "{selected?.name}"</h5>
                <form onSubmit={handleAddItem} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">วัสดุ/อุปกรณ์ *</label>
                        <Select
                            options={productOptions}
                            value={selectedProductForAdd}
                            onChange={(opt) => setAddItemProductId(opt?.value ?? '')}
                            placeholder="พิมพ์ชื่อเพื่อค้นหา..."
                            isClearable
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            จำนวน *
                            {addItemProductId && (() => {
                                const p = products.find((x) => x.id === addItemProductId)
                                return p ? <span className="font-normal text-gray-400 ml-1 text-xs">({p.use_unit})</span> : null
                            })()}
                        </label>
                        <Input
                            type="number"
                            min="0"
                            step="any"
                            value={addItemQty}
                            onChange={(e) => setAddItemQty(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" onClick={() => setShowAddItem(false)}>ยกเลิก</Button>
                        <Button type="submit" variant="solid" disabled={!addItemProductId || !addItemQty}>เพิ่ม</Button>
                    </div>
                </form>
            </Dialog>

            <Dialog isOpen={showCost} onClose={() => setShowCost(false)} onRequestClose={() => setShowCost(false)} width={680}>
                {costData && (
                    <>
                        <h5 className="mb-1 font-semibold">ต้นทุนแพ็กเกจ: {costData.package_name}</h5>
                        <p className="text-xs text-gray-400 mb-4">ใช้ราคาถูกสุดของแต่ละรายการ</p>
                        <table className="w-full mb-4">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">รายการ</th>
                                    <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">จำนวน</th>
                                    <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">ราคา/หน่วย</th>
                                    <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">รวม</th>
                                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">ซัพพลายเออร์</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {costData.items.map((item) => (
                                    <tr key={item.item_id} className={!item.has_price ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}>
                                        <td className="py-2 px-3">
                                            <div className="font-medium text-sm">{item.product_name}</div>
                                            {item.product_model && <div className="text-xs text-gray-400">{item.product_model}</div>}
                                        </td>
                                        <td className="py-2 px-3 text-right tabular-nums text-sm">
                                            {parseFloat(item.quantity).toLocaleString('th-TH')} {item.use_unit}
                                        </td>
                                        <td className="py-2 px-3 text-right tabular-nums text-sm">{fmt(item.price_per_use_unit)}</td>
                                        <td className="py-2 px-3 text-right tabular-nums text-sm font-semibold">{fmt(item.cost)}</td>
                                        <td className="py-2 px-3 text-sm text-gray-500">
                                            {item.has_price ? (item.supplier_name ?? '—') : <span className="text-yellow-600">ยังไม่มีราคา</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                                    <td colSpan={3} className="py-3 px-3 text-right font-bold">รวมทั้งหมด</td>
                                    <td className="py-3 px-3 text-right font-bold text-lg tabular-nums text-indigo-600">
                                        {fmt(costData.total_cost)}
                                    </td>
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                        <div className="flex justify-end">
                            <Button onClick={() => setShowCost(false)}>ปิด</Button>
                        </div>
                    </>
                )}
            </Dialog>

            <Dialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onRequestClose={() => setDeleteTarget(null)}>
                <h5 className="mb-2 font-semibold">ยืนยันการลบ</h5>
                <p className="mb-4 text-gray-500">ลบแพ็กเกจ "{deleteTarget?.name}" ใช่ไหม? รายการทั้งหมดในแพ็กเกจนี้จะถูกลบด้วย</p>
                <div className="flex justify-end gap-2">
                    <Button onClick={() => setDeleteTarget(null)}>ยกเลิก</Button>
                    <Button variant="solid" customColorClass={() => 'bg-red-500 hover:bg-red-600 text-white'} onClick={handleDeletePkg}>ลบ</Button>
                </div>
            </Dialog>

            <Dialog isOpen={!!deleteItemTarget} onClose={() => setDeleteItemTarget(null)} onRequestClose={() => setDeleteItemTarget(null)}>
                <h5 className="mb-2 font-semibold">ยืนยันการลบรายการ</h5>
                <p className="mb-4 text-gray-500">ลบ "{deleteItemTarget?.product_name}" ออกจากแพ็กเกจนี้ใช่ไหม?</p>
                <div className="flex justify-end gap-2">
                    <Button onClick={() => setDeleteItemTarget(null)}>ยกเลิก</Button>
                    <Button variant="solid" customColorClass={() => 'bg-red-500 hover:bg-red-600 text-white'} onClick={handleRemoveItem}>ลบ</Button>
                </div>
            </Dialog>
        </div>
    )
}
