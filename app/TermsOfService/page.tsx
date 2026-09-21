"use client"
import { useEffect } from "react";

const COMPANY = {
  name: "Keeto",
  email: "support@keeto.org",
  address: "Alexandria, Egypt",
  siteUrl: "https://orderfood.keeto.org",
  lastUpdated: "21 September 2026",
  minAge: 18,
  refundWindow: "24 hours",
  governingCountry: "Egypt",
  courtCity: "Alexandria, Egypt",
};

/* const NAV_LINKS = [
  { href: "privacy-policy.html", label: "Privacy Policy" },
  { href: "terms-of-service.html", label: "Terms of Service" },
  { href: "data-deletion.html", label: "Data Deletion" },
]; */

const css = `
.tos-page{
  --bg:#fff;--fg:#1d1d1f;--muted:#5f6368;--line:#e3e3e6;--accent:#b3261e;
  background:var(--bg);color:var(--fg);min-height:100vh;
  font:17px/1.7 Georgia,"Times New Roman",serif;
}
@media(prefers-color-scheme:dark){
  .tos-page{--bg:#141416;--fg:#ececee;--muted:#a0a0a8;--line:#2c2c30;--accent:#ff8a80}
}
.tos-page *{box-sizing:border-box}
.tos-main{max-width:720px;margin:0 auto;padding:48px 20px 96px}
.tos-page h1{font:700 2rem/1.2 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;margin:0 0 4px}
.tos-page h2{font:600 1.15rem/1.3 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;margin:40px 0 8px;padding-top:20px;border-top:1px solid var(--line)}
.tos-page p,.tos-page li{margin:8px 0}
.tos-meta{color:var(--muted);font-family:system-ui,sans-serif;font-size:.9rem}
.tos-page a{color:var(--accent)}
.tos-nav{font-family:system-ui,sans-serif;font-size:.9rem;margin-bottom:32px}
.tos-nav a{margin-right:16px}
`;

export default function TermsOfService() {
  useEffect(() => {
    document.title = "Terms of Service";
  }, []);

  return (
    <div className="tos-page">
      <style>{css}</style>
      <main className="tos-main">
        <nav className="tos-nav">
      {/*     {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))} */}
        </nav>

        <h1>Terms of Service</h1>
        <p className="tos-meta">Last updated: {COMPANY.lastUpdated}</p>

        <p>
          These Terms govern your use of the food ordering website and apps
          operated by {COMPANY.name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) at{" "}
          <a href={COMPANY.siteUrl}>orderfood.keeto.org</a> (the
          &ldquo;Service&rdquo;). By creating an account or placing an order,
          you agree to these Terms and to our{" "}
          <a href="privacy-policy.html">Privacy Policy</a>.
        </p>

        <h2>1. Who can use the Service</h2>
        <p>
          You must be at least {COMPANY.minAge} years old, or have a parent or
          guardian&rsquo;s permission, and be able to form a binding contract
          where you live.
        </p>

        <h2>2. Your account</h2>
        <ul>
          <li>
            You can sign up with your phone number, email, Facebook or Apple.
          </li>
          <li>Give accurate information and keep it up to date.</li>
          <li>
            You are responsible for activity on your account. Tell us right away
            if you suspect unauthorized use.
          </li>
        </ul>

        <h2>3. How ordering works</h2>
        <p>
          The Service lets you browse menus and place orders with independent
          restaurants. Each restaurant is responsible for its food, menu,
          prices, preparation and availability. We provide the technology that
          connects you to them.
        </p>
        <ul>
          <li>An order is confirmed when the restaurant accepts it.</li>
          <li>
            Prices, fees and estimated times are shown before you place the
            order. Estimates are not guarantees.
          </li>
          <li>
            Check allergen and ingredient information with the restaurant. We
            cannot verify it.
          </li>
        </ul>

        <h2>4. Payments</h2>
        <p>
          You agree to pay the total shown at checkout, including taxes,
          delivery and service fees. Payment methods may include cash on
          delivery or online payment, depending on the restaurant. Card payments
          are processed by third-party providers, and we do not store full card
          numbers.
        </p>

        <h2>5. Cancellations and refunds</h2>
        <p>
          You may cancel an order before the restaurant starts preparing it.
          After that, cancellation may not be possible. If your order is wrong,
          missing or unsatisfactory, contact us at{" "}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> within{" "}
          {COMPANY.refundWindow}. Refunds are decided case by case and, where
          approved, returned to the original payment method.
        </p>

        <h2>6. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Break the law or infringe anyone&rsquo;s rights.</li>
          <li>Place false, fraudulent or prank orders.</li>
          <li>Harass restaurant staff, delivery couriers or our team.</li>
          <li>
            Interfere with or attempt to break the security of the Service.
          </li>
          <li>
            Scrape, copy or resell the Service or its content without
            permission.
          </li>
        </ul>

        <h2>7. Suspension and termination</h2>
        <p>
          We may suspend or close accounts that break these Terms, put others at
          risk or are used fraudulently. You can stop using the Service and
          delete your account at any time (see{" "}
          <a href="data-deletion.html">data deletion</a>).
        </p>

        <h2>8. Intellectual property</h2>
        <p>
          The Service, including its design, software and branding, belongs to
          us or our licensors. Menus, photos and logos belong to the
          restaurants. You get a limited, non-transferable right to use the
          Service for personal, non-commercial purposes.
        </p>

        <h2>9. Disclaimers</h2>
        <p>
          The Service is provided &ldquo;as is&rdquo; and &ldquo;as
          available&rdquo;. To the extent the law allows, we do not guarantee
          that it will be uninterrupted or error free, and we are not
          responsible for the food itself, which is prepared by the restaurants.
        </p>

        <h2>10. Limitation of liability</h2>
        <p>
          To the extent the law allows, we are not liable for indirect,
          incidental or consequential losses, and our total liability for any
          claim is limited to the amount you paid for the order involved.
          Nothing in these Terms limits liability that cannot be limited by law.
        </p>

        <h2>11. Changes</h2>
        <p>
          We may update these Terms. The &ldquo;Last updated&rdquo; date will
          change, and continued use after an update means you accept the new
          Terms.
        </p>

        <h2>12. Governing law</h2>
        <p>
          These Terms are governed by the laws of {COMPANY.governingCountry}.
          Disputes will be handled by the competent courts of{" "}
          {COMPANY.courtCity}, unless local consumer law says otherwise.
        </p>

        <h2>13. Contact</h2>
        <p>
          {COMPANY.name}
          <br />
          {COMPANY.address}
          <br />
          Email: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
        </p>
      </main>
    </div>
  );
}
