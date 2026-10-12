"use client";

import React, { useState } from "react";
import { DentalRecord } from "@/types";

interface InteractiveOdontogramProps {
    records?: DentalRecord[];
    selectedTooth: string | null;
    onSelectTooth: (toothNumber: string) => void;
}

// FDI 32 Adult Teeth Arrays
const UPPER_RIGHT = ["18", "17", "16", "15", "14", "13", "12", "11"];
const UPPER_LEFT = ["21", "22", "23", "24", "25", "26", "27", "28"];
const LOWER_RIGHT = ["48", "47", "46", "45", "44", "43", "42", "41"];
const LOWER_LEFT = ["31", "32", "33", "34", "35", "36", "37", "38"];

const TOOTH_NAMES: Record<string, string> = {
    "11": "ฟันตัดกลางขวาบน (Central Incisor)",
    "12": "ฟันตัดข้างขวาบน (Lateral Incisor)",
    "13": "ฟันเขี้ยวขวาบน (Canine)",
    "14": "ฟันกรามน้อยที่ 1 ขวาบน (1st Premolar)",
    "15": "ฟันกรามน้อยที่ 2 ขวาบน (2nd Premolar)",
    "16": "ฟันกรามแท้ที่ 1 ขวาบน (1st Molar)",
    "17": "ฟันกรามแท้ที่ 2 ขวาบน (2nd Molar)",
    "18": "ฟันคุด/กรามที่ 3 ขวาบน (Wisdom Tooth)",
    "21": "ฟันตัดกลางซ้ายบน (Central Incisor)",
    "22": "ฟันตัดข้างซ้ายบน (Lateral Incisor)",
    "23": "ฟันเขี้ยวซ้ายบน (Canine)",
    "24": "ฟันกรามน้อยที่ 1 ซ้ายบน (1st Premolar)",
    "25": "ฟันกรามน้อยที่ 2 ซ้ายบน (2nd Premolar)",
    "26": "ฟันกรามแท้ที่ 1 ซ้ายบน (1st Molar)",
    "27": "ฟันกรามแท้ที่ 2 ซ้ายบน (2nd Molar)",
    "28": "ฟันคุด/กรามที่ 3 ซ้ายบน (Wisdom Tooth)",
    "31": "ฟันตัดกลางซ้ายล่าง (Central Incisor)",
    "32": "ฟันตัดข้างซ้ายล่าง (Lateral Incisor)",
    "33": "ฟันเขี้ยวซ้ายล่าง (Canine)",
    "34": "ฟันกรามน้อยที่ 1 ซ้ายล่าง (1st Premolar)",
    "35": "ฟันกรามน้อยที่ 2 ซ้ายล่าง (2nd Premolar)",
    "36": "ฟันกรามแท้ที่ 1 ซ้ายล่าง (1st Molar)",
    "37": "ฟันกรามแท้ที่ 2 ซ้ายล่าง (2nd Molar)",
    "38": "ฟันคุด/กรามที่ 3 ซ้ายล่าง (Wisdom Tooth)",
    "41": "ฟันตัดกลางขวาล่าง (Central Incisor)",
    "42": "ฟันตัดข้างขวาล่าง (Lateral Incisor)",
    "43": "ฟันเขี้ยวขวาล่าง (Canine)",
    "44": "ฟันกรามน้อยที่ 1 ขวาล่าง (1st Premolar)",
    "45": "ฟันกรามน้อยที่ 2 ขวาล่าง (2nd Premolar)",
    "46": "ฟันกรามแท้ที่ 1 ขวาล่าง (1st Molar)",
    "47": "ฟันกรามแท้ที่ 2 ขวาล่าง (2nd Molar)",
    "48": "ฟันคุด/กรามที่ 3 ขวาล่าง (Wisdom Tooth)",
};

const CONDITION_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
    healthy: { bg: "bg-white", border: "border-slate-300", text: "text-slate-700", label: "ปกติ (Healthy)" },
    caries: { bg: "bg-rose-500", border: "border-rose-600", text: "text-white", label: "ฟันผุ (Caries)" },
    filled: { bg: "bg-teal-500", border: "border-teal-600", text: "text-white", label: "อุดแล้ว (Filled)" },
    crown: { bg: "bg-indigo-500", border: "border-indigo-600", text: "text-white", label: "ครอบฟัน (Crown)" },
    rct: { bg: "bg-amber-400", border: "border-amber-500", text: "text-slate-900", label: "รักษาราก (RCT)" },
    missing: { bg: "bg-slate-400", border: "border-slate-500", text: "text-white", label: "ถอนแล้ว (Missing)" },
    impacted: { bg: "bg-emerald-600", border: "border-emerald-700", text: "text-white", label: "ฟันคุด (Impacted)" },
};

export default function InteractiveOdontogram({
    records = [],
    selectedTooth,
    onSelectTooth,
}: InteractiveOdontogramProps) {
    // หา condition ล่าสุดของแต่ละซี่จาก records
    const toothConditionMap: Record<string, { condition: string; surface?: string }> = {};
    records.forEach((r) => {
        if (!toothConditionMap[r.toothNumber]) {
            toothConditionMap[r.toothNumber] = {
                condition: r.condition || "healthy",
                surface: r.surface,
            };
        }
    });

    const renderToothButton = (toothNo: string) => {
        const info = toothConditionMap[toothNo];
        const condition = info?.condition || "healthy";
        const isSelected = selectedTooth === toothNo;
        const styleConfig = CONDITION_COLORS[condition] || CONDITION_COLORS.healthy;

        return (
            <button
                key={toothNo}
                type="button"
                onClick={() => onSelectTooth(toothNo)}
                className={`relative flex flex-col items-center justify-between p-1.5 w-10 sm:w-12 h-14 sm:h-16 rounded-xl border-2 transition-all group ${
                    isSelected
                        ? "border-teal-500 ring-4 ring-teal-500/20 scale-105 z-10 shadow-md"
                        : `${styleConfig.border} hover:border-teal-400 hover:scale-102`
                } ${styleConfig.bg}`}
                title={`${toothNo} - ${TOOTH_NAMES[toothNo] || "ฟัน"}`}
            >
                {/* Tooth Number */}
                <span
                    className={`text-[11px] font-bold ${
                        condition === "healthy" ? "text-slate-700" : styleConfig.text
                    }`}
                >
                    {toothNo}
                </span>

                {/* Tooth Graphic Representation (Crown + Surface Icon) */}
                <div className="w-5 h-5 flex items-center justify-center">
                    {condition === "missing" ? (
                        <span className="text-xs font-black text-white">✕</span>
                    ) : condition === "caries" ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                    ) : condition === "crown" ? (
                        <span className="text-xs">👑</span>
                    ) : condition === "rct" ? (
                        <span className="text-xs">⚡</span>
                    ) : condition === "filled" ? (
                        <span className="w-3 h-3 rounded-sm bg-white/70" />
                    ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 bg-slate-50 flex items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 opacity-60" />
                        </div>
                    )}
                </div>

                {/* Surface Tag if exists */}
                <span
                    className={`text-[9px] font-mono leading-none ${
                        condition === "healthy" ? "text-slate-400" : "text-white/90"
                    }`}
                >
                    {info?.surface || "—"}
                </span>
            </button>
        );
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-5">
            {/* Legend Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">ผังฟันสากล (FDI Odontogram):</span>
                    <span className="text-slate-500">คลิกที่ซี่ฟันเพื่อเลือกและบันทึกการรักษา</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {Object.entries(CONDITION_COLORS).map(([key, cfg]) => (
                        <div key={key} className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${cfg.bg} border ${cfg.border}`} />
                            <span className="text-slate-600 text-[11px]">{cfg.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Upper Jaw (ขากรรไกรบน) */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-teal-800 bg-teal-50/70 px-3 py-1.5 rounded-lg border border-teal-100">
                    <span>ขวาบน (UR - Quadrant 1)</span>
                    <span className="text-teal-600 font-normal">ขากรรไกรบน (Upper Arch)</span>
                    <span>ซ้ายบน (UL - Quadrant 2)</span>
                </div>
                <div className="overflow-x-auto pb-2">
                    <div className="flex items-center justify-center gap-1 min-w-[680px]">
                        {/* Upper Right (18 -> 11) */}
                        <div className="flex items-center gap-1">
                            {UPPER_RIGHT.map((tooth) => renderToothButton(tooth))}
                        </div>

                        {/* Midline Divider */}
                        <div className="h-14 w-0.5 bg-rose-300 mx-2" title="กึ่งกลางใบหน้า (Midline)" />

                        {/* Upper Left (21 -> 28) */}
                        <div className="flex items-center gap-1">
                            {UPPER_LEFT.map((tooth) => renderToothButton(tooth))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Occlusal Plane Separator */}
            <div className="relative flex items-center justify-center my-1">
                <div className="w-full border-t border-dashed border-slate-200" />
                <span className="absolute bg-white px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                    ระนาบสบฟัน (Occlusal Plane)
                </span>
            </div>

            {/* Lower Jaw (ขากรรไกรล่าง) */}
            <div className="space-y-2">
                <div className="overflow-x-auto pb-2">
                    <div className="flex items-center justify-center gap-1 min-w-[680px]">
                        {/* Lower Right (48 -> 41) */}
                        <div className="flex items-center gap-1">
                            {LOWER_RIGHT.map((tooth) => renderToothButton(tooth))}
                        </div>

                        {/* Midline Divider */}
                        <div className="h-14 w-0.5 bg-rose-300 mx-2" title="กึ่งกลางใบหน้า (Midline)" />

                        {/* Lower Left (31 -> 38) */}
                        <div className="flex items-center gap-1">
                            {LOWER_LEFT.map((tooth) => renderToothButton(tooth))}
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-cyan-800 bg-cyan-50/70 px-3 py-1.5 rounded-lg border border-cyan-100">
                    <span>ขวาล่าง (LR - Quadrant 4)</span>
                    <span className="text-cyan-600 font-normal">ขากรรไกรล่าง (Lower Arch)</span>
                    <span>ซ้ายล่าง (LL - Quadrant 3)</span>
                </div>
            </div>

            {/* Selected Tooth Quick Info */}
            {selectedTooth && (
                <div className="mt-4 p-3 bg-teal-50/80 rounded-xl border border-teal-200 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center text-xs">
                            {selectedTooth}
                        </span>
                        <div>
                            <span className="font-bold text-teal-900">
                                ซี่ที่ {selectedTooth}: {TOOTH_NAMES[selectedTooth]}
                            </span>
                            <span className="text-xs text-teal-700 block">
                                สถานะปัจจุบัน: {toothConditionMap[selectedTooth]?.condition || "ปกติ (Healthy)"}
                                {toothConditionMap[selectedTooth]?.surface
                                    ? ` (ด้าน: ${toothConditionMap[selectedTooth].surface})`
                                    : ""}
                            </span>
                        </div>
                    </div>
                    <span className="text-xs text-teal-600 font-medium">พร้อมบันทึกหัตถการในฟอร์มด้านล่าง ↓</span>
                </div>
            )}
        </div>
    );
}
