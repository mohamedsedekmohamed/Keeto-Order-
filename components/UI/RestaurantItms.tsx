"use client";
import React, { useState, useMemo } from 'react';
import { Search, Plus, X, Minus, LayoutGrid, Heart } from 'lucide-react';
import { useAppDispatch } from "@/redux/hooks";
import { addToCartLocal } from "@/redux/cartSlice"; 
import usePost from "@/app/hooks/usePost"; 
import { MenuItem, Variation, VariationOption } from "@/context/RestaurantContext";
export default function RestaurantItms({ 
  menu, 
  restaurantId 
}: { 
  menu: Record<string, MenuItem[]> | null, 
  restaurantId: string 
}) {
  const dispatch = useAppDispatch();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [favorites, setFavorites] = useState<string[]>([]); 
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});

  // Hooks لطلبات الـ API
  const { postData: addToCartApi, loading: addingToCart } = usePost("/api/user/cart");
  const { postData: toggleFav } = usePost('/api/user/favlist/toggle');

  const { dynamicCategories, dynamicItems } = useMemo(() => {
    const cats = [{ id: 'all', name: 'الكل' }];
    const itms: (MenuItem & { categoryId: string })[] = [];

    if (menu) {
      Object.keys(menu).forEach((categoryName) => {
        cats.push({ id: categoryName, name: categoryName });
        menu[categoryName].forEach((item) => {
          itms.push({ ...item, categoryId: categoryName });
        });
      });
    }
    return { dynamicCategories: cats, dynamicItems: itms };
  }, [menu]);

  const filteredItems = dynamicItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.categoryId === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setQuantity(1);
    
    const initialOptions: Record<string, string[]> = {};
    item.variations?.forEach(variation => {
      if (variation.selectionType === 'single' && variation.isRequired && variation.options.length > 0) {
        initialOptions[variation.id] = [variation.options[0].id];
      } else {
        initialOptions[variation.id] = [];
      }
    });
    setSelectedOptions(initialOptions);
  };

  const handleOptionSelect = (variation: Variation, option: VariationOption) => {
    setSelectedOptions(prev => {
      const currentSelections = prev[variation.id] || [];
      if (variation.selectionType === 'single') {
        return { ...prev, [variation.id]: [option.id] };
      } else {
        const isCurrentlySelected = currentSelections.includes(option.id);
        let newSelections = [];
        if (isCurrentlySelected) {
          newSelections = currentSelections.filter(id => id !== option.id);
        } else {
          if (variation.max === null || currentSelections.length < variation.max) {
            newSelections = [...currentSelections, option.id];
          } else {
            newSelections = currentSelections; 
          }
        }
        return { ...prev, [variation.id]: newSelections };
      }
    });
  };

  const calculateTotalPrice = () => {
    if (!selectedItem) return 0;
    let totalBase = parseFloat(selectedItem.price || "0");
    Object.entries(selectedOptions).forEach(([variationId, optionIds]) => {
      const variation = selectedItem.variations?.find(v => v.id === variationId);
      if (variation) {
        optionIds.forEach(optId => {
          const option = variation.options.find(o => o.id === optId);
          if (option) totalBase += parseFloat(option.additionalPrice || "0");
        });
      }
    });
    return totalBase * quantity;
  };

  const handleToggleFavorite = async (e: React.MouseEvent, foodId: string) => {
    e.stopPropagation(); 
    const isCurrentlyFavorite = favorites.includes(foodId);
    setFavorites((prev) => isCurrentlyFavorite ? prev.filter((id) => id !== foodId) : [...prev, foodId]);

    try {
      await toggleFav({ foodId }, null, isCurrentlyFavorite ? "تمت الإزالة من المفضلة" : "تمت الإضافة للمفضلة");
    } catch (error) {
       setFavorites((prev) => isCurrentlyFavorite ? [...prev, foodId] : prev.filter((id) => id !== foodId));
    }
  };

  // دالة الإضافة للسلة عبر الـ API
  const handleAddToCartSubmit = async () => {
    if (!selectedItem) return;

    try {
      // 1. تجهيز الـ variations بالشكل الذي يطلبه الباك إند
      const formattedVariations = Object.entries(selectedOptions).flatMap(([varId, optIds]) => 
        optIds.map(optId => ({ variationId: varId, optionId: optId }))
      );

      const body = {
        foodId: selectedItem.id,
        quantity: quantity,
        variations: formattedVariations
      };

      // 2. إرسال الطلب للسيرفر
      const response = await addToCartApi(body, null, "تمت الإضافة للسلة بنجاح");

      // 3. تحديث Redux إذا السيرفر أرجع بيانات العنصر المُضاف
      if (response && response.data) {
         dispatch(addToCartLocal(response.data));
      } else {
         console.warn("API succeeded but didn't return cart item data to update Redux.");
      }

      setSelectedItem(null);
    } catch (error) {
      // رسالة الخطأ يتم التعامل معها في الـ hook تلقائياً
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-300 bg-gray-50 dark:bg-zinc-950">
      <div className="px-4 py-6 mx-3 text-right" dir="rtl">
        
        {/* شريط البحث */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 flex items-center pointer-events-none right-3">
            <Search className="w-5 h-5 text-gray-400 dark:text-zinc-500" />
          </div>
          <input
            type="text"
            className="block w-full py-3 pl-4 pr-10 text-gray-900 transition-all bg-white border border-gray-200 outline-none dark:border-zinc-800 rounded-xl dark:bg-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-400"
            placeholder="ابحث في القائمة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* الفئات */}
        <div className="flex gap-2 pb-4 mb-6 overflow-x-auto no-scrollbar scroll-smooth">
          {dynamicCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                activeCategory === cat.id 
                ? 'bg-yellow-400 text-white shadow-md transform scale-105' 
                : 'bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* العرض الديناميكي - الشبكات والوجبات */}
        <div className="space-y-4">
          {activeCategory === 'all' && !searchQuery ? (
            <div>
              <h2 className="mb-4 text-xl font-bold text-gray-800 dark:text-zinc-100">تصفح القائمة</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {dynamicCategories.filter(c => c.id !== 'all').map((cat) => {
                  const itemCount = dynamicItems.filter(i => i.categoryId === cat.id).length;
                  return (
                    <div 
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className="flex flex-col items-center justify-center p-6 transition-all bg-white border border-gray-100 shadow-sm cursor-pointer dark:bg-zinc-900 rounded-2xl dark:border-zinc-800 hover:shadow-md hover:-translate-y-1 group"
                    >
                      <div className="flex items-center justify-center w-16 h-16 mb-4 transition-colors rounded-full bg-yellow-50 dark:bg-yellow-900/20 group-hover:bg-yellow-100 dark:group-hover:bg-yellow-900/40">
                        <LayoutGrid className="w-8 h-8 text-yellow-500" />
                      </div>
                      <h3 className="font-bold text-center text-gray-900 dark:text-zinc-100">{cat.name}</h3>
                      <span className="mt-2 text-xs text-gray-400 dark:text-zinc-500">{itemCount} منتج</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-zinc-100">
                  {searchQuery ? 'نتائج البحث' : dynamicCategories.find(c => c.id === activeCategory)?.name}
                </h2>
                <span className="text-sm text-gray-400 dark:text-zinc-500">({filteredItems.length}) منتج</span>
              </div>

              {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {filteredItems.map((item) => {
                    const isFavorite = favorites.includes(item.id);
                    return (
                      <div 
                        key={item.id} 
                        onClick={() => handleItemClick(item)}
                        className="relative flex items-center p-3 transition-all bg-white border border-gray-100 shadow-sm cursor-pointer dark:bg-zinc-900 rounded-2xl dark:border-zinc-800 hover:shadow-md group"
                      >
                        <div className="relative flex-shrink-0 w-24 h-24 overflow-hidden rounded-xl">
                          <img src={item.image} alt={item.name} className="object-cover w-full h-full transition-transform group-hover:scale-110" />
                        </div>
                        <div className="flex flex-col justify-between flex-1 h-full mr-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="ml-6 font-bold text-gray-900 dark:text-zinc-100">{item.name}</h3>
                              <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500 line-clamp-2">{item.description || item.name}</p>
                            </div>
                            <button
                              onClick={(e) => handleToggleFavorite(e, item.id)}
                              className="absolute top-3 left-3 p-1.5 transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full z-10"
                            >
                              <Heart size={18} className={`transition-colors ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-400 dark:text-zinc-500"}`} />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <span className="font-bold text-yellow-500">{item.price} E£</span>
                            <div className="p-2 text-white transition-colors bg-gray-900 dark:bg-yellow-400 dark:text-zinc-900 rounded-xl">
                              <Plus size={18} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-zinc-600">
                  <Search size={48} className="mb-2 opacity-20" />
                  <p>لم نجد شيئاً بهذا الاسم</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Popup */}
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity">
            <div className="relative w-full max-w-lg overflow-hidden duration-300 bg-white border-t flex flex-col max-h-[90vh] dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl animate-in slide-in-from-bottom dark:border-zinc-800 sm:border-none">
              
              <button onClick={() => setSelectedItem(null)} className="absolute z-10 p-2 rounded-full shadow-lg top-4 right-4 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md">
                <X size={20} className="text-gray-800 dark:text-zinc-100" />
              </button>

              <div className="w-full h-48 overflow-hidden sm:h-64 shrink-0">
                <img src={selectedItem.image} alt={selectedItem.name} className="object-cover w-full h-full" />
              </div>

              {/* قسم التمرير (Scrollable Area) */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{selectedItem.name}</h2>
                  <span className="text-xl font-bold text-yellow-500">{selectedItem.price} E£</span>
                </div>
                
                {selectedItem.description && (
                  <div className="mb-6">
                    <p className="text-sm leading-relaxed text-gray-500 dark:text-zinc-400">{selectedItem.description}</p>
                  </div>
                )}

                {/* قسم عرض الإضافات (Variations) */}
                {selectedItem.variations && selectedItem.variations.length > 0 && (
                  <div className="mb-6 space-y-6">
                    {selectedItem.variations.map((variation) => (
                      <div key={variation.id} className="pt-4 border-t dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-gray-800 dark:text-zinc-200">
                            {variation.name} 
                            {variation.isRequired && <span className="mx-2 text-xs text-red-500">(مطلوب)</span>}
                          </h4>
                          <span className="text-xs text-gray-400">
                            {variation.selectionType === 'single' ? "اختر 1" : (variation.max ? `الحد الأقصى ${variation.max}` : "اختياري")}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          {variation.options.map((option) => {
                            const isSelected = (selectedOptions[variation.id] || []).includes(option.id);
                            return (
                              <label key={option.id} className="flex items-center justify-between p-3 transition-colors border border-gray-100 rounded-lg cursor-pointer dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                                <div className="flex items-center gap-3">
                                  <input
                                    type={variation.selectionType === 'single' ? "radio" : "checkbox"}
                                    name={variation.name}
                                    checked={isSelected}
                                    onChange={() => handleOptionSelect(variation, option)}
                                    className="w-4 h-4 accent-yellow-500"
                                  />
                                  <span className={`text-sm ${isSelected ? 'font-bold text-gray-900 dark:text-zinc-100' : 'text-gray-600 dark:text-zinc-400'}`}>
                                    {option.name}
                                  </span>
                                </div>
                                {parseFloat(option.additionalPrice) > 0 && (
                                  <span className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                                    + {option.additionalPrice} E£
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 bg-white border-t dark:bg-zinc-900 dark:border-zinc-800 shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold tracking-wider text-yellow-500 uppercase">الإجمالي:</span>
                    <span className="text-2xl font-black text-gray-900 dark:text-zinc-100">
                      {calculateTotalPrice().toFixed(2)} E£
                    </span>
                  </div>

                  <div className="flex items-center gap-4 p-1 border bg-gray-50 dark:bg-zinc-800 rounded-2xl dark:border-zinc-700">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex items-center justify-center w-10 h-10 text-gray-600 bg-white shadow-sm rounded-xl dark:bg-zinc-700 dark:text-zinc-200">
                      <Minus size={18} />
                    </button>
                    <span className="w-4 text-lg font-bold text-center dark:text-zinc-100">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="flex items-center justify-center w-10 h-10 text-white bg-yellow-400 shadow-md rounded-xl shadow-yellow-400/20">
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                {/* زر الإضافة للسلة يستخدم الدالة الجديدة */}
                <button 
                  disabled={addingToCart}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-yellow-400/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                  onClick={handleAddToCartSubmit}
                >
                  {addingToCart ? "جاري الإضافة..." : "إضافة للسلة"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}