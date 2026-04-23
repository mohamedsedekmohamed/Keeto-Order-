"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  CreditCard, 
  History, 
  TrendingUp,
  Loader2,
  X,
  Image as ImageIcon
} from "lucide-react";
import { useLanguage } from "../../../../../context/LanguageContext";
import useGet from "@/hooks/useGet";
// بافتراض وجود usePost لديك بناءً على نمط usePut
import usePost from "@/hooks/usePost"; 
import { useParams } from "next/navigation";

// 1. تعريف واجهات البيانات (Interfaces)
interface Transaction {
  id: string;
  amount: string;
  type: "credit" | "debit";
  transactionType: string;
  status: string;
  balanceBefore: string;
  reference: string;
  receiptImage: string;
  createdAt: string;
  paymentMethodId: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  image: string;
  type: string;
}

interface HistoryResponse {
  success: boolean;
  data: {
    data: Transaction[];
  };
}

interface SelectResponse {
  success: boolean;
  data: {
    data: {
      paymentMethods: PaymentMethod[];
    };
  };
}

export default function WalletPage() {
  const { t } = useLanguage();
  
  // حالة نافذة الشحن
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [fundData, setFundData] = useState({
    amount: "",
    paymentMethodId: "",
    receiptImage: "" // في التطبيق الحقيقي قد تحتاج لرفع الصورة أولاً للحصول على الرابط
  });

  // 2. جلب بيانات سجل المحفظة
  const { data: historyResponse, loading: isLoadingHistory, refetch } = 
    useGet<HistoryResponse>('/api/user/wallet/history');
    const params = useParams<{ id: string }>();
        const basePath = `/home/restaurants/${params.id}`;
 
  const { data: selectResponse, loading: isLoadingSelect } = 
    useGet<SelectResponse>('/api/user/order/select?restaurantId=' + params.id);

  // 4. إعداد دالة الشحن
  const { postData, loading: isAddingFund } = usePost('/api/user/wallet/add-fund');

  // استخراج البيانات
  const transactions = historyResponse?.data?.data || [];
  const paymentMethods = selectResponse?.data?.data?.paymentMethods || [];

  // دالة التعامل مع فورم الشحن
  const handleAddFund = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await postData(
        {
          amount: Number(fundData.amount),
          paymentMethodId: fundData.paymentMethodId,
          receiptImage: fundData.receiptImage || "https://img.com/receipt.jpg" // قيمة افتراضية للتجربة
        },
        null,
        t("fundSuccess") || "تم تقديم طلب الشحن بنجاح وفي انتظار الموافقة"
      );
      
      // إغلاق النافذة وتحديث السجل
      setIsAddModalOpen(false);
      setFundData({ amount: "", paymentMethodId: "", receiptImage: "" });
      if (refetch) refetch();
      
    } catch (error) {
      // الـ Hook سيعالج عرض رسالة الخطأ
    }
  };

  if (isLoadingHistory && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-950">
        <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
      </div>
    );
  }

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
              <div className="absolute top-0 right-0 w-64 h-64 transition-colors translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400/10 blur-3xl group-hover:bg-yellow-400/20" />
              
              <div className="relative z-10">
                <p className="text-sm font-bold tracking-wider uppercase text-zinc-400">
                  {t("totalBalance") || "إجمالي الرصيد"}
                </p>
                {/* الرصيد هنا ثابت مؤقتاً، يمكنك استبداله بقيمة من الـ Profile API إذا كانت متوفرة */}
                <h2 className="flex items-center gap-2 mt-2 text-5xl font-black text-white sm:text-6xl">
                  <span className="text-yellow-400">$</span>0.00
                </h2>
                
                <div className="flex gap-4 mt-10">
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center justify-center flex-1 gap-2 py-4 font-black text-gray-900 transition-all bg-yellow-400 shadow-lg hover:bg-yellow-500 rounded-2xl shadow-yellow-400/20 active:scale-95"
                  >
                    <Plus size={20} />
                    {t("addFunds") || "شحن الرصيد"}
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
                  <p className="text-xl font-black text-gray-900 dark:text-white">+$0.00</p>
                </div>
              </div>
              <div className="p-6 bg-white dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800 rounded-[2rem] flex items-center gap-4">
                <div className="p-3 text-red-500 bg-red-500/10 rounded-2xl">
                  <ArrowUpRight size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-zinc-400">{t("spending") || "المصاريف"}</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">-$0.00</p>
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
                {isLoadingHistory ? (
                  <div className="flex justify-center py-4"><Loader2 className="text-yellow-500 animate-spin" /></div>
                ) : transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl transition-colors ${
                          tx.type === "credit" 
                          ? "bg-green-500/10 text-green-500" 
                          : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400"
                        }`}>
                          {tx.type === "credit" ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 transition-colors dark:text-white group-hover:text-yellow-500">
                            {tx.transactionType.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-zinc-500">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-end">
                        <span className={`block font-black text-sm ${
                          tx.type === "credit" ? "text-green-500" : "text-gray-900 dark:text-white"
                        }`}>
                          {tx.type === "credit" ? "+" : "-"}${tx.amount}
                        </span>
                        <span className="text-[10px] text-gray-400 capitalize">{tx.status}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-center text-gray-500">{t("noTransactions") || "لا توجد عمليات سابقة"}</p>
                )}
              </div>

            </div>
          </motion.div>
        </div>
      </div>

      {/* Add Funds Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-8 bg-white border dark:bg-zinc-900 dark:border-zinc-800 rounded-[2.5rem] shadow-2xl relative"
            >
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="absolute p-2 text-gray-400 transition-colors bg-gray-100 rounded-full top-6 end-6 dark:bg-zinc-800 hover:text-gray-900 dark:hover:text-white"
              >
                <X size={20} />
              </button>
              
              <h3 className="mb-6 text-2xl font-black text-gray-900 dark:text-white">
                {t("addFunds") || "شحن الرصيد"}
              </h3>

              <form onSubmit={handleAddFund} className="space-y-5">
                
                {/* Amount */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-zinc-300 ms-1">
                    {t("amount") || "المبلغ"}
                  </label>
                  <input
                    type="number"
                    required
                    value={fundData.amount}
                    onChange={(e) => setFundData({...fundData, amount: e.target.value})}
                    placeholder="500.00"
                    className="w-full px-4 py-4 transition-all border-2 border-transparent outline-none bg-gray-100/50 dark:bg-zinc-800/40 rounded-2xl dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:border-yellow-400"
                  />
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-zinc-300 ms-1">
                    {t("paymentMethod") || "طريقة الدفع"}
                  </label>
                  <select
                    required
                    value={fundData.paymentMethodId}
                    onChange={(e) => setFundData({...fundData, paymentMethodId: e.target.value})}
                    className="w-full px-4 py-4 transition-all border-2 border-transparent outline-none appearance-none bg-gray-100/50 dark:bg-zinc-800/40 rounded-2xl dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:border-yellow-400"
                  >
                    <option value="" disabled>اختر طريقة الدفع</option>
                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Receipt URL (Simulated Upload) */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-zinc-300 ms-1">
                    {t("receiptImage") || "رابط الإيصال"}
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-4">
                      <ImageIcon size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="url"
                      required
                      value={fundData.receiptImage}
                      onChange={(e) => setFundData({...fundData, receiptImage: e.target.value})}
                      placeholder="https://img.com/receipt.jpg"
                      className="w-full px-4 py-4 transition-all border-2 border-transparent outline-none bg-gray-100/50 dark:bg-zinc-800/40 rounded-2xl ps-11 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:border-yellow-400"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isAddingFund}
                  type="submit"
                  className="flex items-center justify-center w-full gap-2 py-4 mt-4 font-black text-gray-900 transition-all bg-yellow-400 shadow-xl rounded-2xl hover:bg-yellow-500 shadow-yellow-400/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isAddingFund ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                  {isAddingFund ? t("processing") || "جاري التنفيذ..." : t("confirmPayment") || "تأكيد الدفع"}
                </motion.button>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}