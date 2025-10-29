"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = savedTheme === "dark";

    console.log("[ThemeProvider] Initializing:", { savedTheme, prefersDark });

    setIsDark(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const newValue = !prev;
      console.log("[ThemeProvider] Toggling theme:", {
        from: prev,
        to: newValue,
      });
      console.log(
        "[ThemeProvider] HTML classes before:",
        document.documentElement.classList.toString()
      );

      if (newValue) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }

      console.log(
        "[ThemeProvider] HTML classes after:",
        document.documentElement.classList.toString()
      );
      console.log(
        "[ThemeProvider] Computed background:",
        window.getComputedStyle(document.body).backgroundColor
      );

      return newValue;
    });
  };

  // Prevent flash during SSR
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
