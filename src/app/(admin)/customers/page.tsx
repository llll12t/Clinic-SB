"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { db, collection, getDocs, doc, updateDoc } from "@/app/lib/supabaseDb";
import { auth } from "@/app/lib/supabaseAuth";
import { useToast } from "@/app/components/Toast";
import { ConfirmationModal } from "@/app/components/common/NotificationComponent";
import { addCustomer, deleteCustomer } from "@/app/actions/customerActions";
import { DentalPatient } from "@/types";

// --- Icons ---
const Icons = {
    User: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    Users: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    Phone: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
    Mail: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    Search: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
    Plus: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>,
    Trash: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    Edit: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
    Line: () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M21.5 10.2c0-4.6-4.3-8.2-9.5-8.2S2.5 5.6 2.5 10.2c0 4.1 3.4 7.5 8 8.1.3 0 .7.1.8.3.1.2.1.5 0 .8-.1.4-.3 1.4-.3 1.7 0 .5.3.9.9.5l5.2-3.6c2.7-1.4 4.4-4.2 4.4-7.8zM12 14.6c-3.6 0-6.6-2.5-6.6-5.6 0-3.1 3-5.6 6.6-5.6 3.6 0 6.6 2.5 6.6 5.6 0 3.1-3 5.6-6.6 5.6z" /></svg>,
    X: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>,
    AlertTriangle: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
    Tooth: () => <span className="text-sm">🦷</span>,
};

// --- Patient Form Modal (Add/Edit) ---
interface PatientFormModalProps {
    open: boolean;
    onClose: () => void;
    onSave: () => void;
    patient: DentalPatient | null;
}

function PatientFormModal({ open, onClose, onSave, patient }: PatientFormModalProps) {
    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        email: "",
        hn: "",
        bloodGroup: "O",
        drugAllergies: "",
        medicalConditions: "",
        takingBloodThinners: false,
        isPregnant: false,
        points: 0,
    });
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();
    const isEdit = !!patient;

    useEffect(() => {
        if (patient) {
            setFormData({
                fullName: patient.fullName || "",
                phone: patient.phone || "",
                email: patient.email || "",
                hn: patient.hn || "",
                bloodGroup: patient.bloodGroup || "O",
                drugAllergies: Array.isArray(patient.drugAllergies) ? patient.drugAllergies.join(", ") : "",
                medicalConditions: Array.isArray(patient.medicalConditions) ? patient.medicalConditions.join(", ") : "",
                takingBloodThinners: !!patient.takingBloodThinners,
                isPregnant: !!patient.isPregnant,
                points: patient.points || 0,
            });
        } else {
            setFormData({
                fullName: "",
                phone: "",
                email: "",
                hn: "",
                bloodGroup: "O",
                drugAllergies: "",
                medicalConditions: "",
                takingBloodThinners: false,
                isPregnant: false,
                points: 0,
            });
        }
    }, [patient, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fullName.trim() || !formData.phone.trim()) {
            showToast("กรุณากรอกชื่อและเบอร์โทรศัพท์ของคนไข้", "error");
            return;
        }

        setSaving(true);
        const allergiesArr = formData.drugAllergies
            ? formData.drugAllergies.split(",").map((s) => s.trim()).filter(Boolean)
            : [];
        const conditionsArr = formData.medicalConditions
            ? formData.medicalConditions.split(",").map((s) => s.trim()).filter(Boolean)
            : [];

        try {
            if (isEdit && patient?.id) {
                await updateDoc(doc(db, "customers", patient.id), {
                    fullName: formData.fullName,
                    phone: formData.phone,
                    email: formData.email,
                    hn: formData.hn || undefined,
                    bloodGroup: formData.bloodGroup,
                    drugAllergies: allergiesArr,
                    medicalConditions: conditionsArr,
                    takingBloodThinners: formData.takingBloodThinners,
                    isPregnant: formData.isPregnant,
                    points: Number(formData.points) || 0,
                    updatedAt: new Date(),
                });
                showToast("อัปเดตเวชระเบียนคนไข้สำเร็จ", "success");
            } else {
                const token = await auth.currentUser?.getIdToken();
                if (!token) {
                    showToast("ไม่พบการยืนยันตัวตนของผู้ดูแลระบบ", "error");
                    setSaving(false);
                    return;
                }
                const result = await addCustomer(
                    {
                        fullName: formData.fullName,
                        phone: formData.phone,
                        email: formData.email,
                        hn: formData.hn || `DN-${Date.now().toString().slice(-6)}`,
                        bloodGroup: formData.bloodGroup,
                        drugAllergies: allergiesArr,
                        medicalConditions: conditionsArr,
                        takingBloodThinners: formData.takingBloodThinners,
                        isPregnant: formData.isPregnant,
                        points: Number(formData.points) || 0,
                    },
                    { adminToken: token }
                );
                if (!result.success) throw new Error(result.error);
                showToast("เพิ่มเวชระเบียนคนไข้ใหม่สำเร็จ", "success");
            }
            onSave();
            onClose();
        } catch (error: any) {
            showToast("เกิดข้อผิดพลาด: " + (error?.message || "ไม่สามารถบันทึกได้"), "error");
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    const inputClass =
        "w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white transition-colors";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-teal-50/50">
                    <div>
                        <h2 className="text-base font-bold text-teal-900">
                            {isEdit ? "แก้ไขเวชระเบียนคนไข้" : "ลงทะเบียนคนไข้ใหม่ (New Patient)"}
                        </h2>
                        <p className="text-xs text-teal-700/80 mt-0.5">บันทึกข้อมูลส่วนบุคคล HN และข้อมูลสุขภาพเพื่อความปลอดภัย</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                        <Icons.X />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className={inputClass}
                                placeholder="เช่น นายสมชาย ฟันดี"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                เบอร์โทรศัพท์ <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className={inputClass}
                                placeholder="08x-xxx-xxxx"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสคนไข้ (HN)</label>
                            <input
                                type="text"
                                value={formData.hn}
                                onChange={(e) => setFormData({ ...formData, hn: e.target.value })}
                                className={inputClass}
                                placeholder="เว้นว่างเพื่อรันอัตโนมัติ"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">หมู่เลือด</label>
                            <select
                                value={formData.bloodGroup}
                                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                                className={inputClass}
                            >
                                <option value="A">Group A</option>
                                <option value="B">Group B</option>
                                <option value="AB">Group AB</option>
                                <option value="O">Group O</option>
                            </select>
                        </div>
                    </div>

                    {/* Critical Medical History Fields */}
                    <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-3">
                        <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5 uppercase tracking-wide">
                            <Icons.AlertTriangle /> ข้อมูลคัดกรองความเสี่ยงทางการแพทย์
                        </span>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.takingBloodThinners}
                                    onChange={(e) => setFormData({ ...formData, takingBloodThinners: e.target.checked })}
                                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                                />
                                <span className="text-xs font-bold text-rose-900">
                                    ทานยาละลายลิ่มเลือด (Taking Blood Thinners) ⚠️
                                </span>
                            </label>

                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isPregnant}
                                    onChange={(e) => setFormData({ ...formData, isPregnant: e.target.checked })}
                                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                                />
                                <span className="text-xs font-semibold text-slate-800">
                                    กำลังตั้งครรภ์ (Pregnant - ระวังการทำ X-Ray)
                                </span>
                            </label>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-rose-900 mb-1">
                                ประวัติแพ้ยา (คั่นด้วยจุลภาค ,)
                            </label>
                            <input
                                type="text"
                                value={formData.drugAllergies}
                                onChange={(e) => setFormData({ ...formData, drugAllergies: e.target.value })}
                                className="w-full px-3 py-1.5 border border-rose-200 rounded-lg text-xs bg-white text-rose-900 placeholder:text-rose-300"
                                placeholder="เช่น Penicillin, Amoxicillin, ยาชา"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                โรคประจำตัว (คั่นด้วยจุลภาค ,)
                            </label>
                            <input
                                type="text"
                                value={formData.medicalConditions}
                                onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 placeholder:text-slate-400"
                                placeholder="เช่น ความดันโลหิตสูง, เบาหวาน, โรคหัวใจ"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-5 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm disabled:opacity-50"
                        >
                            {saving ? "กำลังบันทึก..." : "บันทึกเวชระเบียน"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<DentalPatient[]>([]);
    const [search, setSearch] = useState("");
    const [filterRisk, setFilterRisk] = useState<"all" | "risk">("all");
    const [loading, setLoading] = useState(true);
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<DentalPatient | null>(null);
    const [customerToDelete, setCustomerToDelete] = useState<DentalPatient | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { showToast } = useToast();

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "customers"));
            const list: DentalPatient[] = snap.docs.map((d: any) => ({
                id: d.id,
                ...d.data(),
                hn: d.data().hn || `DN-${d.id.substring(0, 6)}`,
            }));
            setCustomers(list);
        } catch (err: any) {
            console.error("fetchCustomers error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const filtered = useMemo(() => {
        return customers.filter((c) => {
            const q = search.toLowerCase();
            const matchesSearch =
                (c.fullName || "").toLowerCase().includes(q) ||
                (c.phone || "").includes(q) ||
                (c.hn || "").toLowerCase().includes(q);

            if (filterRisk === "risk") {
                return (
                    matchesSearch &&
                    (c.takingBloodThinners || (c.drugAllergies && c.drugAllergies.length > 0))
                );
            }
            return matchesSearch;
        });
    }, [customers, search, filterRisk]);

    const confirmDelete = async () => {
        if (!customerToDelete) return;
        setIsDeleting(true);
        const res = await deleteCustomer(customerToDelete.id);
        if (res.success) {
            showToast("ลบข้อมูลคนไข้สำเร็จ", "success");
            setCustomerToDelete(null);
            fetchCustomers();
        } else {
            showToast(res.error || "ลบไม่สำเร็จ", "error");
        }
        setIsDeleting(false);
    };

    const countRisk = customers.filter(
        (c) => c.takingBloodThinners || (c.drugAllergies && c.drugAllergies.length > 0)
    ).length;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
            <ConfirmationModal
                show={!!customerToDelete}
                title="ยืนยันการลบเวชระเบียน"
                message={`คุณต้องการลบข้อมูลคนไข้ "${customerToDelete?.fullName}" หรือไม่?`}
                onConfirm={confirmDelete}
                onCancel={() => setCustomerToDelete(null)}
                isProcessing={isDeleting}
            />

            <PatientFormModal
                open={showFormModal}
                onClose={() => setShowFormModal(false)}
                onSave={fetchCustomers}
                patient={editingCustomer}
            />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                        <h1 className="text-2xl font-bold text-slate-900">เวชระเบียนคนไข้ (Dental Patient EMR)</h1>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        จัดการฐานข้อมูลผู้ป่วย เลขประจำตัว HN ประวัติสุขภาพ และความเสี่ยงทางการแพทย์
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingCustomer(null);
                        setShowFormModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm shadow-sm shadow-teal-600/20"
                >
                    <Icons.Plus />
                    ลงทะเบียนคนไข้ใหม่
                </button>
            </div>

            {/* KPI Metric Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">คนไข้ทั้งหมด</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{customers.length}</p>
                    <p className="text-xs text-slate-400 mt-0.5">มีเวชระเบียนในระบบ</p>
                </div>
                <div
                    onClick={() => setFilterRisk(filterRisk === "risk" ? "all" : "risk")}
                    className={`bg-white rounded-2xl p-4 border shadow-sm cursor-pointer transition-all ${
                        filterRisk === "risk" ? "border-rose-300 ring-2 ring-rose-200" : "border-rose-100"
                    }`}
                >
                    <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">กลุ่มเสี่ยงสูง (High Risk)</p>
                    <p className="text-2xl font-bold text-rose-700 mt-1 tabular-nums">{countRisk}</p>
                    <p className="text-xs text-rose-500/80 mt-0.5">ทานยาละลายลิ่มเลือด / แพ้ยา</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-teal-100 shadow-sm">
                    <p className="text-xs font-medium text-teal-600 uppercase tracking-wider">เชื่อมต่อ LINE</p>
                    <p className="text-2xl font-bold text-teal-700 mt-1 tabular-nums">
                        {customers.filter((c) => !!c.userId).length}
                    </p>
                    <p className="text-xs text-teal-600/80 mt-0.5">รับใบนัดผ่าน LINE อัตโนมัติ</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">ห้องตรวจทันตกรรม</p>
                    <Link
                        href="/odontogram"
                        className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline"
                    >
                        <span>🦷 เปิดผังฟัน & ตรวจคนไข้ →</span>
                    </Link>
                </div>
            </div>

            {/* Search Box */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="relative flex-1 w-full max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Icons.Search />
                    </div>
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อคนไข้, เลข HN, หรือเบอร์โทร..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                </div>
                <div className="text-xs text-slate-500">
                    แสดง {filtered.length} จาก {customers.length} คน
                </div>
            </div>

            {/* Patients Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="py-16 text-center text-slate-400 text-sm">กำลังโหลดเวชระเบียน...</div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 text-sm">ไม่พบข้อมูลคนไข้ที่ค้นหา</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-100">
                                <tr>
                                    <th className="py-3.5 px-4">รหัสคนไข้ (HN)</th>
                                    <th className="py-3.5 px-4">ชื่อ-นามสกุล</th>
                                    <th className="py-3.5 px-4">เบอร์โทรศัพท์</th>
                                    <th className="py-3.5 px-4">ข้อควรระวังทางการแพทย์</th>
                                    <th className="py-3.5 px-4">LINE เชื่อมต่อ</th>
                                    <th className="py-3.5 px-4 text-right">การรักษา & จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((patient) => {
                                    const hasBloodThinner = patient.takingBloodThinners;
                                    const allergies = patient.drugAllergies || [];

                                    return (
                                        <tr key={patient.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="py-3.5 px-4 font-mono font-bold text-teal-700">
                                                {patient.hn}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="font-semibold text-slate-900">{patient.fullName}</div>
                                                <div className="text-xs text-slate-400">
                                                    หมู่เลือด: {patient.bloodGroup || "—"}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                                                {patient.phone || "—"}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {hasBloodThinner && (
                                                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                            🩸 ทานยาละลายลิ่มเลือด
                                                        </span>
                                                    )}
                                                    {allergies.map((all, i) => (
                                                        <span
                                                            key={i}
                                                            className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200"
                                                        >
                                                            💊 แพ้: {all}
                                                        </span>
                                                    ))}
                                                    {!hasBloodThinner && allergies.length === 0 && (
                                                        <span className="text-xs text-slate-400">ไม่มีข้อมูลแพ้ยา</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {patient.userId ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <Icons.Line /> เชื่อมแล้ว
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href="/odontogram"
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
                                                    >
                                                        <span>🦷 ผังฟัน</span>
                                                    </Link>
                                                    <button
                                                        onClick={() => {
                                                            setEditingCustomer(patient);
                                                            setShowFormModal(true);
                                                        }}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                                        title="แก้ไข"
                                                    >
                                                        <Icons.Edit />
                                                    </button>
                                                    <button
                                                        onClick={() => setCustomerToDelete(patient)}
                                                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                                                        title="ลบ"
                                                    >
                                                        <Icons.Trash />
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
        </div>
    );
}
