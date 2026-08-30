export function DeliveryPinDisplay({ pin }: { pin: string }) {
  const digits = pin.padStart(4, "0");
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#9a0002]/20 bg-[#9a0002]/5 px-3 py-2 dark:bg-[#9a0002]/10">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          PIN de entrega
        </p>
        <p className="text-[11px] text-stone-500 dark:text-stone-400">Decilo al repartidor</p>
      </div>
      <p className="font-mono text-xl font-black tracking-[0.2em] text-[#9a0002] dark:text-[#ff6b6b]">
        {digits}
      </p>
    </div>
  );
}
