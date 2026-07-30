import { BusinessLayout } from "@/components/business/BusinessLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <BusinessLayout>{children}</BusinessLayout>;
}
