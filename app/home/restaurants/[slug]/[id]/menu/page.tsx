"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRestaurant } from "@/context/RestaurantContext";
import { useLanguage } from "@/context/LanguageContext";
import { ChevronLeft, Download, FileImage, Loader2, Maximize2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { useRouter } from "next/navigation";

interface MenuImageItem {
  id: string;
  restaurantid: string;
  img: string;
  periorty: number;
  createdAt: string;
  updatedAt: string;
}

export default function MenuImageDownload() {
  const { language } = useLanguage();
  const isRtl = language === "العربية";
  const router = useRouter();

  const { restaurant, isLoading: restaurantLoading } = useRestaurant();

  const [images, setImages] = useState<MenuImageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMenuImages() {
      if (!restaurant?.id) return;

      try {
        setLoading(true);
        const response = await fetch(
          `https://keetobcknd.keeto.org/api/user/image/${restaurant.id}`,
          { cache: "no-store" },
        );
        const result = await response.json();

        if (result.success && result.data?.data) {
          setImages(result.data.data);
        }
      } catch (error) {
        console.error("Error fetching menu images:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!restaurantLoading && restaurant?.id) {
      fetchMenuImages();
    }
  }, [restaurant, restaurantLoading]);

  // ترتيب تصاعدي بناءً على الأولوية لضمان تسلسل الصفحات الصحيح
  const sortedImages = useMemo(() => {
    return [...images].sort((a, b) => a.periorty - b.periorty);
  }, [images]);

  // دالة ذكية لتحميل وتجميع الصور في PDF بأعلى جودة ممكنة (Pixel-Perfect)
  const downloadAsPdf = async () => {
    if (sortedImages.length === 0) return;

    try {
      setDownloadingPdf(true);
      let pdf: jsPDF | null = null;

      for (let i = 0; i < sortedImages.length; i++) {
        const item = sortedImages[i];

        // 1. جلب الصورة كـ Blob آمن لتفادي مشاكل الـ CORS
        const imgBlob = await fetch(item.img).then((res) => res.blob());
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(imgBlob);
        });

        // 2. قراءة الأبعاد الحقيقية والأصلية للصورة للحفاظ على الجودة بنسبة 100%
        const imgDimensions = await new Promise<{
          width: number;
          height: number;
        }>((resolve) => {
          const img = new Image();
          img.onload = () =>
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
          img.src = dataUrl;
        });

        // تحويل الأبعاد من بكسل إلى مليمتر تقريبياً للـ PDF
        const pdfWidth = imgDimensions.width * 0.264583;
        const pdfHeight = imgDimensions.height * 0.264583;

        // 3. إنشاء الـ PDF في أول لفة بأبعاد أول صورة، أو إضافة صفحة جديدة بالأبعاد المناسبة
        if (i === 0) {
          pdf = new jsPDF({
            orientation: pdfWidth > pdfHeight ? "l" : "p",
            unit: "mm",
            format: [pdfWidth, pdfHeight],
          });
        } else if (pdf) {
          pdf.addPage([pdfWidth, pdfHeight], pdfWidth > pdfHeight ? "l" : "p");
        }

        // 4. إضافة الصورة بدون أي ضغط (Compression: NONE) لمنع البكسلة والغبش تمااماً
        if (pdf) {
          pdf.addImage(
            dataUrl,
            "JPEG",
            0,
            0,
            pdfWidth,
            pdfHeight,
            undefined,
            "NONE",
          );
        }
      }

      if (pdf) {
        const restaurantName = isRtl ? restaurant?.nameAr : restaurant?.name;
        pdf.save(`${restaurantName || "menu"}-high-quality.pdf`);
      }
    } catch (error) {
      console.error("Error generating HD PDF:", error);
      alert(
        isRtl
          ? "حدث خطأ أثناء تحميل ملف الـ PDF عالي الجودة"
          : "Failed to download High-Quality PDF",
      );
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (restaurantLoading || (loading && images.length === 0 && restaurant?.id)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
        <p className="text-xs text-zinc-500">
          {isRtl
            ? "جاري جلب صفحات المنيو بأعلى جودة..."
            : "Fetching HD Menu Pages..."}
        </p>
      </div>
    );
  }

  if (sortedImages.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
        <FileImage className="w-10 h-10 mx-auto text-zinc-400 dark:text-zinc-600 mb-2" />
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          {isRtl
            ? "لا توجد صور منيو متاحة حالياً."
            : "No menu images available."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 duration-500 animate-in fade-in zoom-in-95">
      <button
        onClick={() => router.back()}
        className="absolute z-20 flex items-center justify-center w-10 h-10 transition-transform bg-yellow-400 rounded-full shadow-md mt-24 top-4 left-4 active:scale-95"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
      {/* زر التحميل بتقنية الـ HD */}
      <button
        onClick={downloadAsPdf}
        disabled={downloadingPdf}
        className="w-full py-4 bg-yellow-400 disabled:bg-yellow-400/50 text-black rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-3 transition-all active:scale-95 hover:bg-yellow-500"
      >
        {downloadingPdf ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Download size={18} />
        )}
        {downloadingPdf
          ? isRtl
            ? "جاري معالجة الصور بجودة فائقة..."
            : "Processing Ultra-HQ PDF..."
          : isRtl
            ? "تحميل المنيو كـ PDF عالي الجودة"
            : "Download High-Quality PDF"}
      </button>

      {/* شبكة عرض الصور المحسنة للمتصفحات */}
      <div className=" mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {sortedImages.map((item, index) => (
          <div
            key={item.id}
            className="relative bg-zinc-100 dark:bg-zinc-900/60 border border-gray-200/60 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm group hover:shadow-md transition-all flex flex-col justify-center items-center p-2"
          >
            {/* رقم الصفحة */}
            <span className="absolute top-4 left-4 bg-black/70 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md z-10 select-none">
              {isRtl ? `صفحة ${index + 1}` : `Page ${index + 1}`}
            </span>

            {/* زر تكبير ومعاينة الصورة الفردية بجودتها الكاملة */}
            <button
              onClick={() => setPreviewImage(item.img)}
              className="absolute top-4 right-4 p-2 bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-md z-10"
              title="Preview Image"
            >
              <Maximize2 size={14} />
            </button>

            {/* حاوي الصورة المحسن هندسياً */}
            <div className="w-full h-auto relative overflow-hidden rounded-xl">
              <img
                src={item.img}
                alt={`Menu page ${index + 1}`}
                // هنا يكمن سر الجودة في العرض: الحفاظ على أبعاد العرض الاحترافية وعمل رندر عالي الدقة
                className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                style={{ imageRendering: "high-quality" }}
                loading="lazy"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox / Modal لمعاينة الصورة المنفردة بكامل جودتها وعمل زووم */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <img
              src={previewImage}
              alt="Menu Preview"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              style={{ imageRendering: "high-quality" }}
            />
            <p className="absolute bottom-2 text-zinc-500 text-xs text-center w-full">
              {isRtl ? "اضغط في أي مكان للإغلاق" : "Click anywhere to close"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
