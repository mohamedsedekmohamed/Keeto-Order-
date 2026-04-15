"use client";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { 
  increaseQuantity, 
  decreaseQuantity, 
  removeFromCart, 
  clearCart 
} from "@/redux/cartSlice";
import { Plus, Minus, Trash2, ShoppingBag, ArrowLeft, Receipt } from "lucide-react";
import Link from "next/link";

export default function Cart() {
  const items = useAppSelector((state) => state.cart.items);
  const dispatch = useAppDispatch();

  const totalPrice = items.reduce(
    (total, item) => total + (item.price * item.quantity), 
    0
  );

  // 🟡 Empty Cart
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500 min-h-[60vh] animate-in fade-in duration-500">
        <div className="p-8 mb-6 rounded-full bg-gray-50 dark:bg-zinc-900">
          <ShoppingBag size={80} className="text-yellow-500 opacity-30" />
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          سلتك خالية حالياً
        </p>
        <p className="mt-2 text-gray-500 dark:text-zinc-400">
          اطلب ألذ الفطائر الآن من ملتوت!
        </p>
      </div>
    );
  }

  // 🟡 Filled Cart
  return (
    <div 
      className="max-w-2xl p-4 pb-32 mx-auto duration-500 animate-in slide-in-from-bottom-4" 
      dir="rtl"
    >
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white">
            سلة الطلبات
          </h2>
          <span className="flex items-center justify-center w-8 h-8 text-sm font-bold text-yellow-600 rounded-full bg-yellow-50 dark:bg-yellow-500/10">
            {items.length}
          </span>
        </div>
        
        <button 
          onClick={() => dispatch(clearCart())} 
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-500 transition-all duration-300 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 active:scale-95"
        >
          <Trash2 size={16} />
          <span className="hidden sm:inline">مسح الجميع</span>
        </button>
      </div>
      
      {/* Items */}
      <div className="space-y-4">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="flex items-center justify-between p-4 transition-all duration-300 bg-white border shadow-sm border-gray-100/60 hover:shadow-md dark:bg-zinc-900 dark:border-zinc-800 rounded-3xl"
          >
            
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 text-2xl font-bold text-yellow-600 rounded-2xl bg-yellow-50 dark:bg-yellow-400/10 shrink-0">
                {item.name[0]}
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100">
                  {item.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                  <span className="font-bold text-yellow-600 dark:text-yellow-500">
                    {item.price}
                  </span>{" "}
                  E£ للواحد
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              
              {/* Remove */}
              <button 
                onClick={() => dispatch(removeFromCart(item.id))} 
                className="p-1.5 text-gray-400 transition-all duration-300 rounded-lg bg-gray-50 hover:text-red-500 hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-red-500/10"
              >
                <Trash2 size={16} />
              </button>
              
              {/* Quantity */}
              <div className="flex items-center gap-3 p-1 border border-gray-100/60 bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 rounded-xl">
                
                <button 
                  onClick={() => dispatch(decreaseQuantity(item.id))} 
                  className="p-1.5 transition-all duration-300 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-gray-700 dark:text-white"
                >
                  <Minus size={14} />
                </button>

                <span className="w-4 font-bold text-center text-gray-900 dark:text-white">
                  {item.quantity}
                </span>

                <button 
                  onClick={() => dispatch(increaseQuantity(item.id))} 
                  className="p-1.5 transition-all duration-300 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-gray-900"
                >
                  <Plus size={14} />
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="p-6 mt-8 bg-white border border-gray-100/60 dark:bg-zinc-900 rounded-3xl">
        
        <div className="flex items-center gap-2 mb-4 text-gray-500 dark:text-zinc-400">
          <Receipt size={20} />
          <h3 className="font-semibold">ملخص الطلب</h3>
        </div>
        
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-zinc-800">
          <span className="text-gray-500 dark:text-zinc-400">
            المجموع الفرعي
          </span>
          <span className="font-bold text-gray-900 dark:text-white">
            {totalPrice} E£
          </span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            الإجمالي الكلي
          </span>
          <span className="text-2xl font-black text-yellow-600 dark:text-yellow-500">
            {totalPrice} E£
          </span>
        </div>

        <Link href="/payment" className="flex items-center justify-center w-full gap-2 py-4 text-lg font-bold text-gray-900 transition-all duration-300 bg-yellow-400 shadow-sm hover:bg-yellow-500 rounded-2xl shadow-yellow-400/10 active:scale-95">
          <span>إتمام الطلب الآن</span>
          <ArrowLeft size={20} />
        </Link>
      </div>

    </div>
  );
}