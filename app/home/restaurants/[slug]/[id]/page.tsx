// "use client";

// import { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { FileText, UtensilsCrossed, ShoppingCart, Star, X } from "lucide-react";
// import Link from "next/link";
// import { useParams } from "next/navigation";
// import { useLanguage } from "../../../../../context/LanguageContext";
// import { FaApple, FaGooglePlay } from "react-icons/fa";
// import { useRouter } from "next/navigation";
// import Loading from "@/components/Loading";
// import { useRestaurant } from "@/context/RestaurantContext";
// import usePost from "@/app/hooks/usePost";

// export default function Home() {
//   const { t } = useLanguage();
//   const params = useParams();
//   const isRTL =
//     typeof window !== "undefined" && document.documentElement.dir === "rtl";
//   const router = useRouter();
//   const restaurantName = params?.slug as string;
//   const restaurantId = params?.id as string ;
//   const basePath = `/home/restaurants/${restaurantName}`;
//   const token =
//     typeof window !== "undefined" ? localStorage.getItem("token") : null;

//   const { restaurant, isLoading, isError } = useRestaurant();

//   /* ---------------- RATING LOGIC ---------------- */
//   const [showRating, setShowRating] = useState(false);
//   const [rating, setRating] = useState(0);
//   const [comment, setComment] = useState("");

//   const { postData, loading: isSubmitting } = usePost("/api/user/rating");
//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       localStorage.setItem("lastRestaurantPath", window.location.pathname);
//     }
//   }, []);
//   // Trigger modal on first load of the session
//   useEffect(() => {
//     if (!token || !restaurant?.id) return;

//     const sessionKey = `rating_modal_seen_${restaurant.id}`;
//     const hasSeen = sessionStorage.getItem(sessionKey);

//     if (hasSeen) return;

//     const timer = setTimeout(() => {
//       setShowRating(true);

//       // ✅ mark as seen immediately
//       sessionStorage.setItem(sessionKey, "true");
//     }, 2000);

//     return () => clearTimeout(timer);
//   }, [restaurant?.id, token]);

//   const handleSubmitRating = async () => {
//     if (rating === 0) return;

//     try {
//       await postData({
//         restaurantId: restaurant?.id,
//         rating,
//         comment,
//       });

//       setShowRating(false);
//       setRating(0);
//       setComment("");
//     } catch (err) {
//       router.push("/auth/sign-in");
//       console.error("Rating submission failed:", err);
//     }
//   };

//   /* ---------------- UI CONFIG ---------------- */
//   const cards = [
//     {
//       title: t("eMenu"),
//       desc: t("eMenuDesc"),
//       icon: FileText,
//       nameToAdd: "/e-menu",
//     },
//     {
//       title: t("menu"),
//       desc: t("menuDesc"),
//       icon: UtensilsCrossed,
//       nameToAdd: "/restaurant",
//     },
//   ];

//   if (isLoading) return <Loading />;
//   if (isError)
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         Error loading restaurant data.
//       </div>
//     );

//   return (
//     <div className="relative flex flex-col items-center min-h-screen overflow-hidden bg-white dark:bg-zinc-950">
//       {/* COVER */}
//       {restaurant?.cover && (
//         <div className="relative w-full h-48 md:h-64 overflow-hidden">
//           <img
//             src={restaurant.cover}
//             alt="cover"
//             className="object-cover w-full h-full"
//           />
//           <div className="absolute inset-0 bg-black/30" />
//         </div>
//       )}

//       {/* Restaurant Info */}
//       <motion.div
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="flex flex-col items-center text-center px-6"
//       >
//         {restaurant?.logo && (
//           <div className="relative -mt-20 mb-4 overflow-hidden border-4 border-white shadow-xl w-24 h-24 rounded-3xl dark:border-zinc-800 bg-gray-50 z-10">
//             <img
//               src={restaurant.logo}
//               alt={restaurant.name}
//               className="object-contain w-full h-full"
//             />
//           </div>
//         )}
//         <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white line-clamp-1">
//           {isRTL ? restaurant?.nameAr : restaurant?.name}
//         </h1>
//       </motion.div>

//       {/* CARDS */}
//       <div className="grid w-full max-w-md grid-cols-2 gap-5 mt-10 px-6">
//         {cards.map((item, i) => {
//           const Icon = item.icon;
//           return (
//             <Link key={i} href={`${basePath}${item.nameToAdd}`}>
//               <motion.div
//                 initial={{ opacity: 0, scale: 0.9 }}
//                 animate={{ opacity: 1, scale: 1 }}
//                 transition={{ delay: i * 0.1 }}
//                 whileHover={{ scale: 1.03, y: -3 }}
//                 className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm dark:bg-zinc-900 dark:border-zinc-800"
//               >
//                 <div className="p-3 rounded-2xl bg-yellow-50 dark:bg-yellow-400/10 w-fit">
//                   <Icon className="text-yellow-500" />
//                 </div>
//                 <h3 className="mt-4 font-bold text-gray-900 dark:text-white">
//                   {item.title}
//                 </h3>
//                 <p className="text-xs text-gray-500 dark:text-zinc-400">
//                   {item.desc}
//                 </p>
//               </motion.div>
//             </Link>
//           );
//         })}
//       </div>

//       {/* ORDER BUTTON */}
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="w-full max-w-md px-6"
//       >
//         <Link
//           href={`${basePath}/restaurant`}
//           className="flex items-center justify-center gap-2 py-3 mt-6 text-base font-bold text-gray-900 bg-yellow-400 rounded-xl hover:bg-yellow-500"
//         >
//           <ShoppingCart size={18} />
//           {t("orderNow")}
//         </Link>
//       </motion.div>

//       {/* APP BUTTONS */}
//       <div className="grid grid-cols-2 gap-4 mt-4 w-full max-w-md px-6 mb-10">
//         <div className="flex items-center justify-center gap-2 py-4 text-white bg-black rounded-2xl shadow-lg cursor-pointer">
//           <FaApple className="w-6 h-6" />
//           <div className="flex flex-col items-start leading-tight">
//             <span className="text-[10px] opacity-70">Download on</span>
//             <span className="text-sm font-bold">{t("appStore")}</span>
//           </div>
//         </div>
//         <div className="flex items-center justify-center gap-2 py-4 bg-white border border-gray-200 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm cursor-pointer">
//           <FaGooglePlay className="w-5 h-5 text-green-500" />
//           <div className="flex flex-col items-start leading-tight">
//             <span className="text-[10px] text-gray-500">Get it on</span>
//             <span className="text-sm font-bold dark:text-zinc-300">
//               {t("googlePlay")}
//             </span>
//           </div>
//         </div>
//       </div>

//       {/* ---------------- RATING MODAL ---------------- */}
//       <AnimatePresence>
//         {showRating && (
//           <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
//             <motion.div
//               initial={{ scale: 0.9, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               exit={{ scale: 0.9, opacity: 0 }}
//               className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl"
//             >
//               <div className="flex justify-between mb-4 items-center">
//                 <h2 className="font-bold text-lg dark:text-white">
//                   {t("Enjoying your visit?")}
//                 </h2>
//                 <button
//                   onClick={() => setShowRating(false)}
//                   className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
//                 >
//                   <X size={20} className="dark:text-white" />
//                 </button>
//               </div>

//               <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">
//                 {t("Kindly rate your last order")}
//               </p>

//               {/* STARS */}
//               <div className="flex justify-center gap-3 mb-6">
//                 {[1, 2, 3, 4, 5].map((num) => (
//                   <button key={num} onClick={() => setRating(num)}>
//                     <Star
//                       className={`w-10 h-10 transition-all ${
//                         num <= rating
//                           ? "fill-yellow-400 text-yellow-400 scale-110"
//                           : "text-gray-300 dark:text-zinc-700"
//                       }`}
//                     />
//                   </button>
//                 ))}
//               </div>

//               {/* COMMENT FIELD */}
//               <div className="mb-6">
//                 <textarea
//                   placeholder={t("Leave a comment")}
//                   value={comment}
//                   onChange={(e) => setComment(e.target.value)}
//                   className="w-full p-4 text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-yellow-400 focus:outline-none dark:text-white resize-none h-24"
//                 />
//               </div>

//               <button
//                 onClick={handleSubmitRating}
//                 disabled={isSubmitting || rating === 0}
//                 className={`w-full py-3 text-white font-bold rounded-2xl transition-colors ${
//                   isSubmitting || rating === 0
//                     ? "bg-gray-300 dark:bg-zinc-800 cursor-not-allowed"
//                     : "bg-yellow-400 hover:bg-yellow-500 shadow-lg shadow-yellow-400/20"
//                 }`}
//               >
//                 {isSubmitting ? t("Submitting...") : t("Submit Rating")}
//               </button>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, UtensilsCrossed, ShoppingCart, Star, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "../../../../../context/LanguageContext";
import { FaApple, FaGooglePlay } from "react-icons/fa";
import Loading from "@/components/Loading";
import { useRestaurant } from "@/context/RestaurantContext";
import usePost from "@/app/hooks/usePost";

export default function Home() {
  const { t } = useLanguage();
  const params = useParams();
  const isRTL = typeof window !== "undefined" && document.documentElement.dir === "rtl";
  const router = useRouter();
  
  const restaurantName = params?.slug as string;
  const basePath = `/home/restaurants/${restaurantName}`;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const { restaurant, isLoading, isError } = useRestaurant();

  /* ---------------- RATING LOGIC ---------------- */
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const { postData, loading: isSubmitting } = usePost("/api/user/rating");

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lastRestaurantPath", window.location.pathname);
    }
  }, []);

  // Trigger modal on first load of the session
  useEffect(() => {
    if (!token || !restaurant?.id) return;

    const sessionKey = `rating_modal_seen_${restaurant.id}`;
    const hasSeen = sessionStorage.getItem(sessionKey);

    if (hasSeen) return;

    const timer = setTimeout(() => {
      setShowRating(true);
      sessionStorage.setItem(sessionKey, "true");
    }, 2000);

    return () => clearTimeout(timer);
  }, [restaurant?.id, token]);

  const handleSubmitRating = async () => {
    if (rating === 0) return;

    try {
      await postData({
        restaurantId: restaurant?.id,
        rating,
        comment,
      });

      setShowRating(false);
      setRating(0);
      setComment("");
    } catch (err) {
      router.push("/auth/sign-in");
      console.error("Rating submission failed:", err);
    }
  };

  /* ---------------- UI CONFIG ---------------- */
  const cards = [
    {
      title: t("eMenu"),
      desc: t("eMenuDesc"),
      icon: FileText,
      nameToAdd: "/e-menu",
    },
    {
      title: t("menu"),
      desc: t("menuDesc"),
      icon: UtensilsCrossed,
      nameToAdd: "/restaurant",
    },
  ];

  if (isLoading) return <Loading />;
  if (isError)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Error loading restaurant data.
      </div>
    );

  return (
    <div className="relative flex flex-col items-center min-h-screen overflow-hidden bg-white dark:bg-zinc-950">
      {/* COVER */}
      {restaurant?.cover && (
        <div className="relative w-full h-48 md:h-64 overflow-hidden">
          <img
            src={restaurant.cover}
            alt="cover"
            className="object-cover w-full h-full"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      )}

      {/* Restaurant Info */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center px-6"
      >
        {restaurant?.logo && (
          <div className="relative -mt-20 mb-4 overflow-hidden border-4 border-white shadow-xl w-24 h-24 rounded-3xl dark:border-zinc-800 bg-gray-50 z-10">
            <img
              src={restaurant.logo}
              alt={restaurant.name}
              className="object-contain w-full h-full"
            />
          </div>
        )}
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white line-clamp-1">
          {isRTL ? restaurant?.nameAr : restaurant?.name}
        </h1>
      </motion.div>

      {/* CARDS */}
      <div className="grid w-full max-w-md grid-cols-2 gap-5 mt-10 px-6">
        {cards.map((item, i) => {
          const Icon = item.icon;
          return (
            <Link key={i} href={`${basePath}${item.nameToAdd}`}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.03, y: -3 }}
                className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm dark:bg-zinc-900 dark:border-zinc-800"
              >
                <div className="p-3 rounded-2xl bg-yellow-50 dark:bg-yellow-400/10 w-fit">
                  <Icon className="text-yellow-500" />
                </div>
                <h3 className="mt-4 font-bold text-gray-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  {item.desc}
                </p>
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* ORDER BUTTON */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md px-6"
      >
        <Link
          href={`${basePath}/restaurant`}
          className="flex items-center justify-center gap-2 py-3 mt-6 text-base font-bold text-gray-900 bg-yellow-400 rounded-xl hover:bg-yellow-500"
        >
          <ShoppingCart size={18} />
          {t("orderNow")}
        </Link>
      </motion.div>

      {/* APP BUTTONS */}
      <div className="grid grid-cols-2 gap-4 mt-4 w-full max-w-md px-6 mb-10">
        <div className="flex items-center justify-center gap-2 py-4 text-white bg-black rounded-2xl shadow-lg cursor-pointer">
          <FaApple className="w-6 h-6" />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[10px] opacity-70">Download on</span>
            <span className="text-sm font-bold">{t("appStore")}</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 py-4 bg-white border border-gray-200 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm cursor-pointer">
          <FaGooglePlay className="w-5 h-5 text-green-500" />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[10px] text-gray-500">Get it on</span>
            <span className="text-sm font-bold dark:text-zinc-300">
              {t("googlePlay")}
            </span>
          </div>
        </div>
      </div>

      {/* ---------------- RATING MODAL ---------------- */}
      <AnimatePresence>
        {showRating && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex justify-between mb-4 items-center">
                <h2 className="font-bold text-lg dark:text-white">
                  {t("Enjoying your visit?")}
                </h2>
                <button
                  onClick={() => setShowRating(false)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  <X size={20} className="dark:text-white" />
                </button>
              </div>

              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">
                {t("Kindly rate your last order")}
              </p>

              {/* STARS */}
              <div className="flex justify-center gap-3 mb-6">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button key={num} onClick={() => setRating(num)}>
                    <Star
                      className={`w-10 h-10 transition-all ${
                        num <= rating
                          ? "fill-yellow-400 text-yellow-400 scale-110"
                          : "text-gray-300 dark:text-zinc-700"
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* COMMENT FIELD */}
              <div className="mb-6">
                <textarea
                  placeholder={t("Leave a comment")}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-4 text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-yellow-400 focus:outline-none dark:text-white resize-none h-24"
                />
              </div>

              <button
                onClick={handleSubmitRating}
                disabled={isSubmitting || rating === 0}
                className={`w-full py-3 text-white font-bold rounded-2xl transition-colors ${
                  isSubmitting || rating === 0
                    ? "bg-gray-300 dark:bg-zinc-800 cursor-not-allowed"
                    : "bg-yellow-400 hover:bg-yellow-500 shadow-lg shadow-yellow-400/20"
                }`}
              >
                {isSubmitting ? t("Submitting...") : t("Submit Rating")}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}