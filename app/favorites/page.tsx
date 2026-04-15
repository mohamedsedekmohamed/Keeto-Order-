"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Trash2, ShoppingCart, Star, Search, Ghost } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function FavoritesPage() {
  const { t } = useLanguage();
  
  // بيانات تجريبية (Mock Data)
  const [favorites, setFavorites] = useState([
    { id: 1, name: "Premium Coffee Beans", price: "24.00", rating: 4.8, image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&q=80" },
    { id: 2, name: "Minimalist Watch", price: "120.00", rating: 4.9, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80" },
    { id: 3, name: "Wireless Headphones", price: "85.00", rating: 4.7, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80" },
  ]);

  const removeFavorite = (id) => {
    setFavorites(favorites.filter(item => item.id !== id));
  };

  return (
    <div className="relative min-h-screen px-4 py-12 overflow-hidden transition-colors duration-300 bg-gray-50 dark:bg-zinc-950">
      
      {/* الخلفية الجمالية */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-yellow-400/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col justify-between gap-6 mb-12 md:flex-row md:items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="flex items-center gap-3 text-4xl font-black text-gray-900 dark:text-white">
              <Heart className="text-yellow-400 fill-yellow-400" size={36} />
              {t("myFavorites") || "المفضلات"}
            </h1>
            <p className="mt-2 font-medium text-gray-500 dark:text-zinc-400">
              {favorites.length} {t("itemsSaved") || "عناصر تم حفظها في قائمتك"}
            </p>
          </motion.div>

          {/* Search in Favorites */}
          <div className="relative max-w-sm group">
            <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-4">
              <Search size={18} className="text-gray-400 group-focus-within:text-yellow-500" />
            </div>
            <input
              type="text"
              placeholder={t("searchInFavorites") || "بحث في المفضلات..."}
              className="w-full py-3 transition-all bg-white border-2 border-transparent shadow-sm outline-none dark:bg-zinc-900 rounded-2xl ps-11 pe-4 dark:text-white focus:border-yellow-400"
            />
          </div>
        </div>

        {/* Favorites Grid */}
        <AnimatePresence mode="popLayout">
          {favorites.length > 0 ? (
            <motion.div 
              layout
              className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
            >
              {favorites.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  className="group relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white dark:border-zinc-800/50 rounded-[2.5rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  {/* Image Container */}
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 transition-opacity opacity-0 bg-gradient-to-t from-black/60 to-transparent group-hover:opacity-100" />
                    
                    {/* Delete Button */}
                    <button 
                      onClick={() => removeFavorite(item.id)}
                      className="absolute p-3 text-red-500 transition-all transform shadow-lg top-4 right-4 bg-white/90 dark:bg-zinc-800/90 rounded-2xl backdrop-blur-md hover:bg-red-500 hover:text-white hover:rotate-12"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-1 font-bold text-yellow-500">
                        <Star size={16} className="fill-yellow-500" />
                        <span className="text-sm">{item.rating}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-6">
                      <span className="text-2xl font-black text-gray-900 dark:text-white">
                        ${item.price}
                      </span>
                      <button className="flex items-center gap-2 px-5 py-3 font-bold text-gray-900 transition-all bg-yellow-400 shadow-lg hover:bg-yellow-500 rounded-2xl shadow-yellow-400/20 active:scale-95">
                        <ShoppingCart size={18} />
                        {t("addToCart") || "أضف للسلة"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            /* Empty State */
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-32 h-32 bg-gray-100 dark:bg-zinc-900 rounded-[2.5rem] flex items-center justify-center mb-6">
                <Ghost size={64} className="text-gray-300 dark:text-zinc-700" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t("noFavorites") || "قائمة المفضلات فارغة"}
              </h2>
              <p className="mt-2 text-gray-500 dark:text-zinc-400">
                {t("startAdding") || "ابدأ بإضافة المنتجات التي تعجبك لتظهر هنا."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}