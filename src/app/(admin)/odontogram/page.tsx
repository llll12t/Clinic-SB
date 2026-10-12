"use client";

import { useState, useEffect } from "react";
import InteractiveOdontogram from "@/app/components/dental/InteractiveOdontogram";
import { getPatientDentalRecords, saveDentalRecord, deleteDentalRecord } from "@/app/actions/dentalRecordActions";
import { getDentalChairs } from "@/app/actions/dentalChairActions";
import { getSupabaseClient } from "@/app/lib/supabase";
import { DentalRecord, DentalPatient, DentalChair } from "@/types";

export default function OdontogramPage() {
    const [patients, setPatients] = useState<DentalPatient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string>("");
    const [selectedPatient, setSelectedPatient] = useState<DentalPatient | null>(null);
    const [chairs, setChairs] = useState<DentalChair[]>([]);
    const [records, setRecords] = useState<DentalRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form fields
    const [selectedTooth, setSelectedTooth] = useState<string | null>("11");
    const [selectedSurfaces, setSelectedSurfaces] = useState<string[]>(["O"]);
    const [condition, setCondition] = useState<string>("caries");
    const [diagnosis, setDiagnosis] = useState<string>("Dental Caries (ฟันผุ)");
    const [treatmentDone, setTreatmentDone] = useState<string>("Composite Filling (อุดฟันสีเหมือนฟัน)");
    const [anesthesiaUsed, setAnesthesiaUsed] = useState<string>("");
    const [doctorNotes, setDoctorNotes] = useState<string>("");
    const [cost, setCost] = useState<number>(800);
    const [dfAmount, setDfAmount] = useState<number>(400);
    const [chairId, setChairId] = useState<string>("");
    const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // โหลดรายชื่อคนไข้และยูนิตเตียง
    useEffect(() => {
        const init = async () => {
            const supabase = getSupabaseClient();
            const { data } = await supabase.from("customers").select("*").order("createdAt", { ascending: false });
            if (data && data.length > 0) {
                const mappedPatients: DentalPatient[] = data.map((d: any) => ({
                    id: d.id,
                    fullName: d.fullName || d.name || "ไม่มีชื่อ",
                    phone: d.phone || d.phoneNumber || "",
                    hn: d.hn || `DN-${d.id.substring(0, 6)}`,
                    drugAllergies: d.drug_allergies || d.drugAllergies || [],
                    medicalConditions: d.medical_conditions || d.medicalConditions || [],
                    takingBloodThinners: d.taking_blood_thinners || d.takingBloodThinners || false,
                    isPregnant: d.is_pregnant || d.isPregnant || false,
                    bloodGroup: d.blood_group || d.bloodGroup || "—",
                }));
                setPatients(mappedPatients);
                setSelectedPatientId(mappedPatients[0].id);
                setSelectedPatient(mappedPatients[0]);
            }

            const chairRes = await getDentalChairs();
            if (chairRes.success && chairRes.data) {
                setChairs(chairRes.data);
                if (chairRes.data.length > 0) setChairId(chairRes.data[0].id);
            }
        };
        init();
    }, []);

    // โหลด Records เมื่อเปลี่ยนคนไข้
    useEffect(() => {
        if (!selectedPatientId) return;
        const p = patients.find((x) => x.id === selectedPatientId) || null;
        setSelectedPatient(p);

        const fetchRecords = async () => {
            setLoading(true);
            const res = await getPatientDentalRecords(selectedPatientId);
            if (res.success && res.data) {
                setRecords(res.data);
            } else {
                setRecords([]);
            }
            setLoading(false);
        };
        fetchRecords();
    }, [selectedPatientId, patients]);

    const showNotify = (message: string, type: "success" | "error" = "success") => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const toggleSurface = (surf: string) => {
        if (selectedSurfaces.includes(surf)) {
            setSelectedSurfaces(selectedSurfaces.filter((s) => s !== surf));
        } else {
            setSelectedSurfaces([...selectedSurfaces, surf]);
        }
    };

    const handleSaveRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatientId || !selectedTooth || !treatmentDone.trim()) {
            showNotify("กรุณากรอกข้อมูลหัตถการให้ครบถ้วน", "error");
            return;
        }

        setSaving(true);
        const surfaceString = selectedSurfaces.sort().join("");
        const res = await saveDentalRecord({
            patientId: selectedPatientId,
            dentistId: "dentist-admin", // Default practitioner
            chairId: chairId || undefined,
            toothNumber: selectedTooth,
            surface: surfaceString || undefined,
            condition,
            diagnosis,
            treatmentDone,
            doctorNotes,
            anesthesiaUsed: anesthesiaUsed || undefined,
            cost: Number(cost || 0),
            dfAmount: Number(dfAmount || 0),
        });

        if (res.success && res.data) {
            showNotify(`บันทึกหัตถการซี่ ${selectedTooth} สำเร็จ`);
            setRecords([res.data, ...records]);
            setDoctorNotes("");
        } else {
            showNotify(res.error || "เกิดข้อผิดพลาดในการบันทึก", "error");
        }
        setSaving(false);
    };

    const handleDelete = async (recordId: string, tooth: string) => {
        if (!confirm(`ต้องการลบบันทึกของซี่ ${tooth} หรือไม่?`)) return;
        const res = await deleteDentalRecord(recordId);
        if (res.success) {
            showNotify("ลบบันทึกเรียบร้อย");
            setRecords(records.filter((r) => r.id !== recordId));
        } else {
            showNotify(res.error || "ลบไม่สำเร็จ", "error");
        }
    };

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

            {/* Header & Patient Selector */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                            ห้องตรวจทันตกรรม & ผังฟัน (Dental Consultation)
                        </h1>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        บันทึกการตรวจรักษา วินิจฉัยโรค และประวัติผังฟัน 32 ซี่ตามมาตรฐาน FDI
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">เลือกคนไข้:</label>
                    <select
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 min-w-[240px]"
                    >
                        {patients.map((p) => (
                            <option key={p.id} value={p.id}>
                                [{p.hn || "HN"}] {p.fullName} ({p.phone})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Critical Medical Alert Banner */}
            {selectedPatient && (
                <div className="space-y-2">
                    {/* Alert 1: ยาละลายลิ่มเลือด (Blood Thinners) */}
                    {selectedPatient.takingBloodThinners && (
                        <div className="bg-rose-500 text-white px-4 py-3 rounded-xl flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">⚠️</span>
                                <div>
                                    <p className="font-bold text-sm">ข้อควรระวังวิกฤต: คนไข้ทานยาละลายลิ่มเลือด (Taking Blood Thinners)</p>
                                    <p className="text-xs text-rose-100">
                                        ระวังภาวะเลือดหยุดยาก ห้ามถอนฟันหรือผ่าตัดจนกว่าจะได้รับคำยืนยันจากแพทย์ประจำตัว
                                    </p>
                                </div>
                            </div>
                            <span className="px-2.5 py-1 bg-white/20 rounded-lg text-xs font-semibold uppercase">High Risk</span>
                        </div>
                    )}

                    {/* Alert 2: ประวัติแพ้ยา (Drug Allergy) */}
                    {selectedPatient.drugAllergies && selectedPatient.drugAllergies.length > 0 && (
                        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-sm font-medium text-xs sm:text-sm">
                            <span className="text-base">💊</span>
                            <span>
                                <strong>ประวัติแพ้ยา:</strong> {selectedPatient.drugAllergies.join(", ")}
                            </span>
                        </div>
                    )}

                    {/* Patient Summary Card */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center text-sm">
                                {selectedPatient.fullName[0] || "P"}
                            </div>
                            <div>
                                <span className="font-bold text-slate-900 text-sm">{selectedPatient.fullName}</span>
                                <span className="text-slate-400 ml-2">HN: {selectedPatient.hn}</span>
                                <p className="text-slate-500 mt-0.5">เบอร์โทร: {selectedPatient.phone} | หมู่เลือด: {selectedPatient.bloodGroup}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-slate-600">
                            <span>
                                <strong>โรคประจำตัว:</strong>{" "}
                                {selectedPatient.medicalConditions?.length
                                    ? selectedPatient.medicalConditions.join(", ")
                                    : "ไม่มี"}
                            </span>
                            <span>
                                <strong>ตั้งครรภ์:</strong> {selectedPatient.isPregnant ? "⚠️ ตั้งครรภ์ (งด X-ray)" : "ไม่ใช่"}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Interactive Odontogram Component */}
            <InteractiveOdontogram
                records={records}
                selectedTooth={selectedTooth}
                onSelectTooth={(tooth) => setSelectedTooth(tooth)}
            />

            {/* Consultation & Treatment Form */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span>📝</span> บันทึกการรักษา ซี่ที่ {selectedTooth || "—"}
                    </h3>
                    <span className="text-xs text-slate-500">เลือกซี่และระบุรายละเอียดเพื่อบันทึกประวัติ</span>
                </div>

                <form onSubmit={handleSaveRecord} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Tooth & Condition */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                                ซี่ฟันที่เลือก (Tooth No.) *
                            </label>
                            <input
                                type="text"
                                required
                                value={selectedTooth || ""}
                                onChange={(e) => setSelectedTooth(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-teal-700 bg-teal-50/50"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                                สภาพรอยโรค (Condition)
                            </label>
                            <select
                                value={condition}
                                onChange={(e) => setCondition(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                            >
                                <option value="healthy">⚪ ปกติ (Healthy)</option>
                                <option value="caries">🔴 ฟันผุ (Caries)</option>
                                <option value="filled">🔵 อุดแล้ว (Filled)</option>
                                <option value="crown">🟣 ครอบฟัน (Crown)</option>
                                <option value="rct">🟡 รักษาราก (Root Canal)</option>
                                <option value="missing">✖️ ถอนแล้ว (Missing)</option>
                                <option value="impacted">🟢 ฟันคุด (Impacted)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                                ยูนิตทำฟัน (Dental Chair)
                            </label>
                            <select
                                value={chairId}
                                onChange={(e) => setChairId(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                            >
                                <option value="">— ไม่ระบุ —</option>
                                {chairs.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                                ยาชาที่ใช้ (Anesthesia)
                            </label>
                            <input
                                type="text"
                                value={anesthesiaUsed}
                                onChange={(e) => setAnesthesiaUsed(e.target.value)}
                                placeholder="เช่น 2% Mepivacaine 1 หลอด"
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                            />
                        </div>
                    </div>

                    {/* Surfaces Checkbox (MODBL) */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                            พื้นผิวฟันที่เกี่ยวข้อง (Surfaces: MODBL)
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                            {[
                                { key: "M", label: "M (Mesial - ด้านหน้า)" },
                                { key: "O", label: "O (Occlusal - ด้านบดเคี้ยว)" },
                                { key: "D", label: "D (Distal - ด้านหลัง)" },
                                { key: "B", label: "B (Buccal - ด้านแก้ม)" },
                                { key: "L", label: "L (Lingual - ด้านลิ้น)" },
                            ].map((surf) => {
                                const active = selectedSurfaces.includes(surf.key);
                                return (
                                    <button
                                        type="button"
                                        key={surf.key}
                                        onClick={() => toggleSurface(surf.key)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                            active
                                                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                                                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                        }`}
                                    >
                                        {surf.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Diagnosis & Treatment */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                                การวินิจฉัย (Diagnosis)
                            </label>
                            <input
                                type="text"
                                value={diagnosis}
                                onChange={(e) => setDiagnosis(e.target.value)}
                                placeholder="เช่น Dental Caries, Pulpitis, Tooth Wear"
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                                หัตถการที่ทำ (Treatment Done) *
                            </label>
                            <input
                                type="text"
                                required
                                value={treatmentDone}
                                onChange={(e) => setTreatmentDone(e.target.value)}
                                placeholder="เช่น Composite Filling 2 surfaces, ขูดหินปูนทั้งปาก"
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium"
                            />
                        </div>
                    </div>

                    {/* Cost & Doctor Fee */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                                ค่าหัตถการ (บาท)
                            </label>
                            <input
                                type="number"
                                value={cost}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setCost(val);
                                    setDfAmount(Math.round(val * 0.5)); // Auto default 50% DF
                                }}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold tabular-nums"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                                ส่วนแบ่งแพทย์ (DF 50% - บาท)
                            </label>
                            <input
                                type="number"
                                value={dfAmount}
                                onChange={(e) => setDfAmount(Number(e.target.value))}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-teal-700 tabular-nums"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                                บันทึกเพิ่มเติมของคุณหมอ
                            </label>
                            <input
                                type="text"
                                value={doctorNotes}
                                onChange={(e) => setDoctorNotes(e.target.value)}
                                placeholder="เช่น คนไข้เสียวฟันเล็กน้อย นัดดูอาการ 2 สัปดาห์"
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                            />
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm shadow-sm shadow-teal-600/20 disabled:opacity-50 flex items-center gap-2"
                        >
                            <span>💾</span>
                            {saving ? "กำลังบันทึก..." : "บันทึกหัตถการเข้าเวชระเบียน"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Treatment History Records Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-900">
                        ประวัติการรักษาทั้งหมดของคนไข้ ({records.length} รายการ)
                    </h3>
                    <span className="text-xs text-slate-400">เรียงตามวันที่ล่าสุด</span>
                </div>

                {loading ? (
                    <div className="py-8 text-center text-slate-400 text-sm">กำลังโหลดประวัติ...</div>
                ) : records.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-sm">ยังไม่มีประวัติการรักษาสำหรับคนไข้ท่านนี้</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="py-3 px-4 rounded-l-xl">ซี่ฟัน / ด้าน</th>
                                    <th className="py-3 px-4">สภาพฟัน</th>
                                    <th className="py-3 px-4">การวินิจฉัย</th>
                                    <th className="py-3 px-4">หัตถการที่ทำ</th>
                                    <th className="py-3 px-4">ค่ารักษา (บาท)</th>
                                    <th className="py-3 px-4">DF หมอ</th>
                                    <th className="py-3 px-4">วันที่</th>
                                    <th className="py-3 px-4 text-right rounded-r-xl">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {records.map((r) => (
                                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="py-3 px-4 font-bold text-teal-700">
                                            ซี่ {r.toothNumber} {r.surface ? `(${r.surface})` : ""}
                                        </td>
                                        <td className="py-3 px-4 capitalize">
                                            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-medium">
                                                {r.condition || "healthy"}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-slate-800">{r.diagnosis || "—"}</td>
                                        <td className="py-3 px-4 font-medium text-slate-900">{r.treatmentDone}</td>
                                        <td className="py-3 px-4 font-semibold text-slate-900 tabular-nums">
                                            {r.cost?.toLocaleString() || 0}
                                        </td>
                                        <td className="py-3 px-4 text-teal-700 font-semibold tabular-nums">
                                            {r.dfAmount?.toLocaleString() || 0}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-slate-500">
                                            {r.createdAt ? new Date(r.createdAt).toLocaleDateString("th-TH") : "—"}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <button
                                                onClick={() => handleDelete(r.id, r.toothNumber)}
                                                className="text-xs text-rose-600 hover:text-rose-800 font-medium p-1 hover:bg-rose-50 rounded"
                                            >
                                                ลบ
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
