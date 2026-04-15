"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  CreditCard, 
  History, 
  TrendingUp,
  DollarSign
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function WalletPage() {
  const { t } = useLanguage();
  
  // بيانات تجريبية للعمليات
  const [transactions] = useState([
    { id: 1, type: "out", title: "Premium Coffee", date: "Today, 10:30 AM", amount: "-$24.00", category: "Food" },
    { id: 2, type: "in", title: "Refund: Watch", date: "Yesterday", amount: "+$120.00", category: "Shopping" },
    { id: 3, type: "out", title: "Subscription", date: "2 days ago", amount: "-$15.00", category: "Services" },
  ]);

  return (
    <div className="relative min-h-screen px-4 py-12 overflow-hidden transition-colors duration-300 bg-gray-50 dark:bg-zinc-950">
      
      {/* Ambient Background */}
      <div className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] bg-yellow-400/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="mb-10">
          <h1 className="flex items-center gap-3 text-4xl font-black text-gray-900 dark:text-white">
            <Wallet className="text-yellow-400" size={36} />
            {t("myWallet") || "المحفظة"}
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* Main Balance Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 lg:col-span-2"
          >
            <div className="relative p-8 overflow-hidden bg-zinc-900 dark:bg-zinc-900 rounded-[3rem] shadow-2xl group">
              {/* Pattern Background */}
              <div className="absolute top-0 right-0 w-64 h-64 transition-colors translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400/10 blur-3xl group-hover:bg-yellow-400/20" />
              
              <div className="relative z-10">
                <p className="text-sm font-bold tracking-wider uppercase text-zinc-400">
                  {t("totalBalance") || "إجمالي الرصيد"}
                </p>
                <h2 className="flex items-center gap-2 mt-2 text-5xl font-black text-white sm:text-6xl">
                  <span className="text-yellow-400">$</span>2,850.50
                </h2>
                
                <div className="flex gap-4 mt-10">
                  <button className="flex items-center justify-center flex-1 gap-2 py-4 font-black text-gray-900 transition-all bg-yellow-400 shadow-lg hover:bg-yellow-500 rounded-2xl shadow-yellow-400/20 active:scale-95">
                    <Plus size={20} />
                    {t("addFunds") || "شحن الرصيد"}
                  </button>
                  <button className="flex items-center justify-center flex-1 gap-2 py-4 font-black text-white transition-all bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur-md active:scale-95">
                    <CreditCard size={20} />
                    {t("withdraw") || "سحب"}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-white dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800 rounded-[2rem] flex items-center gap-4">
                <div className="p-3 text-green-500 bg-green-500/10 rounded-2xl">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-zinc-400">{t("income") || "الدخل"}</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">+$420.00</p>
                </div>
              </div>
              <div className="p-6 bg-white dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800 rounded-[2rem] flex items-center gap-4">
                <div className="p-3 text-red-500 bg-red-500/10 rounded-2xl">
                  <ArrowUpRight size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-zinc-400">{t("spending") || "المصاريف"}</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">-$154.20</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Transactions Side List */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="p-8 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white dark:border-zinc-800/50 rounded-[2.5rem] shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="flex items-center gap-2 text-xl font-black text-gray-900 dark:text-white">
                  <History size={20} className="text-yellow-500" />
                  {t("recent") || "الأخيرة"}
                </h3>
                <button className="text-sm font-bold text-yellow-600 dark:text-yellow-400 hover:underline">
                  {t("seeAll") || "الكل"}
                </button>
              </div>

              <div className="space-y-6">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl transition-colors ${
                        tx.type === "in" 
                        ? "bg-green-500/10 text-green-500" 
                        : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400"
                      }`}>
                        {tx.type === "in" ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 transition-colors dark:text-white group-hover:text-yellow-500">{tx.title}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-500">{tx.date}</p>
                      </div>
                    </div>
                    <span className={`font-black text-sm ${
                      tx.type === "in" ? "text-green-500" : "text-gray-900 dark:text-white"
                    }`}>
                      {tx.amount}
                    </span>
                  </div>
                ))}
              </div>

              {/* Promo Banner / Action */}
              <div className="p-5 mt-8 border border-dashed bg-yellow-400/10 border-yellow-400/20 rounded-2xl">
                <p className="text-xs font-bold leading-relaxed text-center text-yellow-700 dark:text-yellow-400">
                  احصل على كاش باك 5% عند الشحن باستخدام بطاقة الفيزا
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}