"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Sun, Sunset, Moon, Bell, LogOut, ShieldAlert } from "lucide-react";

type Theme = "theme-morning" | "theme-evening" | "theme-night";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeWrapper");
  return context;
}

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("theme-night");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Apply theme to document body
      const body = document.body;
      body.classList.remove("theme-morning", "theme-evening", "theme-night");
      body.classList.add(theme);
    }
  }, [theme, mounted]);

  if (!mounted) {
    return <div className="min-h-screen bg-slate-900">{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div className="min-h-screen transition-all duration-1000">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
