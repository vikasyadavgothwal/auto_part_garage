import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/components/language/language-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
export const metadata: Metadata = {
  title: "Garage",
  description: "Garage Dashboard",
};

const isDashboardLanguage = (value: unknown): value is "en" | "ar" =>
  value === "en" || value === "ar";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const languageCookie = (await cookies()).get("app_lang")?.value;
  const language = isDashboardLanguage(languageCookie) ? languageCookie : "en";

  return (
    <html
      lang={language}
      dir={language === "ar" ? "rtl" : "ltr"}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          {children}
          <Toaster
            position="top-right"
            theme="dark"
            richColors={false}
            className="brand-toaster"
            closeButton
            expand={true}
            toastOptions={{
              classNames: {
                toast: "text-[var(--normal-text)] border border-[var(--normal-border)]",
                title: "text-[var(--normal-text)]",
                description: "text-[var(--normal-text)]",
                icon: "text-current",
                closeButton:
                  "text-current hover:text-current",
                actionButton:
                  "text-current hover:text-current border border-[currentColor]",
                cancelButton:
                  "text-current hover:text-current border border-[currentColor]",
                success: "text-[var(--success-text)] border-[var(--success-border)]",
                error: "text-[var(--error-text)] border-[var(--error-border)]",
              },
            }}
          />
        </LanguageProvider>
      </body>
    </html>
  );
}
