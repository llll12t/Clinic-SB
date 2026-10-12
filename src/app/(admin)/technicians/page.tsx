"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { db, collection, getDocs, doc, updateDoc, addDoc, serverTimestamp, deleteDoc } from "@/app/lib/supabaseDb";
import { useToast } from "@/app/components/Toast";
import { ConfirmationModal } from "@/app/components/common/NotificationComponent";
import { Dentist } from "@/types";

// --- Icons ---
const Icons = {
    User: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    Users: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    Phone: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
    Search: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
    Plus: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>,
    Trash: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    Edit: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
    Line: () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M21.5 10.2c0-4.6-4.3-8.2-9.5-8.2S2.5 5.6 2.5 10.2c0 4.1 3.4 7.5 8 8.1.3 0 .7.1.8.3.1.2.1.5 0 .8-.1.4-.3 1.4-.3 1.7 0 .5.3.9.9.5l5.2-3.6c2.7-1.4 4.4-4.2 4.4-7.8zM12 14.6c-3.6 0-6.6-2.5-6.6-5.6 0-3.1 3-5.6 6.6-5.6 3.6 0 6.6 2.5 6.6 5.6 0 3.1-3 5.6-6.6 5.6z" /></svg>,
    X: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>,
    Badge: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
};

// --- Dentist Form Modal (Add/Edit) ---
interface DentistFormModalProps {
    open: boolean;
    onClose: () => void;
    onSave: () => void;
    dentist: Dentist | null;
}

function DentistFormModal({ open, onClose, onSave, dentist }: DentistFormModalProps) {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        nickname: "",
        licenseNumber: "",
        specialty: "General",
        phoneNumber: "",
        dfPercentage: 50,
        status: "available",
        imageUrl: "",
        lineUserId: "",
    });
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();
    const isEdit = !!dentist;

    useEffect(() => {
        if (dentist) {
            setFormData({
                firstName: dentist.firstName || "",
                lastName: dentist.lastName || "",
                nickname: (dentist as any).nickname || "",
                licenseNumber: dentist.licenseNumber || "",
                specialty: dentist.specialty || "General",
                phoneNumber: dentist.phoneNumber || "",
                dfPercentage: dentist.dfPercentage || 50,
                status: dentist.status || "available",
                imageUrl: dentist.imageUrl || "",
                lineUserId: dentist.lineUserId || "",
            });
        } else {
            setFormData({
                firstName: "",
                lastName: "",
                nickname: "",
                licenseNumber: "",
                specialty: "General",
                phoneNumber: "",
                dfPercentage: 50,
                status: "available",
                imageUrl: "",
                lineUserId: "",
            });
        }
    }, [dentist, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.firstName.trim() || !formData.phoneNumber.trim()) {
            showToast("กรุณาระบุชื่อและเบอร์โทรศัพท์ของทันตแพทย์", "error");
            return;
        }

        setSaving(true);
        try {
            if (isEdit && dentist?.id) {
                await updateDoc(doc(db, "technicians", dentist.id), {
                    ...formData,
                    updatedAt: serverTimestamp(),
                });
                showToast("อัปเดตข้อมูลทันตแพทย์เรียบร้อยแล้ว", "success");
            } else {
                await addDoc(collection(db, "technicians"), {
                    ...formData,
                    createdAt: serverTimestamp(),
                });
                showToast("เพิ่มทันตแพทย์ใหม่สำเร็จ", "success");
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
                            {isEdit ? "แก้ไขข้อมูลทันตแพทย์" : "เพิ่มทันตแพทย์ใหม่ (Add Dentist)"}
                        </h2>
                        <p className="text-xs text-teal-700/80 mt-0.5">ระบุใบประกอบวิชาชีพ สาขาความเชี่ยวชาญ และค่าตอบแทน DF</p>
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
                                ชื่อจริง <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className={inputClass}
                                placeholder="เช่น ทพ.สมศักดิ์"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">นามสกุล</label>
                            <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className={inputClass}
                                placeholder="เช่น รักฟันดี"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                เลขที่ใบประกอบวิชาชีพ (ท.xxxx)
                            </label>
                            <input
                                type="text"
                                value={formData.licenseNumber}
                                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                className={inputClass}
                                placeholder="เช่น ท.14582"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">สาขาความเชี่ยวชาญ</label>
                            <select
                                value={formData.specialty}
                                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                                className={inputClass}
                            >
                                <option value="General">ทันตกรรมทั่วไป (General Dentistry)</option>
                                <option value="Orthodontics">ทันตกรรมจัดฟัน (Orthodontics)</option>
                                <option value="Oral Surgery">ศัลยศาสตร์ช่องปาก (Oral Surgery)</option>
                                <option value="Endodontics">รักษารากฟัน (Endodontics)</option>
                                <option value="Periodontics">โรคเหงือกและปริทันต์ (Periodontics)</option>
                                <option value="Pedodontics">ทันตกรรมสำหรับเด็ก (Pedodontics)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                เบอร์โทรศัพท์ <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="tel"
                                required
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                className={inputClass}
                                placeholder="08x-xxx-xxxx"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                ส่วนแบ่งแพทย์ (Doctor Fee: DF %)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={formData.dfPercentage}
                                onChange={(e) => setFormData({ ...formData, dfPercentage: Number(e.target.value) })}
                                className={inputClass}
                                placeholder="50"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">สถานะการลงตรวจ</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className={inputClass}
                            >
                                <option value="available">พร้อมลงตรวจ (Available)</option>
                                <option value="on_trip">กำลังตรวจคนไข้ (In Treatment)</option>
                                <option value="unavailable">ลาพัก (Unavailable)</option>
                                <option value="suspended">ระงับเวร (Suspended)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">LINE User ID</label>
                            <input
                                type="text"
                                value={formData.lineUserId}
                                onChange={(e) => setFormData({ ...formData, lineUserId: e.target.value })}
                                className={inputClass}
                                placeholder="สำหรับแจ้งเตือนเคส"
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
                            {saving ? "กำลังบันทึก..." : "บันทึกข้อมูลทันตแพทย์"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function TechniciansPage() {
    const [dentists, setDentists] = useState<Dentist[]>([]);
    const [search, setSearch] = useState("");
    const [specialtyFilter, setSpecialtyFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingDentist, setEditingDentist] = useState<Dentist | null>(null);
    const [dentistToDelete, setDentistToDelete] = useState<Dentist | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { showToast } = useToast();

    const fetchDentists = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "technicians"));
            const list: Dentist[] = snap.docs.map((d: any) => ({
                id: d.id,
                ...d.data(),
            }));
            setDentists(list);
        } catch (err: any) {
            console.error("fetchDentists error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDentists();
    }, []);

    const filtered = useMemo(() => {
        return dentists.filter((d) => {
            const q = search.toLowerCase();
            const matchesSearch =
                (d.firstName || "").toLowerCase().includes(q) ||
                (d.lastName || "").toLowerCase().includes(q) ||
                (d.phoneNumber || "").includes(q) ||
                (d.licenseNumber || "").toLowerCase().includes(q);

            if (specialtyFilter !== "all") {
                return matchesSearch && d.specialty === specialtyFilter;
            }
            return matchesSearch;
        });
    }, [dentists, search, specialtyFilter]);

    const confirmDelete = async () => {
        if (!dentistToDelete) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, "technicians", dentistToDelete.id));
            showToast("ลบข้อมูลทันตแพทย์สำเร็จ", "success");
            setDentistToDelete(null);
            fetchDentists();
        } catch (err: any) {
            showToast("ลบไม่สำเร็จ: " + err.message, "error");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
            <ConfirmationModal
                show={!!dentistToDelete}
                title="ยืนยันการลบข้อมูลทันตแพทย์"
                message={`คุณต้องการลบข้อมูล "${dentistToDelete?.firstName} ${dentistToDelete?.lastName || ""}" หรือไม่?`}
                onConfirm={confirmDelete}
                onCancel={() => setDentistToDelete(null)}
                isProcessing={isDeleting}
            />

            <DentistFormModal
                open={showModal}
                onClose={() => setShowModal(false)}
                onSave={fetchDentists}
                dentist={editingDentist}
            />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                        <h1 className="text-2xl font-bold text-slate-900">ทันตแพทย์ (Dentists & Specialists)</h1>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        จัดการบุคลากรทันตแพทย์ ใบประกอบวิชาชีพ สาขาความเชี่ยวชาญ และส่วนแบ่งค่าตรวจ (DF)
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingDentist(null);
                        setShowModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm shadow-sm shadow-teal-600/20"
                >
                    <Icons.Plus />
                    เพิ่มทันตแพทย์ใหม่
                </button>
            </div>

            {/* KPI Metric Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">ทันตแพทย์ทั้งหมด</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{dentists.length}</p>
                    <p className="text-xs text-slate-400 mt-0.5">ประจำคลินิก</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-teal-100 shadow-sm">
                    <p className="text-xs font-medium text-teal-600 uppercase tracking-wider">พร้อมลงตรวจ (On Duty)</p>
                    <p className="text-2xl font-bold text-teal-700 mt-1 tabular-nums">
                        {dentists.filter((d) => d.status === "available").length}
                    </p>
                    <p className="text-xs text-teal-600/80 mt-0.5">รับเคสคนไข้ได้ทันที</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-cyan-100 shadow-sm">
                    <p className="text-xs font-medium text-cyan-600 uppercase tracking-wider">กำลังทำหัตถการ</p>
                    <p className="text-2xl font-bold text-cyan-700 mt-1 tabular-nums">
                        {dentists.filter((d) => d.status === "on_trip").length}
                    </p>
                    <p className="text-xs text-cyan-600/80 mt-0.5">อยู่ประจำยูนิตเตียง</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">ค่าตอบแทนเฉลี่ย (DF)</p>
                    <p className="text-2xl font-bold text-teal-700 mt-1 tabular-nums">50%</p>
                    <p className="text-xs text-slate-400 mt-0.5">Doctor Fee มาตรฐาน</p>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="relative flex-1 w-full max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Icons.Search />
                    </div>
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อทันตแพทย์, เลขใบประกอบวิชาชีพ, หรือเบอร์โทร..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={specialtyFilter}
                        onChange={(e) => setSpecialtyFilter(e.target.value)}
                        className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none"
                    >
                        <option value="all">ทุกสาขาความเชี่ยวชาญ</option>
                        <option value="General">ทันตกรรมทั่วไป</option>
                        <option value="Orthodontics">ทันตกรรมจัดฟัน</option>
                        <option value="Oral Surgery">ศัลยศาสตร์ช่องปาก</option>
                        <option value="Endodontics">รักษารากฟัน</option>
                    </select>
                </div>
            </div>

            {/* Dentists Cards Grid */}
            {loading ? (
                <div className="py-16 text-center text-slate-400 text-sm">กำลังโหลดข้อมูลทันตแพทย์...</div>
            ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-sm">ไม่พบข้อมูลทันตแพทย์ที่ค้นหา</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((dentist) => (
                        <div
                            key={dentist.id}
                            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-base border border-teal-200">
                                            👨‍⚕️
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-slate-900">
                                                {dentist.firstName} {dentist.lastName || ""}
                                            </h3>
                                            <p className="text-xs text-teal-700 font-medium">
                                                {dentist.specialty || "ทันตกรรมทั่วไป"}
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                            dentist.status === "available"
                                                ? "bg-teal-50 text-teal-700 border-teal-200"
                                                : "bg-slate-100 text-slate-600 border-slate-200"
                                        }`}
                                    >
                                        {dentist.status === "available" ? "พร้อมตรวจ" : "พักเวร"}
                                    </span>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400">เลขใบประกอบ:</span>
                                        <span className="font-mono font-semibold text-slate-800">
                                            {dentist.licenseNumber || "—"}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400">เบอร์โทรศัพท์:</span>
                                        <span className="font-mono">{dentist.phoneNumber}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Doctor Fee (DF):</span>
                                        <span className="font-bold text-teal-700">{dentist.dfPercentage || 50}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setEditingDentist(dentist);
                                        setShowModal(true);
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200"
                                >
                                    แก้ไข
                                </button>
                                <button
                                    onClick={() => setDentistToDelete(dentist)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200"
                                >
                                    ลบ
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
