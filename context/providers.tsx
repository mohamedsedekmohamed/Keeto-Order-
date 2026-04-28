"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode, useEffect, useState } from "react";
import { Provider } from "react-redux";
import { store } from "@/redux/Store";

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {mounted ? children : null}
      </ThemeProvider>
    </Provider>
  );
}