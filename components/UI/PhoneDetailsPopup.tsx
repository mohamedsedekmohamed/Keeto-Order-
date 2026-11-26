"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import usePut from "@/app/hooks/usePut";
import toast from "react-hot-toast";

interface PhoneDetailsPopupProps {
  initialPhone: string;
  initialAlternatePhone: string;
  onSuccess: () => void | Promise<void>;
}

export default function PhoneDetailsPopup({
  initialPhone,
  initialAlternatePhone,
  onSuccess,
}: PhoneDetailsPopupProps) {
  const { t } = useLanguage();
  const { putData: postProfile, loading: isSavingProfile } =
    usePut("/api/user/profile");

  const [phone, setPhone] = useState(initialPhone);
  const [alternatePhone, setAlternatePhone] = useState(initialAlternatePhone);

  const inputClass =
    "w-full p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all text-zinc-900 dark:text-white text-sm";

  const phoneRegex = /^01\d{9}$/;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value.replace(/\D/g, "").slice(0, 11));
  };

  const handleAlternatePhoneChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setAlternatePhone(e.target.value.replace(/\D/g, "").slice(0, 11));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedPhone = phone.trim();
    const trimmedAlternatePhone = alternatePhone.trim();

    if (!trimmedPhone || !trimmedAlternatePhone) {
      return toast.error(
        t("dir") === "rtl"
          ? "يرجى إدخال رقم الهاتف ورقم الهاتف البديل."
          : "Please enter both your phone and alternate phone numbers.",
      );
    }

    if (!phoneRegex.test(trimmedPhone)) {
      return toast.error(
        t("dir") === "rtl"
          ? "رقم الهاتف يجب أن يتكون من 11 رقمًا ويبدأ بـ 01"
          : "Phone number must be 11 digits and start with 01.",
      );
    }

    if (!phoneRegex.test(trimmedAlternatePhone)) {
      return toast.error(
        t("dir") === "rtl"
          ? "رقم الهاتف البديل يجب أن يتكون من 11 رقمًا ويبدأ بـ 01"
          : "Alternate phone number must be 11 digits and start with 01.",
      );
    }

    try {
      await postProfile(
        { phone: trimmedPhone, alternatePhone: trimmedAlternatePhone },
        null,
        t("dir") === "rtl"
          ? "تم تحديث بيانات الهاتف بنجاح"
          : "Phone details updated successfully",
      );
      await onSuccess();
    } catch {
      // Error toast already handled inside usePut.
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      dir={t("dir")}
    >
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl scale-100 duration-200 animate-in zoom-in-95">
        <div className="mb-6">
          <h2 className="text-xl font-bold dark:text-white mb-1">
            {t("dir") === "rtl"
              ? "استكمال بيانات الهاتف"
              : "Complete Your Phone Details"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {t("dir") === "rtl"
              ? "يرجى إدخال رقم هاتفك ورقم هاتف بديل لإتمام عملية الطلب."
              : "Please add a phone number and an alternate phone number to continue with checkout."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {t("dir") === "rtl" ? "رقم الهاتف" : "Phone Number"}
            </label>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={11}
              value={phone}
              onChange={handlePhoneChange}
              placeholder={
                t("dir") === "rtl" ? "أدخل رقم الهاتف" : "Enter phone number"
              }
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {t("dir") === "rtl"
                ? "رقم الهاتف البديل"
                : "Alternate Phone Number"}
            </label>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={11}
              value={alternatePhone}
              onChange={handleAlternatePhoneChange}
              placeholder={
                t("dir") === "rtl"
                  ? "أدخل رقم الهاتف البديل"
                  : "Enter alternate phone number"
              }
              className={inputClass}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSavingProfile}
            className="w-full py-3.5 mt-2 font-bold text-theme-first-text bg-yellow-400 rounded-xl hover:bg-yellow-500 disabled:opacity-70 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {isSavingProfile && <Loader2 size={16} className="animate-spin" />}
            {isSavingProfile
              ? t("dir") === "rtl"
                ? "جاري الحفظ..."
                : "Saving..."
              : t("dir") === "rtl"
                ? "حفظ ومتابعة"
                : "Save & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
