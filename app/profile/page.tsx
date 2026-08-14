"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Save,
  LogOut,
  Shield,
  Settings,
  Phone,
  Wallet,
  BadgeCheck,
  Loader2,
  ChevronLeft,
  MapPin,
  ShoppingBag,
  Home,
  Briefcase,
  Edit,
  Trash2,
  Navigation,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import useGet from "@/app/hooks/useGet";
import usePost from "@/app/hooks/usePost";
import usePut from "@/app/hooks/usePut";
import useDelete from "@/app/hooks/useDelete";
import { useRouter, useSearchParams } from "next/navigation";
import { useToken } from "@/context/TokenContext";

// Leaflet Imports
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet Marker Icon Path Issue in Next.js
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

// Default Fallback Coordinates
const DEFAULT_MAP_CENTER: [number, number] = [30.0444, 31.2357];

// ─────────────────────────────────────────────
// Map Helper & Component (Draggable Pin)
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

// ─────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────

interface Address {
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
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  alternatePhone: string;
  photo: string | null;
  isVerified: boolean;
  isProfileComplete: boolean;
  createdAt: string;
  addresses: Address[];
}

interface ProfileApiResponse {
  success: boolean;
  data: {
    data: {
      user: UserProfile;
      walletBalance: string;
      ordersCount: number;
    };
  };
}

export default function ProfilePage() {
  const { t, language } = useLanguage();
  const { logout } = useToken();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isRtl = typeof document !== "undefined" && document.dir === "rtl";
  const isArabic = String(language).toLowerCase() === "ar";
  const callbackSlug = searchParams.get("callbackSlug");

  // Mount state for SSR rendering safety with Leaflet
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Tab State
  const [activeTab, setActiveTab] = useState<"profile" | "addresses">(
    "profile",
  );

  // Delete Modal & GPS States
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // APIs
  const {
    data: profileResponse,
    loading: isFetching,
    refetch,
  } = useGet<ProfileApiResponse>("/api/user/profile");

  const { putData: updateProfile, loading: isUpdatingProfile } =
    usePut("/api/user/profile");
  const { postData: addAddress, loading: isAddingAddress } =
    usePost("/api/user/address");
  const { putData: updateAddress, loading: isUpdatingAddress } = usePut();
  const { deleteData, loading: isDeletingAddress } = useDelete("");

  // Extracted Data
  const userData = profileResponse?.data?.data?.user;
  const walletBalance = profileResponse?.data?.data?.walletBalance || "0.00";
  const ordersCount = profileResponse?.data?.data?.ordersCount || 0;

  // Profile Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    alternatePhone: "",
  });

  // Address Editing / Adding State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
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

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        alternatePhone: userData.alternatePhone || "",
      });
    }
  }, [userData]);

  // Handle Profile Changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(
        {
          name: formData.name,
          phone: formData.phone,
          alternatePhone: formData.alternatePhone,
        },
        null,
        t("updateSuccess") || "تم تحديث البيانات بنجاح!",
      );
      if (refetch) refetch();
    } catch (error) {
      console.error(error);
    }
  };

  // Reverse Geocoding via Nominatim
  const applyLocation = async (latitude: number, longitude: number) => {
    let extractedTitle = "";
    let extractedStreet = "";
    let extractedFullAddress = "";

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      );
      const data = await res.json();
      const address = data?.address || {};

      extractedTitle =
        address.road ||
        address.neighbourhood ||
        address.suburb ||
        data?.display_name ||
        "";
      extractedStreet = address.road || address.pedestrian || "";
      extractedFullAddress = data?.display_name || "";
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
      alert(
        isArabic
          ? "المتصفح الخاص بك لا يدعم تحديد الموقع."
          : "Geolocation is not supported by your browser.",
      );
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await applyLocation(latitude, longitude);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        console.error("Error getting location:", error);
        alert(
          isArabic
            ? "فشل في تحديد الموقع. يرجى تفعيل الـ GPS وإعطاء الصلاحية."
            : "Failed to get location. Please allow location access.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Address Form Actions
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
    setEditingAddressId(null);
    setIsFormOpen(false);
  };

  const handleAddNewClick = () => {
    resetAddressForm();
    setIsFormOpen(true);
  };

  const handleAddressEditClick = (address: Address) => {
    setAddressForm({
      title: address.title || "",
      type: address.type || "home",
      street: address.street || "",
      fulladdress: address.fulladdress || "",
      number: address.number?.toString() || "",
      floor: address.floor?.toString() || "",
      apartment: address.apartment || "",
      landmark: address.landmark || "",
      lat: address.lat !== null ? Number(address.lat) : null,
      lng: address.lng !== null ? Number(address.lng) : null,
      location: address.location || "",
    });
    setEditingAddressId(address.id);
    setIsFormOpen(true);
  };

  const handleAddressChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...addressForm,
      number: Number(addressForm.number) || 0,
      floor: Number(addressForm.floor) || 0,
    };

    try {
      if (editingAddressId) {
        await updateAddress(
          payload,
          `/api/user/address/${editingAddressId}`,
          t("address-updated-success") || "تم تحديث العنوان بنجاح!",
        );
      } else {
        await addAddress(
          payload,
          null,
          t("address-added-success") || "تم إضافة العنوان بنجاح!",
        );
      }
      resetAddressForm();
      if (refetch) refetch();
    } catch (error) {
      console.error(error);
    }
  };

  // Address Deletion
  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteData(
        `/api/user/address/${deleteId}`,
        t("address-deleted-success") || "تم حذف العنوان بنجاح!",
      );
      if (refetch) refetch();
    } finally {
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  const hasLocation =
    addressForm.lat !== null &&
    addressForm.lng !== null &&
    !Number.isNaN(Number(addressForm.lat)) &&
    !Number.isNaN(Number(addressForm.lng));

  const latDisplay = hasLocation ? Number(addressForm.lat).toFixed(4) : "";
  const lngDisplay = hasLocation ? Number(addressForm.lng).toFixed(4) : "";

  if (isFetching || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-950">
        <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen px-4 py-12 overflow-hidden transition-colors duration-300 bg-gray-50 dark:bg-zinc-950">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-yellow-400/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-yellow-500/5 blur-[130px] rounded-full pointer-events-none" />

      <button
        onClick={() => router.back()}
        className="absolute z-20 flex items-center justify-center w-10 h-10 transition-transform bg-yellow-400 rounded-full shadow-md -mt-2 top-4 start-4 active:scale-95 text-white"
      >
        <ChevronLeft
          className={`w-6 h-6 transform ${isRtl ? "rotate-180" : ""}`}
        />
      </button>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white">
              {t("profile") || "الحساب الشخصي"}
            </h1>
            <p className="mt-2 font-medium text-gray-500 dark:text-zinc-400">
              {t("manageProfile") || "إدارة ملفك الشخصي وعناوينك"}
            </p>
          </div>
          <button className="p-3 text-gray-500 transition-all bg-white border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-2xl hover:border-yellow-400 dark:text-zinc-400">
            <Settings size={24} />
          </button>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column: Summary Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6 lg:col-span-1"
          >
            <div className="p-8 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white dark:border-zinc-800/50 rounded-[2.5rem] shadow-xl text-center">
              <div className="flex items-center justify-center gap-2 mt-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {userData.name}
                </h3>
                {userData.isVerified && (
                  <BadgeCheck size={20} className="text-blue-500" />
                )}
              </div>
              <p className="mt-1 text-sm font-medium text-gray-500 dark:text-zinc-400">
                {userData.email}
              </p>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="flex flex-col items-center justify-center p-3 bg-yellow-400/10 rounded-2xl border border-yellow-400/20">
                  <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400 font-bold text-sm">
                    <Wallet size={16} />
                    <span>{walletBalance}</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                    {t("wallet") || "المحفظة"}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                  <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-sm">
                    <ShoppingBag size={16} />
                    <span>{ordersCount}</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                    {t("orders") || "الطلبات"}
                  </span>
                </div>
              </div>

              {/* Tab Selector Buttons */}
              <div className="pt-6 mt-6 space-y-2 border-t border-gray-100 dark:border-zinc-800">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`flex items-center w-full gap-3 px-4 py-3 font-bold rounded-2xl transition-all ${
                    activeTab === "profile"
                      ? "bg-yellow-400 text-gray-900 shadow-md shadow-yellow-400/20"
                      : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <User size={18} />
                  <span>{t("personalInfo") || "البيانات الشخصية"}</span>
                </button>

                <button
                  onClick={() => setActiveTab("addresses")}
                  className={`flex items-center justify-between w-full px-4 py-3 font-bold rounded-2xl transition-all ${
                    activeTab === "addresses"
                      ? "bg-yellow-400 text-gray-900 shadow-md shadow-yellow-400/20"
                      : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MapPin size={18} />
                    <span>{t("addresses") || "العناوين المحفوظة"}</span>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-200/60 dark:bg-zinc-700/60">
                    {userData.addresses?.length || 0}
                  </span>
                </button>

                <button
                  onClick={() => {
                    logout(callbackSlug);
                    logout();
                    const redirectPath = callbackSlug
                      ? `/home/restaurants/${callbackSlug}`
                      : "/";
                    router.push(redirectPath);
                  }}
                  className="flex items-center justify-center w-full gap-2 py-3 mt-4 font-bold text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl"
                >
                  <LogOut size={18} />
                  {t("logout") || "تسجيل الخروج"}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Tab Contents */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="p-8 sm:p-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white dark:border-zinc-800/50 rounded-[2.5rem] shadow-xl">
              <AnimatePresence mode="wait">
                {/* TAB 1: Profile Details Form */}
                {activeTab === "profile" && (
                  <motion.form
                    key="profile-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                    onSubmit={handleProfileSubmit}
                  >
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      {t("editProfile") || "تعديل البيانات"}
                    </h3>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-zinc-300 ms-1">
                          {t("fullName") || "الاسم الكامل"}
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-4">
                            <User
                              size={18}
                              className="text-gray-400 group-focus-within:text-yellow-500"
                            />
                          </div>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleProfileChange}
                            required
                            className="w-full py-4 transition-all border-2 border-transparent outline-none bg-gray-100/50 dark:bg-zinc-800/40 rounded-2xl ps-11 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:border-yellow-400"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-zinc-300 ms-1">
                          {t("email") || "البريد الإلكتروني"}
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-4">
                            <Mail size={18} className="text-gray-400" />
                          </div>
                          <input
                            type="email"
                            disabled
                            value={formData.email}
                            className="w-full py-4 text-gray-400 border-2 border-transparent cursor-not-allowed bg-gray-100/30 dark:bg-zinc-800/20 rounded-2xl ps-11"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-zinc-300 ms-1">
                          {t("phone") || "رقم الهاتف"}
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-4">
                            <Phone
                              size={18}
                              className="text-gray-400 group-focus-within:text-yellow-500"
                            />
                          </div>
                          <input
                            type="tel"
                            name="phone"
                            required
                            value={formData.phone}
                            onChange={handleProfileChange}
                            className="w-full py-4 transition-all border-2 border-transparent outline-none bg-gray-100/50 dark:bg-zinc-800/40 rounded-2xl ps-11 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:border-yellow-400"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-zinc-300 ms-1">
                          {t("alternatePhone") || "رقم هاتف إضافي"}
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-4">
                            <Phone
                              size={18}
                              className="text-gray-400 group-focus-within:text-yellow-500"
                            />
                          </div>
                          <input
                            type="tel"
                            name="alternatePhone"
                            value={formData.alternatePhone}
                            onChange={handleProfileChange}
                            className="w-full py-4 transition-all border-2 border-transparent outline-none bg-gray-100/50 dark:bg-zinc-800/40 rounded-2xl ps-11 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:border-yellow-400"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 dark:border-zinc-800">
                      <h4 className="flex items-center gap-2 mb-4 font-bold text-gray-900 dark:text-white">
                        <Shield size={18} className="text-yellow-500" />
                        {t("security") || "الأمان"}
                      </h4>
                      <button
                        type="button"
                        className="text-sm font-bold text-yellow-600 dark:text-yellow-400 hover:underline"
                      >
                        {t("changePassword") || "تغيير كلمة المرور"}
                      </button>
                    </div>

                    <div className="pt-4">
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        disabled={isUpdatingProfile}
                        type="submit"
                        className="flex items-center justify-center w-full gap-2 py-4 font-black text-gray-900 transition-all bg-yellow-400 shadow-xl rounded-2xl hover:bg-yellow-500 shadow-yellow-400/20 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isUpdatingProfile ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : (
                          <Save size={20} />
                        )}
                        {isUpdatingProfile
                          ? t("saving") || "جاري الحفظ..."
                          : t("saveChanges") || "حفظ التغييرات"}
                      </motion.button>
                    </div>
                  </motion.form>
                )}

                {/* TAB 2: Saved Addresses */}
                {activeTab === "addresses" && (
                  <motion.div
                    key="addresses-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {t("savedAddresses") || "العناوين المحفوظة"}
                      </h3>

                      {!isFormOpen && (
                        <button
                          onClick={handleAddNewClick}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-zinc-900 bg-yellow-400 rounded-xl hover:bg-yellow-500 transition-all active:scale-95 shadow-md shadow-yellow-400/20"
                        >
                          <Plus size={18} />
                          <span>
                            {t("add-address-btn") || "إضافة عنوان جديد"}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Dynamic Add / Edit Address Form */}
                    {isFormOpen && (
                      <form
                        onSubmit={handleAddressSubmit}
                        className="p-6 mb-6 space-y-5 bg-gray-50/80 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-800 rounded-2xl transition-all"
                      >
                        <div className="pb-2 border-b border-gray-200 dark:border-zinc-700/60">
                          <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                            {editingAddressId
                              ? t("edit-address") || "تعديل العنوان"
                              : t("add-address") || "إضافة عنوان جديد"}
                          </h4>
                        </div>

                        {/* GPS Location Button */}
                        <button
                          type="button"
                          onClick={handleGetCurrentLocation}
                          disabled={isLocating}
                          className="w-full py-3 px-4 flex items-center justify-center gap-2 bg-white hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-xl font-bold text-sm transition-all border border-gray-200 dark:border-zinc-700 active:scale-98 disabled:opacity-60 shadow-sm"
                        >
                          {isLocating ? (
                            <Loader2
                              size={18}
                              className="animate-spin text-yellow-500"
                            />
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

                        {/* Interactive Map */}
                        <div>
                          <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-zinc-400">
                            {isArabic
                              ? "اسحب الدبوس لتحديد موقعك بدقة"
                              : "Drag the pin to fine-tune your exact location"}
                          </p>
                          {mounted && (
                            <div className="overflow-hidden border rounded-2xl border-gray-200 dark:border-zinc-700">
                              <LocationPicker
                                lat={addressForm.lat ?? DEFAULT_MAP_CENTER[0]}
                                lng={addressForm.lng ?? DEFAULT_MAP_CENTER[1]}
                                onChange={handleMapLocationChange}
                              />
                            </div>
                          )}
                        </div>

                        {hasLocation ? (
                          <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-xl flex items-start gap-2 text-xs font-semibold text-green-700 dark:text-green-400">
                            <CheckCircle2
                              size={16}
                              className="shrink-0 mt-0.5"
                            />
                            <div className="flex flex-col gap-0.5">
                              {addressForm.location && (
                                <span>{addressForm.location}</span>
                              )}
                              <span>
                                {isArabic
                                  ? `تم التقاط الموقع: (${latDisplay}, ${lngDisplay})`
                                  : `Location captured: (${latDisplay}, ${lngDisplay})`}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs font-medium text-amber-600 dark:text-amber-500">
                            {isArabic
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
                              onChange={handleAddressChange}
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
                            onChange={handleAddressChange}
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
                            onChange={handleAddressChange}
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
                              type="number"
                              name="number"
                              placeholder={t("number") || "رقم المبنى"}
                              value={addressForm.number}
                              onChange={handleAddressChange}
                              className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none text-sm dark:text-white focus:ring-2 focus:ring-yellow-400"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                              {t("floor") || "الطابق"}
                            </label>
                            <input
                              type="number"
                              name="floor"
                              placeholder={t("floor") || "رقم الطابق"}
                              value={addressForm.floor}
                              onChange={handleAddressChange}
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
                              onChange={handleAddressChange}
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
                            onChange={handleAddressChange}
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none text-sm dark:text-white focus:ring-2 focus:ring-yellow-400"
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
                            onClick={resetAddressForm}
                            className="px-5 py-3 font-bold text-gray-600 bg-gray-100 dark:bg-zinc-800 dark:text-zinc-300 rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700"
                          >
                            {t("cancel") || "إلغاء"}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Address List View */}
                    {userData.addresses?.length === 0 ? (
                      <div className="py-12 text-center text-gray-500 dark:text-zinc-400">
                        <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
                        <p>
                          {t("noAddresses") || "لا توجد عناوين محفوظة حالياً."}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {userData.addresses?.map((address) => (
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
                                  {address.type === "work" ? (
                                    <Briefcase
                                      size={16}
                                      className="text-yellow-500"
                                    />
                                  ) : (
                                    <Home
                                      size={16}
                                      className="text-yellow-500"
                                    />
                                  )}
                                  {address.title}
                                </span>
                                <div className="flex items-center gap-2">
                                  {address.lat && address.lng && (
                                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                      📍 GPS
                                    </span>
                                  )}
                                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-lg bg-yellow-400/20 text-yellow-700 dark:text-yellow-400 capitalize">
                                    {address.type || "home"}
                                  </span>
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
                                    {t("landmark") || "علامة مميزة"}:{" "}
                                    {address.landmark}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2 pt-4 mt-4 border-t border-gray-100 dark:border-zinc-800">
                              <button
                                onClick={() => handleAddressEditClick(address)}
                                className="flex-1 px-4 py-2 text-xs font-bold text-blue-600 transition-colors rounded-xl bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center justify-center gap-1.5"
                              >
                                <Edit size={14} />
                                <span>{t("edit") || "تعديل"}</span>
                              </button>
                              <button
                                onClick={() => handleDeleteClick(address.id)}
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 bg-white rounded-2xl dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-2xl">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              {t("confirm-delete") || "تأكيد الحذف"}
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {t("are-you-sure-delete") ||
                "هل أنت تأكد من أنك تريد حذف هذا العنوان؟"}
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 font-semibold text-gray-700 dark:text-zinc-300 bg-gray-100 rounded-xl dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
              >
                {t("cancel") || "إلغاء"}
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors shadow-md shadow-red-500/20"
              >
                {t("delete") || "حذف"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
