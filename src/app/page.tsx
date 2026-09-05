import { Suspense } from "react";
import { getHomeData } from "@/lib/business/homeData";
import { HomeContent } from "@/components/home/HomeContent";

// ISR: el home se regenera a lo sumo cada 60s; las mutaciones llaman revalidatePath("/").
export const revalidate = 60;

export default async function HomePage() {
  const data = await getHomeData();
  return (
    <Suspense fallback={null}>
      <HomeContent initial={data} />
    </Suspense>
  );
}