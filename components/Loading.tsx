"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950">
      
      {/* تأثير الإضاءة الخلفية الهادئ */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-400/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative flex flex-col items-center">
        
        {/* اللوجو أو العنصر المتحرك الرئيسي */}
        <div className="relative w-24 h-24">
          {/* الدائرة الخارجية المتحركة */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="absolute inset-0 border-t-4 border-r-4 border-yellow-400 rounded-full"
          />
          
          {/* الدائرة الداخلية بنبض خفيف */}
          <motion.div
            animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="absolute flex items-center justify-center border inset-4 bg-yellow-400/20 backdrop-blur-sm border-yellow-400/30 rounded-2xl"
          >
            <div className="w-4 h-4 bg-yellow-400 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.6)]" />
          </motion.div>
        </div>

        {/* نص التحميل مع تأثير الكتابة */}
        <div className="mt-8 text-center">
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-black tracking-widest text-gray-900 uppercase dark:text-white"
          >
            Loading<motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, times: [0, 0.5, 1] }}
            >...</motion.span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-2 text-sm font-bold text-gray-400 dark:text-zinc-500"
          >
            برجاء الانتظار قليلاً
          </motion.p>
        </div>
      </div>

      {/* خط تقدم (Progress Bar) وهمي تحت */}
      <div className="absolute w-48 h-1 overflow-hidden bg-gray-200 rounded-full bottom-12 dark:bg-zinc-800">
        <motion.div 
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="w-full h-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.4)]"
        />
      </div>
    </div>
  );
}