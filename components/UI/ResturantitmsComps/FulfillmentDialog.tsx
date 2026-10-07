"use client";

import {
  AlertCircle,
  CheckCircle2,
  MapPin,
  Plus,
  Store,
  Truck,
} from "lucide-react";

export interface FulfillmentAddress {
  id: string;
  isDeliverable: boolean;
  title: string;
  street: string;
  number?: string | null;
}

export interface FulfillmentBranch {
  id: string;
  name: string;
  nameAr?: string | null;
  address?: string | null;
}

type FulfillmentMode = "delivery" | "takeaway" | null;

interface FulfillmentDialogProps {
  isOpen: boolean;
  isRtl: boolean;
  loading: boolean;
  mode: FulfillmentMode;
  selectedId: string;
  addresses: FulfillmentAddress[];
  branches: FulfillmentBranch[];
  onModeChange: (mode: "delivery" | "takeaway") => void;
  onSelectionChange: (id: string) => void;
  onAddAddress: () => void;
  onConfirm: (mode: "delivery" | "takeaway", selectedId: string) => void;
  onCancel: () => void;
}

export default function FulfillmentDialog({
  isOpen,
  isRtl,
  loading,
  mode,
  selectedId,
  addresses,
  branches,
  onModeChange,
  onSelectionChange,
  onAddAddress,
  onConfirm,
  onCancel,
}: FulfillmentDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-2xl space-y-6 animate-in zoom-in-95 duration-300 overflow-y-auto overscroll-contain max-h-[90vh] [scrollbar-width:thin] [scrollbar-color:theme(colors.zinc.300)_transparent] dark:[scrollbar-color:theme(colors.zinc.700)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {isRtl ? "طريقة الاستلام" : "Fulfillment Method"}
          </h3>
          <p className="text-sm text-zinc-500">
            {isRtl
              ? "يرجى تحديد طريقة استلام هذا الطلب."
              : "Please select how you want to receive this item."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            {
              id: "delivery" as const,
              label: isRtl ? "توصيل" : "Delivery",
              Icon: Truck,
            },
            {
              id: "takeaway" as const,
              label: isRtl ? "استلام من الفرع" : "Takeaway",
              Icon: Store,
            },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => onModeChange(id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                mode === id
                  ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                  : "border-zinc-100 dark:border-zinc-800 text-zinc-500"
              }`}
            >
              <Icon size={24} />
              <span className="text-xs font-bold">{label}</span>
            </button>
          ))}
        </div>

        {mode === "delivery" && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {isRtl ? "اختر العنوان" : "Select Address"}
              </label>
              <button
                type="button"
                onClick={onAddAddress}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-950 bg-yellow-400 rounded-xl hover:bg-yellow-500 transition-colors"
              >
                <Plus size={14} />
                {isRtl ? "إضافة عنوان" : "Add Address"}
              </button>
            </div>

            <div className="space-y-3 max-h-[45vh] overflow-y-auto overscroll-contain pr-2 scroll-smooth [scrollbar-width:thin] [scrollbar-color:theme(colors.zinc.300)_transparent] dark:[scrollbar-color:theme(colors.zinc.700)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full">
              {addresses.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed rounded-2xl border-zinc-200 dark:border-zinc-800">
                  <p className="text-xs font-semibold text-zinc-500">
                    {isRtl ? "لا يوجد عناوين محفوظة" : "No saved addresses yet"}
                  </p>
                </div>
              ) : (
                addresses.map((address) => (
                  <div
                    key={address.id}
                    onClick={() =>
                      address.isDeliverable && onSelectionChange(address.id)
                    }
                    className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                      address.isDeliverable
                        ? "cursor-pointer"
                        : "cursor-not-allowed opacity-80"
                    } ${
                      selectedId === address.id
                        ? address.isDeliverable
                          ? "border-yellow-400 bg-white dark:bg-zinc-900"
                          : "border-red-400 bg-red-50 dark:bg-red-950/20"
                        : "border-zinc-100 dark:border-zinc-800"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl mt-1">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          {address.title}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {address.street}
                          {address.number ? `, ${address.number}` : ""}
                        </p>
                        {!address.isDeliverable && (
                          <div className="flex items-center gap-1 mt-2 text-red-500">
                            <AlertCircle size={14} />
                            <p className="text-xs font-bold">
                              {isRtl
                                ? "المطعم لا يوصل لهذا العنوان"
                                : "Delivery unavailable for this address"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    {selectedId === address.id && address.isDeliverable && (
                      <CheckCircle2
                        size={20}
                        className="text-yellow-500 shrink-0"
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {mode === "takeaway" && (
          <div className="mt-4">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 block mb-3">
              {isRtl ? "اختر الفرع" : "Select Branch"}
            </label>
            <div className="space-y-3 max-h-[45vh] overflow-y-auto overscroll-contain pr-2 scroll-smooth [scrollbar-width:thin] [scrollbar-color:theme(colors.zinc.300)_transparent] dark:[scrollbar-color:theme(colors.zinc.700)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full">
              {branches.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed rounded-2xl border-zinc-200 dark:border-zinc-800">
                  <p className="text-xs font-semibold text-red-500">
                    {isRtl
                      ? "هذا المنتج غير متاح فى أى فرع حالياً"
                      : "This item isn't available for pickup at any branch right now"}
                  </p>
                </div>
              ) : (
                branches.map((branch) => (
                  <div
                    key={branch.id}
                    onClick={() => onSelectionChange(branch.id)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                      selectedId === branch.id
                        ? "border-yellow-400 bg-white dark:bg-zinc-900"
                        : "border-zinc-100 dark:border-zinc-800"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl mt-1">
                        <Store size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          {isRtl && branch.nameAr ? branch.nameAr : branch.name}
                        </p>
                        {branch.address && (
                          <p className="text-xs text-zinc-500">
                            {branch.address}
                          </p>
                        )}
                      </div>
                    </div>
                    {selectedId === branch.id && (
                      <CheckCircle2
                        size={20}
                        className="text-yellow-500 shrink-0"
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            onClick={() => {
              if (mode) onConfirm(mode, selectedId);
            }}
            disabled={loading || !selectedId}
            className="flex-1 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white dark:border-zinc-900 border-t-transparent rounded-full animate-spin inline-block" />
            ) : isRtl ? (
              "تأكيد"
            ) : (
              "Confirm"
            )}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 font-bold py-3 rounded-xl transition-all border border-zinc-200/40 dark:border-zinc-700/30"
          >
            {isRtl ? "إلغاء" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
