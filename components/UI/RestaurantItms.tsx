"use client";
import React, { useState } from 'react';
import { Search, Plus, ShoppingCart, X, Minus, LayoutGrid } from 'lucide-react';
import { useAppDispatch } from "@/redux/hooks";
import { addToCart } from "@/redux/cartSlice";

const restaurantData = {
  categories: [
    { id: 'all', name: 'الكل' },
    { id: '1', name: 'فطائر حادقة' },
    { id: '2', name: 'أطباق رئيسية وطواجن' },
    { id: '3', name: 'مقبلات ريفية' },
    { id: '4', name: 'فطائر حلوة' },
    { id: '5', name: 'حلويات' },
    { id: '6', name: 'مشروبات' },
  ],
  items: [
    // --- فطائر حادقة (Category 1) ---
    { id: 101, categoryId: '1', name: 'فطيرة مشلتت سادة (كبير)', price: '65 E£', desc: 'فطيرة فلاحي بالسمن البلدي على أصولها، تكفي 3 أفراد', image: '/api/placeholder/150/150' },
    { id: 102, categoryId: '1', name: 'فطيرة بالسجق البلدي', price: '95 E£', desc: 'سجق، فلفل، طماطم، زيتون، وجبنة موتزاريلا', image: '/api/placeholder/150/150' },
    { id: 103, categoryId: '1', name: 'فطيرة مشكل جبن', price: '85 E£', desc: 'رومي، شيدر، كيرى، وموتزاريلا مع فلفل وألوان', image: '/api/placeholder/150/150' },
    { id: 104, categoryId: '1', name: 'فطيرة بسطرمة كيرى', price: '110 E£', desc: 'بسطرمة ممتازة مع قطع الجبنة الكيرى الغنية', image: '/api/placeholder/150/150' },
    { id: 105, categoryId: '1', name: 'فطيرة تونة', price: '90 E£', desc: 'تونة قطع، بصل، فلفل، زيتون، وموتزاريلا', image: '/api/placeholder/150/150' },
    { id: 106, categoryId: '1', name: 'فطيرة سوسيس', price: '80 E£', desc: 'قطع سوسيس مع خلطة الخضروات والجبن', image: '/api/placeholder/150/150' },

    // --- أطباق رئيسية وطواجن (Category 2) ---
    { id: 201, categoryId: '2', name: 'طاجن عكاوي بالبصل', price: '220 E£', desc: 'عكاوي مطبوخة ببطء مع البصل المكرمل في الفرن', image: '/api/placeholder/150/150' },
    { id: 202, categoryId: '2', name: 'حواوشي إسكندراني مخصوص', price: '65 E£', desc: 'لحم بلدي متبل داخل عجينة الفطير المخبوزة', image: '/api/placeholder/150/150' },
    { id: 203, categoryId: '2', name: 'نص فرخة مشوية', price: '140 E£', desc: 'فرخة متبلة بخلطة ملتوت السرية مشوية على الفحم', image: '/api/placeholder/150/150' },
    { id: 204, categoryId: '2', name: 'طاجن مكرونة باللحمة', price: '75 E£', desc: 'مكرونة فرن بالصلصة الحمراء واللحم المفروم البلدي', image: '/api/placeholder/150/150' },
    { id: 205, categoryId: '2', name: 'كفتة مشوية (ربع كيلو)', price: '120 E£', desc: 'كفتة بلدي تقدم مع سلطة طحينة وعيش فلاحي', image: '/api/placeholder/150/150' },
    { id: 206, categoryId: '2', name: 'فتة موزة ضاني', price: '250 E£', desc: 'أرز أبيض، عيش محمص، صلصة ثوم وخل مع موزة ضاني', image: '/api/placeholder/150/150' },

    // --- مقبلات ريفية (Category 3) ---
    { id: 301, categoryId: '3', name: 'عسل نحل بلدي', price: '20 E£', desc: 'عسل نحل طبيعي قطفة أولى', image: '/api/placeholder/150/150' },
    { id: 302, categoryId: '3', name: 'مش فلاحي قديم', price: '15 E£', desc: 'مش أصلي مضاف إليه قطع الشطة والترمس', image: '/api/placeholder/150/150' },
    { id: 303, categoryId: '3', name: 'قشطة بلدي', price: '25 E£', desc: 'قشطة طازجة من قلب الريف', image: '/api/placeholder/150/150' },
    { id: 304, categoryId: '3', name: 'عسل أسود بالطحينة', price: '18 E£', desc: 'عسل قصب أسود خام مع طحينة سمسم', image: '/api/placeholder/150/150' },
    { id: 305, categoryId: '3', name: 'جبنة قريش بالطماطم', price: '20 E£', desc: 'جبنة قريش، زيت زيتون، طماطم، وفلفل أخضر', image: '/api/placeholder/150/150' },
    { id: 306, categoryId: '3', name: 'طبق باذنجان مخلل', price: '10 E£', desc: 'باذنجان مقلي محشو بخلطة الثوم والفلفل الأحمر', image: '/api/placeholder/150/150' },

    // --- فطائر حلوة (Category 4) ---
    { id: 401, categoryId: '4', name: 'فطيرة نوتيلا وبندق', price: '95 E£', desc: 'غارقة في شوكولاتة نوتيلا مع قطع البندق المحمص', image: '/api/placeholder/150/150' },
    { id: 402, categoryId: '4', name: 'فطيرة كرافت بالعسل', price: '80 E£', desc: 'مزيج رائع بين ملوحة الجبنة الكرافت وحلاوة العسل', image: '/api/placeholder/150/150' },
    { id: 403, categoryId: '4', name: 'فطيرة سكر ولبن', price: '40 E£', desc: 'الفطيرة التقليدية الخفيفة بالسكر البودرة واللبن الساخن', image: '/api/placeholder/150/150' },
    { id: 404, categoryId: '4', name: 'فطيرة كاسترد وفواكه', price: '85 E£', desc: 'محشوة كاسترد كريمي ومغطاة بقطع الفواكه الموسمية', image: '/api/placeholder/150/150' },
    { id: 405, categoryId: '4', name: 'فطيرة لوتس', price: '105 E£', desc: 'كريمة لوتس مع قطع بسكويت اللوتس المقرمش', image: '/api/placeholder/150/150' },

    // --- حلويات (Category 5) ---
    { id: 501, categoryId: '5', name: 'أرز بلبن في الفرن', price: '30 E£', desc: 'أرز باللبن والقشطة محمر الوجه في الفرن', image: '/api/placeholder/150/150' },
    { id: 502, categoryId: '5', name: 'طاجن أم علي بالمكسرات', price: '55 E£', desc: 'رقائق، حليب كامل الدسم، قشطة، وفستق وبندق', image: '/api/placeholder/150/150' },
    { id: 503, categoryId: '5', name: 'مهلبية مستكة', price: '25 E£', desc: 'مهلبية باردة بنكهة المستكة اليونانية الأصيلة', image: '/api/placeholder/150/150' },
    { id: 504, categoryId: '5', name: 'كنافة بالمانجو', price: '50 E£', desc: 'طبقات كنافة مقرمشة مع كريمة وقطع مانجو فريش', image: '/api/placeholder/150/150' },

    // --- مشروبات (Category 6) ---
    { id: 601, categoryId: '6', name: 'عصير برتقال فريش', price: '25 E£', desc: 'برتقال طبيعي معصور وقت الطلب', image: '/api/placeholder/150/150' },
    { id: 602, categoryId: '6', name: 'عصير مانجو طبيعي', price: '40 E£', desc: 'قطع مانجو كثيفة وطبيعية', image: '/api/placeholder/150/150' },
    { id: 603, categoryId: '6', name: 'شاي زردة فلاحي', price: '12 E£', desc: 'شاي ثقيل مخمر على نار هادئة', image: '/api/placeholder/150/150' },
    { id: 604, categoryId: '6', name: 'قهوة تركي (دبل)', price: '30 E£', desc: 'بن برازيلي فاخر محوج', image: '/api/placeholder/150/150' },
    { id: 605, categoryId: '6', name: 'ليمون نعناع منعش', price: '25 E£', desc: 'عصير ليمون مثلج مع أوراق النعناع الأخضر', image: '/api/placeholder/150/150' },
    { id: 606, categoryId: '6', name: 'مياه معدنية (كبيرة)', price: '10 E£', desc: 'زجاجة مياه باردة 1.5 لتر', image: '/api/placeholder/150/150' },
  ]
};

type MenuItem = {
  id: number;
  categoryId: string;
  name: string;
  price: string;
  desc: string;
  image: string;
};

const RestaurantItms = () => {
  const dispatch = useAppDispatch();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);

  const filteredItems = restaurantData.items.filter(item => {
    // إظهار نتائج البحث من جميع التصنيفات، أو عرض عناصر تصنيف محدد
    const matchesCategory = activeCategory === 'all' || item.categoryId === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleItemClick = (item: React.SetStateAction<MenuItem | null>) => {
    setSelectedItem(item);
    setQuantity(1);
  };

  return (
    <div className="min-h-screen transition-colors duration-300 bg-gray-50 dark:bg-zinc-950">
      <div className="px-4 py-6 mx-3 text-right" dir="rtl">
        
        {/* 1. شريط البحث */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 flex items-center pointer-events-none right-3">
            <Search className="w-5 h-5 text-gray-400 dark:text-zinc-500" />
          </div>
          <input
            type="text"
            className="block w-full py-3 pl-4 pr-10 text-gray-900 transition-all bg-white border border-gray-200 outline-none dark:border-zinc-800 rounded-xl dark:bg-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            placeholder="ابحث في قائمة ملتوت..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* 2. قائمة الفئات */}
        <div className="flex gap-2 pb-4 mb-6 overflow-x-auto no-scrollbar scroll-smooth">
          {restaurantData.categories.map((cat) => (
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

        {/* 3. العرض الديناميكي (تصنيفات أو منتجات) */}
        <div className="space-y-4">
          
          {/* عرض شبكة التصنيفات إذا كنا في تبويب "الكل" ولا يوجد بحث */}
          {activeCategory === 'all' && !searchQuery ? (
            <div>
              <h2 className="mb-4 text-xl font-bold text-gray-800 dark:text-zinc-100">
                تصفح القائمة
              </h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {restaurantData.categories.filter(c => c.id !== 'all').map((cat) => {
                  const itemCount = restaurantData.items.filter(i => i.categoryId === cat.id).length;
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
                      <span className="mt-2 text-xs text-gray-400 dark:text-zinc-500">
                        {itemCount} منتج
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* عرض قائمة المنتجات للتصنيف المحدد أو لنتائج البحث */
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-zinc-100">
                  {searchQuery ? 'نتائج البحث' : restaurantData.categories.find(c => c.id === activeCategory)?.name}
                </h2>
                <span className="text-sm text-gray-400 dark:text-zinc-500">
                  ({filteredItems.length}) منتج
                </span>
              </div>

              {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {filteredItems.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => handleItemClick(item)}
                      className="flex items-center p-3 transition-all bg-white border border-gray-100 shadow-sm cursor-pointer dark:bg-zinc-900 rounded-2xl dark:border-zinc-800 hover:shadow-md group"
                    >
                      <div className="relative flex-shrink-0 w-24 h-24 overflow-hidden rounded-xl">
                        <img src={item.image} alt={item.name} className="object-cover w-full h-full transition-transform group-hover:scale-110" />
                      </div>
                      <div className="flex-1 mr-4">
                        <h3 className="font-bold text-gray-900 dark:text-zinc-100">{item.name}</h3>
                        <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500 line-clamp-2">{item.desc}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="font-bold text-yellow-500">{item.price}</span>
                          <div className="p-2 text-white transition-colors bg-gray-900 dark:bg-yellow-400 dark:text-zinc-900 rounded-xl">
                            <Plus size={18} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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

        {/* الـ Popup (Product Modal) */}
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity">
            <div className="relative w-full max-w-lg overflow-hidden duration-300 bg-white border-t dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl animate-in slide-in-from-bottom dark:border-zinc-800 sm:border-none">
              
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute z-10 p-2 rounded-full shadow-lg top-4 right-4 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md"
              >
                <X size={20} className="text-gray-800 dark:text-zinc-100" />
              </button>

              <div className="w-full h-64 overflow-hidden sm:h-72">
                <img src={selectedItem.image} alt={selectedItem.name} className="object-cover w-full h-full" />
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{selectedItem.name}</h2>
                  <span className="text-xl font-bold text-yellow-500">{selectedItem.price}</span>
                </div>
                
                <p className="mb-4 font-medium text-yellow-600 dark:text-yellow-400">Maltut</p>
                
                <div className="mb-6">
                  <h4 className="mb-2 font-bold dark:text-zinc-100">الوصف</h4>
                  <p className="text-sm leading-relaxed text-gray-500 dark:text-zinc-400">{selectedItem.desc || selectedItem.name}</p>
                </div>

                <div className="flex items-center justify-between pt-6 border-t dark:border-zinc-800">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold tracking-wider text-yellow-500 uppercase">المجموع:</span>
                    <span className="text-2xl font-black text-gray-900 dark:text-zinc-100">
                      {(parseFloat(selectedItem.price) * quantity)} E£
                    </span>
                  </div>

                  <div className="flex items-center gap-4 p-1 border bg-gray-50 dark:bg-zinc-800 rounded-2xl dark:border-zinc-700">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="flex items-center justify-center w-10 h-10 text-gray-600 bg-white shadow-sm rounded-xl dark:bg-zinc-700 dark:text-zinc-200"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="w-4 text-lg font-bold text-center dark:text-zinc-100">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="flex items-center justify-center w-10 h-10 text-white bg-yellow-400 shadow-md rounded-xl shadow-yellow-400/20"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                <button 
                  className="w-full mt-6 bg-yellow-400 hover:bg-yellow-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-yellow-400/10 transition-all active:scale-[0.98]"
                  onClick={() => {
                    if (selectedItem) {
                      dispatch(addToCart({
                        id: selectedItem.id,
                        name: selectedItem.name,
                        price: parseFloat(selectedItem.price),
                      }));
                      setSelectedItem(null);
                    }
                  }}
                >
                  إضافة للسلة
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantItms;