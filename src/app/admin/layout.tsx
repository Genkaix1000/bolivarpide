import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Admin · BolivarPide",
  manifest: "/manifest-admin.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#1c1917",
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
