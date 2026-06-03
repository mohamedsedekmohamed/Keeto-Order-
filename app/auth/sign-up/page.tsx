"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  UserPlus,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Phone,
} from "lucide-react";
import { useLanguage } from "../../../context/LanguageContext";
import Link from "next/link";
import usePost from "@/app/hooks/usePost";
import { useRouter } from "next/navigation";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useToken } from "@/context/TokenContext";

function SignUpForm() {
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { setToken } = useToken();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    address: "",
  });

  const isRtl = typeof document !== "undefined" && document.dir === "rtl";

  // 1. Credentials Sign Up API Call
  const { postData: signupWithCredentials, loading: isSubmitting } = usePost(
    "/api/user/auth/signup",
  );

  // 2. Google Sign Up API Call
  const { postData: signupWithGoogle, loading: isGoogleSubmitting } = usePost(
    "/api/user/auth/google",
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await signupWithCredentials(formData, null, t("signupSuccess"));
      // Redirect credentials signup to sign-in since they still need to authenticate
      router.push("/auth/sign-in");
    } catch (error) {
      // Handled globally
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen px-4 py-12 overflow-hidden transition-colors duration-300 bg-gray-50 dark:bg-zinc-950">
      {/* Background Glow effects */}
      <div className="absolute top-[-5%] left-[-5%] w-[500px] h-[500px] bg-yellow-400/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[500px] h-[500px] bg-yellow-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Card Wrapper */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-2xl p-8 sm:p-12 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white dark:border-zinc-800/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] rounded-[3rem] z-10"
      >
        {/* Top Accent Bar */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-yellow-400 rounded-b-full shadow-[0_2px_10px_rgba(250,204,21,0.4)]"></div>

        {/* Back Button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute flex items-center gap-2 text-sm font-bold text-gray-600 transition-all left-6 top-6 dark:text-zinc-300 hover:text-yellow-500"
        >
          <ArrowRight size={18} className={`${isRtl ? "" : "rotate-180"}`} />
          {t("back") || "Back"}
        </button>

        {/* Header Header */}
        <div className="mb-8 text-center mt-4">
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
            {t("joinUsSubtitle")}
          </p>
        </div>

        {/* Traditional Credentials Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Name Field */}
            <div>
              <label className="block mb-1.5 text-sm font-bold text-gray-700 ms-1 dark:text-zinc-300">
                {t("name")}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-4">
                  <User
                    size={20}
                    className="text-gray-400 transition-colors group-focus-within:text-yellow-500"
                  />
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

            {/* Phone Field */}
            <div>
              <label className="block mb-1.5 text-sm font-bold text-gray-700 ms-1 dark:text-zinc-300">
                {t("phone")}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-4">
                  <Phone
                    size={20}
                    className="text-gray-400 transition-colors group-focus-within:text-yellow-500"
                  />
                </div>
                <input
                  type="text"
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

          {/* Email Field */}
          <div>
            <label className="block mb-1.5 text-sm font-bold text-gray-700 ms-1 dark:text-zinc-300">
              {t("email")}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-4">
                <Mail
                  size={20}
                  className="text-gray-400 transition-colors group-focus-within:text-yellow-500"
                />
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

          {/* Password Field */}
          <div>
            <label className="block mb-1.5 text-sm font-bold text-gray-700 ms-1 dark:text-zinc-300">
              {t("password")}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-4">
                <Lock
                  size={20}
                  className="text-gray-400 transition-colors group-focus-within:text-yellow-500"
                />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
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

          {/* Core Sign Up Submission Trigger */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting || isGoogleSubmitting}
            className="relative flex items-center justify-center w-full py-4.5 mt-6 overflow-hidden font-black text-gray-900 transition-all bg-yellow-400 rounded-2xl hover:bg-yellow-500 shadow-xl shadow-yellow-400/20 group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span className="flex items-center gap-2">
              {isSubmitting ? t("loading") : t("signUp")}
              {!isSubmitting && (
                <ArrowRight
                  size={20}
                  className={`transition-transform ${isRtl ? "group-hover:-translate-x-1 rotate-180" : "group-hover:translate-x-1"}`}
                />
              )}
            </span>
          </motion.button>
        </form>

        {/* Separator UI Line */}
        <div className="relative flex items-center my-6">
          <div className="flex-grow border-t border-gray-200 dark:border-zinc-800"></div>
          <span className="flex-shrink mx-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
            {isRtl ? "أو سجل عبر" : "Or Register Via"}
          </span>
          <div className="flex-grow border-t border-gray-200 dark:border-zinc-800"></div>
        </div>

        {/* Managed Google Identity SDK Button Wrapper */}
        <div className="flex justify-center w-full transform scale-105">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                if (credentialResponse.credential) {
                  const response = await signupWithGoogle(
                    { token: credentialResponse.credential },
                    null,
                    t("signupSuccess"),
                  );

                  const token =
                    response?.token ||
                    response?.data?.token ||
                    response?.data?.data?.token;

                  if (token) {
                    setToken(token);
                    
                    let redirectPath = "/";
                    if (typeof window !== "undefined") {
                      // Lookup redirect path based on the dynamic active tab restaurant slug key setup
                      const activeSlug = localStorage.getItem("lastActiveRestaurantSlug");
                      if (activeSlug) {
                        redirectPath = localStorage.getItem(`lastRestaurantPath-${activeSlug}`) || `/home/restaurants/${activeSlug}`;
                      } else {
                        redirectPath = localStorage.getItem("lastRestaurantPath") || "/";
                      }
                    }
                    
                    router.push(redirectPath);
                  } else {
                    router.push("/auth/sign-in");
                  }
                }
              } catch (error) {
                // Handled globally
              }
            }}
            onError={() => {
              console.error("Google authentication failed");
            }}
            shape="pill"
            theme={
              typeof window !== "undefined" &&
              document.documentElement.classList.contains("dark")
                ? "filled_blue"
                : "outline"
            }
            width="100%"
          />
        </div>

        {/* Form Footer Switcher */}
        <div className="mt-10 text-center">
          <p className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
            {t("haveAccount")}{" "}
            <Link
              href="/auth/sign-in"
              className="inline-block text-yellow-600 transition-all dark:text-yellow-400 hover:underline underline-offset-4"
            >
              {t("signIn")}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function SignUp() {
  return (
    <GoogleOAuthProvider clientId="798541723323-gt1bh29472nra4ujivcsnnc9f662gr08.apps.googleusercontent.com">
      <SignUpForm />
    </GoogleOAuthProvider>
  );
}