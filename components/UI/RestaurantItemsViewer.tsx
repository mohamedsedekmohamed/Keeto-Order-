"use client";
import React, { useState, useMemo } from 'react';
import { Search, X, LayoutGrid, Info } from 'lucide-react';
import { MenuItem } from "@/context/RestaurantContext";

export default function RestaurantItemsViewer({ menu }: { menu: Record<string, MenuItem[]> | null, restaurantId: string }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const { dynamicCategories, dynamicItems } = useMemo(() => {
    const cats = [{ id: 'all', name: 'الكل' }];
    const itms: (MenuItem & { categoryId: string })[] = [];
    if (menu) {
      Object.keys(menu).forEach((catName) => {
        cats.push({ id: catName, name: catName });
        menu[catName].forEach((item) => itms.push({ ...item, categoryId: catName }));
      });
    }
    return { dynamicCategories: cats, dynamicItems: itms };
  }, [menu]);

  const filteredItems = dynamicItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.categoryId === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="px-4 py-6 mx-3 text-right" dir="rtl">
        
        {/* البحث */}
        <div className="relative mb-6">
          <input
            type="text"
            className="block w-full px-4 py-3 pr-10 bg-white border border-gray-200 outline-none rounded-xl dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100"
            placeholder="ابحث في القائمة..."
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute top-3.5 right-3 w-5 h-5 text-gray-400" />
        </div>

        {/* التصنيفات */}
        <div className="flex gap-2 pb-4 mb-6 overflow-x-auto no-scrollbar">
          {dynamicCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-2 rounded-full whitespace-nowrap transition-all ${
                activeCategory === cat.id ? 'bg-yellow-400 text-white' : 'bg-white dark:bg-zinc-900 dark:text-zinc-400 border dark:border-zinc-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* المنتجات */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedItem(item)}
              className="flex items-center p-3 transition-shadow bg-white border border-gray-100 cursor-pointer dark:bg-zinc-900 rounded-2xl dark:border-zinc-800 hover:shadow-md"
            >
              <img src={item.image} alt={item.name} className="object-cover w-20 h-20 rounded-xl" />
              <div className="flex-1 mr-4">
                <h3 className="font-bold dark:text-zinc-100">{item.name}</h3>
                <p className="text-xs text-gray-400 line-clamp-1">{item.description}</p>
                <div className="mt-2 font-bold text-yellow-500">{item.price} E£</div>
              </div>
              <Info size={18} className="text-gray-300" />
            </div>
          ))}
        </div>

        {/* تفاصيل المنتج (عرض فقط) */}
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-md overflow-hidden bg-white dark:bg-zinc-900 rounded-3xl">
              <button onClick={() => setSelectedItem(null)} className="absolute z-10 p-2 bg-white rounded-full shadow-lg top-4 right-4">
                <X size={20} />
              </button>
              <img src={selectedItem.image} className="object-cover w-full h-56" />
              <div className="p-6">
                <h2 className="mb-2 text-2xl font-bold dark:text-zinc-100">{selectedItem.name}</h2>
                <p className="mb-4 text-gray-500 dark:text-zinc-400">{selectedItem.description}</p>
                <div className="flex items-center justify-between pt-4 border-t dark:border-zinc-800">
                  <span className="text-2xl font-bold text-yellow-500">{selectedItem.price} E£</span>
                  <span className="text-sm italic text-gray-400">العرض فقط</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}