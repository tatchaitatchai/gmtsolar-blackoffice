import { useEffect, useState, useMemo } from 'react'
import { Button, Input, Card, Select, Dialog, toast, Notification, Checkbox } from '@/components/ui'
import {
    HiOutlineTrash, HiOutlinePlus, HiOutlinePencil, HiOutlineCalculator,
    HiOutlineSearch, HiOutlineDownload, HiOutlineViewGridAdd, HiOutlineDocumentText,
    HiOutlineEye, HiOutlineEyeOff,
} from 'react-icons/hi'
import { PDFDownloadLink } from '@react-pdf/renderer'
import AxiosBase from '@/services/axios/AxiosBase'
import QuotationPDF from './QuotationPDF'
import type { QuotationData } from './QuotationPDF'

type Project = {
    id: string
    name: string
    customer_name: string | null
    address: string | null
    vat_percent: string
    overhead_percent: string
    show_overhead: boolean
    qt_number: string | null
    created_at: string
}

type ProjectItemGroup = {
    id: string
    project_id: string
    name: string
    sort_order: number
    custom_sell_price: string | null
    is_visible: boolean
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
    markup_percent: string
    group_id: string | null
}

type ProjectWithItems = Project & {
    items: ProjectItemDetail[]
    groups: ProjectItemGroup[]
}

type ProductOption = {
    id: string
    name: string
    model: string
    use_unit: string
    category_id: string
    brand_id: string
    category_name: string
    brand_name: string
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
    markup_percent: string
    cost: string
    sell_price: string
    supplier_name: string | null
    group_id: string | null
}

type ProjectGroupCost = {
    group_id: string
    name: string
    custom_sell_price: string | null
    is_visible: boolean
    items: ProjectItemCost[]
    group_cost: string
    group_sell_price: string
}

type ProjectCost = {
    project_id: string
    project_name: string
    total_cost: string
    total_sell_price: string
    vat_percent: string
    overhead_percent: string
    show_overhead: boolean
    qt_number: string | null
    overhead_amount: string
    vat_amount: string
    grand_total: string
    groups: ProjectGroupCost[]
    ungrouped_items: ProjectItemCost[]
}

type Package = {
    id: string
    name: string
    description: string | null
}

type PackageItemDetail = {
    id: string
    product_id: string
    product_name: string
    product_model: string
    use_unit: string
    quantity: string
}

type PackageWithItems = Package & { items: PackageItemDetail[] }

type ProjForm = { name: string; customer_name: string; address: string }
const emptyProjForm: ProjForm = { name: '', customer_name: '', address: '' }

type GroupForm = { name: string; custom_sell_price: string; is_visible: boolean }
const emptyGroupForm: GroupForm = { name: '', custom_sell_price: '', is_visible: true }

const notify = (type: 'success' | 'danger', msg: string) =>
    toast.push(<Notification type={type}>{msg}</Notification>)

const fmt = (n: string | number) =>
    parseFloat(String(n)).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

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
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
    const [localVat, setLocalVat] = useState('7')
    const [localOverhead, setLocalOverhead] = useState('0')
    const [localShowOverhead, setLocalShowOverhead] = useState(true)
    const [localQtNumber, setLocalQtNumber] = useState('')
    const [savingPricing, setSavingPricing] = useState(false)

    const [search, setSearch] = useState('')
    const [filterCategoryId, setFilterCategoryId] = useState('')
    const [filterBrandId, setFilterBrandId] = useState('')

    const [packages, setPackages] = useState<Package[]>([])
    const [showImportPkg, setShowImportPkg] = useState(false)
    const [importPkgId, setImportPkgId] = useState('')
    const [importPkgDetail, setImportPkgDetail] = useState<PackageWithItems | null>(null)
    const [importSelectedIds, setImportSelectedIds] = useState<Set<string>>(new Set())

    const [showGroupDialog, setShowGroupDialog] = useState(false)
    const [editGroupTarget, setEditGroupTarget] = useState<ProjectItemGroup | null>(null)
    const [groupForm, setGroupForm] = useState<GroupForm>(emptyGroupForm)

    const [editingMarkup, setEditingMarkup] = useState<Record<string, string>>({})

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
        AxiosBase.get<Package[]>('/packages').then((r) => setPackages(r.data))
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
            setExpandedGroups(new Set(r.data.groups.map((g) => g.group_id)))
            setLocalVat(r.data.vat_percent)
            setLocalOverhead(r.data.overhead_percent)
            setLocalShowOverhead(r.data.show_overhead)
            setLocalQtNumber(r.data.qt_number ?? '')
            setShowCost(true)
        } catch {
            notify('danger', 'เกิดข้อผิดพลาด')
        }
    }

    const handleSavePricing = async () => {
        if (!selected) return
        setSavingPricing(true)
        try {
            await AxiosBase.put(`/projects/${selected.id}/pricing`, {
                vat_percent: parseFloat(localVat) || 0,
                overhead_percent: parseFloat(localOverhead) || 0,
                show_overhead: localShowOverhead,
                qt_number: localQtNumber || null,
            })
            const r = await AxiosBase.get<ProjectCost>(`/projects/${selected.id}/cost`)
            setCostData(r.data)
            await loadDetail(selected.id)
            notify('success', 'บันทึกการตั้งค่าแล้ว')
        } catch {
            notify('danger', 'เกิดข้อผิดพลาด')
        } finally {
            setSavingPricing(false)
        }
    }

    const handleMarkupBlur = async (item: ProjectItemDetail, val: string) => {
        const pct = parseFloat(val)
        if (isNaN(pct)) return
        try {
            await AxiosBase.put(`/project_items/${item.id}`, {
                markup_percent: pct,
                group_id: item.group_id,
            })
            if (selected) loadDetail(selected.id)
        } catch {
            notify('danger', 'เกิดข้อผิดพลาด')
        }
    }

    const handleAssignGroup = async (item: ProjectItemDetail, groupId: string | null) => {
        try {
            await AxiosBase.put(`/project_items/${item.id}`, {
                markup_percent: parseFloat(item.markup_percent),
                group_id: groupId,
            })
            if (selected) loadDetail(selected.id)
        } catch {
            notify('danger', 'เกิดข้อผิดพลาด')
        }
    }

    const handleOpenGroupDialog = (group?: ProjectItemGroup) => {
        if (group) {
            setEditGroupTarget(group)
            setGroupForm({
                name: group.name,
                custom_sell_price: group.custom_sell_price ?? '',
                is_visible: group.is_visible,
            })
        } else {
            setEditGroupTarget(null)
            setGroupForm(emptyGroupForm)
        }
        setShowGroupDialog(true)
    }

    const handleSaveGroup = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selected) return
        try {
            const body = {
                name: groupForm.name,
                custom_sell_price: groupForm.custom_sell_price ? parseFloat(groupForm.custom_sell_price) : null,
                is_visible: groupForm.is_visible,
            }
            if (editGroupTarget) {
                await AxiosBase.put(`/project_groups/${editGroupTarget.id}`, body)
                notify('success', 'อัปเดตกลุ่มแล้ว')
            } else {
                const nextOrder = selected.groups.length
                await AxiosBase.post(`/projects/${selected.id}/groups`, { ...body, sort_order: nextOrder })
                notify('success', 'สร้างกลุ่มแล้ว')
            }
            setShowGroupDialog(false)
            loadDetail(selected.id)
        } catch {
            notify('danger', 'เกิดข้อผิดพลาด')
        }
    }

    const handleDeleteGroup = async (group: ProjectItemGroup) => {
        try {
            await AxiosBase.delete(`/project_groups/${group.id}`)
            notify('success', 'ลบกลุ่มแล้ว')
            if (selected) loadDetail(selected.id)
        } catch {
            notify('danger', 'เกิดข้อผิดพลาด')
        }
    }

    const handleToggleGroupVisibility = async (group: ProjectItemGroup) => {
        try {
            await AxiosBase.put(`/project_groups/${group.id}`, {
                name: group.name,
                custom_sell_price: group.custom_sell_price ? parseFloat(group.custom_sell_price) : null,
                is_visible: !group.is_visible,
            })
            if (selected) loadDetail(selected.id)
        } catch {
            notify('danger', 'เกิดข้อผิดพลาด')
        }
    }

    const handleOpenImportPkg = () => {
        setImportPkgId('')
        setImportPkgDetail(null)
        setImportSelectedIds(new Set())
        setShowImportPkg(true)
    }

    const handleSelectImportPkg = async (opt: { value: string; label: string } | null) => {
        if (!opt) {
            setImportPkgId('')
            setImportPkgDetail(null)
            return
        }
        setImportPkgId(opt.value)
        const r = await AxiosBase.get<PackageWithItems>(`/packages/${opt.value}`)
        setImportPkgDetail(r.data)
        setImportSelectedIds(new Set(r.data.items.map((i) => i.id)))
    }

    const handleImportPackage = async () => {
        if (!selected || !importPkgDetail) return
        try {
            await AxiosBase.post(`/projects/${selected.id}/import-package`, {
                package_id: importPkgDetail.id,
                item_ids: Array.from(importSelectedIds),
            })
            setShowImportPkg(false)
            loadDetail(selected.id)
            notify('success', `นำเข้า ${importSelectedIds.size} รายการจากแพ็กเกจแล้ว`)
        } catch {
            notify('danger', 'เกิดข้อผิดพลาด')
        }
    }

    const categoryOptions = useMemo(() => {
        const seen = new Set<string>()
        return products
            .filter((p) => { if (seen.has(p.category_id)) return false; seen.add(p.category_id); return true })
            .map((p) => ({ value: p.category_id, label: p.category_name }))
    }, [products])

    const brandOptions = useMemo(() => {
        const seen = new Set<string>()
        return products
            .filter((p) => { if (seen.has(p.brand_id)) return false; seen.add(p.brand_id); return true })
            .map((p) => ({ value: p.brand_id, label: p.brand_name }))
    }, [products])

    const filteredProductOptions = useMemo(() =>
        products
            .filter((p) =>
                (!filterCategoryId || p.category_id === filterCategoryId) &&
                (!filterBrandId || p.brand_id === filterBrandId)
            )
            .map((p) => ({
                value: p.id,
                label: p.model ? `${p.name} (${p.model}) — ${p.use_unit}` : `${p.name} — ${p.use_unit}`,
            }))
    , [products, filterCategoryId, filterBrandId])

    const priceOptions = addPrices.map((sp) => ({
        value: sp.id,
        label: `${sp.supplier_name} — ฿${fmt(sp.price_per_use_unit)}/${sp.use_unit}${sp.is_cheapest ? ' ★ ถูกสุด' : ''}`,
    }))

    const selectedPriceOpt = priceOptions.find((o) => o.value === addPriceId) ?? null
    const selectedProductOpt = addProduct ? filteredProductOptions.find((o) => o.value === addProduct.id) ?? null : null

    const packageOptions = packages.map((p) => ({ value: p.id, label: p.name }))
    const selectedPkgOpt = packageOptions.find((o) => o.value === importPkgId) ?? null

    const groupOptions = useMemo(() => [
        { value: '', label: '— ไม่มีกลุ่ม —' },
        ...(selected?.groups ?? []).map((g) => ({ value: g.id, label: g.name })),
    ], [selected?.groups])

    const itemsByGroup = useMemo(() => {
        if (!selected) return { groups: [], ungrouped: [] as ProjectItemDetail[] }
        const byGroupId: Record<string, ProjectItemDetail[]> = {}
        const ungrouped: ProjectItemDetail[] = []
        for (const item of selected.items) {
            if (item.group_id) {
                byGroupId[item.group_id] = byGroupId[item.group_id] ?? []
                byGroupId[item.group_id].push(item)
            } else {
                ungrouped.push(item)
            }
        }
        const groups = selected.groups.map((g) => ({ group: g, items: byGroupId[g.id] ?? [] }))
        return { groups, ungrouped }
    }, [selected])

    const renderItemRow = (item: ProjectItemDetail, grouped = false) => {
        const markupVal = editingMarkup[item.id] ?? item.markup_percent
        const groupOpt = groupOptions.find((o) => o.value === (item.group_id ?? '')) ?? groupOptions[0]
        return (
            <tr
                key={item.id}
                className={grouped
                    ? 'bg-indigo-50/40 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-l-4 border-l-indigo-300 dark:border-l-indigo-600'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                }
            >
                <td className={`py-2 pr-3 ${grouped ? 'pl-5' : 'pl-3'}`}>
                    <div className="font-medium text-sm">{item.product_name}</div>
                    {item.product_model && (
                        <div className="text-xs text-gray-400">{item.product_model}</div>
                    )}
                </td>
                <td className="py-2 px-3 text-right tabular-nums text-sm">
                    {parseFloat(item.quantity).toLocaleString('th-TH')} {item.use_unit}
                </td>
                <td className="py-2 px-3 text-right tabular-nums text-sm">
                    {parseFloat(item.unit_price_snapshot) === 0
                        ? <span className="text-yellow-500 text-xs">ยังไม่มีราคา</span>
                        : <span>฿{fmt(item.unit_price_snapshot)}</span>
                    }
                </td>
                <td className="py-2 px-3">
                    <Input
                        size="sm"
                        type="number"
                        min="0"
                        step="0.1"
                        suffix="%"
                        className="w-24 text-right"
                        value={markupVal}
                        onChange={(e) => setEditingMarkup((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        onBlur={(e) => {
                            handleMarkupBlur(item, e.target.value)
                            setEditingMarkup((prev) => { const n = { ...prev }; delete n[item.id]; return n })
                        }}
                    />
                </td>
                <td className="py-2 px-3 min-w-[130px]">
                    <Select
                        size="sm"
                        options={groupOptions}
                        value={groupOpt}
                        onChange={(opt) => handleAssignGroup(item, opt?.value || null)}
                        isSearchable={false}
                    />
                </td>
                <td className="py-2 px-3 text-gray-500 text-sm">
                    {item.supplier_name ?? '—'}
                </td>
                <td className="py-2 px-3">
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
        )
    }

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
                            <div className="flex flex-wrap gap-2 shrink-0">
                                <Button
                                    variant="default"
                                    icon={<HiOutlineCalculator />}
                                    onClick={handleShowCost}
                                    disabled={selected.items.length === 0}
                                >
                                    สรุปราคา
                                </Button>
                                <Button
                                    variant="default"
                                    icon={<HiOutlineDownload />}
                                    onClick={handleOpenImportPkg}
                                >
                                    นำเข้าแพ็กเกจ
                                </Button>
                                <Button
                                    variant="default"
                                    icon={<HiOutlineViewGridAdd />}
                                    onClick={() => handleOpenGroupDialog()}
                                >
                                    สร้างกลุ่ม
                                </Button>
                                <Button
                                    variant="solid"
                                    icon={<HiOutlinePlus />}
                                    onClick={() => {
                                        setAddProduct(null)
                                        setAddPrices([])
                                        setAddPriceId('')
                                        setAddQty('')
                                        setFilterCategoryId('')
                                        setFilterBrandId('')
                                        setShowAddItem(true)
                                    }}
                                >
                                    เพิ่มรายการ
                                </Button>
                            </div>
                        </div>

                        <Card bodyClass="p-0">
                            {selected.items.length === 0 ? (
                                <p className="text-center py-8 text-gray-400">ยังไม่มีรายการ — กด "+ เพิ่มรายการ" หรือ "นำเข้าแพ็กเกจ"</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[700px]">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                                <th className="text-left py-3 px-3 text-sm font-medium text-gray-500">วัสดุ/อุปกรณ์</th>
                                                <th className="text-right py-3 px-3 text-sm font-medium text-gray-500">จำนวน</th>
                                                <th className="text-right py-3 px-3 text-sm font-medium text-gray-500">ราคา/หน่วย</th>
                                                <th className="text-center py-3 px-3 text-sm font-medium text-gray-500">Markup</th>
                                                <th className="text-left py-3 px-3 text-sm font-medium text-gray-500">กลุ่ม</th>
                                                <th className="text-left py-3 px-3 text-sm font-medium text-gray-500">ซัพพลายเออร์</th>
                                                <th className="py-3 px-3" />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {itemsByGroup.groups.map(({ group, items: gItems }) => (
                                                <>
                                                    <tr key={`g-${group.id}`} className="bg-indigo-100 dark:bg-indigo-900/40 border-l-4 border-l-indigo-400 dark:border-l-indigo-500">
                                                        <td colSpan={5} className="py-2 pl-3 pr-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-indigo-800 dark:text-indigo-200 text-sm tracking-wide">
                                                                    ▸ {group.name}
                                                                </span>
                                                                {!group.is_visible && (
                                                                    <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">ซ่อนใบเสนอราคา</span>
                                                                )}
                                                                {group.custom_sell_price && (
                                                                    <span className="text-xs text-green-700 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded font-medium">ราคาขาย ฿{fmt(group.custom_sell_price)}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td colSpan={2} className="py-2 px-3">
                                                            <div className="flex justify-end gap-1">
                                                                <Button
                                                                    size="xs"
                                                                    variant="plain"
                                                                    icon={group.is_visible ? <HiOutlineEye /> : <HiOutlineEyeOff />}
                                                                    customColorClass={() => group.is_visible ? 'text-indigo-500 hover:bg-indigo-50' : 'text-gray-400 hover:bg-gray-100'}
                                                                    onClick={() => handleToggleGroupVisibility(group)}
                                                                    title={group.is_visible ? 'แสดงในใบเสนอราคา (คลิกเพื่อซ่อน)' : 'ซ่อนในใบเสนอราคา (คลิกเพื่อแสดง)'}
                                                                />
                                                                <Button size="xs" variant="plain" icon={<HiOutlinePencil />}
                                                                    onClick={() => handleOpenGroupDialog(group)} />
                                                                <Button size="xs" variant="plain" icon={<HiOutlineTrash />}
                                                                    customColorClass={() => 'text-red-500 hover:bg-red-50'}
                                                                    onClick={() => handleDeleteGroup(group)} />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {gItems.map((item) => renderItemRow(item, true))}
                                                    <tr key={`g-end-${group.id}`} className="border-l-4 border-l-indigo-300 dark:border-l-indigo-600">
                                                        <td colSpan={7} className="py-0.5 bg-indigo-100/60 dark:bg-indigo-900/20" />
                                                    </tr>
                                                </>
                                            ))}
                                            {itemsByGroup.ungrouped.map((item) => renderItemRow(item, false))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    </div>
                )}
            </div>

            {/* Create / Edit Project */}
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

            {/* Add Item */}
            <Dialog isOpen={showAddItem} onClose={() => setShowAddItem(false)} onRequestClose={() => setShowAddItem(false)}>
                <h5 className="mb-4 font-semibold">เพิ่มรายการใน "{selected?.name}"</h5>
                <form onSubmit={handleAddItem} className="space-y-4">
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">ประเภท</label>
                            <Select
                                options={categoryOptions}
                                value={categoryOptions.find((o) => o.value === filterCategoryId) ?? null}
                                onChange={(opt) => { setFilterCategoryId(opt?.value ?? ''); handleSelectProduct(null) }}
                                placeholder="ทุกประเภท"
                                isClearable
                                isSearchable
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">แบรนด์</label>
                            <Select
                                options={brandOptions}
                                value={brandOptions.find((o) => o.value === filterBrandId) ?? null}
                                onChange={(opt) => { setFilterBrandId(opt?.value ?? ''); handleSelectProduct(null) }}
                                placeholder="ทุกแบรนด์"
                                isClearable
                                isSearchable
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">วัสดุ/อุปกรณ์ *</label>
                        <Select
                            options={filteredProductOptions}
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

            {/* Import Package */}
            <Dialog isOpen={showImportPkg} onClose={() => setShowImportPkg(false)} onRequestClose={() => setShowImportPkg(false)} width={560}>
                <h5 className="mb-4 font-semibold">นำเข้าจากแพ็กเกจ</h5>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">เลือกแพ็กเกจ</label>
                        <Select
                            options={packageOptions}
                            value={selectedPkgOpt}
                            onChange={handleSelectImportPkg}
                            placeholder="เลือกแพ็กเกจ..."
                            isSearchable
                        />
                    </div>

                    {importPkgDetail && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium">รายการ ({importSelectedIds.size}/{importPkgDetail.items.length})</label>
                                <div className="flex gap-2 text-xs">
                                    <button
                                        className="text-indigo-600 hover:underline"
                                        onClick={() => setImportSelectedIds(new Set(importPkgDetail.items.map((i) => i.id)))}
                                    >
                                        เลือกทั้งหมด
                                    </button>
                                    <button
                                        className="text-gray-400 hover:underline"
                                        onClick={() => setImportSelectedIds(new Set())}
                                    >
                                        ยกเลิกทั้งหมด
                                    </button>
                                </div>
                            </div>
                            <div className="border border-gray-200 dark:border-gray-700 rounded overflow-y-auto max-h-64">
                                {importPkgDetail.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0"
                                        onClick={() => setImportSelectedIds((prev) => {
                                            const next = new Set(prev)
                                            if (next.has(item.id)) next.delete(item.id)
                                            else next.add(item.id)
                                            return next
                                        })}
                                    >
                                        <Checkbox
                                            checked={importSelectedIds.has(item.id)}
                                            readOnly
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">{item.product_name}</div>
                                            {item.product_model && (
                                                <div className="text-xs text-gray-400">{item.product_model}</div>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500 shrink-0">
                                            {parseFloat(item.quantity).toLocaleString('th-TH')} {item.use_unit}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button onClick={() => setShowImportPkg(false)}>ยกเลิก</Button>
                        <Button
                            variant="solid"
                            disabled={!importPkgDetail || importSelectedIds.size === 0}
                            onClick={handleImportPackage}
                        >
                            นำเข้า {importSelectedIds.size > 0 ? `(${importSelectedIds.size})` : ''}
                        </Button>
                    </div>
                </div>
            </Dialog>

            {/* Create / Edit Group */}
            <Dialog isOpen={showGroupDialog} onClose={() => setShowGroupDialog(false)} onRequestClose={() => setShowGroupDialog(false)}>
                <h5 className="mb-4 font-semibold">{editGroupTarget ? 'แก้ไขกลุ่ม' : 'สร้างกลุ่มใหม่'}</h5>
                <form onSubmit={handleSaveGroup} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">ชื่อกลุ่ม *</label>
                        <Input
                            value={groupForm.name}
                            onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                            placeholder="เช่น ค่าติดตั้ง, อุปกรณ์หลัก"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">ราคาขาย custom (ถ้าว่าง = ใช้ค่าคำนวณ)</label>
                        <Input
                            type="number"
                            min="0"
                            step="any"
                            prefix="฿"
                            value={groupForm.custom_sell_price}
                            onChange={(e) => setGroupForm({ ...groupForm, custom_sell_price: e.target.value })}
                            placeholder="ปล่อยว่างเพื่อให้ระบบคำนวณเอง"
                        />
                    </div>
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => setGroupForm({ ...groupForm, is_visible: !groupForm.is_visible })}
                    >
                        <Checkbox checked={groupForm.is_visible} readOnly />
                        <div>
                            <span className="text-sm font-medium">แสดงรายละเอียดในใบเสนอราคา</span>
                            <p className="text-xs text-gray-400">ถ้าปิด จะแสดงเฉพาะชื่อกลุ่มและราคารวม</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" onClick={() => setShowGroupDialog(false)}>ยกเลิก</Button>
                        <Button type="submit" variant="solid" disabled={!groupForm.name}>
                            {editGroupTarget ? 'บันทึก' : 'สร้าง'}
                        </Button>
                    </div>
                </form>
            </Dialog>

            {/* Cost Dialog */}
            <Dialog isOpen={showCost} onClose={() => setShowCost(false)} onRequestClose={() => setShowCost(false)} width={900}>
                {costData && (() => {
                    const sellPrice = parseFloat(costData.total_sell_price)
                    const vat = parseFloat(localVat) || 0
                    const overhead = parseFloat(localOverhead) || 0
                    const overheadAmt = localShowOverhead ? sellPrice * overhead / 100 : 0
                    const preVat = sellPrice + overheadAmt
                    const vatAmt = preVat * vat / 100
                    const grandTotal = preVat + vatAmt
                    return (
                    <>
                        <h5 className="mb-1 font-semibold">สรุปราคา: {costData.project_name}</h5>
                        <p className="text-xs text-gray-400 mb-3">ราคาต้นทุน = snapshot ณ วันที่เพิ่ม | ราคาขาย = ต้นทุน × (1 + Markup%)</p>
                        <div className="overflow-y-auto max-h-[75vh] pr-1">
                        <table className="w-full mb-4 text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="text-left py-2 px-3 font-medium text-gray-500">รายการ</th>
                                        <th className="text-right py-2 px-3 font-medium text-gray-500">จำนวน</th>
                                        <th className="text-right py-2 px-3 font-medium text-gray-500">ต้นทุน/หน่วย</th>
                                        <th className="text-right py-2 px-3 font-medium text-gray-500">Markup</th>
                                        <th className="text-right py-2 px-3 font-medium text-gray-500">ต้นทุนรวม</th>
                                        <th className="text-right py-2 px-3 font-medium text-gray-500">ราคาขายรวม</th>
                                        <th className="text-left py-2 px-3 font-medium text-gray-500">ซัพพลายเออร์</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {costData.groups.map((group) => {
                                        const isExpanded = expandedGroups.has(group.group_id)
                                        return (
                                            <>
                                                <tr
                                                    key={`cg-${group.group_id}`}
                                                    className="bg-indigo-50 dark:bg-indigo-900/20 cursor-pointer"
                                                    onClick={() => setExpandedGroups((prev) => {
                                                        const next = new Set(prev)
                                                        if (isExpanded) next.delete(group.group_id)
                                                        else next.add(group.group_id)
                                                        return next
                                                    })}
                                                >
                                                    <td className="py-2 px-3 font-semibold text-indigo-700 dark:text-indigo-300" colSpan={4}>
                                                        <span className="mr-1">{isExpanded ? '▾' : '▸'}</span>
                                                        {group.name}
                                                        {!group.is_visible && <span className="ml-2 text-xs text-gray-400 font-normal">(ซ่อนใบเสนอราคา)</span>}
                                                        {group.custom_sell_price && <span className="ml-2 text-xs text-green-600 font-normal">ราคา custom</span>}
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-semibold tabular-nums">฿{fmt(group.group_cost)}</td>
                                                    <td className="py-2 px-3 text-right font-semibold tabular-nums text-green-600">฿{fmt(group.group_sell_price)}</td>
                                                    <td />
                                                </tr>
                                                {isExpanded && group.items.map((item) => {
                                                    const noPrice = parseFloat(item.unit_price_snapshot) === 0
                                                    return (
                                                        <tr key={item.item_id} className={`pl-4 ${noPrice ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
                                                            <td className="py-2 px-3 pl-7">
                                                                <div className="font-medium">{item.product_name}</div>
                                                                {item.product_model && <div className="text-xs text-gray-400">{item.product_model}</div>}
                                                            </td>
                                                            <td className="py-2 px-3 text-right tabular-nums">{parseFloat(item.quantity).toLocaleString('th-TH')} {item.use_unit}</td>
                                                            <td className="py-2 px-3 text-right tabular-nums">{noPrice ? <span className="text-yellow-600">ยังไม่มีราคา</span> : `฿${fmt(item.unit_price_snapshot)}`}</td>
                                                            <td className="py-2 px-3 text-right tabular-nums">{parseFloat(item.markup_percent).toLocaleString('th-TH')}%</td>
                                                            <td className="py-2 px-3 text-right tabular-nums font-semibold">{noPrice ? '—' : `฿${fmt(item.cost)}`}</td>
                                                            <td className="py-2 px-3 text-right tabular-nums font-semibold text-green-600">{noPrice ? '—' : `฿${fmt(item.sell_price)}`}</td>
                                                            <td className="py-2 px-3 text-gray-500">{item.supplier_name ?? '—'}</td>
                                                        </tr>
                                                    )
                                                })}
                                            </>
                                        )
                                    })}
                                    {costData.ungrouped_items.map((item) => {
                                        const noPrice = parseFloat(item.unit_price_snapshot) === 0
                                        return (
                                            <tr key={item.item_id} className={noPrice ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}>
                                                <td className="py-2 px-3">
                                                    <div className="font-medium">{item.product_name}</div>
                                                    {item.product_model && <div className="text-xs text-gray-400">{item.product_model}</div>}
                                                </td>
                                                <td className="py-2 px-3 text-right tabular-nums">{parseFloat(item.quantity).toLocaleString('th-TH')} {item.use_unit}</td>
                                                <td className="py-2 px-3 text-right tabular-nums">{noPrice ? <span className="text-yellow-600">ยังไม่มีราคา</span> : `฿${fmt(item.unit_price_snapshot)}`}</td>
                                                <td className="py-2 px-3 text-right tabular-nums">{parseFloat(item.markup_percent).toLocaleString('th-TH')}%</td>
                                                <td className="py-2 px-3 text-right tabular-nums font-semibold">{noPrice ? '—' : `฿${fmt(item.cost)}`}</td>
                                                <td className="py-2 px-3 text-right tabular-nums font-semibold text-green-600">{noPrice ? '—' : `฿${fmt(item.sell_price)}`}</td>
                                                <td className="py-2 px-3 text-gray-500">{item.supplier_name ?? '—'}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                                        <td colSpan={4} className="py-3 px-3 text-right font-bold">รวมทั้งหมด</td>
                                        <td className="py-3 px-3 text-right font-bold text-lg tabular-nums text-indigo-600">
                                            ฿{fmt(costData.total_cost)}
                                        </td>
                                        <td className="py-3 px-3 text-right font-bold text-lg tabular-nums text-green-600">
                                            ฿{fmt(costData.total_sell_price)}
                                        </td>
                                        <td />
                                    </tr>
                                </tfoot>
                            </table>
                        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                            <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-gray-700">
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-300 shrink-0 w-28">QT Number</label>
                                <Input
                                    size="sm"
                                    placeholder="เช่น 5069000115"
                                    value={localQtNumber}
                                    onChange={(e) => setLocalQtNumber(e.target.value)}
                                    className="flex-1 font-mono"
                                />
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">ต้นทุนรวม</span>
                                <span className="tabular-nums font-medium text-indigo-600">฿{fmt(costData.total_cost)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">ราคาขายรวม (ก่อน Overhead/VAT)</span>
                                <span className="tabular-nums font-medium">฿{fmt(costData.total_sell_price)}</span>
                            </div>

                            <div className="flex items-center justify-between text-sm gap-4">
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        className={`w-8 h-4 rounded-full transition-colors ${localShowOverhead ? 'bg-indigo-500' : 'bg-gray-300'}`}
                                        onClick={() => setLocalShowOverhead(!localShowOverhead)}
                                        title="เปิด/ปิด Overhead"
                                    >
                                        <span className={`block w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${localShowOverhead ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                    </button>
                                    <span className={localShowOverhead ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400'}>Overhead / Contingency</span>
                                    <Input
                                        size="sm"
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        suffix="%"
                                        className="w-20 text-right"
                                        value={localOverhead}
                                        onChange={(e) => setLocalOverhead(e.target.value)}
                                        disabled={!localShowOverhead}
                                    />
                                </div>
                                <span className={`tabular-nums font-medium ${localShowOverhead ? '' : 'text-gray-400'}`}>
                                    {localShowOverhead ? `฿${fmt(overheadAmt)}` : '—'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-700 dark:text-gray-200">VAT</span>
                                    <Input
                                        size="sm"
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        suffix="%"
                                        className="w-20 text-right"
                                        value={localVat}
                                        onChange={(e) => setLocalVat(e.target.value)}
                                    />
                                </div>
                                <span className="tabular-nums font-medium">฿{fmt(vatAmt)}</span>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                                <span className="font-bold text-base">ยอดรวมสุทธิ</span>
                                <span className="tabular-nums font-bold text-xl text-green-600">฿{fmt(grandTotal)}</span>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={handleSavePricing} loading={savingPricing} variant="solid">
                                        บันทึกการตั้งค่า
                                    </Button>
                                    {(() => {
                                        const today = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'numeric', year: 'numeric' })
                                        const qtData: QuotationData = {
                                            projectName: costData.project_name,
                                            customerName: selected?.customer_name ?? null,
                                            address: selected?.address ?? null,
                                            groups: costData.groups,
                                            ungroupedItems: costData.ungrouped_items,
                                            totalCost: costData.total_cost,
                                            totalSellPrice: costData.total_sell_price,
                                            vatPercent: parseFloat(localVat) || 0,
                                            overheadPercent: parseFloat(localOverhead) || 0,
                                            showOverhead: localShowOverhead,
                                            date: today,
                                            qtNumber: localQtNumber || undefined,
                                        }
                                        return (
                                            <PDFDownloadLink
                                                document={<QuotationPDF {...qtData} />}
                                                fileName={`QT-${costData.project_name}.pdf`}
                                            >
                                                {({ loading }) => (
                                                    <Button size="sm" variant="default" icon={<HiOutlineDocumentText />} loading={loading}>
                                                        {loading ? 'กำลังสร้าง...' : 'ดาวน์โหลด PDF'}
                                                    </Button>
                                                )}
                                            </PDFDownloadLink>
                                        )
                                    })()}
                                </div>
                                <Button onClick={() => setShowCost(false)}>ปิด</Button>
                            </div>
                        </div>
                        </div>
                    </>
                    )
                })()}
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
