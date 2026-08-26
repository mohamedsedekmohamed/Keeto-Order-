"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useGet from "@/app/hooks/useGet"; // adjust path as needed
import { getRestaurantId } from "@/context/Restaurantid"; // adjust path as needed
import { ChevronLeft } from "lucide-react";
type PolicyResponse = {
  success: boolean;
  data: {
    message: string;
    data: {
      id: string;
      title: string;
      description: string;
      type: string;
      restaurantId: string;
      createdAt: string;
      updatedAt: string;
    };
  };
};

export default function PolicyPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const router = useRouter();
  const [restaurantId, setRestaurantIdState] = useState<string | null>(null);

  useEffect(() => {
    setRestaurantIdState(getRestaurantId(slug));
  }, [slug]);

  const { data, loading, error, refetch } = useGet<PolicyResponse>(
    restaurantId ? `/api/user/policy/${restaurantId}` : null,
  );

  const policy = data?.data?.data;

  // Modern Skeleton Loader
  if (loading || !restaurantId) {
    return (
      <main className="min-h-[70vh] bg-slate-50/50 py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-10">
          <div className="animate-pulse space-y-6">
            <div className="space-y-3">
              <div className="h-4 w-20 rounded-full bg-slate-200" />
              <div className="h-8 w-3/4 rounded-lg bg-slate-200" />
              <div className="h-4 w-32 rounded bg-slate-100" />
            </div>
            <div className="my-6 border-t border-slate-100" />
            <div className="space-y-3">
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-11/12 rounded bg-slate-100" />
              <div className="h-4 w-4/5 rounded bg-slate-100" />
              <div className="h-4 w-full rounded bg-slate-100" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Modern Error State
  if (error) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-slate-50/50 px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-rose-100 bg-white p-8 text-center shadow-xl shadow-rose-500/5">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.75"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">
            Unable to load policy
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {error ||
              "An unexpected error occurred while fetching the policy document."}
          </p>
          <button
            onClick={refetch}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 active:scale-[0.98]"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            Try again
          </button>
        </div>
      </main>
    );
  }

  // Modern Empty State
  if (!policy) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-slate-50/50 px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-xl shadow-slate-200/50">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.75"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">
            No Policy Available
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            This store has not published any policies yet.
          </p>
        </div>
      </main>
    );
  }

  const formattedDate = new Date(policy.updatedAt).toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  return (
    <main className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:py-16">
      <button
        onClick={() => router.back()}
        className="flex items-center justify-center w-10 h-10 transition-transform bg-yellow-400 -mr-2 rounded-full shadow-md active:scale-95 text-white"
      >
        <ChevronLeft className="w-6 h-6 transform rotate-0 rtl:rotate-180" />
      </button>
      <div className="mx-auto max-w-3xl">
        {/* Main Card Container */}
        <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-10">
          {/* Header Section */}
          <header className="border-b border-slate-100 pb-6 sm:pb-8">
            <span className="mb-3 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600">
              {slug} Policy
            </span>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              {policy.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <svg
                  className="h-4 w-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Last updated {formattedDate}
              </span>
            </div>
          </header>

          {/* Content Body Section */}
          <div className="prose prose-slate max-w-none pt-6 sm:pt-8">
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 sm:text-base sm:leading-8">
              {policy.description}
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
