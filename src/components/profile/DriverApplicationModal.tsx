"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";
import { submitDriverApplicationAction } from "@/lib/delivery/profileActions";
import {
  cuilValidate,
  DRIVER_AVAILABILITY,
  driverDocInvalidReason,
  requiredDocsForVehicle,
  VEHICLE_ICONS,
  VEHICLE_LABELS,
  type DeliveryVehicleType,
  type DriverApplicationStatus,
} from "@/lib/delivery/profile";

interface DriverOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  initialStatus?: DriverApplicationStatus | null;
  initialVehicle?: DeliveryVehicleType | null;
  onSubmitted?: () => void;
}

type DocFiles = { dniFront: File | null; dniBack: File | null; license: File | null };
type Previews = { dniFront?: string; dniBack?: string; license?: string };
type FileErrors = { dniFront?: string | null; dniBack?: string | null; license?: string | null };

const DOC_META: { kind: DocFilesKey; label: string; hint: string; required: boolean }[] = [
  { kind: "dniFront", label: "DNI — frente", hint: "Lado principal del documento", required: true },
  { kind: "dniBack", label: "DNI — dorso", hint: "Lado del código", required: true },
  { kind: "license", label: "Licencia de conducir", hint: "Frente de la licencia", required: false },
];

type DocFilesKey = keyof DocFiles;

const STEPS = ["Vehículo", "Documentos", "CUIL"];

export function DriverApplicationModal({
  isOpen,
  onClose,
  initialStatus,
  initialVehicle,
  onSubmitted,
}: DriverOnboardingProps) {
  const [step, setStep] = useState(0);
  const [vehicle, setVehicle] = useState<DeliveryVehicleType | null>(initialVehicle ?? null);
  const [availability, setAvailability] = useState("flexible");
  const [cuil, setCuil] = useState("");
  const [files, setFiles] = useState<DocFiles>({
    dniFront: null,
    dniBack: null,
    license: null,
  });
  const [previews, setPreviews] = useState<Previews>({});
  const [fileErrors, setFileErrors] = useState<FileErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const rejectNotice = initialStatus === "rejected";
  const urlRefs = useRef<string[]>([]);

  useEffect(() => {
    if (!isOpen) {
      queueMicrotask(() => {
        setStep(0);
        setSubmitError(null);
      });
    }
  }, [isOpen]);

  useEffect(() => () => urlRefs.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const addPreview = (kind: DocFilesKey, file: File) => {
    const url = URL.createObjectURL(file);
    urlRefs.current.push(url);
    setPreviews((p) => ({ ...p, [kind]: url }));
  };

  const onPick = (kind: DocFilesKey, file: File | undefined | null) => {
    setFileErrors((prev) => ({ ...prev, [kind]: undefined }));
    if (!file) {
      setFiles((f) => ({ ...f, [kind]: null }));
      setPreviews((p) => ({ ...p, [kind]: undefined }));
      return;
    }
    const invalid = driverDocInvalidReason(file);
    if (invalid) {
      setFileErrors((prev) => ({ ...prev, [kind]: invalid }));
      return;
    }
    setFiles((f) => ({ ...f, [kind]: file }));
    addPreview(kind, file);
  };

  const needsLicense = vehicle ? requiredDocsForVehicle(vehicle).includes("license") : false;
  const validStep0 = vehicle !== null && DRIVER_AVAILABILITY.some((a) => a.id === availability);
  const validStep1 =
    Boolean(files.dniFront) &&
    Boolean(files.dniBack) &&
    (!needsLicense || Boolean(files.license)) &&
    !fileErrors.dniFront &&
    !fileErrors.dniBack &&
    !(needsLicense && fileErrors.license);
  const validStep2 = cuilValidate(cuil);

  const handleSubmit = () => {
    if (!vehicle || !validStep2) return;
    setSubmitError(null);
    const fd = new FormData();
    fd.set("vehicleType", vehicle);
    fd.set("availability", availability);
    fd.set("cuil", cuil);
    if (files.dniFront) fd.set("dniFront", files.dniFront);
    if (files.dniBack) fd.set("dniBack", files.dniBack);
    if (files.license) fd.set("license", files.license);

    startTransition(async () => {
      const res = await submitDriverApplicationAction(fd);
      if (!res.ok) setSubmitError(res.error);
      else {
        setStep(3);
        onSubmitted?.();
      }
    });
  };

  const showDocs = DOC_META.filter((d) => d.kind !== "license" || needsLicense);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.button
            type="button"
            aria-label="Cerrar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/55 backdrop-blur-[2px]"
          />
          <motion.div
            role="dialog"
            aria-modal
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] border border-[#e8e0d6] bg-white shadow-2xl dark:border-[#3d3732] dark:bg-[#1c1917]"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#f0ebe4] bg-white/95 px-4 py-3 backdrop-blur-md dark:border-[#2a2623] dark:bg-[#1c1917]/95">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                  <MaterialSymbol icon="sports_motorsports" size={18} fill />
                </div>
                <div>
                  <h3 className="font-bold text-[15px] text-gray-900 dark:text-gray-100 leading-tight">
                    Ser repartidor
                  </h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                    Generá ingresos con tus propios horarios
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-gray-400 hover:bg-[#f5f1eb] hover:text-gray-600 dark:hover:bg-[#2a2623] cursor-pointer transition-colors"
              >
                <MaterialSymbol icon="close" size={18} />
              </button>
            </div>

            {rejectNotice && (
              <div className="mx-4 mt-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-[11px] text-red-700 dark:text-red-300">
                Tu postulación anterior fue rechazada. Corregí los datos y volvé a
                enviarla.
              </div>
            )}

            <div className="p-4 sm:p-5">
              {step < 3 && (
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {STEPS.map((label, i) => (
                      <div
                        key={label}
                        className={cn(
                          "h-1.5 flex-1 rounded-full transition-colors",
                          i === step
                            ? "bg-[#9a0002]"
                            : i < step
                              ? "bg-emerald-500"
                              : "bg-stone-200 dark:bg-stone-700",
                        )}
                        style={{ width: 24 }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400">
                    {STEPS[step]} · {step + 1}/{STEPS.length}
                  </span>
                </div>
              )}

              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      ¿Con qué vehículo vas a repartir?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(VEHICLE_LABELS) as DeliveryVehicleType[]).map((id) => {
                        const active = vehicle === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              setVehicle(id);
                              setFileErrors({});
                            }}
                            className={cn(
                              "p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1",
                              active
                                ? "border-[#9a0002] bg-[#9a0002]/10 text-[#9a0002] dark:text-red-300 font-bold ring-1 ring-[#9a0002]"
                                : "border-[#e8e0d6] bg-[#faf6f1] text-gray-600 hover:border-[#9a0002]/30 dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-gray-400",
                            )}
                          >
                            <MaterialSymbol icon={VEHICLE_ICONS[id]} size={20} />
                            <span className="text-[11px]">{VEHICLE_LABELS[id]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Disponibilidad
                    </label>
                    <select
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-[#e8e0d6] bg-[#faf6f1] text-[13px] text-gray-900 focus:bg-white focus:border-[#9a0002] focus:outline-none dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-gray-100 transition-all"
                    >
                      {DRIVER_AVAILABILITY.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-3">
                  <p className="text-[12px] text-gray-600 dark:text-gray-300">
                    Subí fotos claras de los documentos. Solo se usan para validar
                    tu postulación y se guardan de forma privada.
                  </p>
                  {showDocs.map((doc) => (
                    <DocUpload
                      key={doc.kind}
                      label={doc.label}
                      hint={doc.hint}
                      required={doc.required}
                      file={files[doc.kind]}
                      preview={previews[doc.kind]}
                      error={fileErrors[doc.kind]}
                      onPick={(file) => onPick(doc.kind, file)}
                    />
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      CUIL
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cuil}
                      onChange={(e) => setCuil(e.target.value.replace(/\D/g, "").slice(0, 11))}
                      placeholder="20123456783"
                      className={cn(
                        "w-full h-11 px-3 rounded-xl border border-[#e8e0d6] bg-[#faf6f1] text-[13px] text-gray-900 focus:bg-white focus:outline-none dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-gray-100 transition-all",
                        cuil.length >= 11 && (cuilValidate(cuil) ? "border-emerald-500" : "border-red-500"),
                      )}
                    />
                    <p className={cn("mt-1 text-[11px]", cuil.length >= 11 && !cuilValidate(cuil) ? "text-red-600" : "text-gray-400")}>
                      {cuil.length >= 11 && cuilValidate(cuil)
                        ? "CUIL válido ✓"
                        : cuil.length >= 11
                          ? "Revisá el CUIL: módulo de verificación incorrecto."
                          : "Lo usamos para tu facturación cuando haya cobros."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#f0ebe4] dark:border-[#2a2623] bg-[#faf6f1] dark:bg-[#231f1c] p-3 space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Resumen
                    </p>
                    <Row icon="moped" label="Vehículo" value={vehicle ? VEHICLE_LABELS[vehicle] : "—"} />
                    <Row
                      icon="badge"
                      label="Documentos"
                      value={`DNI f+d${needsLicense ? " · licencia" : ""}`}
                    />
                    <Row icon="receipt_long" label="CUIL" value={cuil ? `${cuil.slice(0, 2)}-${cuil.slice(2, 10)}-${cuil.slice(10)}` : "—"} />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="py-6 text-center space-y-3">
                  <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <MaterialSymbol icon="check_circle" size={30} fill />
                  </div>
                  <h4 className="text-[16px] font-bold text-gray-900 dark:text-gray-100">
                    Postulación enviada
                  </h4>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400 max-w-[260px] mx-auto">
                    Tu documentación quedó en revisión. Te avisamos cuando esté
                    aprobada.
                  </p>
                </div>
              )}

              {submitError && (
                <p className="mt-3 text-[11px] font-medium text-red-600">{submitError}</p>
              )}

              <div className="mt-5 flex items-center justify-between gap-2">
                {step === 0 || step === 3 ? (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-[#e8e0d6] text-[13px] font-semibold text-gray-600 hover:bg-[#faf6f1] dark:border-[#3d3732] dark:text-gray-300 dark:hover:bg-[#2a2623] transition-all"
                  >
                    {step === 3 ? "Cerrar" : "Cancelar"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="px-4 py-2.5 rounded-xl border border-[#e8e0d6] text-[13px] font-semibold text-gray-600 hover:bg-[#faf6f1] dark:border-[#3d3732] dark:text-gray-300 dark:hover:bg-[#2a2623] transition-all"
                  >
                    Atrás
                  </button>
                )}

                {step === 0 && (
                  <button
                    type="button"
                    disabled={!validStep0}
                    onClick={() => setStep(1)}
                    className="px-5 py-2.5 rounded-xl bg-[#9a0002] hover:bg-[#850002] text-white text-[13px] font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    Continuar
                    <MaterialSymbol icon="arrow_forward" size={16} />
                  </button>
                )}
                {step === 1 && (
                  <button
                    type="button"
                    disabled={!validStep1}
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 rounded-xl bg-[#9a0002] hover:bg-[#850002] text-white text-[13px] font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    Continuar
                    <MaterialSymbol icon="arrow_forward" size={16} />
                  </button>
                )}
                {step === 2 && (
                  <button
                    type="button"
                    disabled={!validStep2 || pending}
                    onClick={handleSubmit}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[13px] font-bold shadow-md shadow-amber-600/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <MaterialSymbol icon="send" size={16} />
                    {pending ? "Enviando…" : "Enviar postulación"}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[12px]">
      <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
        <MaterialSymbol icon={icon} size={15} className="text-[#9a0002]" />
        {label}
      </span>
      <span className="font-semibold text-gray-800 dark:text-gray-100">{value}</span>
    </div>
  );
}

function DocUpload({
  label,
  hint,
  required,
  file,
  preview,
  error,
  onPick,
}: {
  label: string;
  hint: string;
  required: boolean;
  file: File | null;
  preview?: string;
  error?: string | null;
  onPick: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={cn(
        "rounded-2xl border p-3",
        error
          ? "border-red-500/40 bg-red-500/5"
          : "border-[#e8e0d6] dark:border-[#3d3732] bg-[#faf6f1] dark:bg-[#231f1c]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-gray-800 dark:text-gray-100">
            {label}
            {!required && <span className="ml-1 text-[10px] font-medium text-gray-400">(si aplica)</span>}
          </p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{hint}</p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "shrink-0 cursor-pointer rounded-xl px-3 py-2 text-[11px] font-bold transition-all",
            file
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
              : "bg-[#9a0002]/10 text-[#9a0002] dark:text-red-300",
          )}
        >
          {file ? "Cambiar" : "Subir"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => {
            onPick(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
      </div>
      {preview ? (
        <div className="mt-2 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt={label}
            className="h-28 w-full rounded-xl object-cover"
          />
          <button
            type="button"
            onClick={() => onPick(null)}
            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white cursor-pointer hover:bg-black/75"
            aria-label={`Quitar ${label}`}
          >
            <MaterialSymbol icon="close" size={14} />
          </button>
        </div>
      ) : null}
      {error ? (
        <p className="mt-1.5 text-[10px] font-medium text-red-600">{error}</p>
      ) : null}
    </div>
  );
}