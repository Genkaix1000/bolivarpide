import { Suspense } from "react";
import PagoResultadoPage from "./page.client";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <span className="text-gray-400 text-sm">Cargando…</span>
        </main>
      }
    >
      <PagoResultadoPage />
    </Suspense>
  );
}
