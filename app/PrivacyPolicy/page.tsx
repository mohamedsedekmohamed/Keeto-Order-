"use client";
import { useEffect } from "react";

const COMPANY = {
  name: "Keeto",
  email: "support@keeto.org",
  phone: "01111771103",
  address: "Alexandria, Egypt",
  siteUrl: "https://orderfood.keeto.org",
  lastUpdated: "21 September 2026",
  retentionDays: 30,
  minAge: 16,
};

/* const NAV_LINKS = [
  { href: "privacy-policy.html", label: "Privacy Policy" },
  { href: "terms-of-service.html", label: "Terms of Service" },
  { href: "data-deletion.html", label: "Data Deletion" },
];
 */
const css = `
.pp-page{
  --bg:#fff;--fg:#1d1d1f;--muted:#5f6368;--line:#e3e3e6;--accent:#b3261e;
  background:var(--bg);color:var(--fg);min-height:100vh;
  font:17px/1.7 Georgia,"Times New Roman",serif;
}
@media(prefers-color-scheme:dark){
  .pp-page{--bg:#141416;--fg:#ececee;--muted:#a0a0a8;--line:#2c2c30;--accent:#ff8a80}
}
.pp-page *{box-sizing:border-box}
.pp-main{max-width:720px;margin:0 auto;padding:48px 20px 96px}
.pp-page h1{font:700 2rem/1.2 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;margin:0 0 4px}
.pp-page h2{font:600 1.15rem/1.3 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;margin:40px 0 8px;padding-top:20px;border-top:1px solid var(--line)}
.pp-page p,.pp-page li{margin:8px 0}
.pp-meta{color:var(--muted);font-family:system-ui,sans-serif;font-size:.9rem}
.pp-page a{color:var(--accent)}
.pp-nav{font-family:system-ui,sans-serif;font-size:.9rem;margin-bottom:32px}
.pp-nav a{margin-right:16px}
`;

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Privacy Policy";
  }, []);

  return (
    <div className="pp-page">
      <style>{css}</style>
      <main className="pp-main">
        <nav className="pp-nav">
         {/*  {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))} */}
        </nav>

        <h1>Privacy Policy</h1>
        <p className="pp-meta">Last updated: {COMPANY.lastUpdated}</p>

        <p>
          This Privacy Policy explains how {COMPANY.name} (&ldquo;we&rdquo;,
          &ldquo;us&rdquo;, &ldquo;our&rdquo;) collects, uses and protects your
          information when you use our food ordering website and apps at{" "}
          <a href={COMPANY.siteUrl}>orderfood.keeto.org</a> (the
          &ldquo;Service&rdquo;). By using the Service you agree to this policy.
        </p>

        <h2>1. Information we collect</h2>
        <p>
          <strong>Information you give us:</strong>
        </p>
        <ul>
          <li>Name, phone number, email address and delivery address.</li>
          <li>
            Order details, such as items, notes, payment method and order
            history.
          </li>
          <li>
            Messages you send to us or to a restaurant through the Service.
          </li>
        </ul>
        <p>
          <strong>Information from sign-in providers.</strong> If you sign in
          with Facebook or Apple, we receive limited profile data based on the
          permissions you approve:
        </p>
        <ul>
          <li>
            From Facebook: your public profile (name, profile picture, Facebook
            user ID) and email address if you share it.
          </li>
          <li>
            From Apple: your name and email address (or Apple&rsquo;s private
            relay address) if you share them.
          </li>
        </ul>
        <p>
          We do not receive your password from these providers, and we do not
          post to your account.
        </p>
        <p>
          <strong>Information collected automatically:</strong> device type,
          browser, IP address, language, pages viewed, and error logs.
        </p>

        <h2>2. How we use your information</h2>
        <ul>
          <li>To create and manage your account and sign you in.</li>
          <li>
            To process orders and share them with the restaurant that prepares
            them.
          </li>
          <li>To contact you about your orders, including delivery updates.</li>
          <li>
            To provide support, prevent fraud and keep the Service secure.
          </li>
          <li>To improve the Service and fix problems.</li>
          <li>To meet legal obligations.</li>
        </ul>
        <p>We do not sell your personal information.</p>

        <h2>3. Who we share it with</h2>
        <ul>
          <li>
            <strong>Restaurants</strong> you order from, who receive your name,
            phone number, address and order details.
          </li>
          <li>
            <strong>Delivery and payment providers</strong> that help us
            complete orders and payments.
          </li>
          <li>
            <strong>Service providers</strong> such as hosting, analytics and
            messaging vendors, who may only use data to serve us.
          </li>
          <li>
            <strong>Authorities</strong> when required by law or to protect
            rights and safety.
          </li>
        </ul>

        <h2>4. Facebook Login and other third-party services</h2>
        <p>
          When you use Facebook Login or Sign in with Apple, those companies
          handle your data under their own policies. You can remove our access
          at any time from your Facebook settings (Settings &amp; privacy &rarr;
          Settings &rarr; Apps and websites) or your Apple ID settings.
        </p>

        <h2>5. Cookies and local storage</h2>
        <p>
          We use cookies and similar technologies to keep you signed in,
          remember your preferences and understand how the Service is used. You
          can block cookies in your browser, but parts of the Service may stop
          working.
        </p>

        <h2>6. Data retention</h2>
        <p>
          We keep your information while your account is active and as long as
          needed to provide the Service, resolve disputes and meet legal or
          accounting requirements. When you delete your account, we delete or
          anonymize your personal data within {COMPANY.retentionDays} days,
          except what we must keep by law.
        </p>

        <h2>7. Your rights</h2>
        <p>
          Depending on where you live (including under Egypt&rsquo;s Personal
          Data Protection Law No. 151 of 2020, and the GDPR where it applies),
          you may have the right to access, correct, delete or export your data,
          to object to or restrict certain processing, and to withdraw consent.
          To exercise these rights, email{" "}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>, or see our{" "}
          <a href="data-deletion.html">data deletion instructions</a>.
        </p>

        <h2>8. Security</h2>
        <p>
          We use reasonable technical and organizational measures, including
          encrypted connections (HTTPS) and access controls. No system is
          perfectly secure, so we cannot guarantee absolute security.
        </p>

        <h2>9. Children</h2>
        <p>
          The Service is not directed to children under {COMPANY.minAge}. We do
          not knowingly collect their data. If you believe a child has given us
          information, contact us and we will delete it.
        </p>

        <h2>10. International transfers</h2>
        <p>
          Your data may be processed in countries other than your own. Where
          required, we use safeguards to protect it.
        </p>

        <h2>11. Changes to this policy</h2>
        <p>
          We may update this policy. We will change the &ldquo;Last
          updated&rdquo; date above and, for significant changes, notify you in
          the Service or by email.
        </p>

        <h2>12. Contact us</h2>
        <p>
          {COMPANY.name}
          <br />
          {COMPANY.address}
          <br />
          Email: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
          <br />
          Phone: {COMPANY.phone}
        </p>
      </main>
    </div>
  );
}
