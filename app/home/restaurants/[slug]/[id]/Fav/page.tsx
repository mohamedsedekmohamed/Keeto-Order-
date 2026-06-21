"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Heart, ChevronLeft } from "lucide-react";
import Loading from "@/components/Loading";
import { useLanguage } from "@/context/LanguageContext";
import toast from "react-hot-toast";
import usePost from "@/app/hooks/usePost";
import { useRouter, useParams, useSearchParams } from "next/navigation"; // 👈 ضفنا useParams لقط الـ slug من الـ Path
import { useToken } from "@/context/TokenContext";

interface FavoriteFood {
  id: string;
  name: string;
  nameAr: string;
  image: string;
  description: string;
  price: string;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteFood[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams(); // 👈 لقط الـ slug لو كان في مسار الرابط الأساسي مثل /restaurants/[slug]/Fav
  const searchParams = useSearchParams(); // 👈 لقط الـ slug لو كان كـ query parameter مثل ?callbackSlug=zzz
  const { language, t } = useLanguage();
  const { postData: toggleFav } = usePost("/api/user/favlist/toggle");
  const isRtl = language === "العربية";

  const { getToken, isReady } = useToken();

  // 👈 دمج ذكي: جلب الـ slug سواء من الـ Path أو من الـ Query Parameter
  const restaurantSlug = 
    (params?.slug as string) || 
    (searchParams?.get("callbackSlug") as string) || 
    "";

  // جلب التوكن بناءً على الـ slug المستخرج بدقة
  const token = getToken(restaurantSlug);

  useEffect(() => {
    if (isReady) {
      if (token) {
        fetchFavorites();
      } else {
        setLoading(false);
        toast.error(t("pleaseSignIn") || "يرجى تسجيل الدخول أولاً");
      }
    }
    // الـ Hook مش هيتكرر "عمال على بطال" لأننا بنراقب الجاهزية والتوكن بشكل مستقر
  }, [isReady, token]); 

  const fetchFavorites = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        "https://keetobcknd.keeto.org/api/user/favlist",
        {
          headers: {
            Authorization: `Bearer ${token}`, // 👈 إرسال التوكن المظبوط للمطعم الحالي
          },
        },
      );

      setFavorites(res?.data?.data?.data?.foods || []);
    } catch (error) {
      console.error(error);
      toast.error("فشل تحميل المفضلة");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (foodId: string) => {
    try {
      await toggleFav({ foodId }, null, t("removed From Favorites"));
      setFavorites((prev) => prev.filter((item) => item.id !== foodId));
    } catch (error) {
      toast.error("حدث خطأ أثناء الإزالة");
    }
  };

  if (!isReady || loading) return <Loading />;

  return (
    <div className="min-h-screen px-4 py-6 bg-gray-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 transition-transform bg-yellow-400 rounded-full shadow-md active:scale-95"
          >
            <ChevronLeft className={`w-6 h-6 text-white ${isRtl ? "rotate-180" : ""}`} />
          </button>
          
          <div className="flex items-center gap-2">
            <Heart className="text-red-500 fill-red-500" />
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">
              {t("favorites")}
            </h1>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Heart
              size={60}
              className="mb-4 text-gray-300 dark:text-zinc-700"
            />
            <p className="text-lg font-bold text-gray-400">
              {t("noFavorites")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {favorites.map((item) => (
              <div
                key={item.id}
                className="p-4 transition bg-white border border-gray-100 shadow-sm dark:bg-zinc-900 rounded-3xl dark:border-zinc-800 hover:shadow-md"
              >
                <div className="relative w-full h-52 mb-4 overflow-hidden rounded-2xl">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="object-cover w-full h-full"
                  />
                </div>

                <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                  {isRtl ? item.nameAr : item.name}
                </h2>

                <p className="mb-4 text-sm text-gray-500 dark:text-zinc-400 line-clamp-2">
                  {item.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="font-black text-yellow-500">
                    {item.price} E£
                  </span>

                  <button
                    onClick={() => handleRemoveFavorite(item.id)}
                    className="p-2 transition bg-red-100 rounded-full cursor-pointer dark:bg-red-500/10 hover:scale-110"
                  >
                    <Heart size={18} className="text-red-500 fill-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}