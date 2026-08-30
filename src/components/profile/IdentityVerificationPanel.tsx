"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { flashToast } from "@/components/FlashToast";
import { useUserProfile } from "@/components/UserProfileProvider";
import { verifyIdentityAction } from "@/lib/userProfileActions";
import { cn } from "@/lib/utils";

function parseDniPdf417(raw: string) {
  const parts = raw.split("@");
  if (parts.length < 5) return null;
  return {
    lastName: parts[1]?.trim() || "",
    firstName: parts[2]?.trim() || "",
    dniNumber: parts[4]?.trim() || "",
  };
}

function IdentityVerificationModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { updateProfile } = useUserProfile();
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  const applyVerified = useCallback(
    async (parsed: { firstName: string; lastName: string; dniNumber: string }) => {
      try {
        const result = await verifyIdentityAction(parsed);
        if ("alreadyVerified" in result && result.alreadyVerified) {
          updateProfile({ identityVerified: true });
          flashToast("Tu identidad ya estaba verificada.");
          setSuccess(true);
          stopCamera();
          setTimeout(onClose, 900);
          return;
        }
        const displayName =
          "displayName" in result && result.displayName
            ? result.displayName
            : [parsed.firstName, parsed.lastName].filter(Boolean).join(" ");
        updateProfile({
          name: displayName,
          firstName: parsed.firstName,
          lastName: parsed.lastName,
          identityVerified: true,
          identityVerifiedAt: new Date().toISOString(),
        });
        flashToast("Identidad verificada correctamente.");
        setSuccess(true);
        stopCamera();
        setTimeout(onClose, 1200);
      } catch (err) {
        flashToast(err instanceof Error ? err.message : "No pudimos verificar el DNI.");
      }
    },
    [updateProfile, stopCamera, onClose],
  );

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setSuccess(false);
    if (typeof window === "undefined" || !("BarcodeDetector" in window)) {
      setCameraError("Usá Chrome en el celular para escanear el código del reverso.");
      return;
    }

    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // @ts-expect-error BarcodeDetector draft API
      const detector = new window.BarcodeDetector({ formats: ["pdf417"] });
      intervalRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (!barcodes?.length) return;
          const parsed = parseDniPdf417(barcodes[0].rawValue);
          if (!parsed?.dniNumber) return;
          stopCamera();
          await applyVerified(parsed);
        } catch {
          /* frame drop */
        }
      }, 350);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo usar la cámara";
      setCameraError(msg);
      setScanning(false);
    }
  }, [applyVerified, stopCamera]);

  useEffect(() => {
    if (!open) {
      stopCamera();
      setSuccess(false);
      setCameraError(null);
      return;
    }
    void startCamera();
    return () => stopCamera();
    // ponytail: only re-run when modal opens/closes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (typeof document === "undefined") return null;

  const modal = (
    <AnimatePresence>
      {open && (
      <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.button
          type="button"
          aria-label="Cerrar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="fixed inset-0 bg-black/55 backdrop-blur-[2px]"
        />
        <motion.div
          role="dialog"
          aria-modal
          aria-labelledby="dni-verify-title"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] border border-[#e8e0d6] bg-white shadow-2xl dark:border-[#3d3732] dark:bg-[#1c1917]"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#f0ebe4] bg-white/95 px-4 py-3 backdrop-blur-md dark:border-[#2a2623] dark:bg-[#1c1917]/95">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#9a0002]/10 flex items-center justify-center text-[#9a0002] dark:bg-[#9a0002]/20 dark:text-red-400">
                <MaterialSymbol icon="badge" size={18} />
              </div>
              <div>
                <h3 id="dni-verify-title" className="font-bold text-[15px] text-gray-900 dark:text-gray-100 leading-tight">
                  Verificar DNI
                </h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">Validación rápida en dispositivo</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="rounded-full p-1.5 text-gray-400 hover:bg-[#f5f1eb] dark:hover:bg-[#2a2623] cursor-pointer transition-colors"
            >
              <MaterialSymbol icon="close" size={18} />
            </button>
          </div>

          <div className="p-4 sm:p-5 space-y-3.5">
            {/* Simple instruction text */}
            <p className="text-[13px] font-semibold text-center text-gray-800 dark:text-gray-200">
              Apuntá al código de la imagen
            </p>

            {/* DNI Guide Image placed directly on modal background without inner box */}
            <div className="flex justify-center py-0.5">
              <img
                src="/images/dni_scan_new.jpg"
                alt="Guía para escanear DNI"
                className="w-full max-w-[280px] sm:max-w-[310px] h-auto object-contain rounded-2xl drop-shadow-sm"
              />
            </div>

            {/* Live Camera Scanner Viewport */}
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full max-h-[190px] overflow-hidden rounded-2xl bg-black border border-stone-800 shadow-inner">
              {success ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-emerald-950/85">
                  <MaterialSymbol icon="check_circle" size={40} className="text-emerald-400 mb-1" fill />
                  <p className="text-[14px] font-bold text-white">DNI validado</p>
                </div>
              ) : scanning ? (
                <>
                  <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
                  <div className="absolute inset-x-6 top-[38%] h-0.5 bg-[#9a0002] shadow-[0_0_12px_#9a0002] animate-pulse pointer-events-none" />
                  <div className="absolute bottom-2.5 inset-x-2 flex justify-center pointer-events-none">
                    <span className="text-[10px] font-semibold text-white bg-black/70 px-2.5 py-1 rounded-full backdrop-blur-sm">
                      Enfocá el código dentro del visor
                    </span>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 text-stone-400 gap-1.5">
                  <MaterialSymbol icon="videocam_off" size={26} className="opacity-50" />
                  <p className="text-[11px] max-w-[220px]">{cameraError || "Preparando cámara…"}</p>
                  <button
                    type="button"
                    onClick={() => void startCamera()}
                    className="mt-0.5 px-3 py-1 rounded-xl bg-white/15 text-white text-[11px] font-semibold hover:bg-white/25 cursor-pointer transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              )}
            </div>

            {/* Security note footer */}
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-medium text-gray-500 dark:text-gray-400 pt-0.5">
              <MaterialSymbol icon="lock" size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Verificación en dispositivo · No guardamos fotos</span>
            </div>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}

export function IdentityVerificationPanel({
  autoOpenModal = false,
  onAutoOpenConsumed,
}: {
  autoOpenModal?: boolean;
  onAutoOpenConsumed?: () => void;
}) {
  const { profile } = useUserProfile();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!autoOpenModal || profile.identityVerified) return;
    setModalOpen(true);
    onAutoOpenConsumed?.();
  }, [autoOpenModal, profile.identityVerified, onAutoOpenConsumed]);

  if (profile.identityVerified) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <MaterialSymbol icon="verified" size={20} fill />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-gray-900 dark:text-gray-100">Identidad verificada</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">DNI validado en tu cuenta</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={cn(
            "col-span-2 p-3.5 rounded-2xl border border-[#9a0002]/25 bg-[#9a0002]/6",
            "hover:bg-[#9a0002]/12 active:scale-[0.98] transition-all cursor-pointer",
            "flex items-center gap-3 text-left group",
          )}
        >
          <span className="w-10 h-10 rounded-xl bg-[#9a0002]/15 text-[#9a0002] dark:text-red-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <MaterialSymbol icon="document_scanner" size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100">Verificar DNI</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
              Verificate y recibí tu ícono de verificado
            </p>
          </div>
          <MaterialSymbol icon="chevron_right" size={20} className="text-[#9a0002]/60 shrink-0" />
        </button>
      </div>

      <IdentityVerificationModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

export const profileInputClass =
  "w-full h-11 px-3 rounded-xl border border-[#e8e0d6] bg-white text-[13px] text-gray-900 focus:border-[#9a0002] focus:outline-none dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-gray-100 transition-all";
