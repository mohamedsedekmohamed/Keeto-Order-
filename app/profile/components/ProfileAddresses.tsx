"use client";

import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import {
  CheckCircle2,
  Edit,
  Loader2,
  MapPin,
  Navigation,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import ZoneSelect, { type DeliveryZone } from "@/components/Zoneselect";
import { useLanguage } from "@/context/LanguageContext";
import ProfileAccordion from "./ProfileAccordion";
import "leaflet/dist/leaflet.css";

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

export interface Address {
  id: string;
  type?: "home" | "work" | string;
  title: string;
  lat: number | null;
  lng: number | null;
  street: string;
  number: string | number;
  floor: string | number;
  apartment: string;
  landmark: string | null;
  fulladdress?: string;
  location?: string | null;
  isRelatedToOrder?: boolean;
}

export interface AddressFormData {
  title: string;
  type: string;
  street: string;
  fulladdress: string;
  number: string;
  floor: string;
  apartment: string;
  landmark: string;
  lat: number | null;
  lng: number | null;
  location: string;
  zoneId: string;
}

interface ProfileAddressesProps {
  isOpen: boolean;
  isArabic: boolean;
  isFacebookBrowser: boolean;
  isMounted: boolean;
  isGuest: boolean;
  addresses: Address[];
  isFormOpen: boolean;
  editingAddressId: string | null;
  addressForm: AddressFormData;
  selectedZoneId: string;
  zones: DeliveryZone[];
  isLocating: boolean;
  isAddingAddress: boolean;
  isUpdatingAddress: boolean;
  isDeletingAddress: boolean;
  hasLocation: boolean;
  onToggle: () => void;
  onAddNewClick: () => void;
  onGetCurrentLocation: () => void;
  onResetForm: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onZoneSelect: (zone: DeliveryZone) => void;
  onMapLocationChange: (lat: number, lng: number) => void;
  onChange: (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
  onEditAddress: (address: Address) => void;
  onDeleteAddress: (id: string) => void;
}

const DEFAULT_MAP_CENTER: [number, number] = [30.0444, 31.2357];

function MapClickHandler({
  onChange,
}: {
  onChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      onChange(event.latlng.lat, event.latlng.lng);
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
  const markerRef = useRef<L.Marker | null>(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker) {
          const position = marker.getLatLng();
          onChange(position.lat, position.lng);
        }
      },
    }),
    [onChange],
  );

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={16}
      scrollWheelZoom
      style={{ height: "220px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        position={[lat, lng]}
        draggable
        eventHandlers={eventHandlers}
        ref={markerRef}
      />
      <MapClickHandler onChange={onChange} />
      <RecenterOnChange lat={lat} lng={lng} />
    </MapContainer>
  );
}

export default function ProfileAddresses({
  isOpen,
  isArabic,
  isFacebookBrowser,
  isMounted,
  isGuest,
  addresses,
  isFormOpen,
  editingAddressId,
  addressForm,
  selectedZoneId,
  zones,
  isLocating,
  isAddingAddress,
  isUpdatingAddress,
  isDeletingAddress,
  hasLocation,
  onToggle,
  onAddNewClick,
  onGetCurrentLocation,
  onResetForm,
  onSubmit,
  onZoneSelect,
  onMapLocationChange,
  onChange,
  onEditAddress,
  onDeleteAddress,
}: ProfileAddressesProps) {
  const { t } = useLanguage();

  return (
    <ProfileAccordion
      icon={<MapPin size={18} />}
      label={t("addresses") || "العناوين"}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="p-6 sm:p-8 mt-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white dark:border-zinc-800/50 rounded-[2.5rem] shadow-xl space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {t("savedAddresses") || "العناوين المحفوظة"}
          </h3>

          {!isFormOpen && !isGuest && (
            <button
              onClick={onAddNewClick}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-zinc-900 bg-yellow-400 rounded-xl hover:bg-yellow-500 transition-all active:scale-95 shadow-md shadow-yellow-400/20"
            >
              <Plus size={16} />
              <span>{t("add-address-btn") || "إضافة عنوان جديد"}</span>
            </button>
          )}
        </div>

        {isFormOpen && !editingAddressId && !hasLocation && !isFacebookBrowser && (
          <div className="p-6 mb-6 space-y-4 bg-gray-50/80 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-800 rounded-2xl">
            <div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                {isArabic
                  ? "حدد موقعك للمتابعة"
                  : "Set your location to continue"}
              </h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                {isFacebookBrowser
                  ? isArabic
                    ? "يجب اختيار منطقة التوصيل قبل إدخال تفاصيل العنوان."
                    : "You must select a delivery zone before entering address details."
                  : isArabic
                    ? "يجب تحديد موقعك الحالي قبل إدخال تفاصيل العنوان."
                    : "You must capture your current location before entering address details."}
              </p>
            </div>
            <button
              type="button"
              onClick={onGetCurrentLocation}
              disabled={isLocating}
              className="w-full py-3 px-4 flex items-center justify-center gap-2 bg-white hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-xl font-bold text-sm transition-all border border-gray-200 dark:border-zinc-700 disabled:opacity-60 shadow-sm"
            >
              {isLocating ? (
                <Loader2 size={18} className="animate-spin text-yellow-500" />
              ) : (
                <Navigation
                  size={18}
                  className="text-yellow-500 fill-yellow-500"
                />
              )}
              {isLocating
                ? isArabic
                  ? "جاري تحديد موقعك..."
                  : "Locating..."
                : isArabic
                  ? "استخدام موقعي الحالي (GPS)"
                  : "Use Current Location (GPS)"}
            </button>
            <button
              type="button"
              onClick={onResetForm}
              className="w-full py-3 font-bold text-gray-600 bg-gray-100 dark:bg-zinc-800 dark:text-zinc-300 rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700"
            >
              {t("cancel") || "Cancel"}
            </button>
          </div>
        )}

        {isFormOpen && (editingAddressId || hasLocation || isFacebookBrowser) && (
          <form
            onSubmit={onSubmit}
            className="p-6 mb-6 space-y-5 bg-gray-50/80 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-800 rounded-2xl transition-all"
          >
            <div className="pb-2 border-b border-gray-200 dark:border-zinc-700/60">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingAddressId
                  ? t("edit-address") || "تعديل العنوان"
                  : t("add-address") || "إضافة عنوان جديد"}
              </h4>
            </div>

            {isFacebookBrowser ? (
              <ZoneSelect
                zones={zones}
                value={selectedZoneId}
                isRtl={isArabic}
                onSelect={onZoneSelect}
              />
            ) : (
              <button
                type="button"
                onClick={onGetCurrentLocation}
                disabled={isLocating}
                className="w-full py-3 px-4 flex items-center justify-center gap-2 bg-white hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-xl font-bold text-sm transition-all border border-gray-200 dark:border-zinc-700 active:scale-98 disabled:opacity-60 shadow-sm"
              >
                {isLocating ? (
                  <Loader2 size={18} className="animate-spin text-yellow-500" />
                ) : (
                  <Navigation
                    size={18}
                    className="text-yellow-500 fill-yellow-500"
                  />
                )}
                {isLocating
                  ? isArabic
                    ? "جاري تحديد موقعك..."
                    : "Locating..."
                  : isArabic
                    ? "استخدام موقعي الحالي (GPS)"
                    : "Use Current Location (GPS)"}
              </button>
            )}

            <div>
              {!isFacebookBrowser && (
                <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-zinc-400">
                  {isArabic
                    ? "اسحب الدبوس لتحديد موقعك بدقة"
                    : "Drag the pin to fine-tune your exact location"}
                </p>
              )}
              {isMounted && !isFacebookBrowser && (
                <div className="overflow-hidden border rounded-2xl border-gray-200 dark:border-zinc-700">
                  <LocationPicker
                    lat={addressForm.lat ?? DEFAULT_MAP_CENTER[0]}
                    lng={addressForm.lng ?? DEFAULT_MAP_CENTER[1]}
                    onChange={onMapLocationChange}
                  />
                </div>
              )}
            </div>

            {hasLocation ? (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-xl flex items-start gap-2 text-xs font-semibold text-green-700 dark:text-green-400">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span>
                    {addressForm.location ||
                      (isArabic ? "تم تحديد الموقع" : "Location selected")}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs font-medium text-amber-600 dark:text-amber-500">
                {isFacebookBrowser
                  ? isArabic
                    ? "اختر منطقة التوصيل من القائمة أعلاه قبل الحفظ."
                    : "Select a delivery zone from the list above before saving."
                  : isArabic
                    ? "اضغط على الزر أعلاه لتحديد موقعك تلقائيًا قبل الحفظ."
                    : "Tap the button above to auto-detect your location before saving."}
              </p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                  {t("addressTitle") || "عنوان الإقامة"}
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder={t("title") || "اسم العنوان"}
                  value={addressForm.title}
                  onChange={onChange}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none text-sm dark:text-white focus:ring-2 focus:ring-yellow-400"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                {t("street") || "الشارع"}
              </label>
              <input
                type="text"
                name="street"
                placeholder={t("street") || "اسم الشارع"}
                value={addressForm.street}
                onChange={onChange}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none text-sm dark:text-white focus:ring-2 focus:ring-yellow-400"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                {t("address") || "العنوان بالتفصيل"}
              </label>
              <textarea
                name="fulladdress"
                placeholder={t("address") || "العنوان الكامل"}
                value={addressForm.fulladdress}
                onChange={onChange}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none text-sm dark:text-white focus:ring-2 focus:ring-yellow-400 resize-none"
                rows={2}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                  {t("number") || "المبنى"}
                </label>
                <input
                  type="text"
                  name="number"
                  placeholder={t("number") || "رقم المبنى"}
                  value={addressForm.number}
                  onChange={onChange}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none text-sm dark:text-white focus:ring-2 focus:ring-yellow-400"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                  {t("floor") || "الطابق"}
                </label>
                <input
                  type="text"
                  name="floor"
                  placeholder={t("floor") || "رقم الطابق"}
                  value={addressForm.floor}
                  onChange={onChange}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none text-sm dark:text-white focus:ring-2 focus:ring-yellow-400"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                  {t("apartment") || "الشقة"}
                </label>
                <input
                  type="text"
                  name="apartment"
                  placeholder={t("apartment") || "رقم الشقة"}
                  value={addressForm.apartment}
                  onChange={onChange}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none text-sm dark:text-white focus:ring-2 focus:ring-yellow-400"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                {t("landmark") || "علامة مميزة"}
              </label>
              <input
                type="text"
                name="landmark"
                placeholder={t("landmark") || "علامة مميزة"}
                value={addressForm.landmark}
                onChange={onChange}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none text-sm dark:text-white focus:ring-2 focus:ring-yellow-400"
                required
              />
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-gray-200 dark:border-zinc-700">
              <button
                type="submit"
                disabled={
                  isAddingAddress ||
                  isUpdatingAddress ||
                  isLocating ||
                  !hasLocation
                }
                className="flex-1 py-3 px-4 font-bold text-zinc-900 bg-yellow-400 rounded-xl hover:bg-yellow-500 shadow-md shadow-yellow-400/20 disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {isAddingAddress || isUpdatingAddress ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                <span>
                  {isAddingAddress || isUpdatingAddress
                    ? t("saving") || "جاري الحفظ..."
                    : editingAddressId
                      ? t("update-address") || "تحديث العنوان"
                      : t("add-address-btn") || "حفظ العنوان"}
                </span>
              </button>

              <button
                type="button"
                onClick={onResetForm}
                className="px-5 py-3 font-bold text-gray-600 bg-gray-100 dark:bg-zinc-800 dark:text-zinc-300 rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700"
              >
                {t("cancel") || "إلغاء"}
              </button>
            </div>
          </form>
        )}

        {addresses.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-zinc-400">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
            <p>{t("noAddresses") || "لا توجد عناوين محفوظة حالياً."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`p-5 border bg-gray-50/50 dark:bg-zinc-800/30 border-gray-200 dark:border-zinc-800 rounded-2xl transition-all relative flex flex-col justify-between ${
                  editingAddressId === address.id
                    ? "ring-2 ring-yellow-400/50 border-yellow-400"
                    : "hover:border-yellow-400/50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                      <MapPin size={16} className="text-yellow-500" />
                      {address.title}
                    </span>
                    <div className="flex items-center gap-2">
                      {address.lat && address.lng && (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                          📍 GPS
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600 dark:text-zinc-400">
                    <p>
                      <span className="font-semibold text-gray-700 dark:text-zinc-300">
                        {t("street") || "الشارع"}:
                      </span>{" "}
                      {address.street} - مبنى {address.number} (طابق{" "}
                      {address.floor})
                    </p>
                    {address.fulladdress && (
                      <p className="line-clamp-2">
                        <span className="font-semibold text-gray-700 dark:text-zinc-300">
                          {t("address") || "العنوان"}:
                        </span>{" "}
                        {address.fulladdress}
                      </p>
                    )}
                    {address.landmark && (
                      <p className="italic text-gray-400 mt-1">
                        {t("landmark") || "علامة مميزة"}: {address.landmark}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 mt-4 border-t border-gray-100 dark:border-zinc-800">
                  <button
                    onClick={() => onEditAddress(address)}
                    className="flex-1 px-4 py-2 text-xs font-bold text-blue-600 transition-colors rounded-xl bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center justify-center gap-1.5"
                  >
                    <Edit size={14} />
                    <span>{t("edit") || "تعديل"}</span>
                  </button>
                  <button
                    onClick={() => onDeleteAddress(address.id)}
                    disabled={isDeletingAddress}
                    className="flex-1 px-4 py-2 text-xs font-bold text-red-600 transition-colors rounded-xl bg-red-50 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    <span>{t("delete") || "حذف"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProfileAccordion>
  );
}
