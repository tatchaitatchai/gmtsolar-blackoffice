import { useEffect, useState, useMemo } from 'react'
import { Button, Input, Card, Select, Dialog, toast, Notification } from '@/components/ui'
import { HiOutlineTrash, HiOutlinePlus, HiOutlinePencil, HiOutlineCalculator, HiOutlineSearch } from 'react-icons/hi'
import AxiosBase from '@/services/axios/AxiosBase'

type Project = {
    id: string
    name: string
    customer_name: string | null
    address: string | null
    created_at: string
}
type ProjectItemDetail = {
    id: string
    product_id: string
    product_name: string
    product_model: string
    use_unit: string
    quantity: string
    supplier_price_id: string | null
    supplier_name: string | null
    unit_price_snapshot: string
}
type ProjectWithItems = Project & { items: ProjectItemDetail[] }

type ProductOption = {
    id: string
    name: string
    model: string
    use_unit: string
}
type PriceEntry = {
    id: string
    supplier_id: string
    supplier_name: string
    price: string
    price_per_use_unit: string
    use_unit: string
    purchase_unit: string | null
    units_per_purchase: string | null
    is_cheapest: boolean
}

type ProjectItemCost = {
    item_id: string
    product_name: string
    product_model: string
    quantity: string
    use_unit: string
    unit_price_snapshot: string
    cost: string
    supplier_name: string | null
}
type ProjectCost = {
    project_id: string
    project_name: string
    total_cost: string
    items: ProjectItemCost[]
}

type ProjForm = { name: string; customer_name: string; address: string }
const emptyProjForm: ProjForm = { name: '', customer_name: '', address: '' }

const notify = (type: 'success' | 'danger', msg: string) =>
    toast.push(<Notification type={type}>{msg}</Notification>)

const fmt = (n: string) =>
    parseFloat(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [selected, setSelected] = useState<ProjectWithItems | null>(null)
    const [products, setProducts] = useState<ProductOption[]>([])

    const [projForm, setProjForm] = useState<ProjForm>(emptyProjForm)
    const [showProjForm, setShowProjForm] = useState(false)
    const [editTarget, setEditTarget] = useState<Project | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)

    const [addProduct, setAddProduct] = useState<ProductOption | null>(null)
    const [addPrices, setAddPrices] = useState<PriceEntry[]>([])
    const [addPriceId, setAddPriceId] = useState('')
    const [addQty, setAddQty] = useState('')
    const [showAddItem, setShowAddItem] = useState(false)
    const [deleteItemTarget, setDeleteItemTarget] = useState<ProjectItemDetail | null>(null)

    const [costData, setCostData] = useState<ProjectCost | null>(null)
    const [showCost, setShowCost] = useState(false)

    const [search, setSearch] = useState('')

    const filteredProjects = useMemo(() => {
        const q = search.toLowerCase()
        return !q ? projects : projects.filter((p) =>
            p.name.toLowerCase().includes(q) ||
            (p.customer_name ?? '').toLowerCase().includes(q) ||
            (p.address ?? '').toLowerCase().includes(q)
        )
    }, [projects, search])

    const loadProjects = async () => {
        const r = await AxiosBase.get<Project[]>('/projects')
        setProjects(r.data)
    }

    const loadDetail = async (id: string) => {
        const r = await AxiosBase.get<ProjectWithItems>(`/projects/${id}`)
        setSelected(r.data)
    }

    useEffect(() => {
        loadProjects()
        AxiosBase.get<ProductOption[]>('/products').then((r) => setProducts(r.data))
    }, [])

    const handleSelectProduct = async (opt: { value: string; label: string } | null) => {
        if (!opt) {
            setAddProduct(null)
            setAddPrices([])
            setAddPriceId('')
            return
        }
        const p = products.find((x) => x.id === opt.value) ?? null
        setAddProduct(p)
        setAddPriceId('')
        if (p) {
            const r = await AxiosBase.get<PriceEntry[]>(`/products/${p.id}/prices`)
            setAddPrices(r.data)
            const cheapest = r.data.find((x) => x.is_cheapest)
            if (cheapest) setAddPriceId(cheapest.id)
        }
    }

    const handleOpenCreate = () => {
        setEditTarget(null)
        setProjForm(emptyProjForm)
        setShowProjForm(true)
    }

    const handleOpenEdit = (proj: Project) => {
        setEditTarget(proj)
        setProjForm({
            name: proj.name,
            customer_name: proj.customer_name ?? '',
            address: proj.address ?? '',
        })
        setShowProjForm(true)
    }

    const handleSaveProj = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const body = {
                name: projForm.name,
                customer_name: projForm.customer_name || null,
                address: projForm.address || null,
            }
            if (editTarget) {
                await AxiosBase.put(`/projects/${editTarget.id}`, body)
                notify('success', 'แก้ไขแล้ว')
            } else {
                await AxiosBase.post('/projects', body)
                notify('success', 'สร้างโปรเจกต์แล้ว')
            }
            setShowProjForm(false)
            await loadProjects()
            if (editTarget && selected?.id === editTarget.id) loadDetail(editTarget.id)
        } catch {
            notify('danger', 'เกิดข้อผิดพลาด')
        }
    }

    const handleDeleteProj = async () => {
        if (!deleteTarget) return
        try {
            await AxiosBase.delete(`/projects/${deleteTarget.id}`)
            setDeleteTarget(null)
            if (selected?.id === deleteTarget.id) setSelected(null)
            await loadProjects()
            notify('success', 'ลบโปรเจกต์แล้ว')
        } catch {
            notify('danger', 'เกิดข้อผิดพลาด')
        }
    }

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selected || !addProduct) return
        try {
            await AxiosBase.post(`/projects/${selected.id}/items`, {
                product_id: addProduct.id,
                supplier_price_id: addPriceId || null,
                quantity: parseFloat(addQty),
            })
            setAddProduct(null)
            setAddPrices([])
            setAddPriceId('')
            setAddQty('')
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
            await AxiosBase.delete(`/project_items/${deleteItemTarget.id}`)
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
            const r = await AxiosBase.get<ProjectCost>(`/projects/${selected.id}/cost`)
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

    const priceOptions = addPrices.map((sp) => ({
        value: sp.id,
        label: `${sp.supplier_name} — ฿${fmt(sp.price_per_use_unit)}/${sp.use_unit}${sp.is_cheapest ? ' ★ ถูกสุด' : ''}`,
    }))

    const selectedPriceOpt = priceOptions.find((o) => o.value === addPriceId) ?? null
    const selectedProductOpt = addProduct ? productOptions.find((o) => o.value === addProduct.id) ?? null : null

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-72 shrink-0 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">โปรเจกต์</h2>
                    <Button size="sm" variant="solid" icon={<HiOutlinePlus />} onClick={handleOpenCreate}>
                        สร้าง
                    </Button>
                </div>

                <Input
                    prefix={<HiOutlineSearch />}
                    placeholder="ค้นหาโปรเจกต์ / ลูกค้า..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                {filteredProjects.length === 0 && (
                    <p className="text-sm text-gray-400 mt-2">
                        {projects.length === 0 ? 'ยังไม่มีโปรเจกต์' : 'ไม่พบ'}
                    </p>
                )}

                {filteredProjects.map((proj) => (
                    <Card
                        key={proj.id}
                        className={`cursor-pointer transition-all ${selected?.id === proj.id ? 'ring-2 ring-indigo-500' : 'hover:shadow-md'}`}
                        onClick={() => loadDetail(proj.id)}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="font-medium truncate">{proj.name}</p>
                                {proj.customer_name && (
                                    <p className="text-xs text-gray-400 truncate mt-0.5">👤 {proj.customer_name}</p>
                                )}
                                {proj.address && (
                                    <p className="text-xs text-gray-400 truncate">📍 {proj.address}</p>
                                )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                                <Button
                                    size="xs"
                                    variant="plain"
                                    icon={<HiOutlinePencil />}
                                    onClick={(e) => { e.stopPropagation(); handleOpenEdit(proj) }}
                                />
                                <Button
                                    size="xs"
                                    variant="plain"
                                    icon={<HiOutlineTrash />}
                                    customColorClass={() => 'text-red-500 hover:bg-red-50'}
                                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(proj) }}
                                />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="flex-1 min-w-0">
                {!selected ? (
                    <div className="flex items-center justify-center h-64 text-gray-400">
                        เลือกโปรเจกต์ทางซ้ายเพื่อดูรายละเอียด
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h3 className="text-lg font-bold">{selected.name}</h3>
                                {selected.customer_name && (
                                    <p className="text-sm text-gray-500">👤 {selected.customer_name}</p>
                                )}
                                {selected.address && (
                                    <p className="text-sm text-gray-500">📍 {selected.address}</p>
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
                                    onClick={() => {
                                        setAddProduct(null)
                                        setAddPrices([])
                                        setAddPriceId('')
                                        setAddQty('')
                                        setShowAddItem(true)
                                    }}
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
                                <table className="w-full min-w-120">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">วัสดุ/อุปกรณ์</th>
                                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">จำนวน</th>
                                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">ราคา/หน่วย (lock)</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">ซัพพลายเออร์</th>
                                            <th className="py-3 px-4" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {selected.items.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                <td className="py-3 px-4">
                                                    <div className="font-medium">{item.product_name}</div>
                                                    {item.product_model && (
                                                        <div className="text-xs text-gray-400">{item.product_model}</div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-right tabular-nums">
                                                    {parseFloat(item.quantity).toLocaleString('th-TH')} {item.use_unit}
                                                </td>
                                                <td className="py-3 px-4 text-right tabular-nums">
                                                    {parseFloat(item.unit_price_snapshot) === 0
                                                        ? <span className="text-yellow-500 text-sm">ยังไม่มีราคา</span>
                                                        : <span>฿{fmt(item.unit_price_snapshot)}</span>
                                                    }
                                                </td>
                                                <td className="py-3 px-4 text-gray-500 text-sm">
                                                    {item.supplier_name ?? '—'}
                                                </td>
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

            <Dialog isOpen={showProjForm} onClose={() => setShowProjForm(false)} onRequestClose={() => setShowProjForm(false)}>
                <h5 className="mb-4 font-semibold">{editTarget ? 'แก้ไขโปรเจกต์' : 'สร้างโปรเจกต์ใหม่'}</h5>
                <form onSubmit={handleSaveProj} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">ชื่อโปรเจกต์ *</label>
                        <Input
                            value={projForm.name}
                            onChange={(e) => setProjForm({ ...projForm, name: e.target.value })}
                            placeholder="เช่น บ้านคุณสมชาย ซ.รามอินทรา 5"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">ชื่อลูกค้า</label>
                        <Input
                            value={projForm.customer_name}
                            onChange={(e) => setProjForm({ ...projForm, customer_name: e.target.value })}
                            placeholder="ชื่อเจ้าของบ้าน"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">ที่อยู่</label>
                        <Input
                            value={projForm.address}
                            onChange={(e) => setProjForm({ ...projForm, address: e.target.value })}
                            placeholder="ที่อยู่ติดตั้ง"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" onClick={() => setShowProjForm(false)}>ยกเลิก</Button>
                        <Button type="submit" variant="solid" disabled={!projForm.name}>{editTarget ? 'บันทึก' : 'สร้าง'}</Button>
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
                            value={selectedProductOpt}
                            onChange={handleSelectProduct}
                            placeholder="พิมพ์ชื่อเพื่อค้นหา..."
                            isClearable
                        />
                    </div>

                    {addProduct && (
                        <div>
                            <label className="block text-sm font-medium mb-1">ราคาที่ใช้</label>
                            {addPrices.length === 0 ? (
                                <p className="text-sm text-yellow-600 bg-yellow-50 rounded p-2">
                                    ยังไม่มีราคาสำหรับสินค้านี้ — ราคาจะถูกบันทึกเป็น ฿0
                                </p>
                            ) : (
                                <Select
                                    options={priceOptions}
                                    value={selectedPriceOpt}
                                    onChange={(opt) => setAddPriceId(opt?.value ?? '')}
                                    placeholder="เลือกราคา/ซัพพลายเออร์"
                                    isClearable
                                />
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            จำนวน *
                            {addProduct && (
                                <span className="font-normal text-gray-400 ml-1 text-xs">({addProduct.use_unit})</span>
                            )}
                        </label>
                        <Input
                            type="number"
                            min="0"
                            step="any"
                            value={addQty}
                            onChange={(e) => setAddQty(e.target.value)}
                            required
                        />
                    </div>

                    {addPriceId && addPrices.length > 0 && (() => {
                        const sp = addPrices.find((x) => x.id === addPriceId)
                        if (!sp || !addQty) return null
                        const qty = parseFloat(addQty)
                        if (isNaN(qty)) return null
                        const ppu = parseFloat(sp.price_per_use_unit)
                        const total = ppu * qty
                        return (
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded p-3 text-sm">
                                <span className="text-gray-500">ต้นทุนรายการนี้: </span>
                                <strong>฿{total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong>
                                <span className="text-gray-400 ml-2 text-xs">(snapshot ราคา ณ วันนี้)</span>
                            </div>
                        )
                    })()}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" onClick={() => setShowAddItem(false)}>ยกเลิก</Button>
                        <Button type="submit" variant="solid" disabled={!addProduct || !addQty}>เพิ่ม</Button>
                    </div>
                </form>
            </Dialog>

            <Dialog isOpen={showCost} onClose={() => setShowCost(false)} onRequestClose={() => setShowCost(false)} width={720}>
                {costData && (
                    <>
                        <h5 className="mb-1 font-semibold">ต้นทุนโปรเจกต์: {costData.project_name}</h5>
                        <p className="text-xs text-gray-400 mb-4">ใช้ราคา ณ วันที่เพิ่มรายการ (snapshot)</p>
                        <div className="overflow-y-auto max-h-[55vh]">
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
                                {costData.items.map((item) => {
                                    const noPrice = parseFloat(item.unit_price_snapshot) === 0
                                    return (
                                        <tr key={item.item_id} className={noPrice ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}>
                                            <td className="py-2 px-3">
                                                <div className="font-medium text-sm">{item.product_name}</div>
                                                {item.product_model && (
                                                    <div className="text-xs text-gray-400">{item.product_model}</div>
                                                )}
                                            </td>
                                            <td className="py-2 px-3 text-right tabular-nums text-sm">
                                                {parseFloat(item.quantity).toLocaleString('th-TH')} {item.use_unit}
                                            </td>
                                            <td className="py-2 px-3 text-right tabular-nums text-sm">
                                                {noPrice ? <span className="text-yellow-600">ยังไม่มีราคา</span> : `฿${fmt(item.unit_price_snapshot)}`}
                                            </td>
                                            <td className="py-2 px-3 text-right tabular-nums text-sm font-semibold">
                                                {noPrice ? '—' : `฿${fmt(item.cost)}`}
                                            </td>
                                            <td className="py-2 px-3 text-sm text-gray-500">
                                                {item.supplier_name ?? '—'}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                                    <td colSpan={3} className="py-3 px-3 text-right font-bold">รวมทั้งหมด</td>
                                    <td className="py-3 px-3 text-right font-bold text-lg tabular-nums text-indigo-600">
                                        ฿{fmt(costData.total_cost)}
                                    </td>
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button onClick={() => setShowCost(false)}>ปิด</Button>
                        </div>
                    </>
                )}
            </Dialog>

            <Dialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onRequestClose={() => setDeleteTarget(null)}>
                <h5 className="mb-2 font-semibold">ยืนยันการลบ</h5>
                <p className="mb-4 text-gray-500">
                    ลบโปรเจกต์ "{deleteTarget?.name}" ใช่ไหม? รายการทั้งหมดในโปรเจกต์นี้จะถูกลบด้วย
                </p>
                <div className="flex justify-end gap-2">
                    <Button onClick={() => setDeleteTarget(null)}>ยกเลิก</Button>
                    <Button variant="solid" customColorClass={() => 'bg-red-500 hover:bg-red-600 text-white'} onClick={handleDeleteProj}>ลบ</Button>
                </div>
            </Dialog>

            <Dialog isOpen={!!deleteItemTarget} onClose={() => setDeleteItemTarget(null)} onRequestClose={() => setDeleteItemTarget(null)}>
                <h5 className="mb-2 font-semibold">ยืนยันการลบรายการ</h5>
                <p className="mb-4 text-gray-500">
                    ลบ "{deleteItemTarget?.product_name}" ออกจากโปรเจกต์นี้ใช่ไหม?
                </p>
                <div className="flex justify-end gap-2">
                    <Button onClick={() => setDeleteItemTarget(null)}>ยกเลิก</Button>
                    <Button variant="solid" customColorClass={() => 'bg-red-500 hover:bg-red-600 text-white'} onClick={handleRemoveItem}>ลบ</Button>
                </div>
            </Dialog>
        </div>
    )
}
