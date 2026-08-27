import type { Metadata, Viewport } from "next";
import { Source_Sans_3, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { CartProvider } from "@/components/CartProvider";
import { CartFlow } from "@/components/CartFlow";
import { UserProfileProvider } from "@/components/UserProfileProvider";

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
};

export const viewport: Viewport = {
  themeColor: "#9a0002",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={cn("h-full", "antialiased", sourceSans.variable, "font-sans", inter.variable)}
    >
      <head>
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
          </CartProvider>
        </UserProfileProvider>
      </body>
    </html>
  );
}
