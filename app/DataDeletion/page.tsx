import { useEffect } from "react";

const COMPANY = {
  name: "Keeto",
  email: "support@keeto.org",
  siteUrl: "https://orderfood.keeto.org",
  lastUpdated: "21 September 2026",
  deletionDays: 30,
  // Set to true ONLY if your app really has a "Delete account" button in the
  // user's profile. When false, the page shows just the email option.
  hasInAppDeletion: false,
};

/* const NAV_LINKS = [
  { href: "privacy-policy.html", label: "Privacy Policy" },
  { href: "terms-of-service.html", label: "Terms of Service" },
  { href: "data-deletion.html", label: "Data Deletion" },
]; */

const css = `
.dd-page{
  --bg:#fff;--fg:#1d1d1f;--muted:#5f6368;--line:#e3e3e6;--accent:#b3261e;
  background:var(--bg);color:var(--fg);min-height:100vh;
  font:17px/1.7 Georgia,"Times New Roman",serif;
}
@media(prefers-color-scheme:dark){
  .dd-page{--bg:#141416;--fg:#ececee;--muted:#a0a0a8;--line:#2c2c30;--accent:#ff8a80}
}
.dd-page *{box-sizing:border-box}
.dd-main{max-width:720px;margin:0 auto;padding:48px 20px 96px}
.dd-page h1{font:700 2rem/1.2 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;margin:0 0 4px}
.dd-page h2{font:600 1.15rem/1.3 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;margin:40px 0 8px;padding-top:20px;border-top:1px solid var(--line)}
.dd-page p,.dd-page li{margin:8px 0}
.dd-meta{color:var(--muted);font-family:system-ui,sans-serif;font-size:.9rem}
.dd-page a{color:var(--accent)}
.dd-nav{font-family:system-ui,sans-serif;font-size:.9rem;margin-bottom:32px}
.dd-nav a{margin-right:16px}
`;

export default function DataDeletion() {
  useEffect(() => {
    document.title = "Data Deletion Instructions";
  }, []);

  const emailLink = (
    <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
  );

  return (
    <div className="dd-page">
      <style>{css}</style>
      <main className="dd-main">
        <nav className="dd-nav">
        {/*   {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))} */}
        </nav>

        <h1>Data Deletion Instructions</h1>
        <p className="dd-meta">Last updated: {COMPANY.lastUpdated}</p>

        <p>
          You can ask us to delete your account and personal data at any time.
          This applies to accounts created with phone, email, Facebook or
          Apple.
        </p>

        {COMPANY.hasInAppDeletion && (
          <>
            <h2>Option 1: Delete from your account</h2>
            <ol>
              <li>
                Sign in at <a href={COMPANY.siteUrl}>orderfood.keeto.org</a>.
              </li>
              <li>
                Open your profile and choose <strong>Delete account</strong>.
              </li>
              <li>Confirm the deletion.</li>
            </ol>
          </>
        )}

        <h2>
          {COMPANY.hasInAppDeletion
            ? "Option 2: Email us"
            : "Request deletion by email"}
        </h2>
        <p>
          Send an email to {emailLink} with the subject &ldquo;Delete my
          data&rdquo;. Include the name and the email or phone number on your
          account. If you signed up with Facebook, include your Facebook name
          so we can find it. We will confirm by email and complete the deletion
          within {COMPANY.deletionDays} days.
        </p>

        <h2>Remove the Facebook connection</h2>
        <p>
          To stop Facebook sharing data with us, open Facebook &rarr; Settings
          &amp; privacy &rarr; Settings &rarr; Apps and websites, find our app
          and choose <strong>Remove</strong>.
        </p>

        <h2>What we delete</h2>
        <ul>
          <li>
            Your profile: name, email, phone, photo, and linked Facebook or
            Apple IDs.
          </li>
          <li>Saved addresses and your links to restaurants.</li>
        </ul>
        <p>
          We may keep limited order and payment records for as long as the law
          requires for accounting, tax or fraud prevention. These are kept
          separately and not used for anything else.
        </p>
      </main>
    </div>
  );
}