"use server";

import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import { DentalLabOrder } from "@/types";

export interface DentalLabOrderDetail extends DentalLabOrder {
    patientName?: string;
    patientHn?: string;
    patientPhone?: string;
    dentistName?: string;
}

/**
 * ดึงรายการส่งแล็บทันตกรรมทั้งหมด
 */
export async function getDentalLabOrders(): Promise<{
    success: boolean;
    data?: DentalLabOrderDetail[];
    error?: string;
}> {
    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from("dental_lab_orders")
            .select(`
                *,
                patient:customers(id, fullName, phone, hn),
                dentist:technicians(id, firstName, lastName)
            `)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching lab orders:", error);
            return { success: false, error: error.message };
        }

        const formatted: DentalLabOrderDetail[] = (data || []).map((row: any) => ({
            id: row.id,
            orderCode: row.order_code,
            patientId: row.patient_id,
            dentistId: row.dentist_id,
            labName: row.lab_name,
            applianceType: row.appliance_type,
            toothNumber: row.tooth_number,
            shade: row.shade,
            impressionDate: row.impression_date,
            expectedDate: row.expected_date,
            receivedDate: row.received_date,
            fittingAppointmentId: row.fitting_appointment_id,
            labFee: Number(row.lab_fee || 0),
            status: row.status || "sent",
            notes: row.notes,
            createdAt: row.created_at,
            patientName: row.patient?.fullName || "คนไข้",
            patientHn: row.patient?.hn || "—",
            patientPhone: row.patient?.phone || "—",
            dentistName: row.dentist ? `${row.dentist.firstName} ${row.dentist.lastName || ""}`.trim() : "ทันตแพทย์",
        }));

        return { success: true, data: formatted };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to fetch lab orders" };
    }
}

/**
 * สร้างรายการส่งแล็บใหม่
 */
export async function createDentalLabOrder(params: {
    patientId: string;
    dentistId: string;
    labName: string;
    applianceType: string;
    toothNumber?: string;
    shade?: string;
    expectedDate: string;
    labFee?: number;
    notes?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const supabase = getSupabaseAdmin();
        const orderCode = `LAB-${Date.now().toString().slice(-6)}`;

        const { data, error } = await supabase
            .from("dental_lab_orders")
            .insert({
                order_code: orderCode,
                patient_id: params.patientId,
                dentist_id: params.dentistId,
                lab_name: params.labName,
                appliance_type: params.applianceType,
                tooth_number: params.toothNumber || null,
                shade: params.shade || null,
                impression_date: new Date().toISOString().split("T")[0],
                expected_date: params.expectedDate,
                lab_fee: params.labFee || 0,
                status: "sent",
                notes: params.notes || null,
            })
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to create lab order" };
    }
}

/**
 * อัปเดตสถานะงานแล็บ
 */
export async function updateDentalLabStatus(
    orderId: string,
    status: "sent" | "in_process" | "received" | "fitted" | "redo",
    receivedDate?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = getSupabaseAdmin();
        const payload: any = { status };
        if (status === "received") {
            payload.received_date = receivedDate || new Date().toISOString().split("T")[0];
        }

        const { error } = await supabase.from("dental_lab_orders").update(payload).eq("id", orderId);
        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * ลบรายการส่งแล็บ
 */
export async function deleteDentalLabOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = getSupabaseAdmin();
        const { error } = await supabase.from("dental_lab_orders").delete().eq("id", orderId);
        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
