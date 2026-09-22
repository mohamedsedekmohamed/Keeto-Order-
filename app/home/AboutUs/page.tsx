"use client";

import { useState } from "react";

/**
 * AboutKeeto
 * -----------
 * Bilingual (EN/AR) "About" page for Keeto.
 * Toggling the language also flips the document direction (LTR <-> RTL)
 * and swaps the type system: Fraunces/Inter for English, Cairo/Tajawal for Arabic.
 *
 * Usage: drop into any Next.js app router page, e.g. app/about/page.tsx
 *   import AboutKeeto from "@/components/AboutKeeto";
 *   export default function Page() { return <AboutKeeto />; }
 *
 * Requires Tailwind CSS to already be configured in the project.
 * Fonts are loaded from Google Fonts via <link> tags in the component
 * for portability; if you prefer next/font, swap those out.
 */

type Lang = "en" | "ar";

const content = {
  en: {
    dir: "ltr" as const,
    toggleLabel: "العربية",
    eyebrow: "About Keeto",
    heroTitle: "Making food ordering simple.",
    heroLead:
      "Keeto is a simple and convenient way to discover restaurants and order the food you love.",
    heroBody:
      "Keeto connects customers with restaurants through one easy-to-use online platform. Whether you're craving a quick meal, ordering dinner for the family, or discovering a new restaurant, Keeto helps make the ordering process easier from start to finish.",
    whatWeDo: {
      title: "What we do",
      lead: "We bring customers and restaurants together.",
      body: "With Keeto, you can explore participating restaurants, browse their menus, choose your favorite meals, place an order, and receive updates about your order — all through our website. Our goal is to make food ordering easy, convenient, and accessible, while helping restaurants reach more customers and grow their businesses.",
    },
    columns: [
      {
        title: "For customers",
        lead: "We want ordering food to be straightforward.",
        body: "Keeto gives you a convenient place to discover restaurants, view available meals, compare options, and place your order without having to contact each restaurant separately.",
      },
      {
        title: "For restaurants",
        lead: "Keeto helps restaurants connect with customers online and expand their reach.",
        body: "Restaurants can showcase their menus, receive orders, and provide their customers with a convenient digital ordering experience.",
      },
    ],
    mission: {
      title: "Our mission",
      lead: "Our mission is simple:",
      body: "To connect people with great food and restaurants through a convenient, reliable, and easy-to-use online ordering platform. We are continuously working to improve Keeto and create a better experience for both customers and restaurant partners.",
    },
    why: {
      title: "Why Keeto?",
      items: [
        { term: "Simple", desc: "Easy restaurant and menu discovery." },
        { term: "Convenient", desc: "Order online from wherever you are." },
        {
          term: "Connected",
          desc: "Bringing customers and restaurants together.",
        },
        { term: "Reliable", desc: "Clear order information and updates." },
        {
          term: "Growing",
          desc: "Continuously improving to serve our customers and restaurant partners better.",
        },
      ],
    },
  },
  ar: {
    dir: "rtl" as const,
    toggleLabel: "English",
    eyebrow: "عن كيتو",
    heroTitle: "نجعل طلب الطعام أمرًا بسيطًا.",
    heroLead:
      "كيتو هي طريقة بسيطة ومريحة لاكتشاف المطاعم وطلب الطعام الذي تحبه.",
    heroBody:
      "يربط كيتو العملاء بالمطاعم من خلال منصة إلكترونية واحدة سهلة الاستخدام. سواء كنت تشتهي وجبة سريعة، أو تطلب عشاء للعائلة، أو تكتشف مطعمًا جديدًا، يساعدك كيتو على جعل عملية الطلب أسهل من البداية إلى النهاية.",
    whatWeDo: {
      title: "ماذا نفعل",
      lead: "نجمع بين العملاء والمطاعم.",
      body: "مع كيتو، يمكنك استكشاف المطاعم المشاركة، وتصفح قوائم طعامها، واختيار وجباتك المفضلة، وتقديم طلبك، ومتابعة تحديثات طلبك — كل ذلك من خلال موقعنا الإلكتروني. هدفنا هو جعل طلب الطعام سهلاً ومريحًا ومتاحًا للجميع، مع مساعدة المطاعم على الوصول إلى مزيد من العملاء وتنمية أعمالها.",
    },
    columns: [
      {
        title: "للعملاء",
        lead: "نريد أن يكون طلب الطعام أمرًا بسيطًا ومباشرًا.",
        body: "يمنحك كيتو مكانًا مريحًا لاكتشاف المطاعم، ومشاهدة الوجبات المتاحة، ومقارنة الخيارات، وتقديم طلبك دون الحاجة للتواصل مع كل مطعم على حدة.",
      },
      {
        title: "للمطاعم",
        lead: "يساعد كيتو المطاعم على التواصل مع العملاء عبر الإنترنت وتوسيع نطاق وصولها.",
        body: "يمكن للمطاعم عرض قوائم طعامها، واستقبال الطلبات، وتقديم تجربة طلب رقمية مريحة لعملائها.",
      },
    ],
    mission: {
      title: "مهمتنا",
      lead: "مهمتنا بسيطة:",
      body: "ربط الناس بالطعام الرائع والمطاعم من خلال منصة طلب إلكترونية مريحة وموثوقة وسهلة الاستخدام. نعمل باستمرار على تطوير كيتو وخلق تجربة أفضل لكل من العملاء وشركاء المطاعم.",
    },
    why: {
      title: "لماذا كيتو؟",
      items: [
        { term: "بساطة", desc: "اكتشاف سهل للمطاعم وقوائم الطعام." },
        { term: "راحة", desc: "اطلب عبر الإنترنت من أي مكان." },
        { term: "تواصل", desc: "نجمع بين العملاء والمطاعم." },
        { term: "موثوقية", desc: "معلومات وتحديثات واضحة عن الطلب." },
        {
          term: "نمو مستمر",
          desc: "نتطور باستمرار لخدمة عملائنا وشركائنا من المطاعم بشكل أفضل.",
        },
      ],
    },
  },
};

export default function AboutKeeto() {
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

          {/* What we do */}
          <Section
            title={t.whatWeDo.title}
            lead={t.whatWeDo.lead}
            body={t.whatWeDo.body}
            isAr={isAr}
          />

          <hr className="my-14" style={{ borderColor: "#DDD3BE" }} />

          {/* For customers / For restaurants */}
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 sm:gap-10">
            {t.columns.map((col) => (
              <div key={col.title}>
                <h2
                  className="mb-3 text-xl"
                  style={{
                    fontFamily: isAr
                      ? "'Cairo', sans-serif"
                      : "'Fraunces', serif",
                    fontWeight: isAr ? 700 : 600,
                  }}
                >
                  {col.title}
                </h2>
                <p
                  className="mb-3 text-base font-medium"
                  style={{ color: "#B97A2A" }}
                >
                  {col.lead}
                </p>
                <p className="text-base leading-relaxed opacity-90">
                  {col.body}
                </p>
              </div>
            ))}
          </div>

          <hr className="my-14" style={{ borderColor: "#DDD3BE" }} />

          {/* Mission */}
          <Section
            title={t.mission.title}
            lead={t.mission.lead}
            body={t.mission.body}
            isAr={isAr}
          />

          <hr className="my-14" style={{ borderColor: "#DDD3BE" }} />

          {/* Why Keeto */}
          <h2
            className="mb-8 text-2xl"
            style={{
              fontFamily: isAr ? "'Cairo', sans-serif" : "'Fraunces', serif",
              fontWeight: isAr ? 700 : 600,
            }}
          >
            {t.why.title}
          </h2>
          <dl className="space-y-6">
            {t.why.items.map((item) => (
              <div
                key={item.term}
                className={`flex flex-col gap-1 border-t pt-4 sm:flex-row sm:gap-6 ${
                  isAr ? "sm:text-right" : "sm:text-left"
                }`}
                style={{ borderColor: "#DDD3BE" }}
              >
                <dt
                  className="shrink-0 text-base font-medium sm:w-40"
                  style={{ color: "#B97A2A" }}
                >
                  {item.term}
                </dt>
                <dd className="text-base leading-relaxed opacity-90">
                  {item.desc}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </>
  );
}

function Section({
  title,
  lead,
  body,
  isAr,
}: {
  title: string;
  lead: string;
  body: string;
  isAr: boolean;
}) {
  return (
    <div>
      <h2
        className="mb-4 text-2xl"
        style={{
          fontFamily: isAr ? "'Cairo', sans-serif" : "'Fraunces', serif",
          fontWeight: isAr ? 700 : 600,
        }}
      >
        {title}
      </h2>
      <p className="mb-3 text-base font-medium" style={{ color: "#B97A2A" }}>
        {lead}
      </p>
      <p className="text-base leading-relaxed opacity-90">{body}</p>
    </div>
  );
}
