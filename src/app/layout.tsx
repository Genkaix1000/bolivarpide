import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { cookies } from "next/headers";
import { Source_Sans_3, Inter } from "next/font/google";
import "./globals.css";
import { PWA_BOOTSTRAP_SCRIPT, readInstallCookie } from "@/lib/pwa/install-global";
import { cn } from "@/lib/utils";
import { CartProvider } from "@/components/CartProvider";
import { CartFlow } from "@/components/CartFlow";
import { FlashToast } from "@/components/FlashToast";
import { UserProfileProvider } from "@/components/UserProfileProvider";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { InstallFab } from "@/components/pwa/InstallFab";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: "BolivarPide",
  description: "Plataforma de delivery local premium y catálogo digital rápido.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BolivarPide",
  },
  icons: {
    apple: [{ url: "/icons/apple-touch-icon-180x180.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#9a0002",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jar = await cookies();
  const showInstallFab = readInstallCookie(jar) === null;

  return (
    <html
      lang="es"
      className={cn("h-full", "antialiased", sourceSans.variable, "font-sans", inter.variable)}
    >
      <head>
        <Script
          id="pwa-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: PWA_BOOTSTRAP_SCRIPT }}
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        <UserProfileProvider>
          <CartProvider>
            <main className="flex-1 flex flex-col w-full mx-auto">
              {children}
            </main>
            <CartFlow />
            <FlashToast />
            {showInstallFab && <InstallFab />}
            <ServiceWorkerRegistration />
          </CartProvider>
        </UserProfileProvider>
      </body>
    </html>
  );
}
