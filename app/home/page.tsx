"use client";

import { motion } from "framer-motion";
import { RefreshCw, Utensils, LayoutGrid, Store, ChevronRight } from "lucide-react";
import useGet from "../../hooks/useGet"; 
import { useLanguage } from "../../context/LanguageContext";
import Loading from "@/components/Loading";
import Image from "next/image";
import Link from "next/link";
// --- Interfaces لتعريف هيكل البيانات ---
interface Cuisine {
  id: string;
  name: string;
  image: string;
}

interface Category {
  id: string;
  name: string;
  image: string;
}

// 1. إضافة واجهة بيانات المطاعم
interface Restaurant {
  id: string;
  name: string;
  cover: string;
  logo: string;
  address: string;
  minDeliveryTime: string;
}

interface HomeData {
  success: boolean;
  data: {
    data: {
      cuisines: Cuisine[];
      categories: Category[];
      restaurants: Restaurant[]; // تم التحديث هنا
    };
  };
}

export default function HomePage() {
  const { t } = useLanguage();
  const isRtl = typeof document !== 'undefined' && document.dir === 'rtl';

  // ربط الـ API بالنوع المخصص
  const { data, loading, error, refetch } = useGet<HomeData>("/api/user/home");

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center bg-gray-50 dark:bg-zinc-950">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-xl border border-red-100 dark:border-red-900/20"
        >
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 text-red-500 bg-red-100 dark:bg-red-500/10 rounded-2xl">
            <RefreshCw size={32} />
          </div>
          <p className="mb-6 font-bold text-gray-900 dark:text-white">{error}</p>
          <button 
            onClick={refetch}
            className="flex items-center gap-2 px-8 py-3 mx-auto font-black text-gray-900 transition-all bg-yellow-400 shadow-lg rounded-2xl hover:bg-yellow-500 shadow-yellow-400/20"
          >
            <RefreshCw size={18} />
            إعادة المحاولة
          </button>
        </motion.div>
      </div>
    );
  }

  const content = data?.data?.data;

  return (
    <div className="relative min-h-screen px-4 py-8 pb-24 overflow-hidden transition-colors duration-300 bg-gray-50 dark:bg-zinc-950">
      
      {/* Background Ambient Orb */}
      <div className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] bg-yellow-400/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-14">
        
        {/* Header */}
        <header className="flex flex-col gap-2">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-black text-gray-900 dark:text-white"
          >
            {t("hello")} <span className="text-yellow-400">👋</span>
          </motion.h1>
          <p className="font-medium text-gray-500 dark:text-zinc-400">
            {t("welcomeBack")}
          </p>
        </header>

        {/* 1. Cuisines Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-black text-gray-900 dark:text-white">
              <Utensils size={24} className="text-yellow-400" />
              {t("cuisines") || "المطابخ الشهيرة"}
            </h2>
          </div>
          
          <div className="flex gap-6 pb-4 overflow-x-auto no-scrollbar scroll-smooth">
            {content?.cuisines?.map((cuisine, index) => (
                        <Link 
      key={cuisine.id} 
      href={`/home/cuisines/${cuisine.id}`}
      className="block"
    >
      
              <motion.div
                key={cuisine.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex-shrink-0 group"
              >
                <div className="relative w-40 h-48 rounded-[2.5rem] overflow-hidden shadow-lg group-hover:shadow-yellow-400/20 transition-all duration-500">
                  <Image
                    fill 
                    sizes="(max-width: 768px) 100vw, 160px"
                    src={cuisine.image} 
                    alt={cuisine.name}
                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 flex items-end justify-center p-4 bg-gradient-to-t from-black/90 via-black/20 to-transparent">
                    <span className="font-bold tracking-wide text-center text-white">{cuisine.name}</span>
                  </div>
                </div>
              </motion.div>
              </Link>
            ))}
          </div>
        </section>

        {/* 2. Categories Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-black text-gray-900 dark:text-white">
              <LayoutGrid size={24} className="text-yellow-400" />
              {t("categories") || "التصنيفات"}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {content?.categories?.map((category, index) => (
               <Link 
      key={category.id} 
      href={`/home/categories/${category.id}`}
      className="block"
    >
      
              <motion.div
                key={category.id}
                whileHover={{ y: -8 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="relative p-6 bg-white dark:bg-zinc-900 border border-white dark:border-zinc-800 rounded-[2rem] shadow-sm hover:shadow-2xl transition-all text-center group overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-12 h-12 bg-yellow-400/5 rounded-bl-[2rem] group-hover:bg-yellow-400 transition-colors duration-500" />
                <div className="relative z-10 flex items-center justify-center w-16 h-16 mx-auto mb-4 overflow-hidden rounded-2xl bg-gray-50 dark:bg-zinc-800">
                  <Image 
                    fill 
                    sizes="(max-width: 768px) 100vw, 160px"
                    src={category.image} 
                    alt={category.name}
                    className="object-cover w-full h-full transition-transform group-hover:scale-110"
                  />
                </div>
                <h3 className="font-bold text-gray-800 transition-colors dark:text-white group-hover:text-yellow-500">
                  {category.name}
                </h3>
              </motion.div>
                  </Link>

            ))}
          </div>
        </section>

        {/* 3. Restaurants Section (تم تحديث هذا الجزء بالكامل) */}
        <section className="space-y-6">
          <h2 className="flex items-center gap-2 text-2xl font-black text-gray-900 dark:text-white">
            <Store size={24} className="text-yellow-400" />
            {t("restaurants") || "المطاعم"}
          </h2>
          
          {content?.restaurants?.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-zinc-800"
            >
              <p className="text-lg font-bold text-gray-400 dark:text-zinc-500">
               {t("noRestaurants")}
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
               {content?.restaurants?.map((restaurant, index) => (
                <Link 
      key={restaurant.id} 
      href={`/home/restaurants/${restaurant.id}`}
      className="block"
    >
      
                  <motion.div
                    key={restaurant.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all group cursor-pointer"
                  >
                    {/* Cover Image */}
                    <div className="relative w-full bg-gray-100 h-44 dark:bg-zinc-800">
                      <Image
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        src={restaurant.cover}
                        alt={`${restaurant.name} cover`}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </div>

                    {/* Info Section */}
                    <div className="relative p-6 pt-10">
                      
                      {/* Logo (Floating over cover) */}
                      <div className="absolute top-[-2.5rem] right-6 w-20 h-20 bg-white dark:bg-zinc-900 rounded-2xl p-1.5 shadow-lg border border-gray-100 dark:border-zinc-700 z-10">
                        <div className="relative w-full h-full overflow-hidden rounded-xl bg-gray-50 dark:bg-zinc-800">
                          <Image
                            fill
                            sizes="80px"
                            src={restaurant.logo}
                            alt={`${restaurant.name} logo`}
                            className="object-cover"
                          />
                        </div>
                      </div>

                      <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white line-clamp-1">
                        {restaurant.name}
                      </h3>
                      
                      <p className="mb-5 text-sm font-medium text-gray-500 dark:text-zinc-400 line-clamp-1">
                        {restaurant.address}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-zinc-800/80">
                        <span className="flex items-center gap-1.5 text-sm font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-400/10 px-3 py-1.5 rounded-xl">
                          ⏱ {restaurant.minDeliveryTime} دقيقة
                        </span>
                        
                        <button className="flex items-center justify-center w-10 h-10 text-gray-400 transition-colors rounded-xl bg-gray-50 dark:bg-zinc-800 group-hover:bg-yellow-400 group-hover:text-gray-900">
                           <ChevronRight size={20} className={isRtl ? "" : "rotate-180"} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                      </Link>

               ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}