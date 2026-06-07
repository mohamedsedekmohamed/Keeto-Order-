import React from 'react';

export const privacy: React.FC = () => {
  return (
    <div className="bg-slate-50 text-slate-800 font-sans antialiased min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-950 tracking-tight mb-2">MyKeeto</h1>
          <p className="text-lg text-slate-500">Official Privacy Policy</p>
        </header>

        <main className="bg-white p-8 rounded-2xl shadow-xs border border-slate-100 prose prose-slate max-w-none">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Privacy Policy</h2>
          <p className="text-sm text-slate-400 mb-6">Last updated: June 2026</p>
          
          <p className="mb-4">
            Welcome to <strong>MyKeeto</strong>. We operate a food ordering and delivery application available on Android and iOS devices. This Privacy Policy describes how your personal information is collected, used, and shared when you use our services.
          </p>

          <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-2">1. Information We Collect</h3>
          <p className="mb-4">To provide you with a seamless food ordering experience, we collect the following information:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li><strong>Account Information:</strong> Your Name, Email Address, Phone Number, and password when you register.</li>
            <li><strong>Social Authentication:</strong> If you choose to log in via Google Sign-In, we collect your Google profile information (Name, Email, and Profile Picture) in accordance with your permission settings.</li>
            <li><strong>Location Data:</strong> We request access to your device's geolocation (via GPS) to help you set delivery addresses and browse nearby available restaurants accurately.</li>
            <li><strong>Transaction & Wallet Details:</strong> We keep track of your order history, transaction receipts, and your current in-app Wallet balance. <em>We do not store complete Credit/Debit card numbers on our servers; card payments are processed securely via encrypted third-party payment gateways.</em></li>
          </ul>

          <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-2">2. Third-Party Services We Use</h3>
          <p className="mb-4">We integrate trusted third-party services to ensure optimal application performance:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li><strong>Google Firebase:</strong> Used for secure authentication, real-time database management, analytics, and sending push notifications about your order status.</li>
            <li><strong>Google Maps API:</strong> Used to display interactive maps, verify address details, and track delivery coordinates.</li>
          </ul>

          <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-2">3. Google API Disclosure</h3>
          <p className="mb-4">
            MyKeeto's use and transfer to any other app of information received from Google APIs will adhere to the{' '}
            <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-indigo-6xl hover:underline">
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>

          <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-2">4. How We Use Your Data</h3>
          <p className="mb-2">Your information is used strictly to fulfill food delivery services, process cash/online/wallet transactions, update you on your orders, and secure your account from unauthorized activities.</p>

          <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-2">5. Data Deletion & Your Rights</h3>
          <p className="mb-4">We highly respect your privacy control. You have the full right to delete your account and clear all associated data (including profile info, order logs, and wallet history). You can perform this action directly from the <strong>Profile Settings</strong> screen inside the MyKeeto app, or by submitting a manual data deletion request to our support email.</p>
        </main>

        <footer className="text-center mt-12 text-sm text-slate-400">
          <p>&copy; 2026 MyKeeto. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default privacy;