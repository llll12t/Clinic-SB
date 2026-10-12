"use server";

import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import { OrthoCase, OrthoInstallment } from "@/types";

export interface OrthoCaseDetail extends OrthoCase {
    patientName?: string;
    patientHn?: string;
    patientPhone?: string;
    dentistName?: string;
    installments?: OrthoInstallment[];
}

/**
 * ดึงรายการเคสจัดฟันทั้งหมด หรือกรองตาม patientId
 */
export async function getOrthoCases(patientId?: string): Promise<{
    success: boolean;
    data?: OrthoCaseDetail[];
    error?: string;
}> {
    try {
        const supabase = getSupabaseAdmin();
        let query = supabase
            .from("ortho_cases")
            .select(`
                *,
                patient:customers(id, fullName, phone, hn),
                dentist:technicians(id, firstName, lastName)
            `)
            .order("created_at", { ascending: false });

        if (patientId) {
            query = query.eq("patient_id", patientId);
        }

        const { data, error } = await query;
        if (error) {
            console.error("Error fetching ortho cases:", error);
            return { success: false, error: error.message };
        }

        // ดึง installments ของแต่ละเคส
        const caseIds = (data || []).map((c: any) => c.id);
        let installmentsMap: Record<string, OrthoInstallment[]> = {};

        if (caseIds.length > 0) {
            const { data: instData } = await supabase
                .from("ortho_installments")
                .select("*")
                .in("case_id", caseIds)
                .order("installment_no", { ascending: true });

            (instData || []).forEach((row: any) => {
                if (!installmentsMap[row.case_id]) installmentsMap[row.case_id] = [];
                installmentsMap[row.case_id].push({
                    id: row.id,
                    caseId: row.case_id,
                    installmentNo: row.installment_no,
                    dueAmount: Number(row.due_amount || 0),
                    paidAmount: Number(row.paid_amount || 0),
                    paidAt: row.paid_at,
                    status: row.status,
                    procedureNote: row.procedure_note,
                    appointmentId: row.appointment_id,
                });
            });
        }

        const formatted: OrthoCaseDetail[] = (data || []).map((row: any) => ({
            id: row.id,
            patientId: row.patient_id,
            dentistId: row.dentist_id,
            planName: row.plan_name,
            totalAmount: Number(row.total_amount || 0),
            paidAmount: Number(row.paid_amount || 0),
            totalMonths: row.total_months || 24,
            currentMonth: row.current_month || 0,
            status: row.status || "in_progress",
            bracketUpperBonded: !!row.bracket_upper_bonded,
            bracketLowerBonded: !!row.bracket_lower_bonded,
            notes: row.notes,
            createdAt: row.created_at,
            patientName: row.patient?.fullName || "คนไข้",
            patientHn: row.patient?.hn || "—",
            patientPhone: row.patient?.phone || "—",
            dentistName: row.dentist ? `${row.dentist.firstName} ${row.dentist.lastName || ""}`.trim() : "ทันตแพทย์",
            installments: installmentsMap[row.id] || [],
        }));

        return { success: true, data: formatted };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to fetch ortho cases" };
    }
}

/**
 * สร้างเคสจัดฟันใหม่ พร้อมสร้างตารางผ่อนชำระอัตโนมัติ
 */
export async function createOrthoCase(params: {
    patientId: string;
    dentistId: string;
    planName: string;
    totalAmount: number;
    initialDownPayment: number; // เงินดาวน์/ติดเครื่องมืองวดแรก
    monthlyPayment: number;      // ปรับเครื่องมือเดือนละ
    totalMonths: number;
    notes?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const supabase = getSupabaseAdmin();

        // 1. สร้างเคสหลัก
        const { data: newCase, error: caseErr } = await supabase
            .from("ortho_cases")
            .insert({
                patient_id: params.patientId,
                dentist_id: params.dentistId,
                plan_name: params.planName,
                total_amount: params.totalAmount,
                paid_amount: 0,
                total_months: params.totalMonths,
                current_month: 0,
                status: "in_progress",
                notes: params.notes || null,
            })
            .select()
            .single();

        if (caseErr) throw caseErr;

        // 2. สร้างรายการงวดผ่อนชำระ
        const installmentsToInsert: any[] = [];
        let remaining = params.totalAmount;

        // งวดที่ 1: ติดเครื่องมือบน/ล่าง (เงินก้อนแรก)
        if (params.initialDownPayment > 0) {
            installmentsToInsert.push({
                case_id: newCase.id,
                installment_no: 1,
                due_amount: params.initialDownPayment,
                paid_amount: 0,
                status: "pending",
                procedure_note: "งวดที่ 1: ติดเครื่องมือจัดฟัน (Bonding)",
            });
            remaining -= params.initialDownPayment;
        }

        // งวดต่อๆ ไป
        const monthlyCount = Math.max(1, params.totalMonths - 1);
        for (let i = 2; i <= monthlyCount + 1; i++) {
            if (remaining <= 0) break;
            const due = Math.min(params.monthlyPayment, remaining);
            installmentsToInsert.push({
                case_id: newCase.id,
                installment_no: i,
                due_amount: due,
                paid_amount: 0,
                status: "pending",
                procedure_note: `งวดที่ ${i}: ปรับเครื่องมือจัดฟันประจำเดือน`,
            });
            remaining -= due;
        }

        if (installmentsToInsert.length > 0) {
            await supabase.from("ortho_installments").insert(installmentsToInsert);
        }

        return { success: true, data: newCase };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to create ortho case" };
    }
}

/**
 * บันทึกการชำระเงินค่างวดจัดฟัน + บันทึกหัตถการประจำงวด
 */
export async function payOrthoInstallment(params: {
    installmentId: string;
    caseId: string;
    amountPaid: number;
    procedureNote?: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = getSupabaseAdmin();

        // 1. อัปเดตงวดที่จ่าย
        const { error: instErr } = await supabase
            .from("ortho_installments")
            .update({
                paid_amount: params.amountPaid,
                paid_at: new Date().toISOString(),
                status: "paid",
                procedure_note: params.procedureNote || "ปรับเครื่องมือจัดฟันเรียบร้อย",
            })
            .eq("id", params.installmentId);

        if (instErr) throw instErr;

        // 2. คำนวณยอดเงินรวมที่จ่ายแล้วของเคส
        const { data: allInst } = await supabase
            .from("ortho_installments")
            .select("paid_amount, status")
            .eq("case_id", params.caseId);

        const totalPaid = (allInst || []).reduce((acc: number, curr: any) => acc + (Number(curr.paid_amount) || 0), 0);
        const paidCount = (allInst || []).filter((x: any) => x.status === "paid").length;

        // 3. ตรวจสอบว่าจ่ายครบตามยอดทั้งหมดหรือยัง
        const { data: caseData } = await supabase
            .from("ortho_cases")
            .select("total_amount")
            .eq("id", params.caseId)
            .single();

        const isCompleted = caseData && totalPaid >= Number(caseData.total_amount);

        await supabase
            .from("ortho_cases")
            .update({
                paid_amount: totalPaid,
                current_month: paidCount,
                status: isCompleted ? "completed" : "in_progress",
            })
            .eq("id", params.caseId);

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to pay installment" };
    }
}

/**
 * อัปเดตสถานะติดเครื่องมือจัดฟัน (Bonding Status)
 */
export async function updateBondingStatus(
    caseId: string,
    upper: boolean,
    lower: boolean
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = getSupabaseAdmin();
        const { error } = await supabase
            .from("ortho_cases")
            .update({
                bracket_upper_bonded: upper,
                bracket_lower_bonded: lower,
            })
            .eq("id", caseId);

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
