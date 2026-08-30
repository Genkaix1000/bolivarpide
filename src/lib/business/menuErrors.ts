/** Mensaje legible desde errores Supabase / server actions de carta. */
export function formatMenuError(err: unknown): string {
  if (err instanceof Error && err.message && !err.message.startsWith("{")) {
    return err.message;
  }
  const raw =
    typeof err === "object" && err !== null && "message" in err
      ? String((err as { message?: string }).message)
      : String(err);

  if (/PGRST205|menu_categories.*schema cache|Could not find the table/i.test(raw)) {
    return "Tu carta aún no está lista en el servidor. Aplicá la migración en Supabase (SQL Editor → archivo 20260829_menu_categories.sql) y recargá.";
  }
  if (/duplicate key|unique constraint/i.test(raw)) {
    return "Ya existe una categoría con ese nombre.";
  }
  return "No se pudo completar la acción. Intentá de nuevo.";
}
