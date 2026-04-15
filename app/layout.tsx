import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TopNav from "@/components/TopNav";
import { Providers } from "./providers";
import { LanguageProvider } from "@/context/LanguageContext";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";
import { TokenProvider } from "@/context/TokenContext";
import { AxiosInterceptor } from "../context/AxiosInterceptor";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Keeto ",
  description: "Keeto is a cutting-edge food delivery service that connects you with your favorite local restaurants. With a user-friendly interface and lightning-fast delivery, Keeto ensures that your cravings are satisfied in no time. Whether you're in the mood for a quick snack or a full meal, Keeto has you covered with a wide variety of cuisines to choose from. Experience the future of food delivery with Keeto – where delicious meals are just a few clicks away.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <Providers>
          <LanguageProvider>
            <TokenProvider>
              <AxiosInterceptor>
                <div className="flex flex-col min-h-screen">
                  <TopNav />
                  <main className="flex-1">
                    {children}
                  </main>
                  <Toaster position="top-center" reverseOrder={false} />
                </div>
              </AxiosInterceptor>
            </TokenProvider>
          </LanguageProvider>
        </Providers>
      </body>
    </html>
  );
}
