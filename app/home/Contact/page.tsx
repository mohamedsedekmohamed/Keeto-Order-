"use client";

import { useState } from "react";

/**
 * ContactKeeto
 * ------------
 * Bilingual (EN/AR) "Contact Us" page for Keeto.
 * Shares the same type system and palette as the About page component
 * (Fraunces/Inter for English, Cairo/Tajawal for Arabic) so the two
 * pages feel like one product.
 *
 * Usage: drop into any Next.js app router page, e.g. app/contact/page.tsx
 *   import ContactKeeto from "@/components/ContactKeeto";
 *   export default function Page() { return <ContactKeeto />; }
 *
 * Requires Tailwind CSS to already be configured in the project.
 * Fill in the bracketed placeholders (phone number, support hours) before shipping.
 */

type Lang = "en" | "ar";

type ContactRow = { label: string; value: string; href?: string };

type ContactCard = {
  title: string;
  lead: string;
  rows: ContactRow[];
  note: string;
};

const content: Record<
  Lang,
  {
    dir: "ltr" | "rtl";
    toggleLabel: string;
    eyebrow: string;
    heroTitle: string;
    heroLead: string;
    heroBody: string;
    sectionTitle: string;
    cards: ContactCard[];
  }
> = {
  en: {
    dir: "ltr" as const,
    toggleLabel: "العربية",
    eyebrow: "Contact Us",
    heroTitle: "We're here to help.",
    heroLead:
      "Have a question about your order, a restaurant, payment, or using Keeto?",
    heroBody:
      "Our team is here to help. Get in touch with us and we'll do our best to assist you as quickly as possible.",
    sectionTitle: "Get in touch",
    cards: [
      {
        title: "Customer support",
        lead: "For questions or issues regarding your order, please contact our support team.",
        rows: [
          {
            label: "Email",
            value: "support@keeto.com",
            href: "mailto:support@keeto.com",
          },
          { label: "Phone", value: "[Phone Number]" },
          { label: "Support hours", value: "[Days & Hours]" },
        ],
        note: "When contacting us about an order, please include your order number so we can help you faster.",
      },
      {
        title: "General enquiries",
        lead: "For general questions, feedback, business enquiries, or partnership opportunities:",
        rows: [
          {
            label: "Email",
            value: "info@keeto.com",
            href: "mailto:info@keeto.com",
          },
        ],
        note: "",
      },
    ],
  },
  ar: {
    dir: "rtl" as const,
    toggleLabel: "English",
    eyebrow: "تواصل معنا",
    heroTitle: "نحن هنا للمساعدة.",
    heroLead:
      "هل لديك سؤال حول طلبك، أو أحد المطاعم، أو الدفع، أو استخدام كيتو؟",
    heroBody:
      "فريقنا هنا لمساعدتك. تواصل معنا وسنبذل قصارى جهدنا لمساعدتك في أسرع وقت ممكن.",
    sectionTitle: "تواصل معنا",
    cards: [
      {
        title: "دعم العملاء",
        lead: "لأي أسئلة أو مشاكل تتعلق بطلبك، يرجى التواصل مع فريق الدعم لدينا.",
        rows: [
          {
            label: "البريد الإلكتروني",
            value: "support@keeto.com",
            href: "mailto:support@keeto.com",
          },
          { label: "الهاتف", value: "[رقم الهاتف]" },
          { label: "ساعات الدعم", value: "[الأيام والساعات]" },
        ],
        note: "عند التواصل معنا بخصوص طلب ما، يرجى إرفاق رقم الطلب حتى نتمكن من مساعدتك بشكل أسرع.",
      },
      {
        title: "استفسارات عامة",
        lead: "للأسئلة العامة، أو الملاحظات، أو استفسارات الأعمال، أو فرص الشراكة:",
        rows: [
          {
            label: "البريد الإلكتروني",
            value: "info@keeto.com",
            href: "mailto:info@keeto.com",
          },
        ],
        note: "",
      },
    ],
  },
};

export default function ContactKeeto() {
  const [lang, setLang] = useState<Lang>("en");
  const t = content[lang];
  const isAr = lang === "ar";

  return (
    <>
      {/* Fonts: Fraunces + Inter for Latin, Cairo + Tajawal for Arabic */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=Cairo:wght@500;600;700&family=Tajawal:wght@400;500;700&display=swap"
        rel="stylesheet"
      />

      <div
        dir={t.dir}
        lang={lang}
        className="min-h-screen"
        style={{
          backgroundColor: "#FBF7EF",
          color: "#1E241F",
          fontFamily: isAr ? "'Tajawal', sans-serif" : "'Inter', sans-serif",
        }}
      >
        <div className="mx-auto max-w-3xl px-6 py-16 sm:px-10 sm:py-24">
          {/* Language toggle */}
          <div
            className={`mb-16 flex ${isAr ? "justify-start" : "justify-end"}`}
          >
            <button
              onClick={() => setLang(isAr ? "en" : "ar")}
              className="rounded-full border px-4 py-1.5 text-sm transition-colors hover:bg-[#3E5C4C] hover:text-[#FBF7EF]"
              style={{ borderColor: "#3E5C4C", color: "#3E5C4C" }}
            >
              {t.toggleLabel}
            </button>
          </div>

          {/* Hero */}
          <p
            className="mb-4 text-sm tracking-wide"
            style={{ color: "#B97A2A" }}
          >
            {t.eyebrow}
          </p>
          <h1
            className="mb-6 text-4xl leading-[1.15] sm:text-5xl"
            style={{
              fontFamily: isAr ? "'Cairo', sans-serif" : "'Fraunces', serif",
              fontWeight: isAr ? 700 : 600,
              color: "#1E241F",
            }}
          >
            {t.heroTitle}
          </h1>
          <p
            className="mb-4 text-lg leading-relaxed"
            style={{ color: "#3E5C4C" }}
          >
            {t.heroLead}
          </p>
          <p className="text-base leading-relaxed opacity-90">{t.heroBody}</p>

          <hr className="my-14" style={{ borderColor: "#DDD3BE" }} />

          {/* Get in touch */}
          <h2
            className="mb-8 text-2xl"
            style={{
              fontFamily: isAr ? "'Cairo', sans-serif" : "'Fraunces', serif",
              fontWeight: isAr ? 700 : 600,
            }}
          >
            {t.sectionTitle}
          </h2>

          <div className="space-y-12">
            {t.cards.map((card) => (
              <div
                key={card.title}
                className="border-t pt-8"
                style={{ borderColor: "#DDD3BE" }}
              >
                <h3
                  className="mb-3 text-xl"
                  style={{
                    fontFamily: isAr
                      ? "'Cairo', sans-serif"
                      : "'Fraunces', serif",
                    fontWeight: isAr ? 700 : 600,
                  }}
                >
                  {card.title}
                </h3>
                <p className="mb-5 text-base leading-relaxed opacity-90">
                  {card.lead}
                </p>

                <dl className="space-y-2">
                  {card.rows.map((row) => (
                    <div
                      key={row.label}
                      className="flex flex-col gap-1 sm:flex-row sm:gap-6"
                    >
                      <dt
                        className="shrink-0 text-base font-medium sm:w-32"
                        style={{ color: "#B97A2A" }}
                      >
                        {row.label}
                      </dt>
                      <dd className="text-base leading-relaxed">
                        {row.href ? (
                          <a
                            href={row.href}
                            className="underline decoration-[#DDD3BE] underline-offset-4 hover:decoration-current"
                          >
                            {row.value}
                          </a>
                        ) : (
                          <span className="opacity-90">{row.value}</span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>

                {card.note && (
                  <p className="mt-5 text-sm leading-relaxed opacity-70">
                    {card.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
