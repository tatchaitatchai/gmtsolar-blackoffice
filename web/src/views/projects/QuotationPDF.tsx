import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer'
import gmtLogo from '@/assets/gmt-logo.png'

Font.register({
    family: 'Sarabun',
    fonts: [
        { src: '/fonts/Sarabun-Regular.ttf' },
        { src: '/fonts/Sarabun-Bold.ttf', fontWeight: 700 },
    ],
})

const COMPANY_NAME = 'หจก.ชาญทิพย์รุ่งเรือเฟอร์นิเจอร์'
const COMPANY_ADDRESS_TH = '105/6 ซ.รัตนโชค 12/12 ต.บางปลา อ.บางพลี จ.สมุทรปราการ 10540'
const COMPANY_ADDRESS_EN = '105/6 Soi Rattanachok 12/12, Bang Pla, Bang Phli, Samut Prakan 10540'
const COMPANY_EMAIL = 'chutartit@gmail.com , Phrom_tom@hotmail.com'
const COMPANY_TEL = '094-7821146'
const COMPANY_TAX_ID = '0113553008589'

type ItemCost = {
    item_id: string
    product_name: string
    product_model: string
    quantity: string
    use_unit: string
    unit_price_snapshot: string
    markup_percent: string
    cost: string
    sell_price: string
    group_id: string | null
}

type GroupCost = {
    group_id: string
    name: string
    custom_sell_price: string | null
    is_visible: boolean
    items: ItemCost[]
    group_cost: string
    group_sell_price: string
}

export type QuotationData = {
    projectName: string
    customerName: string | null
    address: string | null
    groups: GroupCost[]
    ungroupedItems: ItemCost[]
    totalCost: string
    totalSellPrice: string
    vatPercent: number
    overheadPercent: number
    showOverhead: boolean
    date: string
    qtNumber?: string
}

const fmt = (n: string | number, decimals = 2) =>
    parseFloat(String(n)).toLocaleString('th-TH', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    })

const s = StyleSheet.create({
    page: {
        fontFamily: 'Sarabun',
        fontSize: 8.5,
        paddingTop: 24,
        paddingBottom: 36,
        paddingHorizontal: 28,
        color: '#000',
    },

    // ---- header ----
    headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
    logo: { width: 72, height: 36, objectFit: 'contain' },
    companyBlock: { flex: 1, paddingLeft: 8, alignItems: 'center' },
    companyName: { fontSize: 11, fontWeight: 700, marginBottom: 2 },
    companyLine: { fontSize: 7.5, textAlign: 'center', lineHeight: 1.5 },

    // ---- QUOTATION title ----
    titleRow: { alignItems: 'center', marginVertical: 6 },
    title: { fontSize: 14, fontWeight: 700, textDecoration: 'underline' },

    // ---- customer + QT meta ----
    metaRow: { flexDirection: 'row', borderTop: '1pt solid #000', borderBottom: '1pt solid #000', marginBottom: 0 },
    metaLeft: { flex: 1, padding: 4, borderRight: '1pt solid #000' },
    metaRight: { width: 160, padding: 4 },
    metaLabel: { fontWeight: 700 },
    metaLine: { marginBottom: 2, lineHeight: 1.5 },
    metaValueRow: { flexDirection: 'row', marginBottom: 2 },
    metaKey: { width: 56, fontWeight: 700 },
    metaVal: { flex: 1 },

    // ---- table ----
    table: { marginTop: 0, borderLeft: '1pt solid #000', borderRight: '1pt solid #000' },
    tableHead: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        borderBottom: '1pt solid #000',
        borderTop: '1pt solid #000',
        fontWeight: 700,
        fontSize: 8,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '0.5pt solid #ccc',
        minHeight: 18,
        alignItems: 'center',
    },
    tableRowGroup: {
        flexDirection: 'row',
        borderBottom: '0.5pt solid #999',
        borderTop: '0.5pt solid #999',
        minHeight: 18,
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    tableRowSub: {
        flexDirection: 'row',
        borderBottom: '0.3pt solid #e0e0e0',
        minHeight: 16,
        alignItems: 'center',
    },

    // col widths
    colNo: { width: 22, textAlign: 'center', padding: '3 2' },
    colDesc: { flex: 1, padding: '3 4' },
    colQty: { width: 38, textAlign: 'center', padding: '3 2' },
    colUnit: { width: 30, textAlign: 'center', padding: '3 2' },
    colUnitPrice: { width: 58, textAlign: 'right', padding: '3 4' },
    colTotal: { width: 66, textAlign: 'right', padding: '3 4' },

    // text styles
    bold: { fontWeight: 700 },
    red: { color: '#cc0000' },
    gray: { color: '#888' },
    indent: { paddingLeft: 12 },
    subName: { fontSize: 7.5 },

    // ---- totals ----
    totalsBox: {
        marginTop: 4,
        borderTop: '1pt solid #000',
        paddingTop: 4,
        alignItems: 'flex-end',
    },
    totalRow: { flexDirection: 'row', marginBottom: 2, width: 200 },
    totalLabel: { flex: 1, textAlign: 'right', paddingRight: 8 },
    totalVal: { width: 80, textAlign: 'right', fontWeight: 700 },
    grandTotalRow: {
        flexDirection: 'row',
        marginTop: 4,
        borderTop: '1pt solid #000',
        paddingTop: 4,
        width: 200,
    },
    grandTotalLabel: { flex: 1, textAlign: 'right', paddingRight: 8, fontWeight: 700, fontSize: 10 },
    grandTotalVal: { width: 80, textAlign: 'right', fontWeight: 700, fontSize: 10, color: '#005500' },

    // ---- footer remark ----
    remarkBox: { marginTop: 16, fontSize: 7.5, color: '#555' },
})

export default function QuotationPDF({
    projectName,
    customerName,
    address,
    groups,
    ungroupedItems,
    totalCost: _totalCost,
    totalSellPrice,
    vatPercent,
    overheadPercent,
    showOverhead,
    date,
    qtNumber,
}: QuotationData) {
    const sell = parseFloat(totalSellPrice)
    const overheadAmt = showOverhead ? sell * overheadPercent / 100 : 0
    const preVat = sell + overheadAmt
    const vatAmt = preVat * vatPercent / 100
    const grandTotal = preVat + vatAmt

    let rowCounter = 0

    const renderItemRow = (item: ItemCost, subdued = false) => {
        const up = parseFloat(item.unit_price_snapshot)
        const markup = parseFloat(item.markup_percent) || 0
        const sellUnitPrice = up * (1 + markup / 100)
        const total = parseFloat(item.sell_price)
        const noPrice = up === 0

        return (
            <View key={item.item_id} style={subdued ? s.tableRowSub : s.tableRow}>
                <Text style={s.colNo} />
                <View style={[s.colDesc, subdued ? s.indent : {}]}>
                    <Text style={[s.subName, subdued ? s.gray : {}]}>
                        {subdued ? '- ' : ''}{item.product_name}
                        {item.product_model ? ` (${item.product_model})` : ''}
                    </Text>
                </View>
                <Text style={[s.colQty, subdued ? s.gray : {}]}>
                    {parseFloat(item.quantity).toLocaleString('th-TH')}
                </Text>
                <Text style={[s.colUnit, subdued ? s.gray : {}]}>{item.use_unit}</Text>
                <Text style={[s.colUnitPrice, subdued ? s.gray : {}]}>
                    {noPrice ? '-' : fmt(sellUnitPrice)}
                </Text>
                <Text style={[s.colTotal, subdued ? s.gray : {}]}>
                    {subdued ? '-' : noPrice ? '-' : fmt(total)}
                </Text>
            </View>
        )
    }

    return (
        <Document>
            <Page size="A4" style={s.page}>

                {/* ── Company header ── */}
                <View style={s.headerRow}>
                    <Image style={s.logo} src={gmtLogo} />
                    <View style={s.companyBlock}>
                        <Text style={s.companyName}>{COMPANY_NAME}</Text>
                        <Text style={s.companyLine}>{COMPANY_ADDRESS_TH}</Text>
                        <Text style={s.companyLine}>{COMPANY_ADDRESS_EN}</Text>
                        <Text style={s.companyLine}>
                            E-MAIL {COMPANY_EMAIL}  TEL.{COMPANY_TEL}
                        </Text>
                        <Text style={s.companyLine}>เลขที่ผู้เสียภาษี {COMPANY_TAX_ID}</Text>
                    </View>
                </View>

                {/* ── QUOTATION title ── */}
                <View style={s.titleRow}>
                    <Text style={s.title}>QUOTATION</Text>
                </View>

                {/* ── Customer + QT meta ── */}
                <View style={s.metaRow}>
                    <View style={s.metaLeft}>
                        <View style={s.metaValueRow}>
                            <Text style={s.metaKey}>เรียน/ATTENTION</Text>
                            <Text style={s.metaVal}>{customerName ?? '-'}</Text>
                        </View>
                        <View style={s.metaValueRow}>
                            <Text style={s.metaKey}>บริษัท :</Text>
                            <Text style={s.metaVal}>{address ?? projectName}</Text>
                        </View>
                        <Text style={[s.metaLine, { marginTop: 4, fontWeight: 700 }]}>
                            บริษัทมีความยินดีเสนอราคา ดังรายละเอียดดังต่อไปนี้
                        </Text>
                    </View>
                    <View style={s.metaRight}>
                        <View style={s.metaValueRow}>
                            <Text style={s.metaKey}>QT.NO.</Text>
                            <Text style={s.metaVal}>{qtNumber ?? '-'}</Text>
                        </View>
                        <View style={s.metaValueRow}>
                            <Text style={s.metaKey}>REVISION</Text>
                            <Text style={s.metaVal}>0</Text>
                        </View>
                        <View style={s.metaValueRow}>
                            <Text style={s.metaKey}>วันที่ / DATE</Text>
                            <Text style={s.metaVal}>{date}</Text>
                        </View>
                    </View>
                </View>

                {/* ── Items table ── */}
                <View style={s.table}>

                    {/* Table header */}
                    <View style={s.tableHead}>
                        <Text style={[s.colNo, { padding: '4 2' }]}>ลำดับ{'\n'}No.</Text>
                        <View style={[s.colDesc, { padding: '4 4' }]}>
                            <Text>รายการ</Text>
                            <Text>Description</Text>
                        </View>
                        <View style={[s.colQty, { padding: '4 2', alignItems: 'center' }]}>
                            <Text>จำนวน</Text>
                            <Text>Quantity</Text>
                        </View>
                        <View style={[s.colUnit, { padding: '4 2', alignItems: 'center' }]}>
                            <Text>หน่วย</Text>
                            <Text>Unit</Text>
                        </View>
                        <View style={[s.colUnitPrice, { padding: '4 4', alignItems: 'flex-end' }]}>
                            <Text>ราคา/หน่วย</Text>
                            <Text>Unit price</Text>
                        </View>
                        <View style={[s.colTotal, { padding: '4 4', alignItems: 'flex-end' }]}>
                            <Text>จำนวนเงิน</Text>
                            <Text>Total Amount</Text>
                        </View>
                    </View>

                    {/* Groups */}
                    {groups.map((group) => {
                        rowCounter++
                        const num = rowCounter
                        const groupSell = parseFloat(group.group_sell_price)

                        return (
                            <View key={group.group_id}>
                                {/* Group header row */}
                                <View style={s.tableRowGroup}>
                                    <Text style={[s.colNo, s.bold]}>{num}</Text>
                                    <Text style={[s.colDesc, s.bold]}>{group.name}</Text>
                                    <Text style={s.colQty} />
                                    <Text style={s.colUnit} />
                                    <Text style={s.colUnitPrice} />
                                    <Text style={[s.colTotal, s.bold, s.red]}>
                                        {fmt(groupSell)}
                                    </Text>
                                </View>

                                {/* Sub-items — only shown when is_visible=true */}
                                {group.is_visible && group.items.map((item) => renderItemRow(item))}
                            </View>
                        )
                    })}

                    {/* Ungrouped items */}
                    {ungroupedItems.map((item) => {
                        rowCounter++
                        const num = rowCounter
                        const up = parseFloat(item.unit_price_snapshot)
                        const markup = parseFloat(item.markup_percent) || 0
                        const sellUnitPrice = up * (1 + markup / 100)
                        const total = parseFloat(item.sell_price)
                        const noPrice = up === 0

                        return (
                            <View key={item.item_id} style={s.tableRow}>
                                <Text style={s.colNo}>{num}</Text>
                                <View style={s.colDesc}>
                                    <Text>{item.product_name}</Text>
                                    {item.product_model ? (
                                        <Text style={[s.subName, s.gray]}>{item.product_model}</Text>
                                    ) : null}
                                </View>
                                <Text style={s.colQty}>
                                    {parseFloat(item.quantity).toLocaleString('th-TH')}
                                </Text>
                                <Text style={s.colUnit}>{item.use_unit}</Text>
                                <Text style={s.colUnitPrice}>
                                    {noPrice ? '-' : fmt(sellUnitPrice)}
                                </Text>
                                <Text style={s.colTotal}>
                                    {noPrice ? '-' : fmt(total)}
                                </Text>
                            </View>
                        )
                    })}
                </View>

                {/* ── Totals ── */}
                <View style={s.totalsBox}>
                    <View style={s.totalRow}>
                        <Text style={s.totalLabel}>ราคาก่อน VAT</Text>
                        <Text style={s.totalVal}>฿{fmt(sell)}</Text>
                    </View>
                    {showOverhead && overheadPercent > 0 && (
                        <View style={s.totalRow}>
                            <Text style={s.totalLabel}>Overhead / Contingency ({fmt(overheadPercent, 1)}%)</Text>
                            <Text style={s.totalVal}>฿{fmt(overheadAmt)}</Text>
                        </View>
                    )}
                    {(showOverhead && overheadPercent > 0) && (
                        <View style={s.totalRow}>
                            <Text style={s.totalLabel}>ยอดก่อน VAT (รวม Overhead)</Text>
                            <Text style={s.totalVal}>฿{fmt(preVat)}</Text>
                        </View>
                    )}
                    <View style={s.totalRow}>
                        <Text style={s.totalLabel}>VAT {fmt(vatPercent, 1)}%</Text>
                        <Text style={s.totalVal}>฿{fmt(vatAmt)}</Text>
                    </View>
                    <View style={s.grandTotalRow}>
                        <Text style={s.grandTotalLabel}>รวมทั้งสิ้น / Grand Total</Text>
                        <Text style={s.grandTotalVal}>฿{fmt(grandTotal)}</Text>
                    </View>
                </View>

                {/* ── Remark ── */}
                <View style={s.remarkBox}>
                    <Text>หมายเหตุ : ราคานี้ยังไม่รวม VAT {fmt(vatPercent, 1)}%  |  ราคามีผลภายใน 30 วันนับจากวันที่เสนอราคา</Text>
                </View>

            </Page>
        </Document>
    )
}
