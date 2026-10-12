"use client";

import { useState, useEffect } from "react";
import { getDentalChairs, createDentalChair, updateDentalChair, deleteDentalChair } from "@/app/actions/dentalChairActions";
import { DentalChair } from "@/types";

export default function DentalChairsPage() {
    const [chairs, setChairs] = useState<DentalChair[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingChair, setEditingChair] = useState<DentalChair | null>(null);
    const [formName, setFormName] = useState("");
    const [formRoom, setFormRoom] = useState("");
    const [formStatus, setFormStatus] = useState<"available" | "occupied" | "maintenance">("available");
    const [formColor, setFormColor] = useState("#0D9488");
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const loadChairs = async () => {
        setLoading(true);
        const res = await getDentalChairs();
        if (res.success && res.data) {
            setChairs(res.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadChairs();
    }, []);

    const showNotify = (message: string, type: "success" | "error" = "success") => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleOpenAdd = () => {
        setEditingChair(null);
        setFormName(`ยูนิตทำฟัน ${chairs.length + 1}`);
        setFormRoom("");
        setFormStatus("available");
        setFormColor("#0D9488");
        setIsModalOpen(true);
    };

    const handleOpenEdit = (chair: DentalChair) => {
        setEditingChair(chair);
        setFormName(chair.name);
        setFormRoom(chair.roomNumber || "");
        setFormStatus(chair.status);
        setFormColor(chair.colorCode || "#0D9488");
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim()) return;
        setSaving(true);

        if (editingChair) {
            const res = await updateDentalChair(editingChair.id, {
                name: formName,
                roomNumber: formRoom,
                status: formStatus,
                colorCode: formColor,
            });
            if (res.success) {
                showNotify("อัปเดตข้อมูลยูนิตสำเร็จ");
                setIsModalOpen(false);
                loadChairs();
            } else {
                showNotify(res.error || "เกิดข้อผิดพลาด", "error");
            }
        } else {
            const res = await createDentalChair({
                name: formName,
                roomNumber: formRoom,
                status: formStatus,
                colorCode: formColor,
            });
            if (res.success) {
                showNotify("เพิ่มยูนิตทำฟันใหม่เรียบร้อยแล้ว");
                setIsModalOpen(false);
                loadChairs();
            } else {
                showNotify(res.error || "เกิดข้อผิดพลาด", "error");
            }
        }
        setSaving(false);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`คุณต้องการลบ "${name}" หรือไม่?`)) return;
        const res = await deleteDentalChair(id);
        if (res.success) {
            showNotify("ลบยูนิตสำเร็จ");
            loadChairs();
        } else {
            showNotify(res.error || "ลบไม่สำเร็จ", "error");
        }
    };

    const countAvailable = chairs.filter((c) => c.status === "available").length;
    const countOccupied = chairs.filter((c) => c.status === "occupied").length;
    const countMaintenance = chairs.filter((c) => c.status === "maintenance").length;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
            {/* Notification Toast */}
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
                        <h1 className="text-2xl font-bold text-slate-900">จัดการยูนิตทำฟัน (Dental Chairs)</h1>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        บริหารจัดการเตียงและห้องตรวจทันตกรรม ควบคุมสถานะความพร้อมแบบเรียลไทม์
                    </p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm shadow-sm transition-all shadow-teal-600/20 hover:shadow-teal-600/30"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    เพิ่มยูนิตใหม่
                </button>
            </div>

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">ยูนิตทั้งหมด</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{chairs.length}</p>
                    <p className="text-xs text-slate-400 mt-0.5">เตียงทันตกรรมในคลินิก</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-teal-100 shadow-sm">
                    <p className="text-xs font-medium text-teal-600 uppercase tracking-wider">พร้อมใช้งาน (ว่าง)</p>
                    <p className="text-2xl font-bold text-teal-700 mt-1 tabular-nums">{countAvailable}</p>
                    <p className="text-xs text-teal-600/80 mt-0.5">พร้อมรับคนไข้ทันที</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-cyan-100 shadow-sm">
                    <p className="text-xs font-medium text-cyan-600 uppercase tracking-wider">กำลังรักษา</p>
                    <p className="text-2xl font-bold text-cyan-700 mt-1 tabular-nums">{countOccupied}</p>
                    <p className="text-xs text-cyan-600/80 mt-0.5">มีคนไข้ประจำเตียง</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm">
                    <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">ซ่อมบำรุง / ฆ่าเชื้อ</p>
                    <p className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">{countMaintenance}</p>
                    <p className="text-xs text-amber-600/80 mt-0.5">ปิดปรับปรุงชั่วคราว</p>
                </div>
            </div>

            {/* Chair Cards Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-500 border-t-transparent" />
                </div>
            ) : chairs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h3 className="text-base font-semibold text-slate-800">ยังไม่มีข้อมูลยูนิตทำฟัน</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                        เพิ่มยูนิตทำฟัน (Dental Chair) เพื่อเริ่มจัดสรรตารางนัดหมายและการลงตรวจของคุณหมอ
                    </p>
                    <button
                        onClick={handleOpenAdd}
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"
                    >
                        + เพิ่มยูนิตแรก
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {chairs.map((chair) => {
                        const statusBadge = {
                            available: { label: "ว่าง / พร้อมตรวจ", bg: "bg-teal-50 text-teal-700 border-teal-200", dot: "bg-teal-500" },
                            occupied: { label: "กำลังให้บริการ", bg: "bg-cyan-50 text-cyan-700 border-cyan-200", dot: "bg-cyan-500" },
                            maintenance: { label: "ปิดซ่อมบำรุง", bg: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
                        }[chair.status];

                        return (
                            <div
                                key={chair.id}
                                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                                                style={{ backgroundColor: chair.colorCode || "#0D9488" }}
                                            >
                                                💺
                                            </div>
                                            <div>
                                                <h3 className="text-base font-semibold text-slate-900">{chair.name}</h3>
                                                <p className="text-xs text-slate-500">
                                                    {chair.roomNumber ? `ห้อง: ${chair.roomNumber}` : "ห้องตรวจกลาง"}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadge.bg}`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                                            {statusBadge.label}
                                        </span>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: chair.colorCode }} />
                                            สีประจำเตียงในปฏิทิน
                                        </span>
                                        <span className="text-slate-400">ID: {chair.id.substring(0, 8)}</span>
                                    </div>
                                </div>

                                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => handleOpenEdit(chair)}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200"
                                    >
                                        แก้ไข
                                    </button>
                                    <button
                                        onClick={() => handleDelete(chair.id, chair.name)}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200"
                                    >
                                        ลบ
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal Add/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">
                                {editingChair ? "แก้ไขข้อมูลยูนิตทำฟัน" : "เพิ่มยูนิตทำฟันใหม่"}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    ชื่อยูนิต / เตียงทำฟัน *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="เช่น ยูนิต 1 (ริมหน้าต่าง), ห้องผ่าตัดเล็ก"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    หมายเลขห้อง / โซน
                                </label>
                                <input
                                    type="text"
                                    value={formRoom}
                                    onChange={(e) => setFormRoom(e.target.value)}
                                    placeholder="เช่น Room A, ชั้น 2"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                        สถานะการใช้งาน
                                    </label>
                                    <select
                                        value={formStatus}
                                        onChange={(e) => setFormStatus(e.target.value as any)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                    >
                                        <option value="available">ว่าง (Available)</option>
                                        <option value="occupied">กำลังใช้งาน (Occupied)</option>
                                        <option value="maintenance">ซ่อมบำรุง (Maintenance)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                        สีประจำเตียง (ปฏิทิน)
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={formColor}
                                            onChange={(e) => setFormColor(e.target.value)}
                                            className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5 bg-white"
                                        />
                                        <span className="text-xs text-slate-500 font-mono">{formColor}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2 rounded-xl text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white shadow-sm disabled:opacity-50"
                                >
                                    {saving ? "กำลังบันทึก..." : "บันทึกยูนิต"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
