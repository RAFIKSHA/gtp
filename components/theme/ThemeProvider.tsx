"use client";

import React, { useEffect, useState } from "react";
import { Theme, ThemeContext } from "@/context/ThemeContext";

const THEME_STORAGE_KEY = "codexpetra-theme";
const DEFAULT_THEME: Theme = "obsidian";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (storedTheme && (storedTheme === "obsidian" || storedTheme === "crisp" || storedTheme === "warm")) {
        setThemeState(storedTheme);
        document.documentElement.setAttribute("data-theme", storedTheme);
      } else {
        document.documentElement.setAttribute("data-theme", DEFAULT_THEME);
      }
    } catch {
      document.documentElement.setAttribute("data-theme", DEFAULT_THEME);
    }
    setMounted(true);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
    } catch (e) {
      console.error("Failed to persist theme preference:", e);
    }
  };

  // Prevent flash of incorrect theme before client hydration
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div style={{ visibility: mounted ? "visible" : "visible" }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

