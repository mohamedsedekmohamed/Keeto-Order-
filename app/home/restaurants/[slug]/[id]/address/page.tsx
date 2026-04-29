"use client";

import React, { useState, useEffect } from "react";
import useGet from "@/app/hooks/useGet";
import usePost from "@/app/hooks/usePost";
import usePut from "@/app/hooks/usePut";
import useDelete from "@/app/hooks/useDelete"; 
import { useLanguage } from "@/context/LanguageContext";
import { useToken } from "@/context/TokenContext";
import { useParams, useRouter } from "next/navigation";
import { useRestaurant } from "@/context/RestaurantContext";
import Loading from "@/components/Loading";

type Zone = {
  id: string;
  name: string;
};

type Address = {
  id: string;
  title: string;
  street: string;
  number: string;
  floor: string;
  type: "home" | "work" | "other";
  zoneId: string;
};

const AddressPage = () => {
  const { t } = useLanguage();
  const { restaurant } = useRestaurant();
  const { token, isReady } = useToken();
  const params = useParams();
  const router = useRouter();
const [deleteId, setDeleteId] = useState<string | null>(null);
const [showDeleteModal, setShowDeleteModal] = useState(false);
const handleDeleteClick = (id: string) => {
  setDeleteId(id);
  setShowDeleteModal(true);
};
  const restaurantId = (params?.id as string) || restaurant?.id;
  const basePath = `/home/restaurants/${restaurantId}`;

  // APIs
  const { data: addressesRes, loading: loadingAddresses, error: errorAddresses, refetch } = useGet<any>("/api/user/address");
  const { data: zonesRes, loading: loadingZones, error: errorZones } = useGet<any>("/api/user/address/zone");
  
  const { postData, loading: posting } = usePost("/api/user/address");
  const { putData, loading: putting } = usePut();
  const { deleteData, loading: deleting } = useDelete("");

  const addresses: Address[] = addressesRes?.data?.data || [];
  const zones: Zone[] = zonesRes?.data?.data || [];

  // State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    zoneId: "",
    type: "home",
    street: "",
    number: "",
    floor: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // معالجة الإرسال (إضافة أو تعديل)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await putData(form, `/api/user/address/${editingId}`, t("address-updated-success"));
      } else {
        await postData(form, null, t("address-added-success"));
      }
      resetForm();
      refetch();
    } catch (error) {
      // الأخطاء يتم التعامل معها في الـ Hooks
    }
  };

  // دالة لتصفير الفورم
  const resetForm = () => {
    setForm({ title: "", zoneId: "", type: "home", street: "", number: "", floor: "" });
    setEditingId(null);
  };

  // دالة عند الضغط على زر التعديل
  const handleEditClick = (address: Address) => {
    setForm({
      title: address.title,
      zoneId: address.zoneId,
      type: address.type,
      street: address.street,
      number: address.number,
      floor: address.floor,
    });
    setEditingId(address.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // دالة عند الضغط على زر الحذف
  const confirmDelete = async () => {
  if (!deleteId) return;

  try {
    await deleteData(`/api/user/address/${deleteId}`);
    refetch();
  } finally {
    setShowDeleteModal(false);
    setDeleteId(null);
  }
};

  const inputClass = "w-full p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all text-zinc-900 dark:text-white";
  const isLoading = posting || putting;

  useEffect(() => {
    if (!isReady) return;
    if (!token) {
      router.replace(basePath);
    }
  }, [token, isReady]);

  if (loadingAddresses || loadingZones) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loading /></div>;
  }

  if (errorAddresses || errorZones) {
    return <div className="flex items-center justify-center min-h-[60vh] text-red-500 font-medium">{t("error-fetching-data")}</div>;
  }

  return (
    <div className="p-4 pb-24 mx-auto max-w-7xl md:p-6 lg:flex lg:gap-8 lg:items-start">
      
      {/* FORM SECTION (Sticky on Desktop) */}
      <div className="w-full mb-10 lg:w-1/3 lg:sticky lg:top-24 shrink-0 lg:mb-0">
        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white border shadow-sm dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-3xl">
          <div className="pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              {editingId ? t("edit-address") : t("add-address")}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {editingId ? t("edit-address-desc") : t("add-address-desc")}
            </p>
          </div>

          <div className="space-y-4">
            <input name="title" placeholder={t("title")} value={form.title} onChange={handleChange} className={inputClass} required />
            
            <select name="zoneId" value={form.zoneId} onChange={handleChange} className={inputClass} required>
              <option value="" disabled>{t("select-zone")}</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>

            <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
              <option value="home">{t("home")}</option>
              <option value="work">{t("work")}</option>
              <option value="other">{t("other")}</option>
            </select>

            <div className="grid grid-cols-2 gap-4">
              <input name="street" placeholder={t("street")} value={form.street} onChange={handleChange} className={`col-span-2 ${inputClass}`} required />
              <input name="number" placeholder={t("number")} value={form.number} onChange={handleChange} className={inputClass} required />
              <input name="floor" placeholder={t("floor")} value={form.floor} onChange={handleChange} className={inputClass} required />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3.5 font-bold transition-all transform active:scale-[0.98] bg-yellow-400 text-zinc-900 rounded-xl hover:bg-yellow-500 disabled:opacity-70 disabled:active:scale-100 shadow-sm"
            >
              {isLoading ? t("saving") : (editingId ? t("update-address") : t("add-address-btn"))}
            </button>
            
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="w-full px-6 py-3.5 font-bold transition-colors text-zinc-700 bg-zinc-100 rounded-xl hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                {t("cancel")}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* LIST SECTION */}
      <div className="flex-1 w-full lg:w-2/3">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("my-addresses")}</h2>
          <span className="px-3 py-1 text-sm font-semibold rounded-full text-zinc-700 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300">
            {addresses.length}
          </span>
        </div>

        {addresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-3xl border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-center w-16 h-16 mb-4 text-2xl rounded-full bg-zinc-100 dark:bg-zinc-800">
              📍
            </div>
            <p className="text-lg font-medium text-zinc-500 dark:text-zinc-400">{t("no-addresses-found")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {addresses.map((a) => (
              <div 
                key={a.id} 
                className={`flex flex-col justify-between p-5 bg-white dark:bg-zinc-950/50 border rounded-2xl transition-all shadow-sm hover:shadow-md ${editingId === a.id ? 'border-yellow-400 ring-1 ring-yellow-400 dark:border-yellow-500 dark:ring-yellow-500' : 'border-zinc-200 dark:border-zinc-800'}`}
              >
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white line-clamp-1">{a.title}</h3>
                    <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                      {t(a.type)}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                    <p className="flex items-center gap-2"><span className="text-zinc-400">📍</span> {a.street}</p>
                    <div className="flex gap-4">
                      <p className="flex items-center gap-1"><span className="text-zinc-400">#</span> {t("number")} {a.number}</p>
                      <p className="flex items-center gap-1"><span className="text-zinc-400">🏢</span> {t("floor")} {a.floor}</p>
                    </div>
                  </div>
                </div>
                
                {/* أزرار التحكم - تم فصلها بخط لترتيب أفضل */}
                <div className="flex gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                  <button
                    onClick={() => handleEditClick(a)}
                    className="flex-1 px-4 py-2.5 text-sm font-bold text-blue-600 transition-colors rounded-xl bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                  >
                    {t("edit")}
                  </button>
                  <button
                    onClick={() => handleDeleteClick(a.id)}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 text-sm font-bold text-red-600 transition-colors rounded-xl bg-red-50 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50"
                  >
                    {t("delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showDeleteModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="w-full max-w-md p-6 bg-white rounded-2xl dark:bg-zinc-900">
      
      <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
        {t("confirm-delete")}
      </h2>

      <p className="mt-2 text-sm text-zinc-500">
        {t("are-you-sure-delete")}
      </p>

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => setShowDeleteModal(false)}
          className="flex-1 px-4 py-2 font-semibold bg-zinc-100 rounded-xl dark:bg-zinc-800"
        >
          {t("cancel")}
        </button>

        <button
          onClick={confirmDelete}
          className="flex-1 px-4 py-2 font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600"
        >
          {t("delete")}
        </button>
      </div>

    </div>
  </div>
)}
    </div>
  );
};

export default AddressPage;