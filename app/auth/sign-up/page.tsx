"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Mail, Lock, UserPlus, User, Eye, EyeOff, 
  ArrowRight, Phone, MapPin, Globe, Building2, Map 
} from "lucide-react";
import { useLanguage } from "../../../context/LanguageContext";
import Link from "next/link";
import useGet from "../../../Hooks/useGet"; // تأكد من مسار الـ hook
import usePost from "../../../Hooks/usePost"; // تأكد من مسار الـ hook
import { useRouter } from "next/navigation";

// تعريف واجهات البيانات (Interfaces) لتسهيل التعامل مع TypeScript
interface Location {
  id: string;
  name: string;
  displayName?: string;
  countryId?: string;
  cityId?: string;
}

interface ActiveLocationsResponse {
  success: boolean;
  data: {
    message: string;
    data: {
      countries: Location[];
      cities: Location[];
      zones: Location[];
    };
  };
}

export default function SignUp() {
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
const router = useRouter();
  // حالة الفورم (Form State)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    countryId: "",
    cityId: "",
    zoneId: "",
    address: ""
  });

  const isRtl = typeof document !== 'undefined' && document.dir === 'rtl';

  // 1. جلب بيانات المواقع
  const { data: locationData, loading: loadingLocations } = useGet<ActiveLocationsResponse>('/api/user/auth/active-locations');
  const locations = locationData?.data?.data || { countries: [], cities: [], zones: [] };

  // 2. دوال التصفية (Filtering) للمدن والمناطق المعتمدة على الاختيار السابق
  const filteredCities = useMemo(() => {
    return locations.cities.filter(city => city.countryId === formData.countryId);
  }, [locations.cities, formData.countryId]);

  const filteredZones = useMemo(() => {
    return locations.zones.filter(zone => zone.cityId === formData.cityId);
  }, [locations.zones, formData.cityId]);

  // 3. إرسال البيانات
  const { postData, loading: isSubmitting } = usePost('/api/user/auth/signup');

  // معالجة التغيير في الحقول
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
           

      if (name === 'countryId') {
        newData.cityId = '';
        newData.zoneId = '';
      }
      
      if (name === 'cityId') {
        newData.zoneId = '';
      }
      
      return newData;
    });
  };

  // معالجة الإرسال
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await postData(
        formData, 
        null, 
        t("signupSuccess") 
      );
    router.push("/auth/sign-in");
    
    } catch (error) {
    
      console.error("Signup failed", error);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen px-4 py-12 overflow-hidden transition-colors duration-300 bg-gray-50 dark:bg-zinc-950">
      
      {/* إضاءة خلفية جمالية */}
      <div className="absolute top-[-5%] left-[-5%] w-[500px] h-[500px] bg-yellow-400/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[500px] h-[500px] bg-yellow-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-2xl p-8 sm:p-12 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white dark:border-zinc-800/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] rounded-[3rem] z-10"
      >
        {/* خط ديكوري علوي */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-yellow-400 rounded-b-full shadow-[0_2px_10px_rgba(250,204,21,0.4)]"></div>

        {/* Header */}
        <div className="mb-8 text-center">
          <motion.div 
            initial={{ rotate: -10, scale: 0.5 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 mb-6 text-yellow-600 transition-colors bg-yellow-400/20 rounded-3xl dark:text-yellow-400 dark:bg-yellow-400/10"
          >
            <UserPlus size={32} strokeWidth={2.5} />
          </motion.div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            {t("createAccount")}
          </h2>
          <p className="mt-3 text-base font-medium text-gray-500 dark:text-zinc-400">
            {t("joinUsSubtitle") }
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Name Input */}
            <div>
              <label className="block mb-1.5 text-sm font-bold text-gray-700 ms-1 dark:text-zinc-300">
                {t("name") }
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-4">
                  <User size={20} className="text-gray-400 transition-colors group-focus-within:text-yellow-500" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder={t("enterName") || "John Doe"}
                  className="w-full py-4 text-gray-900 transition-all border-2 border-transparent outline-none bg-gray-100/50 rounded-2xl ps-12 pe-4 dark:bg-zinc-800/40 dark:text-white placeholder:text-gray-400 focus:bg-white dark:focus:bg-zinc-800 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10"
                />
              </div>
            </div>

            {/* Phone Input */}
            <div>
              <label className="block mb-1.5 text-sm font-bold text-gray-700 ms-1 dark:text-zinc-300">
                {t("phone") }
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-4">
                  <Phone size={20} className="text-gray-400 transition-colors group-focus-within:text-yellow-500" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="01000000000"
                  className="w-full py-4 text-gray-900 transition-all border-2 border-transparent outline-none bg-gray-100/50 rounded-2xl ps-12 pe-4 dark:bg-zinc-800/40 dark:text-white placeholder:text-gray-400 focus:bg-white dark:focus:bg-zinc-800 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10"
                />
              </div>
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label className="block mb-1.5 text-sm font-bold text-gray-700 ms-1 dark:text-zinc-300">
              {t("email")}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-4">
                <Mail size={20} className="text-gray-400 transition-colors group-focus-within:text-yellow-500" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder={t("enterEmail")}
                className="w-full py-4 text-gray-900 transition-all border-2 border-transparent outline-none bg-gray-100/50 rounded-2xl ps-12 pe-4 dark:bg-zinc-800/40 dark:text-white placeholder:text-gray-400 focus:bg-white dark:focus:bg-zinc-800 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block mb-1.5 text-sm font-bold text-gray-700 ms-1 dark:text-zinc-300">
              {t("password")}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-4">
                <Lock size={20} className="text-gray-400 transition-colors group-focus-within:text-yellow-500" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder={t("enterPassword")}
                className="w-full py-4 text-gray-900 transition-all border-2 border-transparent outline-none bg-gray-100/50 rounded-2xl ps-12 pe-12 dark:bg-zinc-800/40 dark:text-white placeholder:text-gray-400 focus:bg-white dark:focus:bg-zinc-800 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 flex items-center px-4 text-gray-400 end-0 hover:text-yellow-500"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Country Select */}
            <div>
              <label className="block mb-1.5 text-sm font-bold text-gray-700 ms-1 dark:text-zinc-300">
                {t("country") }
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-4">
                  <Globe size={20} className="text-gray-400 transition-colors group-focus-within:text-yellow-500" />
                </div>
                <select
                  name="countryId"
                  value={formData.countryId}
                  onChange={handleChange}
                  required
                  className="w-full py-4 text-gray-900 transition-all border-2 border-transparent outline-none appearance-none bg-gray-100/50 rounded-2xl ps-12 pe-4 dark:bg-zinc-800/40 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10"
                >
                  <option value="" disabled>{t("selectCountry") }</option>
                  {locations.countries.map(country => (
                    <option key={country.id} value={country.id}>{country.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* City Select */}
            <div>
              <label className="block mb-1.5 text-sm font-bold text-gray-700 ms-1 dark:text-zinc-300">
                {t("city") }
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-4">
                  <Building2 size={20} className="text-gray-400 transition-colors group-focus-within:text-yellow-500" />
                </div>
                <select
                  name="cityId"
                  value={formData.cityId}
                  onChange={handleChange}
                  required
                  disabled={!formData.countryId}
                  className="w-full py-4 text-gray-900 transition-all border-2 border-transparent outline-none appearance-none bg-gray-100/50 rounded-2xl ps-12 pe-4 dark:bg-zinc-800/40 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:bg-white dark:focus:bg-zinc-800 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10"
                >
                  <option value="" disabled>{t("selectCity") }</option>
                  {filteredCities.map(city => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Zone Select */}
            <div>
              <label className="block mb-1.5 text-sm font-bold text-gray-700 ms-1 dark:text-zinc-300">
                {t("zone")}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-4">
                  <Map size={20} className="text-gray-400 transition-colors group-focus-within:text-yellow-500" />
                </div>
                <select
                  name="zoneId"
                  value={formData.zoneId}
                  onChange={handleChange}
                  required
                  disabled={!formData.cityId}
                  className="w-full py-4 text-gray-900 transition-all border-2 border-transparent outline-none appearance-none bg-gray-100/50 rounded-2xl ps-12 pe-4 dark:bg-zinc-800/40 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:bg-white dark:focus:bg-zinc-800 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10"
                >
                  <option value="" disabled>{t("selectZone") }</option>
                  {filteredZones.map(zone => (
                    <option key={zone.id} value={zone.id}>{zone.displayName || zone.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Address Input */}
          <div>
            <label className="block mb-1.5 text-sm font-bold text-gray-700 ms-1 dark:text-zinc-300">
              {t("address") }
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-4">
                <MapPin size={20} className="text-gray-400 transition-colors group-focus-within:text-yellow-500" />
              </div>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                placeholder={t("enterAddress") }
                className="w-full py-4 text-gray-900 transition-all border-2 border-transparent outline-none bg-gray-100/50 rounded-2xl ps-12 pe-4 dark:bg-zinc-800/40 dark:text-white placeholder:text-gray-400 focus:bg-white dark:focus:bg-zinc-800 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10"
              />
            </div>
          </div>

          {/* Sign Up Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting || loadingLocations}
            className="relative flex items-center justify-center w-full py-4.5 mt-6 overflow-hidden font-black text-gray-900 transition-all bg-yellow-400 rounded-2xl hover:bg-yellow-500 shadow-xl shadow-yellow-400/20 group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span className="flex items-center gap-2">
              {isSubmitting ? (t("loading")) : (t("signUp") )}
              {!isSubmitting && (
                <ArrowRight size={20} className={`transition-transform ${isRtl ? 'group-hover:-translate-x-1 rotate-180' : 'group-hover:translate-x-1'}`} />
              )}
            </span>
          </motion.button>
        </form>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
            {t("haveAccount")}{" "}
            <Link href="/auth/sign-in" className="inline-block text-yellow-600 transition-all dark:text-yellow-400 hover:underline underline-offset-4">
              {t("signIn")}
            </Link>
          </p>
        </div>
        
      </motion.div>
    </div>
  );
}