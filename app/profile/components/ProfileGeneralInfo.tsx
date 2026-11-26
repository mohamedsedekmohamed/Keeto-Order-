"use client";

import type { ChangeEvent, FormEvent } from "react";
import { motion } from "framer-motion";
import { Loader2, Mail, Phone, Save, User } from "lucide-react";

type Translate = (key: string) => string | undefined;

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  alternatePhone: string;
}

interface ProfileGeneralInfoProps {
  formData: ProfileFormData;
  isUpdating: boolean;
  t: Translate;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onPhoneChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function ProfileGeneralInfo({
  formData,
  isUpdating,
  t,
  onChange,
  onPhoneChange,
  onSubmit,
}: ProfileGeneralInfoProps) {
  return (
    <div className="p-6 sm:p-8 mt-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white dark:border-zinc-800/50 rounded-[2.5rem] shadow-xl space-y-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        {t("editProfile") || "تعديل البيانات الأساسية"}
      </h3>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 ms-1">
              {t("fullName") || "الاسم الكامل"}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-3">
                <User
                  size={16}
                  className="text-gray-400 group-focus-within:text-yellow-500"
                />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={onChange}
                required
                className="w-full py-3 text-sm transition-all border-2 border-transparent outline-none bg-gray-100/50 dark:bg-zinc-800/40 rounded-xl ps-10 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:border-yellow-400"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 ms-1">
              {t("email") || "البريد الإلكتروني"}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-3">
                <Mail size={16} className="text-gray-400" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full py-3 text-sm transition-all border-2 border-transparent outline-none bg-gray-200/60 dark:bg-zinc-800/20 text-gray-500 dark:text-zinc-500 rounded-xl ps-10 cursor-not-allowed select-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 ms-1">
              {t("phone") || "رقم الهاتف"}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-3">
                <Phone
                  size={16}
                  className="text-gray-400 group-focus-within:text-yellow-500"
                />
              </div>
              <input
                type="tel"
                name="phone"
                required
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={11}
                value={formData.phone}
                onChange={onPhoneChange}
                className="w-full py-3 text-sm transition-all border-2 border-transparent outline-none bg-gray-100/50 dark:bg-zinc-800/40 rounded-xl ps-10 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:border-yellow-400"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 ms-1">
              {t("alternatePhone") || "رقم هاتف بديل"}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-3">
                <Phone
                  size={16}
                  className="text-gray-400 group-focus-within:text-yellow-500"
                />
              </div>
              <input
                type="tel"
                name="alternatePhone"
                required
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={11}
                value={formData.alternatePhone}
                onChange={onPhoneChange}
                className="w-full py-3 text-sm transition-all border-2 border-transparent outline-none bg-gray-100/50 dark:bg-zinc-800/40 rounded-xl ps-10 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:border-yellow-400"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isUpdating}
            type="submit"
            className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-black text-gray-900 transition-all bg-yellow-400 shadow-lg rounded-xl hover:bg-yellow-500 shadow-yellow-400/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {isUpdating
              ? t("saving") || "جاري الحفظ..."
              : t("saveChanges") || "حفظ التغييرات"}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
