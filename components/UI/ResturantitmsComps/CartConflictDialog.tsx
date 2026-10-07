"use client";

import { AlertTriangle } from "lucide-react";

interface CartConflictDialogProps {
  isOpen: boolean;
  isRtl: boolean;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CartConflictDialog({
  isOpen,
  isRtl,
  loading,
  onConfirm,
  onCancel,
}: CartConflictDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1110] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-300">
        <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/30 text-amber-500 rounded-full flex items-center justify-center mx-auto border border-amber-100 dark:border-amber-900/30">
          <AlertTriangle size={28} />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {isRtl
              ? "هل أنت متأكد من رغبتك في إضافة هذا المنتج إلى السلة؟"
              : "Are you sure you want to add this item to the cart ?"}
          </h3>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-zinc-950 font-black py-3 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin inline-block" />
            ) : isRtl ? (
              "نعم، متأكد"
            ) : (
              "Yes, Sure"
            )}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 font-bold py-3 rounded-xl transition-all active:scale-[0.98] border border-zinc-200/40 dark:border-zinc-700/30"
          >
            {isRtl ? "إلغاء" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
