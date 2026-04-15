"use client";

import { useState } from "react";
import { useAppSelector } from "@/redux/hooks";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, 
  Phone, 
  User, 
  CreditCard, 
  Banknote, 
  ChevronRight, 
  CheckCircle2,
  Truck
} from "lucide-react";
import Link from "next/link";

export default function Payment() {
  const items = useAppSelector((state) => state.cart.items);
  const totalPrice = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  const [paymentMethod, setPaymentMethod] = useState("cash"); // 'cash' or 'card'

  return (
    <div className="max-w-4xl p-4 mx-auto duration-700 pb-28 animate-in fade-in" dir="rtl">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/cart" className="p-2 transition-colors bg-gray-100 rounded-full dark:bg-zinc-800 hover:bg-gray-200">
          <ChevronRight size={24} className="text-gray-600 dark:text-gray-300" />
        </Link>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">إتمام الطلب</h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        
        {/* Left Side: Forms */}
        <div className="space-y-6 lg:col-span-7">
          
          {/* Section 1: Delivery Info */}
          <section className="p-6 bg-white border border-gray-100 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 rounded-3xl">
            <div className="flex items-center gap-2 mb-6 text-yellow-600">
              <MapPin size={22} />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">عنوان التوصيل</h2>
            </div>
            
            <div className="space-y-4">
              <div className="relative group">
                <User className="absolute text-gray-400 -translate-y-1/2 top-1/2 start-4 group-focus-within:text-yellow-500" size={18} />
                <input 
                  type="text" 
                  placeholder="الاسم بالكامل" 
                  className="w-full py-4 transition-all border-none outline-none bg-gray-50 rounded-2xl ps-12 pe-4 dark:bg-zinc-800 focus:ring-2 focus:ring-yellow-400/50"
                />
              </div>

              <div className="relative group">
                <Phone className="absolute text-gray-400 -translate-y-1/2 top-1/2 start-4 group-focus-within:text-yellow-500" size={18} />
                <input 
                  type="tel" 
                  placeholder="رقم الهاتف" 
                  className="w-full py-4 transition-all border-none outline-none bg-gray-50 rounded-2xl ps-12 pe-4 dark:bg-zinc-800 focus:ring-2 focus:ring-yellow-400/50"
                />
              </div>

              <div className="relative group">
                <MapPin className="absolute text-gray-400 top-4 start-4 group-focus-within:text-yellow-500" size={18} />
                <textarea 
                  placeholder="العنوان بالتفصيل (الشارع، رقم العمارة، الشقة)" 
                  rows={3}
                  className="w-full py-4 transition-all border-none outline-none bg-gray-50 rounded-2xl ps-12 pe-4 dark:bg-zinc-800 focus:ring-2 focus:ring-yellow-400/50"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Payment Method */}
          <section className="p-6 bg-white border border-gray-100 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 rounded-3xl">
            <div className="flex items-center gap-2 mb-6 text-yellow-600">
              <CreditCard size={22} />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">طريقة الدفع</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setPaymentMethod("cash")}
                className={`relative flex flex-col items-center gap-3 p-4 border-2 transition-all rounded-2xl ${paymentMethod === 'cash' ? 'border-yellow-400 bg-yellow-50/50 dark:bg-yellow-400/5' : 'border-transparent bg-gray-50 dark:bg-zinc-800'}`}
              >
                <Banknote size={28} className={paymentMethod === 'cash' ? 'text-yellow-600' : 'text-gray-400'} />
                <span className={`font-bold ${paymentMethod === 'cash' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>دفع نقدي</span>
                {paymentMethod === 'cash' && <CheckCircle2 size={18} className="absolute text-yellow-500 top-2 end-2" />}
              </button>

              <button 
                onClick={() => setPaymentMethod("card")}
                className={`relative flex flex-col items-center gap-3 p-4 border-2 transition-all rounded-2xl ${paymentMethod === 'card' ? 'border-yellow-400 bg-yellow-50/50 dark:bg-yellow-400/5' : 'border-transparent bg-gray-50 dark:bg-zinc-800'}`}
              >
                <CreditCard size={28} className={paymentMethod === 'card' ? 'text-yellow-600' : 'text-gray-400'} />
                <span className={`font-bold ${paymentMethod === 'card' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>بطاقة بنكية</span>
                {paymentMethod === 'card' && <CheckCircle2 size={18} className="absolute text-yellow-500 top-2 end-2" />}
              </button>
            </div>
          </section>
        </div>

        {/* Right Side: Order Summary */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 p-6 bg-white border border-gray-100 shadow-xl dark:bg-zinc-900 dark:border-zinc-800 rounded-[2.5rem]">
            <h2 className="mb-6 text-xl font-black text-gray-900 dark:text-white">ملخص الطلب</h2>
            
            <div className="mb-6 space-y-4 max-h-[30vh] overflow-y-auto custom-scrollbar pe-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 text-sm font-bold text-yellow-600 rounded-xl bg-yellow-50 dark:bg-yellow-400/10">
                      x{item.quantity}
                    </div>
                    <span className="font-bold text-gray-700 dark:text-zinc-300">{item.name}</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{item.price * item.quantity} E£</span>
                </div>
              ))}
            </div>

            <div className="pt-6 space-y-4 border-t border-gray-100 dark:border-zinc-800">
              <div className="flex justify-between text-gray-500 dark:text-zinc-400">
                <span>رسوم التوصيل</span>
                <span className="font-bold text-green-500">مجاناً</span>
              </div>
              <div className="flex justify-between pt-2 text-xl font-black text-gray-900 dark:text-white">
                <span>الإجمالي</span>
                <span className="text-yellow-600 dark:text-yellow-500">{totalPrice} E£</span>
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center w-full gap-3 py-5 mt-8 text-lg font-black text-gray-900 transition-all bg-yellow-400 shadow-lg hover:bg-yellow-500 rounded-2xl shadow-yellow-400/20"
            >
              <Truck size={22} />
              تأكيد وطلب الآن
            </motion.button>
            
            <p className="mt-4 text-xs text-center text-gray-400 dark:text-zinc-500">
              بالضغط على تأكيد، أنت توافق على شروط وأحكام ملتوت
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}