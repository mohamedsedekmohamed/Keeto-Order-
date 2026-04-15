"use client";

import { motion } from "framer-motion";
import { Bell, CheckCircle2, Info, AlertCircle } from "lucide-react";

const notifications = [
  {
    id: 1,
    title: "تم تأكيد طلبك",
    desc: "طلبك رقم #1234 تم تأكيده وجاري التحضير",
    type: "success",
    time: "منذ 5 دقائق",
  },
  {
    id: 2,
    title: "عرض جديد 🎉",
    desc: "خصم 20% على جميع الطلبات اليوم",
    type: "info",
    time: "منذ ساعة",
  },
  {
    id: 3,
    title: "تنبيه",
    desc: "تأكد من تحديث بياناتك",
    type: "warning",
    time: "منذ يوم",
  },
];

export default function Notification() {
  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="text-green-500" />;
      case "info":
        return <Info className="text-blue-500" />;
      case "warning":
        return <AlertCircle className="text-yellow-500" />;
      default:
        return <Bell className="text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen px-6 py-10 transition-colors duration-300 bg-white dark:bg-zinc-950">
      
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-10">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">
          الإشعارات
        </h1>
        <p className="mt-2 text-gray-500 dark:text-zinc-400">
          تابع آخر التحديثات والعروض الخاصة بك
        </p>
      </div>

      {/* Notifications List */}
      <div className="max-w-2xl mx-auto space-y-4">
        {notifications.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.01 }}
            className="flex items-start gap-4 p-4 transition-all duration-300 bg-white border shadow-sm border-gray-100/60 rounded-2xl hover:shadow-md dark:bg-zinc-900 dark:border-zinc-800"
          >
            {/* Icon */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-zinc-800">
              {getIcon(item.type)}
            </div>

            {/* Content */}
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 dark:text-white">
                {item.title}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                {item.desc}
              </p>
              <span className="block mt-2 text-xs text-gray-400">
                {item.time}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State (optional) */}
      {notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
          <Bell size={50} className="mb-4 opacity-30" />
          <p>لا توجد إشعارات حالياً</p>
        </div>
      )}
    </div>
  );
}