"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type DashboardLanguage = "en" | "ar";

type LanguageContextValue = {
  language: DashboardLanguage;
  setLanguage: (language: DashboardLanguage) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const storageKey = "app_lang_pref";
const appLanguageCookie = "app_lang";
const googleTranslateCookie = "googtrans";
const googleTranslateElementId = "google_translate_element";
const storageSecret = "autoparts-pro-main-site-language";

type GoogleTranslateConstructor = new (options: Record<string, unknown>, elementId: string) => void;

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement?: GoogleTranslateConstructor;
      };
    };
  }
}

const setCookie = (name: string, value: string, maxAge = 60 * 60 * 24 * 365) => {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
};

const isDashboardLanguage = (value: unknown): value is DashboardLanguage =>
  value === "en" || value === "ar";

const encodePreference = (value: DashboardLanguage) => {
  const encoded = Array.from(value)
    .map((char, index) =>
      String.fromCharCode(char.charCodeAt(0) ^ storageSecret.charCodeAt(index % storageSecret.length)),
    )
    .join("");
  return window.btoa(encoded);
};

const decodePreference = (value: string | null): DashboardLanguage | null => {
  if (!value) return null;
  try {
    const decoded = window
      .atob(value)
      .split("")
      .map((char, index) =>
        String.fromCharCode(char.charCodeAt(0) ^ storageSecret.charCodeAt(index % storageSecret.length)),
      )
      .join("");
    return isDashboardLanguage(decoded) ? decoded : null;
  } catch {
    return isDashboardLanguage(value) ? value : null;
  }
};

const setGoogleTranslateCookie = (language: DashboardLanguage) => {
  const value = language === "ar" ? "/en/ar" : "";
  const maxAge = language === "ar" ? 60 * 60 * 24 * 365 : 0;
  setCookie(googleTranslateCookie, value, maxAge);

  if (window.location.hostname.includes(".")) {
    const domain = `.${window.location.hostname.split(".").slice(-2).join(".")}`;
    document.cookie = `${googleTranslateCookie}=${encodeURIComponent(value)}; path=/; domain=${domain}; max-age=${maxAge}; samesite=lax`;
  }
};

const readInitialLanguage = (): DashboardLanguage => {
  try {
    const cookie = document.cookie
      .split("; ")
      .find((item) => item.startsWith(`${appLanguageCookie}=`))
      ?.split("=")[1];
    const decodedCookie = cookie ? decodeURIComponent(cookie) : null;
    if (isDashboardLanguage(decodedCookie)) return decodedCookie;
    const stored = decodePreference(window.localStorage.getItem(storageKey));
    if (stored) return stored;
    return "en";
  } catch {
    return "en";
  }
};

const loadGoogleTranslateScript = () => {
  if (document.querySelector("script[data-google-translate='true']")) return;
  const script = document.createElement("script");
  script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  script.dataset.googleTranslate = "true";
  document.body.appendChild(script);
};

const initGoogleTranslate = () => {
  if (window.google?.translate?.TranslateElement && document.getElementById(googleTranslateElementId)) {
    new window.google.translate.TranslateElement(
      {
        autoDisplay: false,
        includedLanguages: "en,ar",
        pageLanguage: "en",
      },
      googleTranslateElementId,
    );
  }
};

const selectGoogleLanguage = (language: DashboardLanguage) => {
  const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (!combo) return false;
  combo.value = language;
  combo.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
};

const resetGoogleTranslateLayout = () => {
  document.body.style.top = "0px";
  document.body.style.position = "";
  document.documentElement.style.top = "0px";
};

const syncDashboardContentDirection = (language: DashboardLanguage) => {
  document
    .querySelectorAll<HTMLElement>("[data-dashboard-content='true']")
    .forEach((element) => {
      element.dir = language === "ar" ? "rtl" : "ltr";
    });
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<DashboardLanguage>(() =>
    typeof window === "undefined" ? "en" : readInitialLanguage(),
  );

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    syncDashboardContentDirection(language);
    window.localStorage.setItem(storageKey, encodePreference(language));
    setCookie(appLanguageCookie, language);
    setGoogleTranslateCookie(language);
    window.googleTranslateElementInit = initGoogleTranslate;
    loadGoogleTranslateScript();
    resetGoogleTranslateLayout();

    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      resetGoogleTranslateLayout();
      if (selectGoogleLanguage(language) || attempts >= 20) {
        window.clearInterval(timer);
      }
    }, 300);

    return () => window.clearInterval(timer);
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage: setLanguageState,
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      <div id={googleTranslateElementId} className="hidden" aria-hidden="true" />
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
