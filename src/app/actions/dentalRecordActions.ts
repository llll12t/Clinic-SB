"use server";

import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import { DentalRecord } from "@/types";

/**
 * ดึงประวัติผังฟันและเวชระเบียนของคนไข้ตาม Patient ID
 */
export async function getPatientDentalRecords(patientId: string): Promise<{
    success: boolean;
    data?: DentalRecord[];
    error?: string;
}> {
    if (!patientId) return { success: false, error: "Patient ID is required" };

    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from("dental_records")
            .select("*")
            .eq("patient_id", patientId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching dental records:", error);
            return { success: false, error: error.message };
        }

        const formatted: DentalRecord[] = (data || []).map((row: any) => ({
            id: row.id,
            appointmentId: row.appointment_id,
            patientId: row.patient_id,
            dentistId: row.dentist_id,
            chairId: row.chair_id,
            toothNumber: row.tooth_number,
            surface: row.surface,
            condition: row.condition,
            diagnosis: row.diagnosis,
            treatmentDone: row.treatment_done,
            doctorNotes: row.doctor_notes,
            anesthesiaUsed: row.anesthesia_used,
            cost: Number(row.cost || 0),
            dfAmount: Number(row.df_amount || 0),
            xrayUrls: row.xray_urls || [],
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));

        return { success: true, data: formatted };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to fetch records" };
    }
}

/**
 * บันทึกประวัติการรักษา / ผังฟันใหม่
 */
export async function saveDentalRecord(record: {
    patientId: string;
    dentistId: string;
    appointmentId?: string;
    chairId?: string;
    toothNumber: string;
    surface?: string;
    condition?: string;
    diagnosis?: string;
    treatmentDone: string;
    doctorNotes?: string;
    anesthesiaUsed?: string;
    cost?: number;
    dfAmount?: number;
}): Promise<{ success: boolean; data?: DentalRecord; error?: string }> {
    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from("dental_records")
            .insert({
                patient_id: record.patientId,
                dentist_id: record.dentistId,
                appointment_id: record.appointmentId || null,
                chair_id: record.chairId || null,
                tooth_number: record.toothNumber,
                surface: record.surface || null,
                condition: record.condition || "healthy",
                diagnosis: record.diagnosis || null,
                treatment_done: record.treatmentDone,
                doctor_notes: record.doctorNotes || null,
                anesthesia_used: record.anesthesiaUsed || null,
                cost: record.cost || 0,
                df_amount: record.dfAmount || 0,
            })
            .select()
            .single();

        if (error) {
            console.error("Error saving dental record:", error);
            return { success: false, error: error.message };
        }

        return {
            success: true,
            data: {
                id: data.id,
                patientId: data.patient_id,
                dentistId: data.dentist_id,
                appointmentId: data.appointment_id,
                chairId: data.chair_id,
                toothNumber: data.tooth_number,
                surface: data.surface,
                condition: data.condition,
                diagnosis: data.diagnosis,
                treatmentDone: data.treatment_done,
                doctorNotes: data.doctor_notes,
                anesthesiaUsed: data.anesthesia_used,
                cost: Number(data.cost || 0),
                dfAmount: Number(data.df_amount || 0),
                createdAt: data.created_at,
            },
        };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to save dental record" };
    }
}

/**
 * ลบบันทึกการรักษา
 */
export async function deleteDentalRecord(recordId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = getSupabaseAdmin();
        const { error } = await supabase.from("dental_records").delete().eq("id", recordId);
        if (error) return { success: false, error: error.message };
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to delete record" };
    }
}
