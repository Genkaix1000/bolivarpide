import { claimBusinessOwnership } from "@/lib/business/actions";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ claim?: string }>;
}) {
  const { claim } = await searchParams;
  if (!claim) {
    return (
      <main className="min-h-dvh grid place-items-center px-4">
        <p className="text-sm text-stone-600">Falta el token de claim.</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh grid place-items-center bg-[#f3efe8] px-4">
      <form
        action={claimBusinessOwnership}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-stone-200 bg-white p-6 text-center"
      >
        <h1 className="text-xl font-bold">Reclamar local</h1>
        <p className="text-sm text-stone-600">
          Vas a vincular este local a tu cuenta OAuth actual como owner.
        </p>
        <input type="hidden" name="claim" value={claim} />
        <button
          type="submit"
          className="w-full rounded-full bg-[#9a0002] py-3 text-sm font-semibold text-white cursor-pointer"
        >
          Confirmar ownership
        </button>
      </form>
    </main>
  );
}
