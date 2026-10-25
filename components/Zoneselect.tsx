"use client";

import React from "react";
import { Check, ChevronDown, MapPin, Search, X } from "lucide-react";

// Matches the "zones" array returned by /api/user/order/select.
// NOTE: `id` is the restaurant-zone row id. This is the id saved on an
// address as `zoneId`. The inner `zoneId` is the master zone id.
// Coordinates arrive as JSON *strings* (e.g. "[{\"lat\":..,\"lng\":..}]"),
// and may be "[]", a single object, or a single-point array.
export interface DeliveryZone {
    id: string;
    zoneId?: string;
    zoneName?: string;
    zoneNameAr?: string | null;
    name?: string; // legacy fallback
    nameAr?: string | null; // legacy fallback
    branchId?: string | null;
    deliveryFee?: string | number | null;
    minOrderAmount?: string | number | null;
    coverageType?: "POLYGON" | "RADIUS" | string;
    customCoordinates?: unknown;
    defaultCoordinates?: unknown;
    customRadiusKm?: string | number | null;
    defaultRadiusKm?: string | number | null;
}

type Pt = { lat: number; lng: number };

export function getZoneName(zone: DeliveryZone, isRtl: boolean): string {
    const ar = (zone.zoneNameAr ?? zone.nameAr ?? "").trim();
    const en = (zone.zoneName ?? zone.name ?? "").trim();
    return (isRtl && ar ? ar : en || ar).trim();
}

// Accepts a JSON string, an array, or a single {lat,lng} object and
// returns a clean list of numeric points.
function parsePoints(raw: unknown): Pt[] {
    let value: unknown = raw;
    if (typeof value === "string") {
        const s = value.trim();
        if (!s) return [];
        try {
            value = JSON.parse(s);
        } catch {
            return [];
        }
    }
    if (value && !Array.isArray(value) && typeof value === "object") {
        value = [value];
    }
    if (!Array.isArray(value)) return [];

    const pts: Pt[] = [];
    for (const p of value as any[]) {
        const lat = Array.isArray(p) ? Number(p[1]) : Number(p?.lat);
        const lng = Array.isArray(p) ? Number(p[0]) : Number(p?.lng);
        if (Number.isFinite(lat) && Number.isFinite(lng)) pts.push({ lat, lng });
    }
    // closed ring: drop the repeated last point
    if (pts.length > 1) {
        const f = pts[0];
        const l = pts[pts.length - 1];
        if (f.lat === l.lat && f.lng === l.lng) pts.pop();
    }
    return pts;
}

function pointInPolygon(p: Pt, poly: Pt[]): boolean {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const a = poly[i];
        const b = poly[j];
        if (
            a.lat > p.lat !== b.lat > p.lat &&
            p.lng < ((b.lng - a.lng) * (p.lat - a.lat)) / (b.lat - a.lat) + a.lng
        ) {
            inside = !inside;
        }
    }
    return inside;
}

// Area-weighted centroid of a polygon (falls back to the vertex average
// when the area is ~0).
function polygonCentroid(poly: Pt[]): Pt {
    let a = 0,
        cx = 0,
        cy = 0;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const p = poly[j];
        const q = poly[i];
        const cross = p.lng * q.lat - q.lng * p.lat;
        a += cross;
        cx += (p.lng + q.lng) * cross;
        cy += (p.lat + q.lat) * cross;
    }
    if (Math.abs(a) < 1e-12) {
        return {
            lat: poly.reduce((s, p) => s + p.lat, 0) / poly.length,
            lng: poly.reduce((s, p) => s + p.lng, 0) / poly.length,
        };
    }
    return { lat: cy / (3 * a), lng: cx / (3 * a) };
}

// For concave polygons the centroid can fall outside the shape. Scan a
// horizontal line through the centroid and use the middle of its widest
// inside segment instead.
function pointInsidePolygon(poly: Pt[]): Pt {
    const c = polygonCentroid(poly);
    if (pointInPolygon(c, poly)) return c;

    const xs: number[] = [];
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const a = poly[i];
        const b = poly[j];
        if (a.lat > c.lat !== b.lat > c.lat) {
            xs.push(((b.lng - a.lng) * (c.lat - a.lat)) / (b.lat - a.lat) + a.lng);
        }
    }
    xs.sort((m, n) => m - n);
    let best: Pt | null = null;
    let bestW = -1;
    for (let i = 0; i + 1 < xs.length; i += 2) {
        const w = xs[i + 1] - xs[i];
        if (w > bestW) {
            bestW = w;
            best = { lat: c.lat, lng: (xs[i] + xs[i + 1]) / 2 };
        }
    }
    return best ?? c;
}

// Returns a point that represents the zone (and lies inside it when it is a
// polygon). Uses customCoordinates first, then defaultCoordinates.
export function getZoneCenter(zone: DeliveryZone): Pt | null {
    for (const raw of [zone.customCoordinates, zone.defaultCoordinates]) {
        const pts = parsePoints(raw);
        if (!pts.length) continue;
        if (pts.length < 3) {
            // single point (radius zone) or a line: average it
            return {
                lat: pts.reduce((s, p) => s + p.lat, 0) / pts.length,
                lng: pts.reduce((s, p) => s + p.lng, 0) / pts.length,
            };
        }
        return pointInsidePolygon(pts);
    }
    return null;
}

// Lower-cases, strips Arabic diacritics/tatweel and unifies letter variants so
// "اسكندريه" matches "إسكندرية", etc.
export function normalizeSearch(input: string): string {
    return (input || "")
        .toLowerCase()
        .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
        .replace(/[أإآٱ]/g, "ا")
        .replace(/ى/g, "ي")
        .replace(/ة/g, "ه")
        .replace(/\s+/g, " ")
        .trim();
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
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");
    const rootRef = React.useRef<HTMLDivElement>(null);
    const searchRef = React.useRef<HTMLInputElement>(null);

    const sorted = React.useMemo(
        () =>
            [...zones].sort((a, b) =>
                getZoneName(a, isRtl).localeCompare(
                    getZoneName(b, isRtl),
                    isRtl ? "ar" : "en",
                ),
            ),
        [zones, isRtl],
    );

    // Search in both the Arabic and the English name, whatever the UI language.
    const filtered = React.useMemo(() => {
        const q = normalizeSearch(query);
        if (!q) return sorted;
        return sorted.filter((z) =>
            normalizeSearch(
                `${z.zoneName ?? z.name ?? ""} ${z.zoneNameAr ?? z.nameAr ?? ""}`,
            ).includes(q),
        );
    }, [sorted, query]);

    const selected = zones.find((z) => String(z.id) === value);

    // close on outside click / Escape
    React.useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent | TouchEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        document.addEventListener("touchstart", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("touchstart", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const toggle = () => {
        setOpen((o) => {
            const next = !o;
            if (next) {
                setQuery("");
                setTimeout(() => searchRef.current?.focus(), 0);
            }
            return next;
        });
    };

    const pick = (z: DeliveryZone) => {
        onSelect(z);
        setOpen(false);
        setQuery("");
    };

    return (
        <div className={className} ref={rootRef} dir={isRtl ? "rtl" : "ltr"}>
            <label className="flex items-center gap-1.5 mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                <MapPin size={16} className="text-yellow-500" />
                {isRtl ? "اختر منطقة التوصيل" : "Select delivery zone"}
            </label>

            <button
                type="button"
                onClick={toggle}
                aria-haspopup="listbox"
                aria-expanded={open}
                className="w-full p-3.5 flex items-center justify-between gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm text-start"
            >
                <span
                    className={
                        selected
                            ? "text-zinc-900 dark:text-white truncate"
                            : "text-zinc-400 truncate"
                    }
                >
                    {selected
                        ? getZoneName(selected, isRtl)
                        : isRtl
                            ? "اختر المنطقة..."
                            : "Choose a zone..."}
                </span>
                <ChevronDown
                    size={18}
                    className={`shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open && (
                <div className="mt-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                    <div className="relative border-b border-zinc-100 dark:border-zinc-800">
                        <Search
                            size={16}
                            className="absolute top-1/2 -translate-y-1/2 start-3 text-zinc-400 pointer-events-none"
                        />
                        <input
                            ref={searchRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={isRtl ? "ابحث عن منطقة..." : "Search zones..."}
                            className="w-full py-3 ps-9 pe-9 bg-transparent text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => {
                                    setQuery("");
                                    searchRef.current?.focus();
                                }}
                                aria-label={isRtl ? "مسح" : "Clear"}
                                className="absolute top-1/2 -translate-y-1/2 end-3 text-zinc-400 hover:text-zinc-600"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <ul
                        role="listbox"
                        className="max-h-56 overflow-y-auto overscroll-contain"
                    >
                        {filtered.length === 0 ? (
                            <li className="px-4 py-3 text-xs font-semibold text-zinc-500">
                                {isRtl ? "لا توجد نتائج" : "No zones found"}
                            </li>
                        ) : (
                            filtered.map((z) => {
                                const isSelected = String(z.id) === value;
                                return (
                                    <li key={z.id} role="option" aria-selected={isSelected}>
                                        <button
                                            type="button"
                                            onClick={() => pick(z)}
                                            className={`w-full px-4 py-3 flex items-center justify-between gap-2 text-sm text-start transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 ${isSelected
                                                    ? "bg-yellow-50 dark:bg-yellow-500/10 font-bold text-yellow-700 dark:text-yellow-400"
                                                    : "text-zinc-800 dark:text-zinc-200"
                                                }`}
                                        >
                                            <span className="truncate">{getZoneName(z, isRtl)}</span>
                                            {isSelected && (
                                                <Check size={16} className="shrink-0 text-yellow-500" />
                                            )}
                                        </button>
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>
            )}

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