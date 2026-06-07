import React from 'react';

export const support: React.FC = () => {
  return (
    <div className="bg-slate-50 text-slate-800 font-sans antialiased min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-950 tracking-tight mb-2">MyKeeto</h1>
          <p className="text-lg text-slate-500">Support Center</p>
        </header>

        <main className="bg-white p-8 rounded-2xl shadow-xs border border-slate-100 prose prose-slate max-w-none">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Customer Support</h2>
          <p className="mb-6">Have any questions, facing an order tracking error, or having trouble with your digital wallet balance on MyKeeto? Our support team is here to assist you.</p>
          
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-indigo-900 mb-2">Get in touch:</h3>
            <p className="mb-4 text-indigo-950">For technical inquiries, ordering issues, payment adjustments, or manual account deletion requests, please email us directly at:</p>
            <a href="mailto:wegostores@gmail.com" className="text-xl font-bold text-indigo-6xl hover:underline">
              wegostores@gmail.com
            </a>
          </div>

          <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-2">Frequently Asked Questions (FAQ)</h3>
          <div className="space-y-4 mt-4">
            <div className="border-l-4 border-slate-200 pl-4">
              <h4 className="font-semibold text-slate-900">How do I request account and data deletion?</h4>
              <p className="text-slate-600 text-sm">You can easily delete your account from your Profile Settings inside the app. Alternatively, email us at <span className="font-medium">wegostores@gmail.com</span> using your registered email address, and our team will erase your personal history within 48 hours.</p>
            </div>
            <div className="border-l-4 border-slate-200 pl-4">
              <h4 className="font-semibold text-slate-900">What payment methods does MyKeeto accept?</h4>
              <p className="text-slate-600 text-sm">We currently support Cash on Delivery (COD), online Credit/Debit cards, and our secure in-app Wallet balance system.</p>
            </div>
            <div className="border-l-4 border-slate-200 pl-4">
              <h4 className="font-semibold text-slate-900">Why does the app ask for my Location permission?</h4>
              <p className="text-slate-600 text-sm">We use Google Maps to determine your exact location. This ensures that nearby restaurant options are shown correctly and that food couriers can navigate straight to your doorstep.</p>
            </div>
          </div>
        </main>

        <footer className="text-center mt-12 text-sm text-slate-400">
          <p>&copy; 2026 MyKeeto. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default support;