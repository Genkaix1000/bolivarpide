"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { flashToast } from "@/components/FlashToast";
import { useUserProfile } from "@/components/UserProfileProvider";

interface DriverApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DriverApplicationModal({
  isOpen,
  onClose,
}: DriverApplicationModalProps) {
  const { profile } = useUserProfile();
  const [vehicle, setVehicle] = useState<"moto" | "bici" | "auto">("moto");
  const [availability, setAvailability] = useState("flexible");
  const [phone, setPhone] = useState(profile.phone || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const vehicleText = vehicle === "moto" ? "Moto" : vehicle === "bici" ? "Bicicleta" : "Auto";
    const text = encodeURIComponent(
      `¡Hola BolivarPide! Quiero sumarme como repartidor.\n\nNombre: ${profile.name || "Interesado"}\nTeléfono: ${phone}\nVehículo: ${vehicleText}\nDisponibilidad: ${availability}`,
    );

    // BolivarPide official support WhatsApp
    const whatsappUrl = `https://wa.me/5492314510000?text=${text}`;
    window.open(whatsappUrl, "_blank");

    flashToast("¡Postulación enviada! Te redirigimos a WhatsApp.");
    setIsSubmitting(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-[#e8e0d6] bg-white p-6 shadow-2xl dark:border-[#3d3732] dark:bg-[#1c1917] z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#f0ebe4] dark:border-[#2a2623]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                <MaterialSymbol icon="sports_motorsports" size={20} fill />
              </div>
              <div>
                <h3 className="font-bold text-[16px] text-gray-900 dark:text-gray-100">
                  Sumate como Repartidor
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Generá ingresos con tus propios horarios en Bolívar
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 hover:bg-[#f5f1eb] hover:text-gray-600 dark:hover:bg-[#2a2623] dark:hover:text-gray-200 transition-colors"
            >
              <MaterialSymbol icon="close" size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="py-4 space-y-4">
            {/* Vehículo */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                ¿Con qué vehículo vas a repartir?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "moto", label: "Moto", icon: "two_wheeler" },
                  { id: "bici", label: "Bicicleta", icon: "pedal_bike" },
                  { id: "auto", label: "Auto", icon: "directions_car" },
                ].map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVehicle(v.id as typeof vehicle)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      vehicle === v.id
                        ? "border-[#9a0002] bg-[#9a0002]/10 text-[#9a0002] dark:text-red-300 font-bold ring-1 ring-[#9a0002]"
                        : "border-[#e8e0d6] bg-[#faf6f1] text-gray-600 hover:border-[#9a0002]/30 dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-gray-400"
                    }`}
                  >
                    <MaterialSymbol icon={v.icon} size={20} />
                    <span className="text-[11px]">{v.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                WhatsApp de contacto
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54 9 2314 ..."
                className="w-full h-11 px-3 rounded-xl border border-[#e8e0d6] bg-[#faf6f1] text-[13px] text-gray-900 focus:bg-white focus:border-[#9a0002] focus:outline-none dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-gray-100 dark:focus:bg-[#1c1917] transition-all"
              />
            </div>

            {/* Disponibilidad */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                Disponibilidad
              </label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-[#e8e0d6] bg-[#faf6f1] text-[13px] text-gray-900 focus:bg-white focus:border-[#9a0002] focus:outline-none dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-gray-100 dark:focus:bg-[#1c1917] transition-all"
              >
                <option value="flexible">Horarios flexibles / Cuando esté disponible</option>
                <option value="noches">Turno Noche / Cenas (19:30 a 00:00)</option>
                <option value="mediodia">Turno Mediodía / Almuerzos (11:30 a 15:00)</option>
                <option value="completo">Turno Completo</option>
              </select>
            </div>

            {/* Submit */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#e8e0d6] text-[13px] font-semibold text-gray-600 hover:bg-[#faf6f1] dark:border-[#3d3732] dark:text-gray-300 dark:hover:bg-[#2a2623] transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[13px] font-bold shadow-md shadow-amber-600/25 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <MaterialSymbol icon="send" size={16} />
                <span>Enviar postulación</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
