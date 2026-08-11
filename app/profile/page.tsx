"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import useGet from "@/app/hooks/useGet";
import usePut from "@/app/hooks/usePut";
import { useRouter, useSearchParams } from "next/navigation";
import { useToken } from "@/context/TokenContext";

// Interfaces
interface Address {
  id: string;
  zoneId: string;
  type: "home" | "work" | string;
  title: string;
  lat: string | number | null;
  lng: string | number | null;
  street: string;
  number: string | number;
  floor: string | number;
  landmark: string | null;
  location: string | null;
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
  const { t } = useLanguage();
  const { logout } = useToken();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isRtl = typeof document !== "undefined" && document.dir === "rtl";
  const callbackSlug = searchParams.get("callbackSlug");

  // Tab State
  const [activeTab, setActiveTab] = useState<"profile" | "addresses">(
    "profile",
  );

  // Fetching user profile data
  const {
    data: profileResponse,
    loading: isFetching,
    refetch,
  } = useGet<ProfileApiResponse>("/api/user/profile");

  // Update hooks
  const { putData: updateProfile, loading: isUpdatingProfile } =
    usePut("/api/user/profile");
  const { putData: updateAddress, loading: isUpdatingAddress } = usePut(); // Kept empty to allow dynamic URLs

  // Extracted response data
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

  // Address Editing State
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [editAddressData, setEditAddressData] = useState<Partial<Address>>({});

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
      // Handled by hook
    }
  };

  // Handle Address Changes
  const handleAddressEditClick = (address: Address) => {
    setEditingAddressId(address.id);
    setEditAddressData(address);
  };

  const handleAddressChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setEditAddressData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressSubmit = async (e: React.FormEvent, addressId: string) => {
    e.preventDefault();

    // Convert values to numeric type to ensure backend compatibility
    const payload = {
      ...editAddressData,
      number: Number(editAddressData.number) || 0,
      floor: Number(editAddressData.floor) || 0,
    };

    try {
      await updateAddress(
        payload,
        `/api/user/address/${addressId}`,
        t("address-updated-success") || "تم تحديث العنوان بنجاح!",
      );
      setEditingAddressId(null);
      if (refetch) refetch();
    } catch (error) {
      // Handled by hook
    }
  };

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
        className="absolute z-20 flex items-center justify-center w-10 h-10 transition-transform bg-yellow-400 rounded-full shadow-md -mt-2 top-4 start-4 active:scale-95"
      >
        <ChevronLeft
          className={`w-6 h-6 text-white ${isRtl ? "rotate-180" : ""}`}
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
                    </div>

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
                            className={`p-5 border bg-gray-50/50 dark:bg-zinc-800/30 border-gray-200 dark:border-zinc-800 rounded-2xl transition-all relative ${
                              editingAddressId === address.id
                                ? "ring-2 ring-yellow-400/50 border-yellow-400"
                                : "hover:border-yellow-400/50"
                            }`}
                          >
                            {/* IF IN EDITING MODE */}
                            {editingAddressId === address.id ? (
                              <form
                                onSubmit={(e) =>
                                  handleAddressSubmit(e, address.id)
                                }
                                className="space-y-4"
                              >
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                  <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300">
                                      {t("addressTitle") ||
                                        "اسم العنوان (مثال: المنزل)"}
                                    </label>
                                    <input
                                      type="text"
                                      name="title"
                                      value={editAddressData.title || ""}
                                      onChange={handleAddressChange}
                                      required
                                      className="w-full px-3 py-2.5 text-sm transition-all border border-gray-200 dark:border-zinc-700 outline-none bg-white dark:bg-zinc-900 rounded-xl dark:text-white focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300">
                                      {t("addressType") || "نوع العنوان"}
                                    </label>
                                    <select
                                      name="type"
                                      value={editAddressData.type || "home"}
                                      onChange={handleAddressChange}
                                      className="w-full px-3 py-2.5 text-sm transition-all border border-gray-200 dark:border-zinc-700 outline-none bg-white dark:bg-zinc-900 rounded-xl dark:text-white focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                                    >
                                      <option value="home">
                                        {t("home") || "المنزل"}
                                      </option>
                                      <option value="work">
                                        {t("work") || "العمل"}
                                      </option>
                                      <option value="other">
                                        {t("other") || "أخرى"}
                                      </option>
                                    </select>
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300">
                                    {t("street") || "اسم الشارع"}
                                  </label>
                                  <input
                                    type="text"
                                    name="street"
                                    value={editAddressData.street || ""}
                                    onChange={handleAddressChange}
                                    required
                                    className="w-full px-3 py-2.5 text-sm transition-all border border-gray-200 dark:border-zinc-700 outline-none bg-white dark:bg-zinc-900 rounded-xl dark:text-white focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300">
                                      {t("buildingNumber") || "رقم المبنى"}
                                    </label>
                                    <input
                                      type="number"
                                      name="number"
                                      value={editAddressData.number || ""}
                                      onChange={handleAddressChange}
                                      required
                                      className="w-full px-3 py-2.5 text-sm transition-all border border-gray-200 dark:border-zinc-700 outline-none bg-white dark:bg-zinc-900 rounded-xl dark:text-white focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300">
                                      {t("floor") || "الدور / الطابق"}
                                    </label>
                                    <input
                                      type="number"
                                      name="floor"
                                      value={editAddressData.floor || ""}
                                      onChange={handleAddressChange}
                                      className="w-full px-3 py-2.5 text-sm transition-all border border-gray-200 dark:border-zinc-700 outline-none bg-white dark:bg-zinc-900 rounded-xl dark:text-white focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300">
                                    {t("landmark") || "علامة مميزة"}
                                  </label>
                                  <input
                                    type="text"
                                    name="landmark"
                                    value={editAddressData.landmark || ""}
                                    onChange={handleAddressChange}
                                    className="w-full px-3 py-2.5 text-sm transition-all border border-gray-200 dark:border-zinc-700 outline-none bg-white dark:bg-zinc-900 rounded-xl dark:text-white focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                                  />
                                </div>

                                <div className="flex items-center gap-3 pt-3 mt-2 border-t border-gray-100 dark:border-zinc-800">
                                  <button
                                    type="submit"
                                    disabled={isUpdatingAddress}
                                    className="flex-1 py-3 px-4 text-sm font-bold text-gray-900 transition-all bg-yellow-400 rounded-xl hover:bg-yellow-500 shadow-md shadow-yellow-400/20 disabled:opacity-70 flex justify-center items-center gap-2"
                                  >
                                    {isUpdatingAddress ? (
                                      <Loader2
                                        size={16}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <Save size={16} />
                                    )}
                                    <span>{t("save") || "حفظ"}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setEditingAddressId(null)}
                                    className="px-5 py-3 text-sm font-bold text-gray-600 transition-all bg-gray-100 dark:bg-zinc-800 dark:text-zinc-300 rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700"
                                  >
                                    {t("cancel") || "إلغاء"}
                                  </button>
                                </div>
                              </form>
                            ) : (
                              /* IF IN READ-ONLY MODE */
                              <>
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
                                    <span className="px-2.5 py-0.5 text-xs font-semibold rounded-lg bg-yellow-400/20 text-yellow-700 dark:text-yellow-400 capitalize">
                                      {address.type}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleAddressEditClick(address)
                                      }
                                      className="p-1.5 text-gray-500 transition-colors hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-500/20 dark:hover:text-yellow-400 rounded-lg"
                                      title={t("edit") || "تعديل"}
                                    >
                                      <Edit size={16} />
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-1 text-sm text-gray-600 dark:text-zinc-400 pr-1">
                                  <p>
                                    <span className="font-semibold text-gray-700 dark:text-zinc-300">
                                      الشارع:
                                    </span>{" "}
                                    {address.street} - مبنى {address.number}{" "}
                                    (طابق {address.floor})
                                  </p>
                                  {address.location && (
                                    <p>
                                      <span className="font-semibold text-gray-700 dark:text-zinc-300">
                                        الموقع:
                                      </span>{" "}
                                      {address.location}
                                    </p>
                                  )}
                                  {address.landmark && (
                                    <p className="italic text-gray-400 mt-1">
                                      علامة مميزة: {address.landmark}
                                    </p>
                                  )}
                                </div>
                              </>
                            )}
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
    </div>
  );
}
