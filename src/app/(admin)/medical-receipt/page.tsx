"use client";

import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/app/lib/supabase";
import { DentalPatient, Dentist } from "@/types";

interface ReceiptItem {
    name: string;
    tooth?: string;
    qty: number;
    price: number;
    ssoEligible: boolean; // เบิกประกันสังคมได้หรือไม่
}

export default function MedicalReceiptPage() {
    const [patients, setPatients] = useState<DentalPatient[]>([]);
    const [dentists, setDentists] = useState<Dentist[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState("");
    const [selectedDentistId, setSelectedDentistId] = useState("");
    const [documentType, setDocumentType] = useState<"receipt" | "certificate">("receipt");

    // Receipt details
    const [receiptNo, setReceiptNo] = useState(() => `RCP-${Date.now().toString().slice(-6)}`);
    const [receiptDate, setReceiptDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [paymentMethod, setPaymentMethod] = useState("PromptPay QR");
    const [items, setItems] = useState<ReceiptItem[]>([
        { name: "ขูดหินปูนทั้งปาก (Scaling)", tooth: "All", qty: 1, price: 900, ssoEligible: true },
        { name: "ยาแก้ปวดและลดบวม (Ibuprofen 400mg)", qty: 1, price: 150, ssoEligible: false },
    ]);

    // Certificate details
    const [restDays, setRestDays] = useState(1);
    const [diagnosisText, setDiagnosisText] = useState("ผ่าฟันคุดล่างขวา (Surgical Removal of Impacted Tooth 48)");

    useEffect(() => {
        const loadInit = async () => {
            const supabase = getSupabaseClient();
            const { data: pData } = await supabase.from("customers").select("*").order("fullName");
            if (pData && pData.length > 0) {
                const list = pData.map((d: any) => ({
                    id: d.id,
                    fullName: d.fullName || d.name || "ไม่มีชื่อ",
                    phone: d.phone || d.phoneNumber || "",
                    hn: d.hn || `DN-${d.id.substring(0, 6)}`,
                    idCardNumber: d.id_card_number || "1-1004-xxxxx-xx-1",
                }));
                setPatients(list);
                setSelectedPatientId(list[0].id);
            }

            const { data: dData } = await supabase.from("technicians").select("*").order("firstName");
            if (dData && dData.length > 0) {
                setDentists(dData as any);
                setSelectedDentistId(dData[0].id);
            }
        };
        loadInit();
    }, []);

    const patient = patients.find((p) => p.id === selectedPatientId);
    const dentist = dentists.find((d) => d.id === selectedDentistId);

    const totalAmount = items.reduce((acc, curr) => acc + curr.price * curr.qty, 0);
    const ssoTotal = items.filter((i) => i.ssoEligible).reduce((acc, curr) => acc + curr.price * curr.qty, 0);

    const addItem = () => {
        setItems([...items, { name: "อุดฟันสีเหมือนฟัน (Composite Filling)", tooth: "16 (O)", qty: 1, price: 800, ssoEligible: true }]);
    };

    const removeItem = (idx: number) => {
        setItems(items.filter((_, i) => i !== idx));
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
            {/* Control Panel (Hidden on Print) */}
            <div className="print:hidden bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">
                            เอกสารการเงิน & ใบเสร็จรับเงินทางการแพทย์ (Dental Medical Documents)
                        </h1>
                        <p className="text-xs text-slate-500">
                            ออกใบเสร็จรับเงินสำหรับเบิกประกันสังคม (SSO Claim) และใบรับรองแพทย์
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                            <button
                                onClick={() => setDocumentType("receipt")}
                                className={`px-3 py-1.5 rounded-lg transition-all ${
                                    documentType === "receipt" ? "bg-white text-teal-800 shadow-xs" : "text-slate-600"
                                }`}
                            >
                                🧾 ใบเสร็จรับเงิน / เบิก ปกส.
                            </button>
                            <button
                                onClick={() => setDocumentType("certificate")}
                                className={`px-3 py-1.5 rounded-lg transition-all ${
                                    documentType === "certificate" ? "bg-white text-teal-800 shadow-xs" : "text-slate-600"
                                }`}
                            >
                                🩺 ใบรับรองแพทย์ทันตกรรม
                            </button>
                        </div>

                        <button
                            onClick={handlePrint}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                        >
                            <span>🖨️</span> พิมพ์เอกสาร (Print)
                        </button>
                    </div>
                </div>

                {/* Document Options */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                        <label className="block font-semibold text-slate-600 mb-1">เลือกคนไข้:</label>
                        <select
                            value={selectedPatientId}
                            onChange={(e) => setSelectedPatientId(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800"
                        >
                            {patients.map((p) => (
                                <option key={p.id} value={p.id}>
                                    [{p.hn}] {p.fullName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block font-semibold text-slate-600 mb-1">ทันตแพทย์ผู้ให้การรักษา:</label>
                        <select
                            value={selectedDentistId}
                            onChange={(e) => setSelectedDentistId(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800"
                        >
                            {dentists.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.firstName} {d.lastName || ""} ({d.licenseNumber || "ท.12345"})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block font-semibold text-slate-600 mb-1">วิธีการชำระเงิน:</label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800"
                        >
                            <option value="PromptPay QR">พร้อมเพย์ (PromptPay QR)</option>
                            <option value="Cash">เงินสด (Cash)</option>
                            <option value="Credit Card">บัตรเครดิต (Credit Card)</option>
                        </select>
                    </div>
                </div>

                {documentType === "receipt" && (
                    <div className="pt-2">
                        <button
                            onClick={addItem}
                            className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                        >
                            <span>+ เพิ่มรายการหัตถการ/ยา</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Print-Ready Paper (A4 Style) */}
            <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-300 shadow-lg print:border-none print:shadow-none print:p-0 text-slate-900 font-sans text-xs">
                {documentType === "receipt" ? (
                    /* --- Medical Receipt Template --- */
                    <div className="space-y-6">
                        {/* Header Clinic Info */}
                        <div className="flex items-start justify-between border-b pb-4 border-slate-300">
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-teal-900">
                                    คลินิกทันตกรรมสไมล์แคร์ (SmileCare Dental Clinic)
                                </h2>
                                <p className="text-[11px] text-slate-600 mt-0.5">
                                    ใบอนุญาตสถานพยาบาลเลขที่: <strong>101030014589</strong> | เลขประจำตัวผู้เสียภาษี: 0105562014589
                                </p>
                                <p className="text-[11px] text-slate-500">
                                    123/45 ถนนสุขุมวิท แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพฯ 10110 โทร. 02-123-4567
                                </p>
                            </div>
                            <div className="text-right">
                                <h3 className="text-base font-extrabold text-teal-950 uppercase tracking-wide">
                                    ใบเสร็จรับเงิน / ใบกำกับภาษีอย่างย่อ
                                </h3>
                                <p className="text-[11px] font-mono font-bold mt-1">เลขที่: {receiptNo}</p>
                                <p className="text-[11px]">วันที่: {new Date(receiptDate).toLocaleDateString("th-TH")}</p>
                            </div>
                        </div>

                        {/* Patient & Doctor Box */}
                        <div className="grid grid-cols-2 gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                            <div>
                                <p><strong>ชื่อคนไข้:</strong> {patient?.fullName}</p>
                                <p><strong>เลขประจำตัวผู้ป่วย (HN):</strong> <span className="font-mono">{patient?.hn}</span></p>
                                <p><strong>เลขประจำตัวประชาชน:</strong> <span className="font-mono">{patient?.idCardNumber}</span></p>
                            </div>
                            <div>
                                <p><strong>ทันตแพทย์ผู้รักษา:</strong> {dentist?.firstName} {dentist?.lastName || ""}</p>
                                <p><strong>เลขที่ใบประกอบวิชาชีพ:</strong> <span className="font-mono">{dentist?.licenseNumber || "ท.14582"}</span></p>
                                <p><strong>ชำระโดย:</strong> {paymentMethod}</p>
                            </div>
                        </div>

                        {/* Items Table */}
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-slate-800 text-[11px] font-bold text-slate-800">
                                    <th className="py-2">ลำดับ</th>
                                    <th className="py-2">รายการหัตถการ / การรักษา</th>
                                    <th className="py-2 text-center">ซี่ฟัน</th>
                                    <th className="py-2 text-center">จำนวน</th>
                                    <th className="py-2 text-right">จำนวนเงิน (บาท)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs">
                                {items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="py-2.5 font-mono">{idx + 1}</td>
                                        <td className="py-2.5">
                                            <span className="font-medium text-slate-900">{item.name}</span>
                                            {item.ssoEligible && (
                                                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                                                    [เบิก ปกส. ได้]
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-2.5 text-center font-mono">{item.tooth || "—"}</td>
                                        <td className="py-2.5 text-center tabular-nums">{item.qty}</td>
                                        <td className="py-2.5 text-right font-semibold tabular-nums">{item.price.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-slate-800 font-bold text-sm">
                                    <td colSpan={4} className="py-3 text-right">ยอดรวมสุทธิ (Total Amount):</td>
                                    <td className="py-3 text-right text-teal-800 tabular-nums">{totalAmount.toLocaleString()} บาท</td>
                                </tr>
                            </tfoot>
                        </table>

                        {/* SSO Eligibility Notice Box */}
                        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                            <div>
                                <p className="font-bold">✓ สิทธิประโยชน์ประกันสังคม (Social Security Fund Claim):</p>
                                <p className="text-[11px] text-emerald-700">
                                    รายการที่สามารถยื่นเบิกได้ในบิลนี้ รวม: <strong>{ssoTotal.toLocaleString()} บาท</strong> (สิทธิทำฟันสูงสุด 900 บาท/ปี)
                                </p>
                            </div>
                            <span className="px-2.5 py-1 bg-white border border-emerald-400 rounded-lg text-[10px] font-bold uppercase text-emerald-800">
                                SSO Compliant
                            </span>
                        </div>

                        {/* Signatures */}
                        <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                            <div>
                                <div className="border-b border-slate-400 w-48 mx-auto mb-1.5 h-12" />
                                <p className="font-bold">{dentist?.firstName} {dentist?.lastName || ""}</p>
                                <p className="text-[11px] text-slate-500">ทันตแพทย์ผู้ให้การรักษา ({dentist?.licenseNumber || "ท.14582"})</p>
                            </div>
                            <div>
                                <div className="border-b border-slate-400 w-48 mx-auto mb-1.5 h-12" />
                                <p className="font-bold">เจ้าหน้าที่การเงิน</p>
                                <p className="text-[11px] text-slate-500">ผู้รับเงิน / ออกใบเสร็จ</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* --- Dental Medical Certificate Template --- */
                    <div className="space-y-6">
                        <div className="text-center border-b pb-4 border-slate-300">
                            <h2 className="text-xl font-bold text-teal-900">ใบรับรองการรักษาทันตกรรม (Dental Certificate)</h2>
                            <p className="text-xs text-slate-600 mt-1">คลินิกทันตกรรมสไมล์แคร์ | ใบอนุญาตสถานพยาบาลเลขที่: 101030014589</p>
                        </div>

                        <div className="space-y-4 text-xs sm:text-sm leading-relaxed p-4 bg-slate-50/50 rounded-xl">
                            <p className="text-right"><strong>วันที่:</strong> {new Date().toLocaleDateString("th-TH")}</p>
                            <p>
                                ข้าพเจ้า <strong>{dentist?.firstName} {dentist?.lastName || ""}</strong> เลขที่ใบประกอบวิชาชีพเวชกรรมทันตกรรม{" "}
                                <strong className="font-mono">{dentist?.licenseNumber || "ท.14582"}</strong>
                            </p>
                            <p>
                                ได้ทำการตรวจและให้การรักษาแก่: <strong>{patient?.fullName}</strong> เลขประจำตัวผู้ป่วย (HN):{" "}
                                <strong className="font-mono">{patient?.hn}</strong>
                            </p>
                            <div>
                                <p className="font-semibold text-slate-900">การวินิจฉัยและการทำหัตถการ:</p>
                                <p className="p-3 bg-white border border-slate-200 rounded-xl mt-1 text-teal-900 font-medium">
                                    {diagnosisText}
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900">ความเห็นของทันตแพทย์:</p>
                                <p className="p-3 bg-white border border-slate-200 rounded-xl mt-1 text-slate-800">
                                    ผู้ป่วยได้รับการทำหัตถการทางทันตกรรม มีอาการระบมและแผลผ่าตัดช่องปาก สมควรให้หยุดพักผ่อนเพื่อฟื้นฟูอาการเป็นเวลา{" "}
                                    <strong>{restDays} วัน</strong> (ตั้งแต่วันที่ {new Date().toLocaleDateString("th-TH")})
                                </p>
                            </div>
                        </div>

                        <div className="pt-8 text-center text-xs">
                            <div className="border-b border-slate-400 w-52 mx-auto mb-2 h-14" />
                            <p className="font-bold text-sm">({dentist?.firstName} {dentist?.lastName || ""})</p>
                            <p className="text-slate-500">ทันตแพทย์ผู้ให้การรักษา ({dentist?.licenseNumber || "ท.14582"})</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
