"use client";

import { useState } from "react";

/**
 * Keeto — Terms & Conditions
 * Bilingual (Arabic / English) legal page.
 * - Arabic  -> dir="rtl", Arabic-first typography
 * - English -> dir="ltr", Latin typography
 *
 * Drop this file into a Next.js app (e.g. app/terms/page.tsx or
 * components/TermsAndConditions.tsx) and import it wherever needed.
 * Tailwind CSS is assumed to be configured in the host project.
 */

type Lang = "ar" | "en";

interface Section {
  heading: string;
  // A section can be plain paragraphs, or paragraphs + a bullet list,
  // or paragraphs + a contact block. Kept simple/flexible on purpose.
  paragraphs?: string[];
  bullets?: string[];
  contact?: { label: string; value: string }[];
}

const CONTENT: Record<Lang, { title: string; updated: string; intro: string; sections: Section[] }> = {
  ar: {
    title: "الشروط والأحكام",
    updated: "آخر تحديث: سبتمبر 2026",
    intro:
      "مرحبًا بك في Keeto، وهي منصة إلكترونية متخصصة في طلب الطعام عبر الإنترنت، تتيح للمستخدمين تصفح المطاعم وقوائم الطعام المتاحة، وإرسال طلبات الطعام من خلال المنصة.",
    sections: [
      {
        heading: "1. مقدمة",
        paragraphs: [
          "تعمل Keeto كوسيط تقني بين المستخدم والمطاعم المشاركة في المنصة. ولا تقوم Keeto بإعداد أو تصنيع أو تجهيز الطعام، كما أن توصيل الطلب يتم بواسطة المطعم، ما لم يتم توضيح خلاف ذلك للمستخدم عند إتمام الطلب.",
          "باستخدام موقع أو تطبيق Keeto أو بإجراء أي طلب من خلال المنصة، فإنك تقر بأنك قرأت هذه الشروط والأحكام ووافقت عليها.",
        ],
      },
      {
        heading: "2. تعريفات",
        paragraphs: ["لأغراض هذه الشروط:"],
        bullets: [
          "Keeto / المنصة: خدمة إلكترونية تتيح للمستخدمين طلب الطعام من المطاعم المشاركة.",
          "المستخدم: أي شخص يستخدم موقع أو تطبيق Keeto أو يقوم بإجراء طلب.",
          "المطعم: أي مطعم أو مقدم طعام يعرض منتجاته من خلال Keeto.",
          "الطلب: طلب الطعام الذي يقوم المستخدم بإرساله من خلال المنصة.",
          "رسوم التوصيل: الرسوم التي يتم تحديدها وفقًا للمطعم والمنطقة والطلب، ويتم عرضها للمستخدم قبل تأكيد الطلب متى كان ذلك ممكنًا.",
        ],
      },
      {
        heading: "3. طبيعة خدمة Keeto",
        paragraphs: [
          "Keeto توفر منصة تقنية لتسهيل التواصل وإتمام الطلبات بين المستخدمين والمطاعم.",
          "وبما أن Keeto ليست الجهة التي تقوم بإعداد الطعام أو تعبئته أو توصيله، فإن المطعم يكون مسؤولًا عن:",
        ],
        bullets: [
          "جودة وسلامة الطعام.",
          "مكونات الطعام وطريقة تحضيره.",
          "مطابقة الطعام للطلب.",
          "الكمية والمواصفات المعلنة.",
          "التعبئة والتغليف.",
          "تجهيز الطلب في الوقت المناسب.",
          "توصيل الطلب إلى المستخدم.",
          "أي معلومات خاصة بالحساسيات الغذائية أو المكونات التي يعلن عنها المطعم.",
        ],
      },
      {
        heading: "",
        paragraphs: [
          "وتعمل Keeto على تسهيل الطلب والتواصل بين الطرفين ومساعدة المستخدم في حالة وجود مشكلة متعلقة بالطلب، دون الإخلال بأي حقوق مقررة للمستخدم بموجب القانون.",
        ],
      },
      {
        heading: "4. استخدام المنصة",
        paragraphs: [
          "يجب على المستخدم تقديم معلومات صحيحة ودقيقة عند إنشاء الحساب أو إجراء الطلب.",
          "ويتعهد المستخدم بما يلي:",
        ],
        bullets: [
          "عدم استخدام المنصة لأي غرض غير قانوني.",
          "عدم تقديم بيانات أو معلومات مضللة.",
          "عدم إنشاء حسابات متعددة بغرض إساءة استخدام العروض أو الخدمات.",
          "عدم استخدام المنصة بطريقة قد تؤثر على تشغيلها أو أمنها.",
          "عدم محاولة الوصول غير المصرح به إلى أنظمة Keeto أو حسابات المستخدمين الآخرين.",
        ],
      },
      {
        heading: "",
        paragraphs: [
          "تحتفظ Keeto بحق اتخاذ الإجراءات المناسبة عند إساءة استخدام المنصة، مع مراعاة الحقوق القانونية للمستخدم.",
        ],
      },
      {
        heading: "5. الطلبات",
        paragraphs: [
          "عند قيام المستخدم بإرسال طلب، يتم إرسال الطلب إلى المطعم المعني.",
          "لا يُعتبر الطلب مقبولًا بصورة نهائية إلا بعد قبول المطعم للطلب أو ظهور حالة تؤكد قبول الطلب من خلال المنصة.",
          "قد يرفض المطعم الطلب أو يتعذر عليه تنفيذه في بعض الحالات، بما في ذلك عدم توفر بعض المنتجات أو عدم القدرة على التوصيل إلى المنطقة المحددة.",
          "في حالة إلغاء الطلب أو عدم إمكانية تنفيذه بعد الدفع الإلكتروني، يتم التعامل مع المبلغ وفقًا لسياسة الاسترداد المعمول بها وطريقة الدفع والقوانين السارية.",
        ],
      },
      {
        heading: "6. الأسعار",
        paragraphs: [
          "يتم عرض أسعار المنتجات على المنصة وفقًا للمعلومات التي يقدمها المطعم.",
          "قد تتغير الأسعار من وقت لآخر، ويُعتد بالسعر المعروض للمستخدم عند تأكيد الطلب، ما لم يكن هناك خطأ واضح أو حالة أخرى يسمح بها القانون.",
          "قد تشمل قيمة الطلب:",
        ],
        bullets: ["سعر الطعام.", "رسوم التوصيل.", "أي رسوم أخرى يتم توضيحها للمستخدم قبل تأكيد الطلب."],
      },
      {
        heading: "",
        paragraphs: ["ويجب على المستخدم مراجعة ملخص الطلب والقيمة الإجمالية قبل تأكيده."],
      },
      {
        heading: "7. رسوم التوصيل",
        paragraphs: [
          "تختلف رسوم التوصيل بحسب المطعم والمنطقة والمسافة وعوامل أخرى مرتبطة بالطلب.",
          "يتم عرض رسوم التوصيل للمستخدم قبل تأكيد الطلب متى كان ذلك متاحًا.",
          "ويكون المطعم مسؤولًا عن تنفيذ خدمة التوصيل، ما لم يتم الإعلان صراحةً عن خلاف ذلك.",
        ],
      },
      {
        heading: "8. طرق الدفع",
        paragraphs: ["تدعم Keeto حاليًا طرق الدفع التالية:"],
        bullets: [
          "الدفع نقدًا عند الاستلام (Cash on Delivery).",
          "الدفع باستخدام بطاقة Visa من خلال وسائل الدفع الإلكتروني المتاحة على المنصة.",
        ],
      },
      {
        heading: "",
        paragraphs: [
          "عند اختيار الدفع الإلكتروني، يوافق المستخدم على تقديم بيانات الدفع من خلال مزود خدمة الدفع المعتمد.",
          "ولا تحتفظ Keeto ببيانات البطاقة البنكية الحساسة إلا بالقدر المسموح به والمطلوب لتشغيل خدمة الدفع وبما يتوافق مع القوانين والسياسات الأمنية ذات الصلة.",
        ],
      },
      {
        heading: "9. إلغاء الطلب",
        paragraphs: [
          "قد يتيح Keeto للمستخدم إلغاء الطلب وفقًا لحالة الطلب وسياسة المطعم.",
          "وبمجرد بدء المطعم في تجهيز الطعام، قد لا يكون الإلغاء ممكنًا في بعض الحالات، خصوصًا بالنسبة للطعام الذي يتم تحضيره خصيصًا بناءً على طلب المستخدم.",
          "لا يؤثر هذا البند على أي حقوق إلزامية للمستهلك لا يجوز التنازل عنها بموجب القانون المصري.",
        ],
      },
      {
        heading: "10. مشاكل الطلب والشكاوى",
        paragraphs: ["إذا كان الطلب:"],
        bullets: [
          "غير مطابق للطلب.",
          "ناقصًا.",
          "يحتوي على منتج مختلف.",
          "به مشكلة واضحة في الجودة أو التغليف.",
          "لم يصل إلى المستخدم.",
          "أو توجد به أي مشكلة أخرى،",
        ],
      },
      {
        heading: "",
        paragraphs: ["يجب على المستخدم التواصل مع Keeto في أقرب وقت ممكن من خلال:"],
        contact: [
          { label: "Email", value: "support@keeto.org" },
          { label: "Phone", value: "+20 111 177 1103" },
        ],
      },
      {
        heading: "",
        paragraphs: [
          "ويُنصح بالاحتفاظ ببيانات الطلب وأي صور أو مستندات يمكن أن تساعد في معالجة الشكوى.",
          "تقوم Keeto بالتواصل مع المطعم ومحاولة معالجة المشكلة وفقًا لطبيعتها، مع عدم الإخلال بالحقوق القانونية للمستهلك.",
        ],
      },
      {
        heading: "11. مسؤولية المطعم",
        paragraphs: [
          "نظرًا لأن المطعم هو الجهة التي تقوم بإعداد وتجهيز وتوصيل الطعام، يكون المطعم مسؤولًا عن الجوانب المتعلقة بالطعام والخدمة التي يقدمها، بما في ذلك الجودة والسلامة والمكونات والتعبئة والتوصيل.",
          "لا يجوز تفسير ذلك على أنه إعفاء لـKeeto من أي مسؤولية قانونية تكون مفروضة عليها بموجب القوانين المصرية.",
        ],
      },
      {
        heading: "12. المحتوى والصور وقوائم الطعام",
        paragraphs: [
          "يتم توفير أسماء المنتجات والصور والأوصاف والأسعار والمعلومات المتعلقة بالطعام من قبل المطاعم أو من خلال المعلومات المتاحة للمنصة.",
          "قد تختلف صور المنتجات عن المنتج الفعلي من حيث الشكل أو طريقة التقديم.",
          "تسعى Keeto إلى عرض المعلومات بصورة دقيقة، إلا أن المطعم يظل مسؤولًا عن دقة المعلومات الخاصة بالمنتجات التي يقدمها.",
        ],
      },
      {
        heading: "13. العروض والخصومات",
        paragraphs: [
          "قد توفر Keeto أو المطاعم المشاركة عروضًا أو خصومات من وقت لآخر.",
          "تخضع كل عروض لشروطها الخاصة، بما في ذلك فترة العرض، والمطاعم المشاركة، والحد الأدنى للطلب، وأي قيود أخرى يتم الإعلان عنها.",
          "لا يجوز استخدام العروض بطريقة احتيالية أو مخالفة لشروطها.",
        ],
      },
      {
        heading: "14. توفر الخدمة",
        paragraphs: ["تسعى Keeto إلى توفير المنصة بصورة مستمرة، إلا أنه قد تحدث حالات توقف مؤقت بسبب:"],
        bullets: [
          "أعمال الصيانة.",
          "الأعطال التقنية.",
          "مشاكل الاتصال بالإنترنت.",
          "أسباب خارجة عن سيطرة Keeto.",
          "أحداث أو ظروف طارئة.",
        ],
      },
      {
        heading: "",
        paragraphs: ["ولا تضمن Keeto أن تكون المنصة متاحة دون انقطاع في جميع الأوقات."],
      },
      {
        heading: "15. الحساب والأمان",
        paragraphs: [
          "المستخدم مسؤول عن الحفاظ على سرية بيانات الدخول الخاصة بحسابه.",
          "في حالة الاشتباه في استخدام غير مصرح به للحساب، يجب على المستخدم التواصل مع Keeto فورًا.",
          "يجوز لـKeeto تعليق أو إيقاف الحساب في حالة وجود استخدام مخالف للشروط أو إساءة استخدام للمنصة، مع مراعاة الحقوق القانونية للمستخدم.",
        ],
      },
      {
        heading: "16. الخصوصية والبيانات الشخصية",
        paragraphs: [
          "تقوم Keeto بجمع واستخدام البيانات اللازمة لتقديم خدماتها، بما في ذلك تنفيذ الطلبات والتواصل مع المستخدم وتحسين الخدمة.",
          "ويجب أن يتم التعامل مع البيانات الشخصية وفقًا للقوانين المصرية السارية وسياسة الخصوصية الخاصة بـKeeto.",
          "ويُنصح المستخدم بمراجعة سياسة الخصوصية الخاصة بالمنصة قبل استخدام الخدمات.",
        ],
      },
      {
        heading: "17. الملكية الفكرية",
        paragraphs: [
          "جميع الحقوق المتعلقة بالعلامة التجارية Keeto، وتصميم المنصة، والبرمجيات، والنصوص، والتصميمات، والشعارات، والمحتوى المملوك لـKeeto، تكون مملوكة لـKeeto أو للجهات المرخصة لها، ولا يجوز نسخها أو استخدامها تجاريًا دون إذن مسبق.",
          "أما العلامات التجارية والصور والمحتوى الخاص بالمطاعم فتظل مملوكة لأصحابها.",
        ],
      },
      {
        heading: "18. حدود المسؤولية",
        paragraphs: [
          "تعمل Keeto كمنصة وسيطة لتسهيل الطلبات بين المستخدم والمطعم.",
          "ولا تتحمل Keeto مسؤولية عن الأمور التي تقع بالكامل تحت سيطرة المطعم، مثل إعداد الطعام أو مكوناته أو جودته أو سلامته أو التزامه بوقت التوصيل، وذلك في حدود ما يسمح به القانون.",
          "ولا يفسر أي بند من هذه الشروط على أنه استبعاد أو تقييد لأي مسؤولية لا يسمح القانون المصري باستبعادها أو تقييدها.",
        ],
      },
      {
        heading: "19. التعديلات على الشروط",
        paragraphs: [
          "يجوز لـKeeto تعديل هذه الشروط من وقت لآخر لتحديث خدماتها أو الامتثال للتغييرات القانونية أو التشغيلية.",
          "يتم نشر النسخة المحدثة على المنصة مع تحديد تاريخ آخر تحديث.",
          "استمرار المستخدم في استخدام المنصة بعد نشر التعديلات يعني قبول الشروط المعدلة، بالقدر الذي يسمح به القانون.",
        ],
      },
      {
        heading: "20. القانون وتسوية النزاعات",
        paragraphs: [
          "تخضع هذه الشروط للقوانين المعمول بها في جمهورية مصر العربية.",
          "وفي حالة وجود نزاع بين المستخدم والمطعم أو Keeto، تسعى الأطراف أولًا إلى حل النزاع وديًا من خلال التواصل مع خدمة العملاء.",
          "ولا يؤثر ذلك على حق المستهلك في اللجوء إلى الجهات المختصة أو ممارسة أي حق مقرر له بموجب القانون.",
        ],
      },
      {
        heading: "21. التواصل معنا",
        paragraphs: ["للاستفسارات والشكاوى والدعم:"],
        contact: [
          { label: "Email", value: "support@keeto.org" },
          { label: "Phone", value: "+20 111 177 1103" },
          { label: "Address", value: "الإسكندرية، مصر" },
        ],
      },
    ],
  },
  en: {
    title: "Terms & Conditions",
    updated: "Last updated: September 2026",
    intro:
      "Welcome to Keeto, an online platform for food ordering that lets users browse restaurants and available menus, and place food orders through the platform.",
    sections: [
      {
        heading: "1. Introduction",
        paragraphs: [
          "Keeto acts as a technical intermediary between users and the restaurants that participate on the platform. Keeto does not prepare, manufacture, or package food, and delivery is carried out by the restaurant, unless the user is told otherwise when placing an order.",
          "By using the Keeto website or app, or by placing an order through the platform, you confirm that you have read and agreed to these Terms & Conditions.",
        ],
      },
      {
        heading: "2. Definitions",
        paragraphs: ["For the purposes of these Terms:"],
        bullets: [
          "Keeto / the Platform: an online service that lets users order food from participating restaurants.",
          "User: any person who uses the Keeto website or app, or who places an order.",
          "Restaurant: any restaurant or food provider that lists its products through Keeto.",
          "Order: a food order a user submits through the platform.",
          "Delivery Fee: the fee set according to the restaurant, area, and order, shown to the user before the order is confirmed whenever possible.",
        ],
      },
      {
        heading: "3. The Nature of Keeto's Service",
        paragraphs: [
          "Keeto provides a technical platform to facilitate communication and complete orders between users and restaurants.",
          "As Keeto is not the party that prepares, packages, or delivers the food, the restaurant is responsible for:",
        ],
        bullets: [
          "The quality and safety of the food.",
          "The food's ingredients and how it is prepared.",
          "The food matching the order.",
          "The quantity and specifications advertised.",
          "Packaging.",
          "Preparing the order within a reasonable time.",
          "Delivering the order to the user.",
          "Any information about food allergens or ingredients that the restaurant discloses.",
        ],
      },
      {
        heading: "",
        paragraphs: [
          "Keeto works to facilitate ordering and communication between both parties and to assist the user if a problem arises with an order, without prejudice to any rights the user is granted by law.",
        ],
      },
      {
        heading: "4. Using the Platform",
        paragraphs: [
          "Users must provide accurate and truthful information when creating an account or placing an order.",
          "The user agrees not to:",
        ],
        bullets: [
          "Use the platform for any unlawful purpose.",
          "Submit misleading data or information.",
          "Create multiple accounts to abuse offers or services.",
          "Use the platform in a way that could affect its operation or security.",
          "Attempt unauthorized access to Keeto's systems or other users' accounts.",
        ],
      },
      {
        heading: "",
        paragraphs: [
          "Keeto reserves the right to take appropriate action in cases of misuse of the platform, while respecting the user's legal rights.",
        ],
      },
      {
        heading: "5. Orders",
        paragraphs: [
          "When a user submits an order, it is sent to the relevant restaurant.",
          "An order is not considered finally accepted until the restaurant accepts it, or a status confirming acceptance appears on the platform.",
          "A restaurant may decline an order or be unable to fulfil it in certain cases, including where a product is unavailable or delivery to the specified area is not possible.",
          "If an order is cancelled or cannot be fulfilled after electronic payment, the amount is handled according to the applicable refund policy, the payment method used, and applicable law.",
        ],
      },
      {
        heading: "6. Prices",
        paragraphs: [
          "Product prices shown on the platform are based on information provided by the restaurant.",
          "Prices may change from time to time; the price shown to the user at the time of confirming the order applies, unless there is an obvious error or another circumstance permitted by law.",
          "The order value may include:",
        ],
        bullets: ["The price of the food.", "The delivery fee.", "Any other fees disclosed to the user before the order is confirmed."],
      },
      {
        heading: "",
        paragraphs: ["Users should review the order summary and total value before confirming."],
      },
      {
        heading: "7. Delivery Fees",
        paragraphs: [
          "Delivery fees vary by restaurant, area, distance, and other factors related to the order.",
          "The delivery fee is shown to the user before the order is confirmed, whenever available.",
          "The restaurant is responsible for carrying out the delivery service, unless expressly stated otherwise.",
        ],
      },
      {
        heading: "8. Payment Methods",
        paragraphs: ["Keeto currently supports the following payment methods:"],
        bullets: [
          "Cash on Delivery.",
          "Payment by Visa card through the electronic payment options available on the platform.",
        ],
      },
      {
        heading: "",
        paragraphs: [
          "When choosing electronic payment, the user agrees to submit payment details through the approved payment service provider.",
          "Keeto does not retain sensitive card data beyond what is permitted and necessary to operate the payment service, and in line with applicable laws and security policies.",
        ],
      },
      {
        heading: "9. Cancelling an Order",
        paragraphs: [
          "Keeto may allow a user to cancel an order depending on the order's status and the restaurant's policy.",
          "Once a restaurant has begun preparing the food, cancellation may no longer be possible in some cases, especially for food prepared specifically to the user's order.",
          "This clause does not affect any mandatory consumer rights that cannot be waived under Egyptian law.",
        ],
      },
      {
        heading: "10. Order Issues & Complaints",
        paragraphs: ["If an order is:"],
        bullets: [
          "Not as ordered.",
          "Incomplete.",
          "Contains a different product.",
          "Has a clear issue with quality or packaging.",
          "Did not reach the user.",
          "Or has any other problem,",
        ],
      },
      {
        heading: "",
        paragraphs: ["the user should contact Keeto as soon as possible through:"],
        contact: [
          { label: "Email", value: "support@keeto.org" },
          { label: "Phone", value: "+20 111 177 1103" },
        ],
      },
      {
        heading: "",
        paragraphs: [
          "It is advisable to keep the order details and any photos or documents that could help process the complaint.",
          "Keeto will contact the restaurant and try to resolve the issue based on its nature, without prejudice to the consumer's legal rights.",
        ],
      },
      {
        heading: "11. Restaurant Responsibility",
        paragraphs: [
          "As the restaurant is the party that prepares, packages, and delivers the food, the restaurant is responsible for aspects related to the food and service it provides, including quality, safety, ingredients, packaging, and delivery.",
          "This should not be interpreted as releasing Keeto from any legal liability imposed on it under Egyptian law.",
        ],
      },
      {
        heading: "12. Content, Images & Menus",
        paragraphs: [
          "Product names, images, descriptions, prices, and food-related information are provided by restaurants or through information available to the platform.",
          "Product images may differ from the actual product in appearance or presentation.",
          "Keeto works to display information accurately, but the restaurant remains responsible for the accuracy of information about the products it offers.",
        ],
      },
      {
        heading: "13. Offers & Discounts",
        paragraphs: [
          "Keeto or participating restaurants may offer promotions or discounts from time to time.",
          "All offers are subject to their own terms, including the offer period, participating restaurants, minimum order value, and any other stated restrictions.",
          "Offers may not be used fraudulently or in violation of their terms.",
        ],
      },
      {
        heading: "14. Service Availability",
        paragraphs: ["Keeto strives to keep the platform continuously available, though temporary interruptions may occur due to:"],
        bullets: [
          "Maintenance work.",
          "Technical faults.",
          "Internet connectivity issues.",
          "Causes beyond Keeto's control.",
          "Emergency events or circumstances.",
        ],
      },
      {
        heading: "",
        paragraphs: ["Keeto does not guarantee that the platform will be available without interruption at all times."],
      },
      {
        heading: "15. Account & Security",
        paragraphs: [
          "Users are responsible for keeping their account login details confidential.",
          "If unauthorized use of an account is suspected, the user should contact Keeto immediately.",
          "Keeto may suspend or disable an account in cases of use that violates these Terms or misuse of the platform, while respecting the user's legal rights.",
        ],
      },
      {
        heading: "16. Privacy & Personal Data",
        paragraphs: [
          "Keeto collects and uses the data necessary to provide its services, including fulfilling orders, communicating with users, and improving the service.",
          "Personal data is handled in accordance with applicable Egyptian law and Keeto's Privacy Policy.",
          "Users are advised to review the platform's Privacy Policy before using the services.",
        ],
      },
      {
        heading: "17. Intellectual Property",
        paragraphs: [
          "All rights related to the Keeto brand, platform design, software, text, designs, logos, and content owned by Keeto belong to Keeto or its licensors, and may not be copied or used commercially without prior permission.",
          "Trademarks, images, and content belonging to restaurants remain the property of their respective owners.",
        ],
      },
      {
        heading: "18. Limitation of Liability",
        paragraphs: [
          "Keeto acts as an intermediary platform to facilitate orders between users and restaurants.",
          "Keeto is not liable for matters that fall entirely under the restaurant's control, such as food preparation, ingredients, quality, safety, or adherence to delivery timing, to the extent permitted by law.",
          "Nothing in these Terms shall be interpreted as excluding or limiting any liability that Egyptian law does not permit to be excluded or limited.",
        ],
      },
      {
        heading: "19. Changes to These Terms",
        paragraphs: [
          "Keeto may amend these Terms from time to time to update its services or comply with legal or operational changes.",
          "The updated version is published on the platform along with the date of the last update.",
          "A user's continued use of the platform after amendments are published constitutes acceptance of the amended Terms, to the extent permitted by law.",
        ],
      },
      {
        heading: "20. Governing Law & Dispute Resolution",
        paragraphs: [
          "These Terms are governed by the laws applicable in the Arab Republic of Egypt.",
          "In the event of a dispute between a user and a restaurant or Keeto, the parties will first seek an amicable resolution by contacting customer service.",
          "This does not affect a consumer's right to approach the competent authorities or exercise any right granted by law.",
        ],
      },
      {
        heading: "21. Contact Us",
        paragraphs: ["For inquiries, complaints, and support:"],
        contact: [
          { label: "Email", value: "support@keeto.org" },
          { label: "Phone", value: "+20 111 177 1103" },
          { label: "Address", value: "Alexandria, Egypt" },
        ],
      },
    ],
  },
};

export default function TermsAndConditions() {
  const [lang, setLang] = useState<Lang>("ar");
  const isRTL = lang === "ar";
  const data = CONTENT[lang];

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      lang={lang}
      className={`min-h-screen bg-[#FBF9F6] text-[#1E1B16] ${
        isRTL ? "font-arabic" : "font-latin"
      }`}
    >
      {/* Sticky header */}
      <header className="sticky top-0 z-10 border-b border-[#E7E1D6] bg-[#FBF9F6]/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold tracking-tight text-[#B5511E]">Keeto</span>
            <span className="text-sm text-[#8A8274]">
              {isRTL ? "الشروط والأحكام" : "Terms & Conditions"}
            </span>
          </div>

          <div className="flex overflow-hidden rounded-full border border-[#E7E1D6] text-sm">
            <button
              type="button"
              onClick={() => setLang("ar")}
              aria-pressed={lang === "ar"}
              className={`px-3 py-1.5 transition-colors ${
                lang === "ar"
                  ? "bg-[#B5511E] text-white"
                  : "bg-transparent text-[#5B5548] hover:bg-[#F0EBE1]"
              }`}
            >
              العربية
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
              className={`px-3 py-1.5 transition-colors ${
                lang === "en"
                  ? "bg-[#B5511E] text-white"
                  : "bg-transparent text-[#5B5548] hover:bg-[#F0EBE1]"
              }`}
            >
              English
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className={isRTL ? "text-right" : "text-left"}>
          <h1 className="text-3xl font-bold tracking-tight text-[#1E1B16] sm:text-4xl">
            {data.title}
          </h1>
          <p className="mt-2 text-sm text-[#8A8274]">{data.updated}</p>
          <p className="mt-6 text-base leading-relaxed text-[#3D392F]">{data.intro}</p>
        </div>

        <div className="mt-10 space-y-8">
          {data.sections.map((section, i) => (
            <section key={i} className={isRTL ? "text-right" : "text-left"}>
              {section.heading && (
                <h2 className="mb-3 text-lg font-semibold text-[#1E1B16]">{section.heading}</h2>
              )}

              {section.paragraphs?.map((p, j) => (
                <p key={j} className="mb-3 text-[15px] leading-relaxed text-[#3D392F]">
                  {p}
                </p>
              ))}

              {section.bullets && (
                <ul
                  className={`mb-3 list-disc space-y-1.5 text-[15px] leading-relaxed text-[#3D392F] ${
                    isRTL ? "pr-5" : "pl-5"
                  }`}
                >
                  {section.bullets.map((b, k) => (
                    <li key={k}>{b}</li>
                  ))}
                </ul>
              )}

              {section.contact && (
                <div className="mt-2 rounded-xl border border-[#E7E1D6] bg-white/60 p-4">
                  <dl className="space-y-1">
                    {section.contact.map((c, k) => (
                      <div key={k} className="flex gap-2 text-[15px]">
                        <dt className="font-medium text-[#8A8274]">{c.label}:</dt>
                        <dd dir="ltr" className="text-[#1E1B16]">
                          {c.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </section>
          ))}
        </div>

        <footer className="mt-16 border-t border-[#E7E1D6] pt-6 text-sm text-[#8A8274]">
          <p>Keeto — {isRTL ? "الإسكندرية، مصر" : "Alexandria, Egypt"}</p>
        </footer>
      </main>
    </div>
  );
}

/*
Optional: add these to your Tailwind config / globals.css to get
a proper Arabic typeface alongside a Latin one, e.g.:

  .font-arabic { font-family: 'IBM Plex Sans Arabic', 'Tajawal', system-ui, sans-serif; }
  .font-latin  { font-family: 'Inter', system-ui, sans-serif; }

and load the fonts (next/font or a <link> to Google Fonts) in your
root layout.
*/