"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRestaurant, useMenu } from "@/context/RestaurantContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  Phone,
  MapPin,
  Globe,
  ArrowLeft,
  Info,
  ChevronLeft,
  Share2,
  X,
} from "lucide-react";
import { FaInstagramSquare } from "react-icons/fa";

interface FoodItem {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  image: string;
}

interface MenuCategory {
  name: string;
  foods: FoodItem[];
}

interface ContactItemProps {
  icon: React.ReactNode;
  title: string;
  value: string | undefined;
  href: string;
  isRtl: boolean;
}

export default function RestaurantLinkPage() {
  const { language } = useLanguage();
  const { restaurant, isLoading: restaurantLoading } = useRestaurant();
  const { menu, isLoading: menuLoading } = useMenu() as {
    menu: MenuCategory[] | null;
    isLoading: boolean;
  };

  const [view, setView] = useState<"links" | "menu">("menu");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null); // State for the detail card modal

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const categoryBarRef = useRef<HTMLDivElement | null>(null);
  const isManualClick = useRef(false);

  const theme = {
    primary: "#facc15",
    secondary: "#09090b",
    accent: "#27272a",
  };

  const categories = useMemo(
    () => (menu ? menu.map((c) => c.name) : []),
    [menu],
  );

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    if (view !== "menu" || categories.length === 0) return;

    const timer = setTimeout(() => {
      const handleIntersect = (entries: IntersectionObserverEntry[]) => {
        if (isManualClick.current) return;

        const visibleEntry = entries.find((e) => e.isIntersecting);
        if (visibleEntry) {
          setActiveCategory(visibleEntry.target.id);

          const activeTab = document.getElementById(
            `pill-${visibleEntry.target.id}`,
          );
          if (activeTab && categoryBarRef.current) {
            categoryBarRef.current.scrollTo({
              left:
                activeTab.offsetLeft -
                categoryBarRef.current.offsetWidth / 2 +
                activeTab.offsetWidth / 2,
              behavior: "smooth",
            });
          }
        }
      };

      const observer = new IntersectionObserver(handleIntersect, {
        root: null,
        rootMargin: "-120px 0px -70% 0px",
        threshold: 0,
      });

      Object.values(sectionRefs.current).forEach((section) => {
        if (section) observer.observe(section);
      });

      return () => observer.disconnect();
    }, 100);

    return () => clearTimeout(timer);
  }, [view, categories]);

  const scrollToCategory = (catId: string) => {
    setActiveCategory(catId);
    isManualClick.current = true;

    setTimeout(() => {
      const element = sectionRefs.current[catId];
      if (element) {
        const offset = 120;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const offsetPosition = elementRect - bodyRect - offset;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      }
      setTimeout(() => {
        isManualClick.current = false;
      }, 800);
    }, 120);
  };

  if (restaurantLoading || menuLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#09090b]">
        <div className="w-12 h-12 border-t-2 border-yellow-400 rounded-full animate-spin" />
      </div>
    );
  }

  const isRtl = language === "العربية";

  return (
    <div
      style={{ "--primary-color": theme.primary } as React.CSSProperties}
      className="min-h-screen bg-white dark:bg-[#09090b] text-gray-900 dark:text-white font-sans selection:bg-[var(--primary-color)]/30 flex flex-col"
    >
      <div className="relative w-full h-56 overflow-hidden shrink-0 md:h-72">
        <img
          src={restaurant?.cover || "/default-cover.jpg"}
          className="object-cover w-full h-full transition-transform duration-700 hover:scale-105"
          alt="cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-white dark:to-[#09090b]" />
        <div
          className={`absolute top-6 px-6 w-full flex justify-between items-center ${isRtl ? "flex-row-reverse" : ""}`}
        >
          <button className="bg-black/40 backdrop-blur-xl p-2.5 rounded-full border border-white/10 text-white">
            <Share2 size={20} />
          </button>
          {view === "links" && (
            <button
              onClick={() => setView("menu")}
              className="bg-[var(--primary-color)] text-black p-2.5 rounded-full shadow-2xl hover:scale-110 active:scale-90 transition-all"
            >
              <ArrowLeft size={22} className={isRtl ? "rotate-180" : ""} />
            </button>
          )}
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 -mt-16 shrink-0">
        <div className="relative group">
          <div className="absolute transition duration-1000 bg-[var(--primary-color)] rounded-full -inset-1 blur opacity-20 group-hover:opacity-40" />
          <div className="relative w-32 h-32 rounded-full border-[5px] border-white dark:border-[#09090b] overflow-hidden bg-zinc-100 dark:bg-zinc-900 shadow-2xl">
            <img
              src={restaurant?.logo || "/default-logo.png"}
              className="object-contain w-full h-full"
              alt="logo"
            />
          </div>
        </div>
        <h1 className="mt-3 text-2xl font-black text-center text-gray-900 dark:text-white">
          {isRtl ? restaurant?.nameAr : restaurant?.name}
        </h1>
        <p className="text-zinc-500 text-sm mt-1 flex items-center gap-1.5">
          <MapPin size={12} className="text-[var(--primary-color)]" />
          {isRtl ? restaurant?.addressAr : restaurant?.address}
        </p>
      </div>

      <div className="flex-1 px-6 pb-10 mt-6">
        <div className="max-w-xl mx-auto">
          {view === "menu" ? (
            <div className="duration-500 animate-in slide-in-from-bottom-5">
              <button
                onClick={() => setView("links")}
                className="w-full mb-6 py-4 bg-zinc-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white rounded-2xl font-bold text-sm shadow-sm flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                <Phone size={18} className="text-[var(--primary-color)]" />
                {isRtl ? "روابط التواصل والطلب" : "Contact & Social Links"}
              </button>

              <div
                ref={categoryBarRef}
                className="sticky top-0 z-20 flex gap-2 py-3 mb-6 overflow-x-auto no-scrollbar bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md"
              >
                {categories.map((cat) => (
                  <button
                    id={`pill-${cat}`}
                    key={cat}
                    onClick={() => scrollToCategory(cat)}
                    className={`px-6 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                      activeCategory === cat
                        ? "bg-[var(--primary-color)] border-[var(--primary-color)] text-black scale-105 shadow-md"
                        : "bg-gray-100 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-zinc-500"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="space-y-12">
                {categories.map((cat) => {
                  const items =
                    menu?.find((category) => category.name === cat)?.foods ||
                    [];
                  if (items.length === 0) return null;

                  return (
                    <div
                      key={cat}
                      id={cat}
                      ref={(el) => {
                        sectionRefs.current[cat] = el;
                      }}
                      className="scroll-mt-32"
                    >
                      <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-zinc-800 pb-2">
                        <h2 className="text-lg font-black text-gray-900 dark:text-white">
                          {cat}
                        </h2>
                        <span className="text-xs text-gray-400 dark:text-zinc-500">
                          ({items.length}) {isRtl ? "منتج" : "items"}
                        </span>
                      </div>

                      <div className="space-y-4">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => setSelectedItem(item)} // Open card modal on container click
                            className={`bg-gray-50 dark:bg-zinc-900/40 border border-gray-200 dark:border-zinc-800/50 p-3 rounded-[1.8rem] flex items-center gap-4 group hover:shadow-md cursor-pointer transition-all ${isRtl ? "flex-row-reverse" : ""}`}
                          >
                            <div className="w-20 h-20 rounded-[1.2rem] overflow-hidden shrink-0">
                              <img
                                src={item.image}
                                className="object-contain w-full h-full group-hover:scale-110 transition-transform duration-500"
                                alt={item.name}
                              />
                            </div>
                            <div
                              className={`flex-1 ${isRtl ? "text-right" : "text-left"}`}
                              dir={isRtl ? "rtl" : "ltr"}
                            >
                              <h3 className="text-md font-bold text-gray-900 dark:text-white group-hover:text-[var(--primary-color)] transition-colors">
                                {isRtl ? item.nameAr : item.name}
                              </h3>
                              <p className="text-[10px] text-gray-400 dark:text-zinc-500 line-clamp-1">
                                {isRtl ? item.descriptionAr : item.description}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-lg font-black text-[var(--primary-color)] italic">
                                  {item.price}{" "}
                                  <small className="text-[9px] not-italic">
                                    EGP
                                  </small>
                                </span>
                                <button className="p-1.5 rounded-full bg-gray-200 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-[var(--primary-color)] hover:text-black transition-all">
                                  <Info size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4 duration-500 animate-in fade-in zoom-in-95">
              <div className="space-y-3">
                <ContactItem
                  icon={<Phone size={20} />}
                  title={isRtl ? "اطلب الآن" : "Call Us"}
                  value={restaurant?.ownerPhone}
                  href={`tel:${restaurant?.ownerPhone}`}
                  isRtl={isRtl}
                />
                <ContactItem
                  icon={<FaInstagramSquare size={20} />}
                  title={isRtl ? "تابعنا" : "Instagram"}
                  value={restaurant?.name}
                  href="#"
                  isRtl={isRtl}
                />
                <ContactItem
                  icon={<Globe size={20} />}
                  title={isRtl ? "الموقع" : "Website"}
                  value={
                    restaurant?.email ? restaurant.email.split("@")[0] : "visit"
                  }
                  href="#"
                  isRtl={isRtl}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="shrink-0 py-4 text-center border-t border-gray-100 dark:border-zinc-900 bg-white dark:bg-[#09090b]">
        <p className="text-gray-400 dark:text-zinc-600 text-[9px] uppercase tracking-widest font-bold">
          Powered by{" "}
          <span className="text-[var(--primary-color)]">Keeto Ecosystem</span>
        </p>
      </footer>

      {/* Item Details Card Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 duration-300 animate-in fade-in"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className={`w-full sm:max-w-md bg-white dark:bg-[#0c0c0e] border border-gray-100 dark:border-zinc-800/80 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl transform transition-transform duration-300 animate-in slide-in-from-bottom sm:zoom-in-95 ${isRtl ? "text-right" : "text-left"}`}
            dir={isRtl ? "rtl" : "ltr"}
            onClick={(e) => e.stopPropagation()} // Stop click through to overlay close
          >
            {/* Header/Image container */}
            <div className="relative h-64 w-full bg-zinc-50 dark:bg-zinc-950/50 flex items-center justify-center p-6 border-b border-gray-100 dark:border-zinc-900">
              <button
                onClick={() => setSelectedItem(null)}
                className={`absolute top-4 z-10 bg-black/40 dark:bg-zinc-900/80 backdrop-blur-md text-white p-2.5 rounded-full hover:scale-105 active:scale-95 transition-all ${isRtl ? "left-4" : "right-4"}`}
              >
                <X size={18} />
              </button>
              <img
                src={selectedItem.image}
                alt={isRtl ? selectedItem.nameAr : selectedItem.name}
                className="max-h-full max-w-full object-contain drop-shadow-xl"
              />
            </div>

            {/* Content Details */}
            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white">
                  {isRtl ? selectedItem.nameAr : selectedItem.name}
                </h2>
                <span className="inline-block mt-2 text-xl font-black text-[var(--primary-color)] italic">
                  {selectedItem.price}{" "}
                  <span className="text-xs not-italic font-bold text-gray-400 dark:text-zinc-500">
                    EGP
                  </span>
                </span>
              </div>

              <div className="border-t border-gray-100 dark:border-zinc-900 pt-3">
                <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                  {isRtl ? "الوصف" : "Description"}
                </p>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-zinc-400 whitespace-pre-line">
                  {(isRtl
                    ? selectedItem.descriptionAr
                    : selectedItem.description) ||
                    (isRtl
                      ? "لا يوجد وصف متاح لهذا المنتج."
                      : "No description available for this item.")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ContactItem({ icon, title, value, href, isRtl }: ContactItemProps) {
  return (
    <a
      href={href}
      className={`flex items-center justify-between p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl hover:border-zinc-700 transition-all group ${isRtl ? "flex-row-reverse" : ""}`}
    >
      <div className="bg-zinc-800 p-2 rounded-xl text-[var(--primary-color)] group-hover:bg-[var(--primary-color)] group-hover:text-black transition-all">
        {icon}
      </div>
      <div className="flex-1 px-4 text-center">
        <p className="text-[9px] text-zinc-600 font-black uppercase mb-0.5">
          {title}
        </p>
        <p className="text-sm font-bold text-zinc-300">{value}</p>
      </div>
      <ChevronLeft
        size={18}
        className={`${isRtl ? "rotate-0" : "rotate-180"} text-zinc-700 group-hover:text-[var(--primary-color)]`}
      />
    </a>
  );
}
