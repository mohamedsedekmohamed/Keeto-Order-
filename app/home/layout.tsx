import LogoNav from "@/components/LogoNav";
import Footer from "@/components/Footer";
import NewKeetaLogo from "@/public/NewKeetaLogo.jpeg";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (


    <div className="flex flex-col min-h-screen">
      <LogoNav logo={NewKeetaLogo} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>



  );
}
