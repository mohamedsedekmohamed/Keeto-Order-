"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { Provider } from "react-redux"; 
import { store, persistor } from "@/redux/Store"; 

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      
      <Provider store={store}>
          {children}
      </Provider>
    </ThemeProvider>
  );
}