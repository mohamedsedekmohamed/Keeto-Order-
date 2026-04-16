import LogoNav from "@/components/LogoNav";
import NewKeetaLogo from "@/public/NewKeetaLogo.jpeg";
import Footer from "@/components/Footer";


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
