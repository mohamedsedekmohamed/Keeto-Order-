"use client";

import React from "react";
import { MapPin } from "lucide-react";

// Matches the "zones" array returned by /api/user/order/select
export interface ZoneCoordinate {
    lat: number | string;
    lng: number | string;
}

export interface DeliveryZone {
    id: string;
    zoneId?: string;
    name?: string;
    nameAr?: string | null;
    deliveryFee?: string | number | null;
    minOrderAmount?: string | number | null;
    coverageType?: "POLYGON" | "RADIUS" | string;
    customCoordinates?: ZoneCoordinate[] | null;
    defaultCoordinates?: ZoneCoordinate[] | null;
    customRadiusKm?: string | number | null;
    defaultRadiusKm?: string | number | null;
}

// Returns a representative point for the zone: the average of its polygon
// points (customCoordinates first, then defaultCoordinates). A single point
// (radius-type zone) is returned as is.
export function getZoneCenter(
    zone: DeliveryZone,
): { lat: number; lng: number } | null {
    const pickPoints = (): ZoneCoordinate[] => {
        for (const list of [zone.customCoordinates, zone.defaultCoordinates]) {
            if (Array.isArray(list) && list.length) return list;
        }
        return [];
    };

    const pts = pickPoints()
        .map((p) => ({ lat: Number(p?.lat), lng: Number(p?.lng) }))
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

    if (!pts.length) return null;

    // Polygons are closed (last point repeats the first): drop the duplicate
    // so it doesn't skew the average.
    if (pts.length > 1) {
        const f = pts[0];
        const l = pts[pts.length - 1];
        if (f.lat === l.lat && f.lng === l.lng) pts.pop();
    }

    return {
        lat: pts.reduce((s, p) => s + p.lat, 0) / pts.length,
        lng: pts.reduce((s, p) => s + p.lng, 0) / pts.length,
    };
}

interface ZoneSelectProps {
    zones: DeliveryZone[];
    value: string;
    isRtl: boolean;
    onSelect: (zone: DeliveryZone) => void;
    className?: string;
}

export default function ZoneSelect({
    zones,
    value,
    isRtl,
    onSelect,
    className = "",
}: ZoneSelectProps) {
    return (
        <div className={className}>
            <label className="flex items-center gap-1.5 mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                <MapPin size={16} className="text-yellow-500" />
                {isRtl ? "اختر منطقة التوصيل" : "Select delivery zone"}
            </label>
            <select
                value={value}
                onChange={(e) => {
                    const z = zones.find((z) => String(z.id) === e.target.value);
                    if (z) onSelect(z);
                }}
                className="w-full p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-zinc-900 dark:text-white text-sm"
            >
                <option value="">{isRtl ? "اختر المنطقة..." : "Choose a zone..."}</option>
                {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                        {isRtl && z.nameAr ? z.nameAr : z.name}
                    </option>
                ))}
            </select>
            {zones.length === 0 && (
                <p className="mt-2 text-xs font-semibold text-red-500">
                    {isRtl
                        ? "لا توجد مناطق توصيل متاحة لهذا المطعم"
                        : "No delivery zones available for this restaurant"}
                </p>
            )}
        </div>
    );
}