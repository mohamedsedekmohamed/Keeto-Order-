"use client";

import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "../../../context/LanguageContext";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

export default function RefundPolicyPage() {
  const { language } = useLanguage();
  const isRTL = language === "العربية";
  const router = useRouter();
  const params = useParams();
  const restaurantName = params?.slug as string;
  const basePath = restaurantName
    ? `/home/restaurants/${restaurantName}`
    : "/home";

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const content = {
    en: {
      title: "Refund Policy",
      updated: "Last updated: September 2026",
      intro:
        "Keeto is a food ordering platform operating in Alexandria, Egypt, connecting customers with local restaurants and cafés. This Refund Policy explains when and how you may be entitled to a refund for orders placed through Keeto.",
      sections: [
        {
          heading: "1. Eligibility for a Refund",
          icon: "check",
          body: "You may be eligible for a full or partial refund in the following cases:",
          items: [
            "Your order was not delivered within a reasonable time and the restaurant or courier confirms it will not arrive.",
            "You received the wrong order, missing items, or items that differ substantially from what you ordered.",
            "The food arrived spoiled, damaged, or unsafe to eat.",
            "The order was cancelled by the restaurant after payment was taken.",
            "You were charged more than once for the same order (duplicate charge).",
          ],
        },
        {
          heading: "2. Situations Not Covered",
          icon: "cross",
          body: "Refunds are generally not provided for:",
          items: [
            "A change of mind after the restaurant has already started preparing the order.",
            "Delays caused by incorrect delivery details provided by the customer.",
            "Minor differences in portion size, presentation, or ingredients that are within the restaurant's normal preparation standards.",
            "Orders marked as delivered and confirmed received by the customer, unless a valid issue is reported within the timeframe below.",
            "If the order in preparing status at the restaurant, it is not eligible for a refund.",
          ],
        },
        {
          heading: "3. How to Request a Refund",
          icon: "clock",
          body: "To request a refund, contact Keeto support through the app or the channels listed below within 24 hours of receiving your order. Please include your order number, a description of the issue, and photos of the item if it relates to food quality, damage, or a wrong item.",
        },
        {
          heading: "4. Refund Review & Timeframe",
          icon: "clock",
          body: "Once submitted, refund requests are typically reviewed within 2–5 business days. Approved refunds are returned to your original payment method or Keeto wallet, depending on how the order was paid. Bank and card refunds may take additional time to appear depending on your bank's processing period.",
        },
        {
          heading: "5. Cancellations",
          icon: "check",
          body: "Orders can usually be cancelled free of charge if the restaurant has not yet started preparing them. Once preparation has begun, cancellation may no longer be possible, and the order will be treated under the standard refund eligibility rules above.",
        },
        {
          heading: "6. Changes to This Policy",
          icon: "clock",
          body: "Keeto may update this Refund Policy from time to time to reflect changes in our services or applicable regulations in Egypt. The updated version will be posted on this page with a new effective date.",
        },
      ],
      contactHeading: "Contact Us",
      contactIntro:
        "For refund requests or questions about this policy, reach out to our support team:",
      location: "Alexandria, Egypt",
      backLabel: "Back",
    },
    ar: {
      title: "سياسة الاسترجاع",
      updated: "آخر تحديث: سبتمبر 2026",
      intro:
        "كيتو منصة لطلب الطعام تعمل في مدينة الإسكندرية، جمهورية مصر العربية، وتربط العملاء بالمطاعم والمقاهي المحلية. توضح سياسة الاسترجاع هذه متى وكيف يمكنك الحصول على استرداد لمبلغ طلباتك عبر كيتو.",
      sections: [
        {
          heading: "١. الحالات المستحقة للاسترجاع",
          icon: "check",
          body: "يمكنك التقدم بطلب استرداد كامل أو جزئي في الحالات التالية:",
          items: [
            "عدم وصول الطلب خلال وقت معقول، مع تأكيد المطعم أو مندوب التوصيل بعدم إمكانية توصيله.",
            "استلام طلب خاطئ، أو نقص في الأصناف، أو اختلاف واضح عمّا تم طلبه.",
            "وصول الطعام تالفًا أو غير صالح للاستهلاك.",
            "إلغاء الطلب من قِبل المطعم بعد سداد المبلغ.",
            "خصم المبلغ أكثر من مرة لنفس الطلب (خصم مكرر).",
          ],
        },
        {
          heading: "٢. حالات لا تشملها السياسة",
          icon: "cross",
          body: "لا يتم عادةً استرداد المبلغ في الحالات التالية:",
          items: [
            "تغيير الرأي بعد أن يكون المطعم قد بدأ بالفعل في تجهيز الطلب.",
            "التأخير الناتج عن بيانات توصيل غير صحيحة تم إدخالها من قِبل العميل.",
            "اختلافات بسيطة في حجم الحصة أو طريقة التقديم أو المكونات، طالما أنها ضمن المعايير المعتادة للمطعم.",
            "الطلبات التي تم تسليمها وتأكيد استلامها من العميل، ما لم يتم الإبلاغ عن مشكلة حقيقية خلال المدة المحددة أدناه.",
            "في حالة وصول الطلب لحالة التحضير في المطعم"
          ],
        },
        {
          heading: "٣. كيفية تقديم طلب استرداد",
          icon: "clock",
          body: "لتقديم طلب استرداد، تواصل مع دعم كيتو عبر التطبيق أو وسائل التواصل الموضحة أدناه خلال 24 ساعة من استلام الطلب. يُرجى إرفاق رقم الطلب، ووصف المشكلة، وصور للصنف إذا كانت المشكلة متعلقة بجودة الطعام أو تلفه أو خطأ في الصنف.",
        },
        {
          heading: "٤. مراجعة الطلب والمدة الزمنية",
          icon: "clock",
          body: "بعد تقديم الطلب، تتم مراجعته عادةً خلال 2 إلى 5 أيام عمل. يتم إعادة المبلغ المعتمد إلى وسيلة الدفع الأصلية أو محفظة كيتو، حسب طريقة الدفع المستخدمة. قد تستغرق التحويلات البنكية أو الخاصة بالبطاقات وقتًا إضافيًا للظهور حسب مدة معالجة البنك.",
        },
        {
          heading: "٥. الإلغاء",
          icon: "check",
          body: "يمكن عادةً إلغاء الطلب دون أي رسوم إذا لم يكن المطعم قد بدأ في تجهيزه بعد. وبمجرد بدء التجهيز، قد لا يكون الإلغاء متاحًا، ويُعامل الطلب حينها وفقًا لقواعد استحقاق الاسترداد الموضحة أعلاه.",
        },
        {
          heading: "٦. التعديلات على هذه السياسة",
          icon: "clock",
          body: "قد تقوم كيتو بتحديث سياسة الاسترجاع من وقت لآخر لتعكس أي تغييرات في خدماتنا أو الأنظمة المعمول بها في مصر. سيتم نشر النسخة المحدثة على هذه الصفحة مع تاريخ سريان جديد.",
        },
      ],
      contactHeading: "تواصل معنا",
      contactIntro:
        "لتقديم طلب استرداد أو للاستفسار عن هذه السياسة، يمكنك التواصل مع فريق الدعم:",
      location: "الإسكندرية، مصر",
      backLabel: "رجوع",
    },
  };

  const c = isRTL ? content.ar : content.en;

  const iconFor = (icon: string) => {
    if (icon === "check")
      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    if (icon === "cross") return <XCircle className="w-5 h-5 text-red-500" />;
    return <Clock className="w-5 h-5 text-yellow-500" />;
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="relative min-h-screen px-4 py-8 pb-24 overflow-hidden transition-colors duration-300 bg-gray-50 dark:bg-zinc-950"
    >
      <div className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] bg-yellow-400/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto space-y-8">
        {/* Logo */}
        <Link
          href="/home"
         
          className="block w-fit mx-auto"
        >
          <Image
            src="/main.webp"
            alt="KeeTo Logo"
            width={128} // تعادل w-32
            height={128} // تعادل h-32
            className="mx-auto"
          />
        </Link>

        {/* Back + Title */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => router.push(basePath)}
            className="flex items-center gap-1.5 w-fit text-sm font-semibold text-gray-500 dark:text-zinc-400 hover:text-yellow-500 transition-colors"
          >
            <BackIcon size={16} />
            {c.backLabel}
          </button>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="flex items-center justify-center w-12 h-12 text-yellow-500 bg-yellow-50 dark:bg-yellow-400/10 rounded-2xl">
              <RotateCcw size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white md:text-3xl">
                {c.title}
              </h1>
              <p className="text-xs font-medium text-gray-400 dark:text-zinc-500">
                {c.updated}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 rounded-3xl shadow-sm"
        >
          <p className="text-sm leading-relaxed text-gray-600 dark:text-zinc-300">
            {c.intro}
          </p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-4">
          {c.sections.map((section, i) => (
            <motion.div
              key={section.heading}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-6 bg-white border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 rounded-3xl shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                {iconFor(section.icon)}
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  {section.heading}
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-zinc-300">
                {section.body}
              </p>
              {"items" in section && section.items && (
                <ul className="mt-3 space-y-2">
                  {section.items.map((item) => (
                    <li
                      key={item}
                      className={`flex items-start gap-2 text-sm text-gray-600 dark:text-zinc-400 ${
                        isRTL ? "text-right" : "text-left"
                      }`}
                    >
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          ))}
        </div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 rounded-3xl shadow-sm"
        >
          <h2 className="mb-2 text-base font-bold text-gray-900 dark:text-white">
            {c.contactHeading}
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-zinc-300">
            {c.contactIntro}
          </p>
          <div className="flex flex-col gap-3 text-sm text-gray-600 dark:text-zinc-300">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-yellow-500 flex-shrink-0" />
              <span>support@keeto.org</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-yellow-500 flex-shrink-0" />
              <span dir="ltr">+20 1111771103</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-yellow-500 flex-shrink-0" />
              <span>{c.location}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}