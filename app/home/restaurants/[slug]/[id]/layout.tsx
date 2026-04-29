import LogoNav from "@/components/LogoNav";
import NewKeetaLogo from "@/public/PicWhite.jpeg";
import Footer from "@/components/Footer";
import RestaurantProvider from "@/context/RestaurantContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // الـ Provider الآن سيعتمد على نفسه لجلب الـ id من الرابط
    <RestaurantProvider>
      <div className="flex flex-col min-h-screen">
        <LogoNav logo={NewKeetaLogo} />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </RestaurantProvider>
  );
}