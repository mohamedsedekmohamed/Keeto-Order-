"use client";

import React, { useState, useEffect } from 'react';
import { useRestaurant, useMenu } from "@/context/RestaurantContext";
import { useLanguage } from "@/context/LanguageContext";
import { 
  Phone, 
  MapPin, 
  Globe, 
  ArrowLeft, 
  LayoutGrid,
  Info,
  ChevronLeft,
  Share2
} from "lucide-react";
import { FaInstagramSquare } from "react-icons/fa";

export default function RestaurantLinkPage() {
  const { language } = useLanguage();
  const { restaurant, isLoading: restaurantLoading } = useRestaurant();
  const { menu, isLoading: menuLoading } = useMenu();
  
  const [view, setView] = useState<'links' | 'menu'>('links');
  const [activeCategory, setActiveCategory] = useState<string>("");

  // الثيم الافتراضي (تقدر تغيره بناءً على داتا المطعم)
  const theme = {
    primary: "#facc15", // الأصفر بتاعك
    secondary: "#09090b", // الخلفية السوداء
    accent: "#27272a" // الزنك
  };

  useEffect(() => {
    if (menu && Object.keys(menu).length > 0 && !activeCategory) {
      setActiveCategory(Object.keys(menu)[0]);
    }
  }, [menu, activeCategory]);

  if (restaurantLoading || menuLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#09090b]">
        <div className="w-12 h-12 border-t-2 border-yellow-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  const categories = menu ? Object.keys(menu) : [];
  const isRtl = language === 'ar';

  return (
    // حقن متغيرات الثيم هنا
    <div 
      style={{ '--primary-color': theme.primary } as React.CSSProperties}
      className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-[var(--primary-color)]/30 overflow-hidden flex flex-col"
    >
      
      {/* --- 1. الغلاف (Fixed height) --- */}
      <div className="relative w-full h-56 overflow-hidden shrink-0 md:h-72">
        <img 
          src={restaurant?.cover || "/default-cover.jpg"} 
          className="object-cover w-full h-full transition-transform duration-700 hover:scale-105"
          alt="cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#09090b]"></div>
        
        <div className={`absolute top-6 px-6 w-full flex justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
            <button className="bg-black/40 backdrop-blur-xl p-2.5 rounded-full border border-white/10">
                <Share2 size={20} />
            </button>
            {view === 'menu' && (
                <button 
                  onClick={() => setView('links')}
                  className="bg-[var(--primary-color)] text-black p-2.5 rounded-full shadow-2xl hover:scale-110 active:scale-90 transition-all"
                >
                  <ArrowLeft size={22} className={isRtl ? 'rotate-180' : ''} />
                </button>
            )}
        </div>
      </div>

      {/* --- 2. الهوية (Logo & Info) --- */}
      <div className="relative z-10 flex flex-col items-center px-6 -mt-16 shrink-0">
        <div className="relative group">
            <div className="absolute transition duration-1000 bg-[var(--primary-color)] rounded-full -inset-1 blur opacity-20 group-hover:opacity-40"></div>
            <div className="relative w-32 h-32 rounded-full border-[5px] border-[#09090b] overflow-hidden bg-zinc-900 shadow-2xl">
                <img src={restaurant?.logo || "/default-logo.png"} className="object-cover w-full h-full" alt="logo" />
            </div>
        </div>
        <h1 className="mt-3 text-2xl font-black text-center">{isRtl ? restaurant?.nameAr : restaurant?.name}</h1>
        <p className="text-zinc-500 text-sm mt-1 flex items-center gap-1.5">
            <MapPin size={12} className="text-[var(--primary-color)]" />
            {isRtl ? restaurant?.addressAr : restaurant?.address}
        </p>
      </div>

      {/* --- 3. الجسم القابل للتمرير (Main Content with Scroll) --- */}
      <div className="flex-1 px-6 pb-10 mt-6 overflow-y-auto no-scrollbar">
        <div className="max-w-xl mx-auto">
          
          {view === 'links' ? (
            <div className="space-y-4 duration-500 animate-in fade-in zoom-in-95">
              <button 
                onClick={() => setView('menu')}
                className="w-full py-5 bg-[var(--primary-color)] hover:brightness-110 text-black rounded-[2rem] font-black text-lg shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                <LayoutGrid size={22} />
                {isRtl ? "تصفح المنيو" : "Browse Menu"}
              </button>

              <div className="space-y-3">
                  <ContactItem icon={<Phone size={20} />} title={isRtl ? "اطلب الآن" : "Call Us"} value={restaurant?.ownerPhone} href={`tel:${restaurant?.ownerPhone}`} isRtl={isRtl} />
                  <ContactItem icon={<FaInstagramSquare size={20} />} title={isRtl ? "تابعنا" : "Instagram"} value={restaurant?.name} href="#" isRtl={isRtl} />
                  <ContactItem icon={<Globe size={20} />} title={isRtl ? "الموقع" : "Website"} value={restaurant?.email?.split('@')[0]} href="#" isRtl={isRtl} />
              </div>
            </div>
          ) : (
            <div className="duration-500 animate-in slide-in-from-bottom-5">
              {/* Category Pills - Sticky within the scroll area */}
              <div className="sticky top-0 z-20 flex gap-2 py-3 mb-6 overflow-x-auto no-scrollbar bg-[#09090b]/80 backdrop-blur-md">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-6 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                      activeCategory === cat 
                      ? 'bg-[var(--primary-color)] border-[var(--primary-color)] text-black' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Products List Area */}
              <div className="h-full space-y-4">
                 {menu && menu[activeCategory]?.map((item: any) => (
                    <div key={item.id} className={`bg-zinc-900/40 border border-zinc-800/50 p-3 rounded-[1.8rem] flex items-center gap-4 group ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <div className="w-20 h-20 rounded-[1.2rem] overflow-hidden shrink-0">
                            <img src={item.image} className="object-cover w-full h-full group-hover:scale-110 transition-duration-500" alt={item.name} />
                        </div>
                        <div className={`flex-1 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
                            <h3 className="text-md font-bold group-hover:text-[var(--primary-color)] transition-colors">{item.name}</h3>
                            <p className="text-[10px] text-zinc-500 line-clamp-1">{item.description}</p>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-lg font-black text-[var(--primary-color)] italic">{item.price} <small className="text-[9px] not-italic">EGP</small></span>
                                <button className="p-1.5 rounded-full bg-zinc-800 text-zinc-400">
                                    <Info size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- Footer (Fixed) --- */}
      <footer className="shrink-0 py-4 text-center border-t border-zinc-900 bg-[#09090b]">
          <p className="text-zinc-600 text-[9px] uppercase tracking-widest font-bold">
            Powered by <span className="text-[var(--primary-color)]">Keeto Ecosystem</span>
          </p>
      </footer>
    </div>
  );
}

function ContactItem({ icon, title, value, href, isRtl }: any) {
    return (
        <a href={href} className={`flex items-center justify-between p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl hover:border-zinc-700 transition-all group ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className="bg-zinc-800 p-2 rounded-xl text-[var(--primary-color)] group-hover:bg-[var(--primary-color)] group-hover:text-black transition-all">
                {icon}
            </div>
            <div className="flex-1 px-4 text-center">
                <p className="text-[9px] text-zinc-600 font-black uppercase mb-0.5">{title}</p>
                <p className="text-sm font-bold text-zinc-300">{value}</p>
            </div>
            <ChevronLeft size={18} className={`${isRtl ? 'rotate-0' : 'rotate-180'} text-zinc-700 group-hover:text-[var(--primary-color)]`} />
        </a>
    );
}