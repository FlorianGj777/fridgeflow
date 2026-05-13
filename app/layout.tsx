import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import ServiceWorkerUpdater from "@/components/sw-updater";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FridgeFlow",
  description:
    "Planifiez vos repas, gérez votre frigo et générez vos listes de courses.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FridgeFlow",
  },
};

export const viewport: Viewport = {
  themeColor: "#1876f2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning className={bricolage.variable}>
      <body>
        <div className="app-container bg-background shadow-xl shadow-black/5">
          {children}
        </div>
        <ServiceWorkerUpdater />
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            style: { maxWidth: "400px" },
          }}
        />
      </body>
    </html>
  );
}
