"use client";

import { useState, useEffect } from "react";
import { getOrthoCases, createOrthoCase, payOrthoInstallment, updateBondingStatus, OrthoCaseDetail } from "@/app/actions/orthoActions";
import { getSupabaseClient } from "@/app/lib/supabase";
import { DentalPatient, Dentist, OrthoInstallment } from "@/types";

export default function OrthodonticsPage() {
    const [cases, setCases] = useState<OrthoCaseDetail[]>([]);
    const [patients, setPatients] = useState<DentalPatient[]>([]);
    const [dentists, setDentists] = useState<Dentist[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedCase, setSelectedCase] = useState<OrthoCaseDetail | null>(null);
    const [payingInstallment, setPayingInstallment] = useState<OrthoInstallment | null>(null);
    const [procedureNote, setProcedureNote] = useState("");
    const [amountToPay, setAmountToPay] = useState<number>(1500);

    // New Case Form
    const [formPatientId, setFormPatientId] = useState("");
    const [formDentistId, setFormDentistId] = useState("");
    const [formPlanName, setFormPlanName] = useState("จัดฟันโลหะมาตรฐาน (Metal Braces)");
    const [formTotalAmount, setFormTotalAmount] = useState<number>(45000);
    const [formDownPayment, setFormDownPayment] = useState<number>(5000);
    const [formMonthlyPayment, setFormMonthlyPayment] = useState<number>(1500);
    const [formTotalMonths, setFormTotalMonths] = useState<number>(24);
    const [formNotes, setFormNotes] = useState("");
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const loadData = async () => {
        setLoading(true);
        const res = await getOrthoCases();
        if (res.success && res.data) {
            setCases(res.data);
            if (selectedCase) {
                const refreshed = res.data.find((c) => c.id === selectedCase.id) || null;
                setSelectedCase(refreshed);
            }
        }

        const supabase = getSupabaseClient();
        const { data: pData } = await supabase.from("customers").select("*").order("fullName");
        if (pData) {
            setPatients(
                pData.map((d: any) => ({
                    id: d.id,
                    fullName: d.fullName || d.name || "ไม่มีชื่อ",
                    phone: d.phone || d.phoneNumber || "",
                    hn: d.hn || `DN-${d.id.substring(0, 6)}`,
                }))
            );
            if (pData.length > 0 && !formPatientId) setFormPatientId(pData[0].id);
        }

        const { data: dData } = await supabase.from("technicians").select("*").order("firstName");
        if (dData) {
            setDentists(dData as any);
            if (dData.length > 0 && !formDentistId) setFormDentistId(dData[0].id);
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

    const handleCreateCase = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formPatientId || !formDentistId || !formPlanName) return;

        setSaving(true);
        const res = await createOrthoCase({
            patientId: formPatientId,
            dentistId: formDentistId,
            planName: formPlanName,
            totalAmount: Number(formTotalAmount),
            initialDownPayment: Number(formDownPayment),
            monthlyPayment: Number(formMonthlyPayment),
            totalMonths: Number(formTotalMonths),
            notes: formNotes,
        });

        if (res.success) {
            showNotify("เปิดเคสจัดฟันใหม่เรียบร้อยแล้ว");
            setIsAddModalOpen(false);
            loadData();
        } else {
            showNotify(res.error || "เกิดข้อผิดพลาดในการสร้างเคส", "error");
        }
        setSaving(false);
    };

    const handleOpenPay = (inst: OrthoInstallment) => {
        setPayingInstallment(inst);
        setAmountToPay(inst.dueAmount);
        setProcedureNote(inst.procedureNote || `งวดที่ ${inst.installmentNo}: ปรับเครื่องมือจัดฟัน`);
    };

    const handleConfirmPay = async () => {
        if (!payingInstallment || !selectedCase) return;
        setSaving(true);
        const res = await payOrthoInstallment({
            installmentId: payingInstallment.id,
            caseId: selectedCase.id,
            amountPaid: Number(amountToPay),
            procedureNote,
        });

        if (res.success) {
            showNotify(`บันทึกชำระงวดที่ ${payingInstallment.installmentNo} เรียบร้อยแล้ว`);
            setPayingInstallment(null);
            await loadData();
        } else {
            showNotify(res.error || "บันทึกไม่สำเร็จ", "error");
        }
        setSaving(false);
    };

    const handleToggleBonding = async (caseId: string, upper: boolean, lower: boolean) => {
        const res = await updateBondingStatus(caseId, upper, lower);
        if (res.success) {
            showNotify("อัปเดตสถานะติดเครื่องมือสำเร็จ");
            loadData();
        }
    };

    const filtered = cases.filter((c) => {
        const q = search.toLowerCase();
        return (
            c.patientName?.toLowerCase().includes(q) ||
            c.patientHn?.toLowerCase().includes(q) ||
            c.patientPhone?.includes(q) ||
            c.planName.toLowerCase().includes(q)
        );
    });

    const totalActiveCases = cases.filter((c) => c.status === "in_progress").length;
    const totalRevenue = cases.reduce((acc, c) => acc + c.paidAmount, 0);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
            {/* Toast Notification */}
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
                        <h1 className="text-2xl font-bold text-slate-900">
                            เคสจัดฟัน & งวดผ่อนชำระ (Orthodontic Tracking)
                        </h1>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        ติดตามความคืบหน้าการจัดฟัน ยอดชำระสะสม และตัดงวดปรับเครื่องมือรายเดือน
                    </p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm shadow-sm shadow-teal-600/20"
                >
                    <span>🦷</span>
                    เปิดเคสจัดฟันใหม่
                </button>
            </div>

            {/* KPI Metric Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">เคสจัดฟันทั้งหมด</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{cases.length}</p>
                    <p className="text-xs text-slate-400 mt-0.5">ในคลินิก</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-teal-100 shadow-sm">
                    <p className="text-xs font-medium text-teal-600 uppercase tracking-wider">กำลังรักษา (Active)</p>
                    <p className="text-2xl font-bold text-teal-700 mt-1 tabular-nums">{totalActiveCases}</p>
                    <p className="text-xs text-teal-600/80 mt-0.5">คนไข้ปรับเครื่องมือประจำเดือน</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
                    <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">เคสจบสมบูรณ์</p>
                    <p className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
                        {cases.filter((c) => c.status === "completed").length}
                    </p>
                    <p className="text-xs text-emerald-600/80 mt-0.5">ถอดเครื่องมือ / ใส่รีเทนเนอร์</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">ยอดเงินจัดฟันที่ชำระแล้ว</p>
                    <p className="text-2xl font-bold text-teal-700 mt-1 tabular-nums">
                        {totalRevenue.toLocaleString()} <span className="text-xs font-normal text-slate-500">บาท</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">รายรับรวมจากค่างวด</p>
                </div>
            </div>

            {/* Search Box */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="relative flex-1 w-full max-w-md">
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อคนไข้, เลข HN, หรือชื่อแผนจัดฟัน..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                </div>
                <div className="text-xs text-slate-500">แสดง {filtered.length} เคส</div>
            </div>

            {/* Ortho Cases List */}
            {loading ? (
                <div className="py-16 text-center text-slate-400 text-sm">กำลังโหลดเคสจัดฟัน...</div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                    <span className="text-3xl block mb-2">🦷</span>
                    <h3 className="text-base font-semibold text-slate-800">ยังไม่มีเคสจัดฟัน</h3>
                    <p className="text-sm text-slate-500 mt-1">
                        คลิกปุ่ม "เปิดเคสจัดฟันใหม่" เพื่อเริ่มบันทึกแผนและตารางผ่อนชำระ
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((c) => {
                        const percent = Math.min(100, Math.round((c.paidAmount / (c.totalAmount || 1)) * 100));

                        return (
                            <div
                                key={c.id}
                                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <span className="text-[11px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                                                HN: {c.patientHn}
                                            </span>
                                            <h3 className="text-base font-bold text-slate-900 mt-1">{c.patientName}</h3>
                                            <p className="text-xs text-slate-500">{c.planName}</p>
                                        </div>
                                        <span
                                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                c.status === "completed"
                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                    : "bg-teal-50 text-teal-700 border border-teal-200"
                                            }`}
                                        >
                                            {c.status === "completed" ? "จบเคสแล้ว" : `งวดที่ ${c.currentMonth}/${c.totalMonths}`}
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-4 space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500">ยอดชำระแล้ว:</span>
                                            <span className="font-bold text-slate-900 tabular-nums">
                                                {c.paidAmount.toLocaleString()} / {c.totalAmount.toLocaleString()} บาท ({percent}%)
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-500"
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Bonding Status Badges */}
                                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                        <span className="text-slate-400">ทันตแพทย์ผู้ดูแล:</span>
                                        <span className="font-medium text-slate-700">{c.dentistName}</span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2 text-xs">
                                        <label className="flex items-center gap-1 text-slate-600 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={c.bracketUpperBonded}
                                                onChange={(e) => handleToggleBonding(c.id, e.target.checked, c.bracketLowerBonded || false)}
                                                className="rounded text-teal-600"
                                            />
                                            <span>ติดเครื่องมือบน</span>
                                        </label>
                                        <label className="flex items-center gap-1 text-slate-600 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={c.bracketLowerBonded}
                                                onChange={(e) => handleToggleBonding(c.id, c.bracketUpperBonded || false, e.target.checked)}
                                                className="rounded text-teal-600"
                                            />
                                            <span>ติดเครื่องมือล่าง</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-xs text-slate-400">
                                        คงเหลือ: {(c.totalAmount - c.paidAmount).toLocaleString()} บ.
                                    </span>
                                    <button
                                        onClick={() => setSelectedCase(c)}
                                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
                                    >
                                        ดูตารางงวด & ตัดชำระ →
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal Detail / Installments Timeline */}
            {selectedCase && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <span>🦷</span> ตารางงวดจัดฟัน: {selectedCase.patientName} (HN: {selectedCase.patientHn})
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        แผน: {selectedCase.planName} | หมอผู้ดูแล: {selectedCase.dentistName}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedCase(null)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="my-3 p-3 bg-teal-50/70 rounded-xl border border-teal-100 flex items-center justify-between text-xs">
                                <div>
                                    <span className="text-slate-500">ยอดรวม: </span>
                                    <span className="font-bold text-slate-900">{selectedCase.totalAmount.toLocaleString()} บ.</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">ชำระแล้ว: </span>
                                    <span className="font-bold text-teal-700">{selectedCase.paidAmount.toLocaleString()} บ.</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">ยอดคงเหลือ: </span>
                                    <span className="font-bold text-rose-600">
                                        {(selectedCase.totalAmount - selectedCase.paidAmount).toLocaleString()} บ.
                                    </span>
                                </div>
                            </div>

                            {/* Installments Table */}
                            <div className="overflow-y-auto max-h-[45vh] border border-slate-100 rounded-xl">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-600 uppercase font-semibold sticky top-0">
                                        <tr>
                                            <th className="py-2.5 px-3">งวดที่</th>
                                            <th className="py-2.5 px-3">ยอดที่ต้องชำระ</th>
                                            <th className="py-2.5 px-3">สถานะ</th>
                                            <th className="py-2.5 px-3">หัตถการ / บันทึกความคืบหน้า</th>
                                            <th className="py-2.5 px-3 text-right">ดำเนินการ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(selectedCase.installments || []).map((inst) => (
                                            <tr key={inst.id} className="hover:bg-slate-50/50">
                                                <td className="py-2.5 px-3 font-bold text-teal-800">
                                                    งวด {inst.installmentNo}
                                                </td>
                                                <td className="py-2.5 px-3 font-semibold tabular-nums">
                                                    {inst.dueAmount.toLocaleString()} บ.
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    {inst.status === "paid" ? (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            ✓ ชำระแล้ว ({inst.paidAt ? new Date(inst.paidAt).toLocaleDateString("th-TH") : ""})
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                            รอชำระ
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-3 text-slate-600">
                                                    {inst.procedureNote || "—"}
                                                </td>
                                                <td className="py-2.5 px-3 text-right">
                                                    {inst.status !== "paid" ? (
                                                        <button
                                                            onClick={() => handleOpenPay(inst)}
                                                            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium text-[11px] shadow-sm"
                                                        >
                                                            รับชำระ
                                                        </button>
                                                    ) : (
                                                        <span className="text-[11px] text-slate-400">เรียบร้อย</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                            <button
                                onClick={() => setSelectedCase(null)}
                                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                            >
                                ปิดหน้าต่าง
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Pay Installment */}
            {payingInstallment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                        <h3 className="text-base font-bold text-slate-900 mb-2">
                            💰 บันทึกชำระค่างวดที่ {payingInstallment.installmentNo}
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    ยอดเงินที่ชำระ (บาท)
                                </label>
                                <input
                                    type="number"
                                    value={amountToPay}
                                    onChange={(e) => setAmountToPay(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-teal-700"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    หัตถการที่ทำในงวดนี้ (บันทึกหมอ)
                                </label>
                                <input
                                    type="text"
                                    value={procedureNote}
                                    onChange={(e) => setProcedureNote(e.target.value)}
                                    placeholder="เช่น เปลี่ยนลวด 0.016 บนล่าง, ดึงยาง Class II, เปลี่ยนยาง O-ring สีฟ้า"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                            <button
                                onClick={() => setPayingInstallment(null)}
                                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleConfirmPay}
                                disabled={saving}
                                className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm disabled:opacity-50"
                            >
                                {saving ? "กำลังบันทึก..." : "ยืนยันการรับชำระ"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Add Ortho Case */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-base font-bold text-teal-900">
                                🦷 เปิดเคสจัดฟันใหม่ (New Orthodontic Case)
                            </h3>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateCase} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">เลือกคนไข้ *</label>
                                <select
                                    required
                                    value={formPatientId}
                                    onChange={(e) => setFormPatientId(e.target.value)}
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
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    ทันตแพทย์ผู้ดูแลเคส *
                                </label>
                                <select
                                    required
                                    value={formDentistId}
                                    onChange={(e) => setFormDentistId(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                >
                                    {dentists.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.firstName} {d.lastName || ""} ({d.specialty || "ทันตแพทย์"})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    ชื่อแผนการจัดฟัน *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formPlanName}
                                    onChange={(e) => setFormPlanName(e.target.value)}
                                    placeholder="เช่น จัดฟันโลหะ (Metal Braces), จัดฟันเซรามิก, จัดฟันใส Damon"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        ยอดรวมทั้งคอร์ส (บาท) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        value={formTotalAmount}
                                        onChange={(e) => setFormTotalAmount(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-teal-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        งวดแรก/ติดเครื่องมือ (บาท)
                                    </label>
                                    <input
                                        type="number"
                                        value={formDownPayment}
                                        onChange={(e) => setFormDownPayment(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        ผ่อนเดือนละ (บาท)
                                    </label>
                                    <input
                                        type="number"
                                        value={formMonthlyPayment}
                                        onChange={(e) => setFormMonthlyPayment(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        ระยะเวลาประมาณการ (เดือน)
                                    </label>
                                    <input
                                        type="number"
                                        value={formTotalMonths}
                                        onChange={(e) => setFormTotalMonths(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    บันทึกเพิ่มเติมของเคส
                                </label>
                                <textarea
                                    value={formNotes}
                                    onChange={(e) => setFormNotes(e.target.value)}
                                    rows={2}
                                    placeholder="เช่น คนไข้มีฟันคุด 2 ซี่ต้องผ่าก่อนติดเครื่องมือล่าง"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm disabled:opacity-50"
                                >
                                    {saving ? "กำลังสร้างเคส..." : "สร้างเคสจัดฟัน"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
