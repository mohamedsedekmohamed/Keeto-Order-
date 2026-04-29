"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  User, Mail, Save, LogOut, Shield, Settings, 
  Phone, MapPin, Wallet, BadgeCheck, Loader2 ,Plus
} from "lucide-react";
import { useLanguage } from "../../../../../../context/LanguageContext";
import useGet from "@/app/hooks/useGet";
import usePut from "@/app/hooks/usePut"; // استدعاء usePut
import { redirect, useParams } from "next/navigation";
import { useToken } from "@/context/TokenContext";
import Link from "next/link";
// تعريف واجهات البيانات
interface UserLocation {
  country: string;
  city: string;
  zone: string;
  address: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  photo: string | null;
  location: UserLocation;
  isVerified: boolean;
  createdAt: string;
}

interface ProfileApiResponse {
  success: boolean;
  data: {
    data: {
      user: UserProfile;
      walletBalance: string;
    };
  };
}

export default function ProfilePage() {
  const { t } = useLanguage();
  const { logout } = useToken();

  // 1. جلب بيانات المستخدم
  const { data: profileResponse, loading: isFetching, refetch } = useGet<ProfileApiResponse>('/api/user/profile');
     const params = useParams<{ id: string }>();
          const basePath = `/home/restaurants/${params.id}`;
  // 2. إعداد دالة التحديث
  const { putData, loading: isUpdating } = usePut('/api/user/profile');
  
  // استخراج البيانات للوصول السهل
  const userData = profileResponse?.data?.data?.user;
  const walletBalance = profileResponse?.data?.data?.walletBalance || "0.00";

  // حالة الفورم لتخزين البيانات وعرضها/تعديلها
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });

  // تحديث الفورم بمجرد وصول البيانات من الـ API
  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        address: userData.location?.address || ""
      });
    }
  }, [userData]);

  // معالجة التغيير في الحقول
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // معالجة حفظ التغييرات
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // إرسال الاسم ورقم الهاتف فقط حسب المطلوب
      await putData(
        {
          name: formData.name,
          phone: formData.phone
        },
        null,
        t("updateSuccess") || "تم تحديث البيانات بنجاح!" // رسالة النجاح
      );
      
      // إعادة جلب البيانات لتحديث واجهة المستخدم (الاسم والصورة الخ)
      if (refetch) refetch();
      
    } catch (error) {
      // الـ Hook سيعالج عرض رسالة الخطأ
      
    }
  };

  // شاشة تحميل أثناء جلب البيانات الأساسية
  if (isFetching || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-950">
        <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen px-4 py-12 overflow-hidden transition-colors duration-300 bg-gray-50 dark:bg-zinc-950">
      
      {/* Ambient Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-yellow-400/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-yellow-500/5 blur-[130px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white">
              {t("profile")}
            </h1>
            <p className="mt-2 font-medium text-gray-500 dark:text-zinc-400">
              {t("manageProfile") }
            </p>
          </div>
          <button className="p-3 text-gray-500 transition-all bg-white border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-2xl hover:border-yellow-400 dark:text-zinc-400">
            <Settings size={24} />
          </button>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* Left Column: Avatar Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6 lg:col-span-1"
          >
            <div className="p-8 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white dark:border-zinc-800/50 rounded-[2.5rem] shadow-xl text-center">
              
          

              {/* User Info & Verification */}
              <div className="flex items-center justify-center gap-2 mt-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{userData.name}</h3>
                {userData.isVerified && (
                  <BadgeCheck size={20} className="text-blue-500"  />
                )}
              </div>
              <p className="mt-1 text-sm font-medium text-gray-500 dark:text-zinc-400">
                {userData.location?.city}, {userData.location?.country}
              </p>

              {/* Wallet Balance Badge */}
            
              <div className="flex items-center justify-center gap-2 mt-4">
  <Link 
    href={basePath+"/wallet"} // عدل المسار ده بناءً على مسار صفحة المحفظة عندك
    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-yellow-700 transition-all bg-yellow-400/20 hover:bg-yellow-400/30 active:scale-95 rounded-2xl dark:text-yellow-400 group"
  >
    <Wallet size={18} />
    <span dir="ltr">{walletBalance} {t("currency")}</span>
    
    {/* أيقونة صغيرة بتظهر إن في أكشن أو شحن */}
    <div className="flex items-center justify-center w-5 h-5 transition-colors bg-yellow-500 rounded-full text-zinc-900 group-hover:bg-yellow-400 ms-2">
      <Plus size={14} strokeWidth={3} />
    </div>
  </Link>
</div>
              
              <div className="pt-8 mt-8 space-y-3 border-t border-gray-100 dark:border-zinc-800">
                <button 
                onClick={()=>{
logout();
                  redirect("/")
                }}
                className="flex items-center justify-center w-full gap-2 py-3 font-bold text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl">
                  <LogOut size={18} />
                  {t("logout") }
                </button>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Settings Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="p-8 sm:p-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white dark:border-zinc-800/50 rounded-[2.5rem] shadow-xl">
              <form className="space-y-6" onSubmit={handleSubmit}>
                
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Name Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-zinc-300 ms-1">
                      {t("fullName")}
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-4">
                        <User size={18} className="text-gray-400 group-focus-within:text-yellow-500" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full py-4 transition-all border-2 border-transparent outline-none bg-gray-100/50 dark:bg-zinc-800/40 rounded-2xl ps-11 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:border-yellow-400"
                      />
                    </div>
                  </div>

                  {/* Email Input (Disabled) */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-zinc-300 ms-1">
                      {t("email") }
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

                  {/* Phone Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-zinc-300 ms-1">
                      {t("phone") }
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-4">
                        <Phone size={18} className="text-gray-400 group-focus-within:text-yellow-500" />
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full py-4 transition-all border-2 border-transparent outline-none bg-gray-100/50 dark:bg-zinc-800/40 rounded-2xl ps-11 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:border-yellow-400"
                      />
                    </div>
                  </div>

                  {/* Address Input (Disabled / ReadOnly) */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-zinc-300 ms-1">
                      {t("address")}
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-4">
                        <MapPin size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="address"
                        disabled
                        value={formData.address}
                        className="w-full py-4 text-gray-400 border-2 border-transparent cursor-not-allowed bg-gray-100/30 dark:bg-zinc-800/20 rounded-2xl ps-11"
                      />
                    </div>
                  </div>
                </div>

                {/* Security Section */}
                <div className="pt-6 border-t border-gray-100 dark:border-zinc-800">
                  <h4 className="flex items-center gap-2 mb-4 font-bold text-gray-900 dark:text-white">
                    <Shield size={18} className="text-yellow-500" />
                    {t("security")}
                  </h4>
                  <button type="button" className="text-sm font-bold text-yellow-600 dark:text-yellow-400 hover:underline">
                    {t("changePassword")}
                  </button>
                </div>

                {/* Save Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={isUpdating}
                  type="submit"
                  className="flex items-center justify-center w-full gap-2 py-4 mt-4 font-black text-gray-900 transition-all bg-yellow-400 shadow-xl rounded-2xl hover:bg-yellow-500 shadow-yellow-400/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isUpdating ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Save size={20} />
                  )}
                  {isUpdating ? (t("saving")) : (t("saveChanges") )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}