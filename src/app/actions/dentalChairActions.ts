"use server";

import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import { DentalChair } from "@/types";

/**
 * ดึงรายการยูนิตทำฟันทั้งหมด (Dental Chairs)
 */
export async function getDentalChairs(): Promise<{ success: boolean; data?: DentalChair[]; error?: string }> {
    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from("dental_chairs")
            .select("*")
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Error fetching dental chairs:", error);
            return { success: false, error: error.message };
        }

        const formatted: DentalChair[] = (data || []).map((row: any) => ({
            id: row.id,
            name: row.name,
            roomNumber: row.room_number,
            status: row.status || "available",
            colorCode: row.color_code || "#0D9488",
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));

        return { success: true, data: formatted };
    } catch (err: any) {
        console.error("getDentalChairs exception:", err);
        return { success: false, error: err.message || "Failed to fetch chairs" };
    }
}

/**
 * สร้างยูนิตทำฟันใหม่
 */
export async function createDentalChair(formData: {
    name: string;
    roomNumber?: string;
    status?: "available" | "occupied" | "maintenance";
    colorCode?: string;
}): Promise<{ success: boolean; data?: DentalChair; error?: string }> {
    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from("dental_chairs")
            .insert({
                name: formData.name,
                room_number: formData.roomNumber || null,
                status: formData.status || "available",
                color_code: formData.colorCode || "#0D9488",
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating dental chair:", error);
            return { success: false, error: error.message };
        }

        return {
            success: true,
            data: {
                id: data.id,
                name: data.name,
                roomNumber: data.room_number,
                status: data.status,
                colorCode: data.color_code,
                createdAt: data.created_at,
            },
        };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to create chair" };
    }
}

/**
 * แก้ไขข้อมูลยูนิตทำฟัน
 */
export async function updateDentalChair(
    id: string,
    formData: Partial<{
        name: string;
        roomNumber: string;
        status: "available" | "occupied" | "maintenance";
        colorCode: string;
    }>
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = getSupabaseAdmin();
        const payload: any = { updated_at: new Date().toISOString() };
        if (formData.name !== undefined) payload.name = formData.name;
        if (formData.roomNumber !== undefined) payload.room_number = formData.roomNumber;
        if (formData.status !== undefined) payload.status = formData.status;
        if (formData.colorCode !== undefined) payload.color_code = formData.colorCode;

        const { error } = await supabase
            .from("dental_chairs")
            .update(payload)
            .eq("id", id);

        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to update chair" };
    }
}

/**
 * ลบยูนิตทำฟัน
 */
export async function deleteDentalChair(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = getSupabaseAdmin();
        const { error } = await supabase.from("dental_chairs").delete().eq("id", id);
        if (error) return { success: false, error: error.message };
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to delete chair" };
    }
}
