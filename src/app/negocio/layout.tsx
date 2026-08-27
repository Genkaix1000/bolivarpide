import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Negocio · BolivarPide",
  manifest: "/manifest-negocio.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#9a0002",
};

export default function NegocioRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
