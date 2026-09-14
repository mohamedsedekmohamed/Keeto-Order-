"use client";
import useGet from "@/app/hooks/useGet";
import { Tag, BadgePercent, ChevronLeft } from "lucide-react";
import Loading from "@/components/Loading";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";

interface DiscountDetails {
  id: string;
  name: string;
  nameAr: string;
  type: "percentage" | "fixed_amount" | string;
  value: number;
  maxDiscount?: number;
  isGlobal?: boolean;
  source?: string;
}

interface BranchRef {
  id: string;
  name: string;
  nameAr: string;
  nameFr: string;
}

interface RestaurantOffer {
  id: string;
  name: string;
  nameAr: string;
  nameFr: string;
  description: string;
  descriptionAr: string;
  descriptionFr: string;
  price: number;
  discountType: "percentage" | "fixed_amount" | string;
  discountValue: number;
  discountPrice: number;
  discountNote?: string;
  discountDetails?: DiscountDetails;
  image: string | null;
  isOutOfStock: boolean;
  points: number | null;
  isFavorite: boolean;
  variations: unknown[];
  addons: unknown[];
  unavailableBranches: BranchRef[];
  category?: {
    id: string;
    name: string;
    nameAr: string;
    nameFr: string;
  };
  subcategory?: {
    id: string;
    name: string;
    nameAr: string;
    nameFr: string;
    image?: string | null;
    order_level?: number;
  };
}

interface ApiEnvelope {
  success: boolean;
  message: string;
  data: RestaurantOffer[];
}

const RestaurantOffers = () => {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.id as string;
  const { t } = useLanguage();
  const { data, loading } = useGet<ApiEnvelope>(
    `/api/user/offers/restaurant/${restaurantId}/offers`,
  );

  if (loading) return <Loading />;

  const offers: RestaurantOffer[] = Array.isArray(data?.data) ? data.data : [];

  return (
    <div className="p-6">
      <button
        onClick={() => router.back()}
        className="flex items-center justify-center w-10 h-10 transition-transform bg-yellow-400 rounded-full shadow-md active:scale-95 text-white"
      >
        <ChevronLeft className="w-6 h-6 transform rotate-0 rtl:rotate-180" />
      </button>
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Tag className="text-indigo-600" />
        {t("currentOffers") || "Current Offers"}
      </h2>

      {offers.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          {t("noOffersAvailable") || "No offers available"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map((offer, index) => {
            const displayPrice =
              typeof offer.discountPrice === "number" && offer.discountPrice > 0
                ? offer.discountPrice
                : offer.discountType === "fixed_amount"
                  ? Math.max(offer.price - offer.discountValue, 0)
                  : offer.discountType === "percentage"
                    ? Math.max(
                        offer.price - (offer.price * offer.discountValue) / 100,
                        0,
                      )
                    : offer.price;

            const label =
              offer.discountType === "percentage"
                ? `${offer.discountValue}%`
                : offer.discountType === "fixed_amount"
                  ? `OFF ${offer.discountValue}`
                  : `OFF ${offer.discountValue}`;

            return (
              <div
                key={offer.id ?? `${offer.name}-${index}`}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg text-slate-800">
                    {offer.name}
                  </h3>
                  <span className="px-2 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-lg flex items-center gap-1">
                    <BadgePercent size={14} />
                    {label}
                  </span>
                </div>

                <div className="text-sm text-slate-500 mb-4">
                  {t("deal") || "Deal:"}{" "}
                  <span className="font-medium text-slate-700">
                    {offer.discountDetails?.name ||
                      offer.discountNote ||
                      t("offer") ||
                      "Offer"}
                  </span>
                </div>

                {offer.image ? (
                  <div className="w-full h-40 rounded-xl mb-4 overflow-hidden relative">
                    <Image
                      src={offer.image}
                      alt={offer.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                ) : null}

                {offer.isOutOfStock ? (
                  <div className="flex items-center gap-2 text-rose-500 text-xs font-bold mb-3">
                    <span>{t("outOfStock") || "Out of stock"}</span>
                  </div>
                ) : null}

                <div className="flex items-center gap-3">
                  <span className="text-slate-400 line-through text-sm">
                    EGP{Number(offer.price).toFixed(2)}
                  </span>
                  <span className="text-xl font-bold text-yellow-400">
                    EGP{Number(displayPrice).toFixed(2)}
                  </span>
                </div>

                <div className="text-xs text-slate-500 mt-3">
                  {offer.unavailableBranches?.length ? (
                    <span>
                      {t("availableIn") || "Available in"}{" "}
                      {offer.unavailableBranches.length}{" "}
                      {offer.unavailableBranches.length > 1
                        ? t("branches") || "branches"
                        : t("branch") || "branch"}
                    </span>
                  ) : (
                    <span>
                      {t("availableAcrossBranches") ||
                        "Available across branches"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RestaurantOffers;
