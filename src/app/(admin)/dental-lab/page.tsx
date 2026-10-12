"use client";

import { useState, useEffect } from "react";
import { getDentalLabOrders, createDentalLabOrder, updateDentalLabStatus, deleteDentalLabOrder, DentalLabOrderDetail } from "@/app/actions/dentalLabActions";
import { getSupabaseClient } from "@/app/lib/supabase";
import { DentalPatient, Dentist } from "@/types";

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
    sent: { label: "ส่งแล็บแล้ว", badge: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
    in_process: { label: "กำลังผลิต", badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
    received: { label: "ของถึงคลินิกแล้ว", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
    fitted: { label: "คนไข้ใส่เรียบร้อย", badge: "bg-teal-50 text-teal-700 border-teal-200", dot: "bg-teal-500" },
    redo: { label: "ส่งแก้งาน", badge: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" },
};

export default function DentalLabPage() {
    const [orders, setOrders] = useState<DentalLabOrderDetail[]>([]);
    const [patients, setPatients] = useState<DentalPatient[]>([]);
    const [dentists, setDentists] = useState<Dentist[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Modal Add
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [patientId, setPatientId] = useState("");
    const [dentistId, setDentistId] = useState("");
    const [labName, setLabName] = useState("Hexa Ceram Dental Lab");
    const [applianceType, setApplianceType] = useState("Retainer ใส (Clear Retainer)");
    const [toothNumber, setToothNumber] = useState("");
    const [shade, setShade] = useState("A2");
    const [expectedDate, setExpectedDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString().split("T")[0];
    });
    const [labFee, setLabFee] = useState<number>(1200);
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const loadData = async () => {
        setLoading(true);
        const res = await getDentalLabOrders();
        if (res.success && res.data) {
            setOrders(res.data);
        }

        const supabase = getSupabaseClient();
        const { data: pData } = await supabase.from("customers").select("*").order("fullName");
        if (pData) {
            setPatients(pData as any);
            if (pData.length > 0 && !patientId) setPatientId(pData[0].id);
        }

        const { data: dData } = await supabase.from("technicians").select("*").order("firstName");
        if (dData) {
            setDentists(dData as any);
            if (dData.length > 0 && !dentistId) setDentistId(dData[0].id);
        }

        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const showNotify = (message: string, type: "success" | "error" = "success") => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientId || !dentistId || !labName || !applianceType) return;
        setSaving(true);

        const res = await createDentalLabOrder({
            patientId,
            dentistId,
            labName,
            applianceType,
            toothNumber: toothNumber || undefined,
            shade: shade || undefined,
            expectedDate,
            labFee: Number(labFee || 0),
            notes,
        });

        if (res.success) {
            showNotify("สร้างรายการส่งแล็บทันตกรรมสำเร็จ");
            setIsAddOpen(false);
            loadData();
        } else {
            showNotify(res.error || "เกิดข้อผิดพลาด", "error");
        }
        setSaving(false);
    };

    const handleStatusChange = async (orderId: string, newStatus: any) => {
        const res = await updateDentalLabStatus(orderId, newStatus);
        if (res.success) {
            showNotify(`อัปเดตสถานะเป็น "${STATUS_CONFIG[newStatus]?.label}" แล้ว`);
            loadData();
        } else {
            showNotify(res.error || "อัปเดตไม่สำเร็จ", "error");
        }
    };

    const handleDelete = async (orderId: string, code: string) => {
        if (!confirm(`ต้องการลบรายการแล็บ "${code}" หรือไม่?`)) return;
        const res = await deleteDentalLabOrder(orderId);
        if (res.success) {
            showNotify("ลบรายการสำเร็จ");
            loadData();
        }
    };

    const filtered = orders.filter((o) => {
        const q = search.toLowerCase();
        const matchesQuery =
            (o.orderCode || "").toLowerCase().includes(q) ||
            (o.patientName || "").toLowerCase().includes(q) ||
            (o.patientHn || "").toLowerCase().includes(q) ||
            (o.labName || "").toLowerCase().includes(q) ||
            (o.applianceType || "").toLowerCase().includes(q);

        if (statusFilter !== "all") {
            return matchesQuery && o.status === statusFilter;
        }
        return matchesQuery;
    });

    const countInTransit = orders.filter((o) => o.status === "sent" || o.status === "in_process").length;
    const countReceived = orders.filter((o) => o.status === "received").length;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
            {notification && (
                <div
                    className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
                        notification.type === "success"
                            ? "bg-teal-50 border-teal-200 text-teal-800"
                            : "bg-rose-50 border-rose-200 text-rose-800"
                    }`}
                >
                    {notification.message}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                        <h1 className="text-2xl font-bold text-slate-900">งานแล็บทันตกรรม (Dental Lab Orders)</h1>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        ติดตามงานผลิตรีเทนเนอร์ ครอบฟัน ฟันปลอม วันกำหนดส่ง และสถานะความพร้อมก่อนนัดคนไข้
                    </p>
                </div>
                <button
                    onClick={() => setIsAddOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm shadow-sm shadow-teal-600/20"
                >
                    <span>🔬</span>
                    ส่งงานแล็บใหม่
                </button>
            </div>

            {/* KPI Metric Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">งานแล็บทั้งหมด</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{orders.length}</p>
                    <p className="text-xs text-slate-400 mt-0.5">รายการ</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm">
                    <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">กำลังผลิต / ส่งแล็บ</p>
                    <p className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">{countInTransit}</p>
                    <p className="text-xs text-amber-600/80 mt-0.5">รอแล็บจัดส่งกลับคลินิก</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
                    <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">ของถึงคลินิกแล้ว (พร้อมใส่)</p>
                    <p className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">{countReceived}</p>
                    <p className="text-xs text-emerald-600/80 mt-0.5">รอคนไข้ตามวันนัด</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">ใส่เรียบร้อยแล้ว</p>
                    <p className="text-2xl font-bold text-teal-700 mt-1 tabular-nums">
                        {orders.filter((o) => o.status === "fitted").length}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">เคสปิดสมบูรณ์</p>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="relative flex-1 w-full max-w-md">
                    <input
                        type="text"
                        placeholder="ค้นหาเลขที่แล็บ, ชื่อคนไข้, HN, หรือชื่อชิ้นงาน..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none"
                    >
                        <option value="all">ทุกสถานะ</option>
                        <option value="sent">ส่งแล็บแล้ว</option>
                        <option value="in_process">กำลังผลิต</option>
                        <option value="received">ของถึงคลินิกแล้ว</option>
                        <option value="fitted">คนไข้ใส่เรียบร้อย</option>
                        <option value="redo">ส่งแก้งาน</option>
                    </select>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="py-16 text-center text-slate-400 text-sm">กำลังโหลดรายการแล็บ...</div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 text-sm">ไม่พบรายการงานแล็บ</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-100">
                                <tr>
                                    <th className="py-3.5 px-4">รหัสแล็บ</th>
                                    <th className="py-3.5 px-4">คนไข้ / HN</th>
                                    <th className="py-3.5 px-4">ชิ้นงาน & แล็บ</th>
                                    <th className="py-3.5 px-4">ซี่ฟัน / สี (Shade)</th>
                                    <th className="py-3.5 px-4">กำหนดส่งคืน</th>
                                    <th className="py-3.5 px-4">สถานะ</th>
                                    <th className="py-3.5 px-4 text-right">เปลี่ยนสถานะ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((order) => {
                                    const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.sent;
                                    const isLate =
                                        order.status !== "received" &&
                                        order.status !== "fitted" &&
                                        new Date(order.expectedDate) < new Date();

                                    return (
                                        <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="py-3.5 px-4 font-mono font-bold text-teal-800 text-xs">
                                                {order.orderCode}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="font-semibold text-slate-900">{order.patientName}</div>
                                                <div className="text-xs text-slate-400">HN: {order.patientHn}</div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="font-medium text-slate-900">{order.applianceType}</div>
                                                <div className="text-xs text-teal-700">แล็บ: {order.labName}</div>
                                            </td>
                                            <td className="py-3.5 px-4 text-xs text-slate-700">
                                                <div>ซี่: {order.toothNumber || "—"}</div>
                                                <div className="text-slate-400">สีฟัน: {order.shade || "—"}</div>
                                            </td>
                                            <td className="py-3.5 px-4 text-xs font-mono">
                                                <span className={isLate ? "text-rose-600 font-bold" : "text-slate-800"}>
                                                    {order.expectedDate}
                                                </span>
                                                {isLate && (
                                                    <span className="block text-[10px] text-rose-500 font-sans font-bold">
                                                        ⚠️ เกินกำหนด
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.badge}`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {order.status !== "received" && order.status !== "fitted" && (
                                                        <button
                                                            onClick={() => handleStatusChange(order.id, "received")}
                                                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-xs"
                                                            title="ของมาถึงคลินิกแล้ว"
                                                        >
                                                            ของถึงแล้ว ✨
                                                        </button>
                                                    )}
                                                    {order.status === "received" && (
                                                        <button
                                                            onClick={() => handleStatusChange(order.id, "fitted")}
                                                            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-medium shadow-xs"
                                                        >
                                                            คนไข้ใส่แล้ว ✓
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(order.id, order.orderCode)}
                                                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg text-xs"
                                                        title="ลบ"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Add Lab Order */}
            {isAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-base font-bold text-teal-900">🔬 สั่งทำชิ้นงานแล็บทันตกรรมใหม่</h3>
                            <button
                                onClick={() => setIsAddOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">เลือกคนไข้ *</label>
                                <select
                                    required
                                    value={patientId}
                                    onChange={(e) => setPatientId(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                >
                                    {patients.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            [{p.hn}] {p.fullName} ({p.phone})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">ทันตแพทย์ผู้สั่ง *</label>
                                <select
                                    required
                                    value={dentistId}
                                    onChange={(e) => setDentistId(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                >
                                    {dentists.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.firstName} {d.lastName || ""}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อแล็บทันตกรรม *</label>
                                    <input
                                        type="text"
                                        required
                                        value={labName}
                                        onChange={(e) => setLabName(e.target.value)}
                                        placeholder="เช่น Hexa Ceram, Smile Tech"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">ประเภทชิ้นงาน *</label>
                                    <input
                                        type="text"
                                        required
                                        value={applianceType}
                                        onChange={(e) => setApplianceType(e.target.value)}
                                        placeholder="เช่น Retainer ใส, ครอบฟัน Zirconia"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">ซี่ฟัน (Tooth No.)</label>
                                    <input
                                        type="text"
                                        value={toothNumber}
                                        onChange={(e) => setToothNumber(e.target.value)}
                                        placeholder="เช่น 11, 21 หรือ บน-ล่าง"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">สีฟัน (Shade)</label>
                                    <input
                                        type="text"
                                        value={shade}
                                        onChange={(e) => setShade(e.target.value)}
                                        placeholder="เช่น A1, A2, A3, 3M Bleach"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        วันที่แล็บต้องส่งคืน *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={expectedDate}
                                        onChange={(e) => setExpectedDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        ค่าส่งแล็บ (ต้นทุนคลินิก บ.)
                                    </label>
                                    <input
                                        type="number"
                                        value={labFee}
                                        onChange={(e) => setLabFee(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    หมายเหตุ / คำสั่งพิเศษถึงช่างแล็บ
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={2}
                                    placeholder="เช่น ขอขอบเรียบไม่คม, เว้นเหงือก 1mm"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAddOpen(false)}
                                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm disabled:opacity-50"
                                >
                                    {saving ? "กำลังส่งแล็บ..." : "บันทึกส่งแล็บ"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
