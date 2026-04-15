"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { Provider } from "react-redux"; 
import { store, persistor } from "@/redux/Store"; 
import { PersistGate } from "redux-persist/integration/react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    // 1. نجعل ThemeProvider في الخارج ليتم تحميله فوراً مع الـ SSR
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {/* 2. ثم نضع Redux Provider و PersistGate بالداخل */}
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          {children}
        </PersistGate>
      </Provider>
    </ThemeProvider>
  );
}