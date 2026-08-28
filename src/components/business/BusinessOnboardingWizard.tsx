"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { createBusinessFromOnboarding } from "@/lib/business/onboardingActions";
import {
  TOP_CATEGORIES,
  suggestCategories,
} from "@/lib/business/categories";
import { BUSINESS_PLANS } from "@/lib/business/plans";
import { formatLocalMobile, toStoredPhone } from "@/lib/business/phone";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

const NAME_MAX = 40;

const STEPS = [
  { id: 1, label: "Iniciar sesión" },
  { id: 2, label: "Tu negocio" },
  { id: 3, label: "Elegir plan" },
] as const;

type Props = {
  isAuthenticated: boolean;
  existingBusinessId: string | null;
};

export function BusinessOnboardingWizard({ isAuthenticated, existingBusinessId }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(isAuthenticated ? 2 : 1);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [categorySelection, setCategorySelection] = useState("");
  const [showOther, setShowOther] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [plan, setPlan] = useState<"free" | "impulso" | "lider">("free");
  const otherInputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(
    () => suggestCategories(customCategoryInput),
    [customCategoryInput],
  );

  useEffect(() => {
    if (showOther) otherInputRef.current?.focus();
  }, [showOther]);

  if (existingBusinessId) {
    return (
      <section className="relative px-6 pb-14 pt-2 md:px-10">
        <div className="mx-auto w-full max-w-[1200px]">
          <div className="rounded-[28px] border border-white/20 bg-white p-8 text-center shadow-xl shadow-black/10">
            <MaterialSymbol icon="store" size={32} className="mx-auto text-[#9a0002]" />
            <h2 className="mt-4 text-xl font-black text-gray-900">
              Ya tenés un local registrado
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Por ahora podés operar un comercio por cuenta. Más adelante vas a poder sumar sucursales.
            </p>
            <Link
              href={`/negocio/${existingBusinessId}/dashboard`}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#9a0002] px-6 py-3 text-sm font-bold text-white"
            >
              Ir al panel
              <MaterialSymbol icon="arrow_forward" size={16} />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  function validateStep2() {
    if (name.trim().length < 2) return "Ingresá el nombre del comercio.";
    if (!categorySelection && !showOther) return "Seleccioná un rubro.";
    if (showOther && !customCategoryInput.trim()) return "Contanos qué tipo de local es.";
    if (!phone.replace(/\D/g, "").trim()) return "Ingresá un WhatsApp de contacto.";
    if (phone.replace(/\D/g, "").length < 8) return "El número debe tener al menos 8 dígitos.";
    if (!address.trim()) return "Ingresá la dirección (calle y número).";
    return null;
  }

  async function handleCreate() {
    setError(null);
    const step2Error = validateStep2();
    if (step2Error) {
      setError(step2Error);
      setStep(2);
      return;
    }
    if (plan !== "free") {
      setError("Solo el Plan Inicial está disponible por ahora.");
      return;
    }

    setPending(true);
    try {
      const storedPhone = toStoredPhone(phone);
      if (!storedPhone) {
        setError("WhatsApp inválido");
        setPending(false);
        return;
      }
      await createBusinessFromOnboarding({
        name: name.trim(),
        categorySelection: showOther ? "otros" : categorySelection,
        customCategoryInput: showOther ? customCategoryInput.trim() : undefined,
        phone: storedPhone,
        address: address.trim(),
        plan,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear el comercio");
      setPending(false);
    }
  }

  return (
    <section className="relative px-6 pb-4 pt-2 md:px-10">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-xl shadow-black/10">
          <div className="flex flex-col lg:flex-row">
            <WizardSidebar step={step} />
            <div className="flex min-h-[520px] flex-1 flex-col p-6 md:p-8 lg:p-10">
              <WizardMobileStepper step={step} />

              <div className="mb-6 lg:mb-8">
                <Link
                  href="/"
                  className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#9a0002]"
                >
                  <MaterialSymbol icon="arrow_back" size={14} />
                  Volver
                </Link>
                <h2 className="text-2xl font-black tracking-tight text-gray-900">
                  {step === 1 && "Iniciá sesión"}
                  {step === 2 && "Sobre tu negocio"}
                  {step === 3 && "Elegí tu plan"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {step === 1 && "Usá tu cuenta existente — email, Google o el método que hayas elegido."}
                  {step === 2 && "Datos básicos para levantar tu local en Bolívar."}
                  {step === 3 && "Empezá gratis. Podés cambiar de plan más adelante."}
                </p>
              </div>

            <div className="flex flex-1 flex-col">
              {step === 1 && (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 py-6">
                  {isAuthenticated ? (
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className={primaryBtnClass}
                    >
                      Continuar
                      <MaterialSymbol icon="arrow_forward" size={16} />
                    </button>
                  ) : (
                    <>
                      <Link
                        href="/negocio/login?next=/negocio/registro"
                        className={cn(primaryBtnClass, "w-full max-w-sm justify-center")}
                      >
                        Iniciar sesión
                        <MaterialSymbol icon="login" size={16} />
                      </Link>
                      <p className="max-w-sm text-center text-xs text-stone-500">
                        Si no tenés cuenta, podés registrarte desde el mismo login con email y contraseña.
                      </p>
                    </>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="mx-auto w-full max-w-lg space-y-5">
                  <Field label="Nombre del comercio" hint="Como lo verán tus clientes">
                    <div className="relative">
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value.slice(0, NAME_MAX))}
                        placeholder="Ej. Pizzería Don Roque"
                        maxLength={NAME_MAX}
                        className={cn(inputClass, "pr-12")}
                      />
                      <span
                        className={cn(
                          "pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black tabular-nums",
                          NAME_MAX - name.length <= 5 ? "text-amber-600" : "text-stone-400",
                        )}
                      >
                        {NAME_MAX - name.length}
                      </span>
                    </div>
                  </Field>

                  <Field label="Rubro principal" hint="Elegí el que mejor represente tu local">
                    <div className="flex flex-wrap gap-2">
                      {TOP_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setCategorySelection(cat.id);
                            setShowOther(false);
                            setCustomCategoryInput("");
                          }}
                          className={cn(
                            pillClass,
                            categorySelection === cat.id && !showOther && pillActive,
                          )}
                        >
                          <MaterialSymbol icon={cat.icon} size={16} />
                          {cat.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setShowOther(true);
                          setCategorySelection("");
                        }}
                        className={cn(pillClass, showOther && pillActive)}
                      >
                        <MaterialSymbol icon="more_horiz" size={16} />
                        Otros...
                      </button>
                    </div>
                  </Field>

                  <AnimatePresence initial={false}>
                    {showOther && (
                      <motion.div
                        key="other-category"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <Field label="¿Qué tipo de local es?">
                          <input
                            ref={otherInputRef}
                            value={customCategoryInput}
                            onChange={(e) => setCustomCategoryInput(e.target.value)}
                            placeholder="Ej. Rotisería, Dietética..."
                            className={inputClass}
                          />
                          {suggestions.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {suggestions.map((s) => (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => {
                                    setCustomCategoryInput(s.label);
                                    setCategorySelection(s.id);
                                  }}
                                  className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-semibold text-stone-700 hover:border-stone-400"
                                >
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </Field>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Field label="WhatsApp de pedidos">
                    <div className={phoneWrapClass}>
                      <span className="flex shrink-0 items-center border-r border-stone-200 bg-stone-50 px-3.5 text-[13px] font-bold text-stone-500">
                        +54 9
                      </span>
                      <input
                        value={phone}
                        onChange={(e) => setPhone(formatLocalMobile(e.target.value))}
                        placeholder="2314 443322"
                        inputMode="numeric"
                        className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[13px] text-stone-900 outline-none placeholder:text-stone-400"
                      />
                    </div>
                  </Field>

                  <Field label="Dirección">
                    <input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Av. San Martín 450"
                      className={inputClass}
                    />
                    <p className="mt-1 text-[11px] text-stone-400">
                      San Carlos de Bolívar · CP 6550
                    </p>
                  </Field>
                </div>
              )}

              {step === 3 && (
                <div className="mx-auto grid w-full max-w-3xl gap-4 md:grid-cols-3">
                  {BUSINESS_PLANS.map((p) => {
                    const selected = plan === p.id;
                    return (
                      <div
                        key={p.id}
                        className={cn(
                          "relative flex flex-col rounded-2xl border p-5 transition",
                          selected && p.available
                            ? "border-[#9a0002] bg-white shadow-md dark:bg-[#231f1c]"
                            : "border-gray-200 bg-white/80 dark:border-[#3d3732] dark:bg-[#231f1c]/80",
                          !p.available && "opacity-70",
                        )}
                      >
                        {p.badge && (
                          <span className="mb-3 inline-flex w-fit rounded-full bg-[#9a0002]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#9a0002]">
                            {p.badge}
                          </span>
                        )}
                        <h3 className="text-base font-black text-gray-900 dark:text-white">
                          {p.name}
                        </h3>
                        <p className="mt-1 text-lg font-black text-[#9a0002]">{p.priceLabel}</p>
                        <p className="text-xs text-gray-500">
                          Comisión: <span className="font-bold">{p.commission}</span>
                        </p>
                        <ul className="mt-4 flex-1 space-y-2">
                          {p.highlights.map((h) => (
                            <li
                              key={h}
                              className="flex items-start gap-2 text-[12px] text-gray-600 dark:text-gray-400"
                            >
                              <MaterialSymbol
                                icon="check"
                                size={14}
                                className="mt-0.5 shrink-0 text-emerald-500"
                              />
                              {h}
                            </li>
                          ))}
                        </ul>
                        {p.available ? (
                          <button
                            type="button"
                            onClick={() => setPlan(p.id)}
                            className={cn(
                              "mt-4 w-full rounded-xl py-2.5 text-xs font-bold transition",
                              selected
                                ? "bg-[#9a0002] text-white"
                                : "border border-gray-200 bg-gray-50 text-gray-700 dark:border-[#3d3732] dark:bg-[#2a2623] dark:text-gray-200",
                            )}
                          >
                            {selected ? "Seleccionado" : "Elegir"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="mt-4 w-full cursor-not-allowed rounded-xl border border-dashed border-gray-300 py-2.5 text-xs font-bold text-gray-400 dark:border-[#3d3732]"
                          >
                            Próximamente
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {error && (
                <p className="mt-4 text-center text-sm font-semibold text-red-600">{error}</p>
              )}
            </div>

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-[#ddd4c8]/60 pt-6 dark:border-[#3d3732]/60">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((step - 1) as 1 | 2)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#2a2623]"
                >
                  Atrás
                </button>
              ) : (
                <span />
              )}

              {step === 2 && (
                <button
                  type="button"
                  onClick={() => {
                    const err = validateStep2();
                    if (err) {
                      setError(err);
                      return;
                    }
                    setError(null);
                    setStep(3);
                  }}
                  className={primaryBtnClass}
                >
                  Continuar
                  <MaterialSymbol icon="arrow_forward" size={16} />
                </button>
              )}

              {step === 3 && (
                <button
                  type="button"
                  disabled={pending || plan !== "free"}
                  onClick={() => void handleCreate()}
                  className={cn(primaryBtnClass, pending && "opacity-60")}
                >
                  {pending ? "Creando..." : "Crear mi comercio gratis"}
                  {!pending && <MaterialSymbol icon="arrow_forward" size={16} />}
                </button>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WizardSidebar({ step }: { step: 1 | 2 | 3 }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-gray-100 bg-gray-50/80 p-6 lg:block">
      <nav className="space-y-1">
        {STEPS.map((s) => {
          const done = step > s.id;
          const active = step === s.id;
          return (
            <div
              key={s.id}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold",
                active && "bg-[#9a0002]/10 text-[#9a0002]",
                done && !active && "text-emerald-600",
                !active && !done && "text-gray-400",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-black",
                  active && "border-[#9a0002] bg-[#9a0002] text-white",
                  done && !active && "border-emerald-500 bg-emerald-500 text-white",
                  !active && !done && "border-gray-300 text-gray-400",
                )}
              >
                {done ? <MaterialSymbol icon="check" size={14} /> : s.id}
              </span>
              {s.label}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function WizardMobileStepper({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="mb-6 flex items-center justify-center gap-2 lg:hidden">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-xs font-black",
              step === s.id && "bg-[#9a0002] text-white",
              step > s.id && "bg-emerald-500 text-white",
              step < s.id && "border-2 border-gray-300 text-gray-400",
            )}
          >
            {step > s.id ? <MaterialSymbol icon="check" size={14} /> : s.id}
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn("h-0.5 w-8 rounded", step > s.id ? "bg-emerald-500" : "bg-gray-200")}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </label>
      {hint && <p className="mt-0.5 text-[11px] text-gray-400">{hint}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-[13px] text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400";

const phoneWrapClass =
  "flex overflow-hidden rounded-lg border border-stone-200 bg-white transition focus-within:border-stone-400";

const pillClass =
  "inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-700 transition hover:border-stone-400";

const pillActive = "border-[#9a0002] bg-[#9a0002]/10 text-[#9a0002]";

const primaryBtnClass =
  "ml-auto inline-flex items-center gap-2 rounded-full bg-[#9a0002] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#850002] disabled:cursor-not-allowed";
