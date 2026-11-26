"use client";

import type { ChangeEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";

type Translate = (key: string) => string | undefined;

interface CancelReason {
  id: string;
  name?: string;
  nameAr?: string;
}

interface AddressConfirmationModalsProps {
  isDeleteOpen: boolean;
  isUpdateOpen: boolean;
  isUpdateLoading: boolean;
  t: Translate;
  onCloseDelete: () => void;
  onConfirmDelete: () => void;
  onCancelUpdate: () => void;
  onConfirmUpdate: () => void;
}

export function AddressConfirmationModals({
  isDeleteOpen,
  isUpdateOpen,
  isUpdateLoading,
  t,
  onCloseDelete,
  onConfirmDelete,
  onCancelUpdate,
  onConfirmUpdate,
}: AddressConfirmationModalsProps) {
  return (
    <>
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 bg-white rounded-2xl dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-2xl">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              {t("confirm-delete") || "تأكيد الحذف"}
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {t("are-you-sure-delete") ||
                "هل أنت تأكد من أنك تريد حذف هذا العنوان؟"}
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={onCloseDelete}
                className="flex-1 px-4 py-2.5 font-semibold text-gray-700 dark:text-zinc-300 bg-gray-100 rounded-xl dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
              >
                {t("cancel") || "إلغاء"}
              </button>
              <button
                onClick={onConfirmDelete}
                className="flex-1 px-4 py-2.5 font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors shadow-md shadow-red-500/20"
              >
                {t("delete") || "حذف"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isUpdateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 bg-white rounded-2xl dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center flex-shrink-0 text-amber-500 bg-amber-50 dark:bg-amber-950/30 rounded-2xl w-10 h-10">
                <AlertTriangle size={20} />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                {t("confirmaddressupdate") || "تأكيد تحديث العنوان"}
              </h2>
            </div>
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              {t("address-in-order-warning") ||
                "هذا العنوان مرتبط بطلب حالي. هل أنت متأكد أنك تريد تحديثه؟"}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                type="button"
                onClick={onCancelUpdate}
                disabled={isUpdateLoading}
                className="flex-1 px-4 py-2.5 font-semibold text-gray-700 dark:text-zinc-300 bg-gray-100 rounded-xl dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-60"
              >
                {t("cancel") || "إلغاء"}
              </button>
              <button
                type="button"
                onClick={onConfirmUpdate}
                disabled={isUpdateLoading}
                className="flex-1 px-4 py-2.5 font-semibold text-gray-900 bg-yellow-400 rounded-xl hover:bg-yellow-500 transition-colors shadow-md shadow-yellow-400/20 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isUpdateLoading && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                {t("confirm") || "تأكيد"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface CancelReasonModalProps {
  isOpen: boolean;
  reasons: CancelReason[];
  selectedReasonId: string;
  customReason: string;
  isUpdating: boolean;
  isRtl: boolean;
  t: Translate;
  onClose: () => void;
  onSelectReason: (reasonId: string) => void;
  onCustomReasonChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export function CancelReasonModal({
  isOpen,
  reasons,
  selectedReasonId,
  customReason,
  isUpdating,
  isRtl,
  t,
  onClose,
  onSelectReason,
  onCustomReasonChange,
  onBack,
  onSubmit,
}: CancelReasonModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[25%] md:max-w-md md:mx-auto bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] z-[90] shadow-2xl border dark:border-zinc-800"
          >
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-2xl mb-4">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">
                {t("cancelOrderTitle") || "إلغاء الطلب"}
              </h3>
              <p className="text-xs text-gray-400 mt-1 mb-4">
                {t("cancelOrderDesc") || "برجاء اختيار سبب الإلغاء قبل المتابعة"}
              </p>

              <div className="w-full space-y-2 max-h-[200px] overflow-y-auto pr-1 mb-3">
                {reasons.length > 0 ? (
                  reasons.map((reason) => (
                    <label
                      key={reason.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        selectedReasonId === reason.id
                          ? "border-red-500 bg-red-50/40 dark:bg-red-950/10 font-bold"
                          : "border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900"
                      }`}
                    >
                      <span className="text-sm text-gray-800 dark:text-zinc-200">
                        {(isRtl ? reason.nameAr : reason.name) || reason.name}
                      </span>
                      <input
                        type="radio"
                        name="cancelReason"
                        value={reason.id}
                        checked={selectedReasonId === reason.id}
                        onChange={() => onSelectReason(reason.id)}
                        className="w-4 h-4 accent-red-500 cursor-pointer"
                      />
                    </label>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 py-4">
                    {t("noReasonsAvailable") || "لا توجد أسباب متاحة"}
                  </p>
                )}

                <label
                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                    selectedReasonId === "other"
                      ? "border-red-500 bg-red-50/40 dark:bg-red-950/10 font-bold"
                      : "border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900"
                  }`}
                >
                  <span className="text-sm text-gray-800 dark:text-zinc-200">
                    {t("otherReason") || "أخرى"}
                  </span>
                  <input
                    type="radio"
                    name="cancelReason"
                    value="other"
                    checked={selectedReasonId === "other"}
                    onChange={() => onSelectReason("other")}
                    className="w-4 h-4 accent-red-500 cursor-pointer"
                  />
                </label>
              </div>

              {selectedReasonId === "other" && (
                <div className="w-full mb-6">
                  <textarea
                    value={customReason}
                    onChange={onCustomReasonChange}
                    placeholder={t("writeYourReason") || "برجاء كتابة سبب الإلغاء"}
                    rows={3}
                    className="w-full p-3 text-sm rounded-2xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 resize-none focus:outline-none focus:border-red-500"
                  />
                </div>
              )}

              <div className="flex gap-3 w-full">
                <button
                  onClick={onBack}
                  className="flex-1 py-3 text-sm font-bold text-gray-500 bg-gray-100 dark:bg-zinc-800 rounded-2xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  {t("back") || "تراجع"}
                </button>
                <button
                  onClick={onSubmit}
                  disabled={
                    isUpdating ||
                    !selectedReasonId ||
                    (selectedReasonId === "other" && !customReason.trim())
                  }
                  className="flex-1 py-3 text-sm font-bold text-white bg-red-600 rounded-2xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-red-600/10 flex items-center justify-center gap-2"
                >
                  {isUpdating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    t("confirmCancel") || "تأكيد الإلغاء"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
