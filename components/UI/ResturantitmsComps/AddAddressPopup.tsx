"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { X, Navigation, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon URLs — Next.js/Webpack breaks Leaflet's default
// icon path resolution, so we point them at the CDN assets instead.
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}
import { useLanguage } from "@/context/LanguageContext";
import usePost from "@/app/hooks/usePost";

// AddAddressPopup Component
// Ported from the checkout page so the fulfillment dialog can create a
// new delivery address in place, without navigating away from the menu.
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// LocationPicker Component (draggable map pin)
// ─────────────────────────────────────────────

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);
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
  const markerRef = useRef<L.Marker | null>(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker) {
          const pos = marker.getLatLng();
          onChange(pos.lat, pos.lng);
        }
      },
    }),
    [onChange],
  );

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
      />
      <MapClickHandler onChange={onChange} />
      <RecenterOnChange lat={lat} lng={lng} />
    </MapContainer>
  );
}

interface AddAddressPopupProps {
  onClose: () => void;
  onSuccess: (id?: string) => void;
}

function AddAddressPopup({ onClose, onSuccess }: AddAddressPopupProps) {
  const { language, t } = useLanguage();
  const isRtl = language === "العربية";
  const { postData: postAddress, loading: postingAddress } =
    usePost("/api/user/address");

  const [isLocating, setIsLocating] = useState(false);
  const [locationErrorType, setLocationErrorType] = useState<
    "ios" | "android" | "generic" | null
  >(null);

  // Leaflet needs the DOM, so we only render the map after mounting on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fallback map center (Cairo, Egypt) used until we have a real location.
  const DEFAULT_MAP_CENTER: [number, number] = [30.0444, 31.2357];

  const [addressForm, setAddressForm] = useState({
    title: "",
    street: "",
    fulladdress: "",
    number: "",
    floor: "",
    apartment: "",
    landmark: "",
    lat: null as number | null,
    lng: null as number | null,
    location: "" as string,
  });

  const inputClass =
    "w-full p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all text-zinc-900 dark:text-white text-sm";

  // Reverse-geocodes a coordinate and stores it (+ derived address fields)
  // in the form. Shared by the GPS button and the draggable map pin.
  const applyLocation = async (latitude: number, longitude: number) => {
    let extractedTitle = "";
    let extractedStreet = "";
    let extractedfulladdress = "";

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
      extractedfulladdress = geoData?.display_name || "";
    } catch (geoError) {
      console.error("Error reverse geocoding location:", geoError);
    }

    setAddressForm((prev) => ({
      ...prev,
      lat: latitude,
      lng: longitude,
      location: extractedTitle,
      street: extractedStreet,
      fulladdress: extractedfulladdress,
    }));
  };

  // Called when the user drags the pin or taps elsewhere on the map.
  const handleMapLocationChange = (lat: number, lng: number) => {
    applyLocation(lat, lng);
  };

  const handleGetCurrentLocation = () => {
    const isFacebookBrowser =
      navigator.userAgent.includes("FBAN") ||
      navigator.userAgent.includes("FBAV");
    if (isFacebookBrowser) {
      setLocationErrorType("ios");
      return;
    }

    if (!navigator.geolocation) {
      return toast.error(
        isRtl
          ? "المتصفح الخاص بك لا يدعم تحديد الموقع."
          : "Geolocation is not supported by your browser.",
      );
    }

    setIsLocating(true);
    setLocationErrorType(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0,
    };

    const successCallback = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;

      await applyLocation(latitude, longitude);

      setIsLocating(false);
      toast.success(
        isRtl
          ? "تم تحديد موقعك الحالي بنجاح!"
          : "Current location fetched successfully!",
      );
    };

    const errorCallback = (error: GeolocationPositionError) => {
      setIsLocating(false);
      console.error("Error getting location:", error);

      if (error.code === error.PERMISSION_DENIED) {
        const userAgent =
          navigator.userAgent || navigator.vendor || (window as any).opera;
        const isiOS =
          /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
        const isAndroid = /Android/i.test(userAgent);

        if (isiOS) {
          setLocationErrorType("ios");
        } else if (isAndroid) {
          setLocationErrorType("android");
        } else {
          setLocationErrorType("generic");
        }
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        toast.error(
          isRtl
            ? "معلومات الموقع غير متوفرة. يرجى التأكد من تفعيل الـ GPS في هاتفك."
            : "Location information is unavailable. Please ensure your device GPS is turned on.",
        );
      } else if (error.code === error.TIMEOUT) {
        toast.error(
          isRtl
            ? "انتهت مهلة طلب الموقع. يرجى المحاولة مرة أخرى."
            : "Location request timed out. Please try again.",
        );
      }
    };

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((permissionStatus) => {
          if (permissionStatus.state === "denied") {
            setIsLocating(false);
            const userAgent =
              navigator.userAgent || navigator.vendor || (window as any).opera;
            const isiOS =
              /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
            setLocationErrorType(isiOS ? "ios" : "android");
          } else {
            navigator.geolocation.getCurrentPosition(
              successCallback,
              errorCallback,
              options,
            );
          }
        })
        .catch(() => {
          navigator.geolocation.getCurrentPosition(
            successCallback,
            errorCallback,
            options,
          );
        });
    } else {
      navigator.geolocation.getCurrentPosition(
        successCallback,
        errorCallback,
        options,
      );
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (addressForm.lat === null || addressForm.lng === null) {
      return toast.error(
        isRtl
          ? "يرجى تحديد الموقع الحالي أولاً لتأكيد إرسال الإحداثيات."
          : "Please capture your current location before submitting.",
      );
    }

    const payload = {
      ...addressForm,
      number: String(addressForm.number) || 0,
      floor: String(addressForm.floor) || 0,
    };

    try {
      const response = await postAddress(
        payload,
        null,
        t("address-added-success"),
      );
      onClose();
      onSuccess(response?.data?.data?.id || response?.data?.id);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl scale-100 duration-200 animate-in zoom-in-95 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold dark:text-white">
            {isRtl ? "إضافة عنوان" : "Add Address"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={20} className="dark:text-white" />
          </button>
        </div>

        {/* GPS Location Button */}
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="w-full mb-4 py-3 px-4 flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-xl font-bold text-sm transition-all border border-zinc-200 dark:border-zinc-700 active:scale-98 disabled:opacity-60"
        >
          {isLocating ? (
            <Loader2 size={18} className="animate-spin text-yellow-500" />
          ) : (
            <Navigation size={18} className="text-yellow-500 fill-yellow-500" />
          )}
          {isLocating
            ? isRtl
              ? "جاري تحديد موقعك..."
              : "Locating..."
            : isRtl
              ? "استخدام موقعي الحالي (GPS)"
              : "Use Current Location (GPS)"}
        </button>

        {/* Alert box when permission is denied */}
        {locationErrorType && (
          <div className="mb-4 p-4 rounded-2xl border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-300 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-2.5">
              <span className="text-lg mt-0.5">⚠️</span>
              <div className="text-xs font-medium leading-relaxed">
                <p className="font-bold text-sm mb-1">
                  {isRtl ? "صلاحية الموقع محجوبة" : "Location Access Blocked"}
                </p>

                {navigator.userAgent.includes("FBAN") ||
                navigator.userAgent.includes("FBAV") ? (
                  <div className="space-y-3">
                    <p>
                      {isRtl
                        ? "متصفح فيسبوك قد لا يدعم تحديد الموقع بشكل صحيح."
                        : "The Facebook browser may not fully support location access."}
                    </p>

                    <ol className="list-decimal ps-5 space-y-1">
                      <li>
                        {isRtl
                          ? "اضغط على القائمة (⋮) بالأعلى."
                          : "Tap the menu (⋮) at the top."}
                      </li>

                      <li>
                        {isRtl
                          ? "اختر «فتح في المتصفح» (Open in Browser)."
                          : "Select 'Open in Browser'."}
                      </li>

                      <li>
                        {isRtl
                          ? "إذا طُلب منك، فعِّل «مشاركة الموقع» (Share Location) أو اسمح بالوصول إلى الموقع من إعدادات جهازك."
                          : "If prompted, enable 'Share Location' or allow location access from your device settings."}
                      </li>
                    </ol>
                  </div>
                ) : (
                  <p>
                    {locationErrorType === "ios" &&
                      (isRtl
                        ? "يرجى تفعيل خدمات الموقع والسماح لـ Safari بالوصول إلى موقعك."
                        : "Please enable Location Services and allow Safari to access your location.")}
                    {locationErrorType === "android" &&
                      (isRtl
                        ? "يرجى تفعيل خدمة الموقع (GPS) والسماح للمتصفح بالوصول إلى موقعك."
                        : "Please enable GPS and allow your browser to access your location.")}

                    {locationErrorType === "generic" && (
                      <p>
                        {isRtl
                          ? "تعذر الوصول إلى موقعك الحالي. يرجى التأكد من تفعيل خدمة الموقع والسماح للمتصفح بالوصول إلى موقعك، ثم أعد المحاولة."
                          : "Unable to access your current location. Please make sure location services are enabled and your browser has permission to access your location, then try again."}
                      </p>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Interactive Map - drag the pin or tap the map to fine-tune the location */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {isRtl
              ? "اسحب الدبوس لتحديد موقعك بدقة"
              : "Drag the pin to fine-tune your exact location"}
          </p>
          {mounted && (
            <div className="overflow-hidden border rounded-2xl border-zinc-200 dark:border-zinc-800">
              <LocationPicker
                lat={addressForm.lat ?? DEFAULT_MAP_CENTER[0]}
                lng={addressForm.lng ?? DEFAULT_MAP_CENTER[1]}
                onChange={handleMapLocationChange}
              />
            </div>
          )}
        </div>

        {/* Captured Coordinates Feedback */}
        {addressForm.lat && addressForm.lng && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-xl flex items-start gap-2 text-xs font-semibold text-green-700 dark:text-green-400 animate-in fade-in">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              {addressForm.location && <span>{addressForm.location}</span>}
              <span>
                {isRtl
                  ? `تم التقاط الموقع: (${addressForm.lat.toFixed(4)}, ${addressForm.lng.toFixed(4)})`
                  : `Location captured: (${addressForm.lat.toFixed(4)}, ${addressForm.lng.toFixed(4)})`}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleAddressSubmit} className="space-y-4">
          <input
            name="title"
            placeholder={isRtl ? "العنوان (مثال: المنزل)" : "Title (e.g. Home)"}
            value={addressForm.title}
            onChange={handleInputChange}
            className={inputClass}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              name="street"
              placeholder={isRtl ? "الشارع" : "Street"}
              value={addressForm.street}
              onChange={handleInputChange}
              className={`col-span-2 ${inputClass}`}
              required
            />

            <textarea
              name="fulladdress"
              placeholder={isRtl ? "العنوان بالكامل" : "Full Address"}
              value={addressForm.fulladdress}
              onChange={handleInputChange}
              className={`col-span-2 ${inputClass} resize-none`}
              rows={2}
              required
            />

            <input
              name="number"
              placeholder={isRtl ? "رقم المبنى" : "Number"}
              value={addressForm.number}
              onChange={handleInputChange}
              className={inputClass}
              required
            />
            <input
              name="floor"
              placeholder={isRtl ? "الدور" : "Floor"}
              value={addressForm.floor}
              onChange={handleInputChange}
              className={inputClass}
              required
            />
            <input
              name="apartment"
              placeholder={isRtl ? "الشقة" : "Apartment"}
              value={addressForm.apartment}
              onChange={handleInputChange}
              className={inputClass}
              required
            />
            <input
              name="landmark"
              placeholder={isRtl ? "علامة مميزة" : "Landmark"}
              value={addressForm.landmark}
              onChange={handleInputChange}
              className={`col-span-2 ${inputClass}`}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 font-bold text-zinc-700 bg-zinc-100 rounded-xl hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 transition-colors text-sm"
            >
              {isRtl ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={postingAddress || isLocating}
              className="flex-1 py-3 font-bold text-zinc-950 bg-yellow-400 rounded-xl hover:bg-yellow-500 disabled:opacity-70 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {postingAddress && <Loader2 size={16} className="animate-spin" />}
              {postingAddress
                ? isRtl
                  ? "جاري الحفظ..."
                  : "Saving..."
                : isRtl
                  ? "إضافة العنوان"
                  : "Add Address"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddAddressPopup;
