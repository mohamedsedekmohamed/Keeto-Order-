"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  Store,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Plus,
  Save,
  Loader2,
} from "lucide-react";
import useGet from "@/app/hooks/useGet";
import usePost from "@/app/hooks/usePost";
import { useLanguage } from "@/context/LanguageContext";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icon URLs for Next.js/webpack.
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapClickHandler({
  onChange,
}: {
  onChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterOnChange({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

function LocationPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}) {
  const markerRef = React.useRef<L.Marker | null>(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (!marker) return;
      const pos = marker.getLatLng();
      onChange(pos.lat, pos.lng);
    },
  };

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={16}
      scrollWheelZoom={true}
      style={{ height: "220px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        position={[lat, lng]}
        draggable={true}
        eventHandlers={eventHandlers}
        ref={markerRef}
        icon={markerIcon}
      />
      <MapClickHandler onChange={onChange} />
      <RecenterOnChange lat={lat} lng={lng} />
    </MapContainer>
  );
}

interface Branch {
  id: string;
  name: string;
  nameAr: string;
  address: string;
  addressAr: string;
  phoneNumber?: string;
  lat?: string;
  lng?: string;
}

interface Address {
  id: string;
  address?: string;
  label?: string;
  title?: string;
  city?: string;
  street?: string;
  number?: string;
  floor?: string;
  apartment?: string;
  landmark?: string;
  location?: string;
  fulladdress?: string;
  isDeliverable?: boolean;
  deliveryFee?: string | number;
}

type CheckoutSelectResponse = {
  success: boolean;
  data: {
    data: {
      branches?: Branch[];
      addresses?: Address[];
    };
  };
};

interface FulfillmentSelectDialogProps {
  restaurantId: string;
  firstColor: string;
  textFirstColor: string;
  onConfirm: () => void;
}

// ──────────────────────────────────────────────────────────────────────────────
// Session-storage helpers
// ──────────────────────────────────────────────────────────────────────────────
export function getFulfillmentFromSession(): {
  mode: "delivery" | "takeaway" | null;
  branchId: string | null;
  addressId: string | null;
} {
  if (typeof window === "undefined") {
    return { mode: null, branchId: null, addressId: null };
  }
  const raw = sessionStorage.getItem("fulfillment_mode") as
    | "delivery"
    | "takeaway"
    | null;
  return {
    mode: raw,
    branchId: sessionStorage.getItem("fulfillment_branch_id"),
    addressId: sessionStorage.getItem("fulfillment_address_id"),
  };
}

function saveFulfillmentToSession(
  mode: "delivery" | "takeaway",
  id: string,
): void {
  sessionStorage.setItem("fulfillment_mode", mode);
  if (mode === "takeaway") {
    sessionStorage.setItem("fulfillment_branch_id", id);
    sessionStorage.removeItem("fulfillment_address_id");
  } else {
    sessionStorage.setItem("fulfillment_address_id", id);
    sessionStorage.removeItem("fulfillment_branch_id");
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("fulfillment-session-changed"));
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Main dialog
// ──────────────────────────────────────────────────────────────────────────────
export default function FulfillmentSelectDialog({
  restaurantId,
  firstColor,
  textFirstColor,
  onConfirm,
}: FulfillmentSelectDialogProps) {
  const { t } = useLanguage();
  const isRTL =
    typeof window !== "undefined" && document.documentElement.dir === "rtl";

  const [step, setStep] = useState<"mode" | "branch" | "address">("mode");
  const [selectedMode, setSelectedMode] = useState<
    "delivery" | "takeaway" | null
  >(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    title: "",
    type: "home",
    street: "",
    fulladdress: "",
    number: "",
    floor: "",
    apartment: "",
    landmark: "",
    lat: null as number | null,
    lng: null as number | null,
    location: "",
  });

  const { postData: postAddress, loading: postingAddress } =
    usePost("/api/user/address");

  // ── Fetch the shared order-select payload once and derive both
  // branches and saved addresses from the same response, matching the
  // restaurant checkout payload shape.
  const {
    data: checkoutRes,
    loading: checkoutLoading,
    refetch: refetchCheckout,
  } = useGet<CheckoutSelectResponse>(
    restaurantId
      ? `/api/user/order/select?restaurantId=${restaurantId}&orderSource=online_order_web`
      : null,
  );

  const selectData = checkoutRes?.data?.data ?? {
    branches: [],
    addresses: [],
  };
  const branches: Branch[] = Array.isArray(selectData.branches)
    ? selectData.branches
    : [];
  const addresses: Address[] = Array.isArray(selectData.addresses)
    ? selectData.addresses
    : [];

  // ── Step transitions ────────────────────────────────────────────────────────
  const handleModeSelect = (mode: "delivery" | "takeaway") => {
    setSelectedMode(mode);
    setSelectedId("");
    setStep(mode === "takeaway" ? "branch" : "address");
  };

  const handleAddressFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetAddressForm = () => {
    setAddressForm({
      title: "",
      type: "home",
      street: "",
      fulladdress: "",
      number: "",
      floor: "",
      apartment: "",
      landmark: "",
      lat: null,
      lng: null,
      location: "",
    });
  };

  const applyLocation = async (latitude: number, longitude: number) => {
    let extractedTitle = "";
    let extractedStreet = "";
    let extractedFullAddress = "";

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      );
      const geoData = await res.json();
      const address = geoData?.address || {};

      extractedTitle =
        address.road ||
        address.neighbourhood ||
        address.suburb ||
        geoData?.display_name ||
        "";
      extractedStreet = address.road || address.pedestrian || "";
      extractedFullAddress = geoData?.display_name || "";
    } catch (geoError) {
      console.error("Error reverse geocoding location:", geoError);
    }

    setAddressForm((prev) => ({
      ...prev,
      lat: latitude,
      lng: longitude,
      location: extractedTitle,
      street: extractedStreet,
      fulladdress: extractedFullAddress,
    }));
  };

  const handleMapLocationChange = (lat: number, lng: number) => {
    applyLocation(lat, lng);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      return;
    }

    if (
      navigator.userAgent.includes("FBAN") ||
      navigator.userAgent.includes("FBAV")
    ) {
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await applyLocation(latitude, longitude);
      },
      (error) => {
        console.error("Error getting location:", error);
      },
      options,
    );
  };

  const handleAddAddressSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    const payload = {
      ...addressForm,
      number: String(addressForm.number) || 0,
      floor: String(addressForm.floor) || 0,
      lat: addressForm.lat ?? null,
      lng: addressForm.lng ?? null,
      location: addressForm.location || addressForm.fulladdress || "",
    };

    try {
      const response = await postAddress(payload, null, "Address added");
      const newId =
        response?.data?.id || response?.data?.data?.id || response?.id || "";

      if (newId) {
        setSelectedMode("delivery");
        setSelectedId(newId);
      }

      setShowAddAddressForm(false);
      resetAddressForm();
      await refetchCheckout();
    } catch {
      // Keep the same flow as the rest of the app and let usePost show toast
    }
  };

  const handleConfirm = () => {
    if (!selectedMode || !selectedId) return;
    saveFulfillmentToSession(selectedMode, selectedId);
    onConfirm();
  };

  const canConfirm = !!selectedId;

  const themeBtn = {
    backgroundColor: firstColor || "#facc15",
    color: textFirstColor || "#111827",
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", damping: 24, stiffness: 260 }}
        className="w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-zinc-800"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <div className="flex items-center gap-3">
            {step !== "mode" && (
              <button
                onClick={() => {
                  setStep("mode");
                  setSelectedId("");
                }}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
                aria-label="Back"
              >
                <ChevronRight
                  size={18}
                  className={`text-gray-500 dark:text-zinc-400 ${isRTL ? "" : "rotate-180"}`}
                />
              </button>
            )}
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {step === "mode"
                ? t("How would you like to receive your order?") ||
                  "How would you like to receive your order?"
                : step === "branch"
                  ? t("Select Branch") || "Select Branch"
                  : t("Select Address") || "Select Address"}
            </h2>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div
          className="px-6 py-5 space-y-3 max-h-[65vh] overflow-y-auto"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <AnimatePresence mode="wait">
            {/* STEP 1: Mode selection */}
            {step === "mode" && (
              <motion.div
                key="mode"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-2 gap-4"
              >
                {/* Delivery */}
                <button
                  onClick={() => handleModeSelect("delivery")}
                  className="flex flex-col items-center gap-3 p-6 border-2 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-800"
                >
                  <div
                    className="flex items-center justify-center w-14 h-14 rounded-2xl"
                    style={{ backgroundColor: `${firstColor}20` }}
                  >
                    <Truck size={28} style={{ color: firstColor }} />
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white text-sm">
                    {t("Delivery") || "Delivery"}
                  </span>
                </button>

                {/* Takeaway */}
                <button
                  onClick={() => handleModeSelect("takeaway")}
                  className="flex flex-col items-center gap-3 p-6 border-2 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-800"
                >
                  <div
                    className="flex items-center justify-center w-14 h-14 rounded-2xl"
                    style={{ backgroundColor: `${firstColor}20` }}
                  >
                    <Store size={28} style={{ color: firstColor }} />
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white text-sm">
                    {t("Takeaway") || "Takeaway"}
                  </span>
                </button>
              </motion.div>
            )}

            {/* STEP 2a: Branch list */}
            {step === "branch" && (
              <motion.div
                key="branch"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-2"
              >
                {checkoutLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <div
                      className="w-8 h-8 border-4 rounded-full animate-spin"
                      style={{
                        borderColor: firstColor,
                        borderTopColor: "transparent",
                      }}
                    />
                  </div>
                ) : branches.length === 0 ? (
                  <p className="py-8 text-center text-gray-400 dark:text-zinc-500">
                    {t("No branches found.") || "No branches found."}
                  </p>
                ) : (
                  branches.map((branch) => {
                    const isSelected = selectedId === branch.id;
                    return (
                      <button
                        key={branch.id}
                        onClick={() => setSelectedId(branch.id)}
                        className="w-full text-start px-4 py-3 rounded-2xl border-2 transition-all flex items-start gap-3 border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800"
                        style={
                          isSelected
                            ? {
                                borderColor: firstColor,
                                backgroundColor: `${firstColor}10`,
                              }
                            : {}
                        }
                      >
                        <MapPin
                          size={18}
                          className="mt-0.5 flex-shrink-0"
                          style={{ color: isSelected ? firstColor : "#9ca3af" }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">
                            {isRTL ? branch.nameAr || branch.name : branch.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                            {isRTL
                              ? branch.addressAr || branch.address
                              : branch.address}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle2
                            size={18}
                            className="flex-shrink-0 mt-0.5"
                            style={{ color: firstColor }}
                          />
                        )}
                      </button>
                    );
                  })
                )}
              </motion.div>
            )}

            {/* STEP 2b: Address list */}
            {step === "address" && (
              <motion.div
                key="address"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAddressForm(true)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl border border-yellow-300 bg-yellow-50 dark:bg-yellow-400/10 text-gray-900 dark:text-yellow-300 hover:bg-yellow-400 hover:text-gray-900 transition"
                  >
                    <Plus size={14} />
                    {t("add-address-btn") || "Add Address"}
                  </button>
                </div>

                {checkoutLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <div
                      className="w-8 h-8 border-4 rounded-full animate-spin"
                      style={{
                        borderColor: firstColor,
                        borderTopColor: "transparent",
                      }}
                    />
                  </div>
                ) : addresses.length === 0 ? (
                  <p className="py-8 text-center text-gray-400 dark:text-zinc-500">
                    {t("No saved addresses found.") ||
                      "No saved addresses found."}
                  </p>
                ) : (
                  addresses.map((addr) => {
                    const isSelected = selectedId === addr.id;
                    const label =
                      addr.title ||
                      addr.label ||
                      addr.location ||
                      addr.street ||
                      addr.fulladdress ||
                      addr.address ||
                      addr.city ||
                      "Address";
                    const addressParts = [
                      addr.street,
                      addr.number,
                      addr.floor,
                      addr.apartment,
                      addr.landmark,
                      addr.location,
                      addr.fulladdress,
                    ].filter(Boolean);
                    const details = addressParts.filter(
                      (part) => part !== label,
                    );
                    return (
                      <button
                        key={addr.id}
                        onClick={() => setSelectedId(addr.id)}
                        className="w-full text-start px-4 py-3 rounded-2xl border-2 transition-all flex items-start gap-3 border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800"
                        style={
                          isSelected
                            ? {
                                borderColor: firstColor,
                                backgroundColor: `${firstColor}10`,
                              }
                            : {}
                        }
                      >
                        <MapPin
                          size={18}
                          className="mt-0.5 flex-shrink-0"
                          style={{ color: isSelected ? firstColor : "#9ca3af" }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">
                            {label}
                          </p>

                          {details.length > 0 && (
                            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                              {details.join(", ")}
                            </p>
                          )}

                          {addr.isDeliverable === false && (
                            <p className="text-xs text-red-500 mt-0.5">
                              {t("Not deliverable to this address") ||
                                "Not deliverable to this area"}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <CheckCircle2
                            size={18}
                            className="flex-shrink-0 mt-0.5"
                            style={{ color: firstColor }}
                          />
                        )}
                      </button>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer: Confirm button (only on step 2) ─────────────────────── */}
        {step !== "mode" && (
          <div className="px-6 pb-6 pt-2 border-t border-gray-100 dark:border-zinc-800">
            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="w-full py-3.5 text-base font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={
                canConfirm
                  ? themeBtn
                  : { backgroundColor: "#d1d5db", color: "#6b7280" }
              }
            >
              {t("Confirm") || "Confirm"}
            </button>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showAddAddressForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[260] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-zinc-900 p-4 sm:p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                  {t("add-address") || "Add Address"}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAddressForm(false);
                    resetAddressForm();
                  }}
                  className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  <ChevronRight size={16} className="rotate-180" />
                </button>
              </div>

              <form onSubmit={handleAddAddressSubmit} className="space-y-3">
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  className="w-full py-3 px-4 flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-xl font-bold text-sm transition-all border border-zinc-200 dark:border-zinc-700 active:scale-98 disabled:opacity-60"
                >
                  <MapPin size={18} className="text-yellow-500" />
                  {t("Use Current Location (GPS)") ||
                    "Use Current Location (GPS)"}
                </button>

                <div className="overflow-hidden border rounded-2xl border-zinc-200 dark:border-zinc-800">
                  <LocationPicker
                    lat={addressForm.lat ?? 30.0444}
                    lng={addressForm.lng ?? 31.2357}
                    onChange={handleMapLocationChange}
                  />
                </div>

                <input
                  name="title"
                  value={addressForm.title}
                  onChange={handleAddressFormChange}
                  placeholder={t("title") || "Address title"}
                  required
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                />

                <input
                  name="street"
                  value={addressForm.street}
                  onChange={handleAddressFormChange}
                  placeholder={t("street") || "Street"}
                  required
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                />

                <textarea
                  name="fulladdress"
                  value={addressForm.fulladdress}
                  onChange={handleAddressFormChange}
                  placeholder={t("address") || "Full address"}
                  required
                  rows={2}
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 text-sm outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input
                    name="number"
                    value={addressForm.number}
                    onChange={handleAddressFormChange}
                    placeholder={t("number") || "Number"}
                    required
                    className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  <input
                    name="floor"
                    value={addressForm.floor}
                    onChange={handleAddressFormChange}
                    placeholder={t("floor") || "Floor"}
                    required
                    className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  <input
                    name="apartment"
                    value={addressForm.apartment}
                    onChange={handleAddressFormChange}
                    placeholder={t("apartment") || "Apartment"}
                    required
                    className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <input
                  name="landmark"
                  value={addressForm.landmark}
                  onChange={handleAddressFormChange}
                  placeholder={t("landmark") || "Landmark"}
                  required
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                />

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddAddressForm(false);
                      resetAddressForm();
                    }}
                    className="flex-1 py-3 font-bold text-zinc-700 bg-zinc-100 rounded-xl hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 transition-colors"
                  >
                    {t("cancel") || "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={postingAddress}
                    className="flex-1 py-3 font-bold text-gray-900 bg-yellow-400 rounded-xl hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2"
                  >
                    {postingAddress ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    {postingAddress
                      ? t("saving") || "Saving..."
                      : t("add-address-btn") || "Add Address"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
