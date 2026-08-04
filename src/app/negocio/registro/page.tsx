"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { SmoothInput } from "@/components/SmoothInput";
import { cn } from "@/lib/utils";
import { RESTAURANT_SPECIALTIES } from "@/lib/mockData";

// ─── Animated Section wrapper (scroll reveal) ────────────────────────────
function AnimatedSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const COUNTRIES = [
  { code: "+54", flag: "🇦🇷", name: "Argentina" },
  { code: "+55", flag: "🇧🇷", name: "Brasil" },
  { code: "+56", flag: "🇨🇱", name: "Chile" },
  { code: "+598", flag: "🇺🇾", name: "Uruguay" },
  { code: "+595", flag: "🇵🇾", name: "Paraguay" },
  { code: "+51", flag: "🇵🇪", name: "Perú" },
  { code: "+57", flag: "🇨🇴", name: "Colombia" },
  { code: "+52", flag: "🇲🇽", name: "México" },
];

const BUSINESS_TYPES = [
  { id: "restaurante", label: "Restaurante", icon: "restaurant_menu" },
  { id: "farmacia", label: "Farmacia", icon: "medication" },
  { id: "kiosko", label: "Kiosko", icon: "storefront" },
  { id: "cafe", label: "Café", icon: "local_cafe" },
  { id: "almacen", label: "Almacén", icon: "grocery" },
  { id: "otro", label: "Otro", icon: "inventory_2" },
];

const FIXED_LOCATION = {
  city: "San Carlos de Bolivar",
  province: "Buenos Aires",
  postal_code: "6550",
};

export default function BusinessRegisterPage() {
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Form Fields State
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [restaurantCategory, setRestaurantCategory] = useState("");
  const [responsibleName, setResponsibleName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [responsibleEmail, setResponsibleEmail] = useState("");
  const [message, setMessage] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);

  // Selected Country Prefix State
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showPrefixDropdown, setShowPrefixDropdown] = useState(false);

  // Validation States
  const [nameValidationState, setNameValidationState] = useState<'idle' | 'invalid'>('idle');
  const [whatsappValidationState, setWhatsappValidationState] = useState<'idle' | 'invalid'>('idle');
  const [emailValidationState, setEmailValidationState] = useState<'idle' | 'invalid'>('idle');

  // Input Validation Message Feedback State
  const [validationMessages, setValidationMessages] = useState<Record<string, string>>({});

  // Form Errors State
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Specialties Grid Scroll State
  const [specScrollState, setSpecScrollState] = useState({ isAtTop: true, isAtBottom: true });
  const specScrollRef = useRef<HTMLDivElement>(null);

  const checkSpecScroll = () => {
    const el = specScrollRef.current;
    if (!el) return;
    const isAtTop = el.scrollTop <= 2;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 2;
    setSpecScrollState({ isAtTop, isAtBottom });
  };

  useEffect(() => {
    if (businessType === "restaurante") {
      setTimeout(checkSpecScroll, 100);
    }
  }, [businessType]);

  // Phone number formatter function
  const formatPhoneNumber = (value: string) => {
    const clean = value.replace(/\D/g, "");
    const truncated = clean.slice(0, 11);
    if (truncated.length <= 2) return truncated;
    if (truncated.length <= 6) {
      return `${truncated.slice(0, 2)} ${truncated.slice(2)}`;
    }
    if (truncated.length <= 10) {
      return `${truncated.slice(0, 2)} ${truncated.slice(2, 6)} ${truncated.slice(6)}`;
    }
    return `${truncated.slice(0, 3)} ${truncated.slice(3, 7)} ${truncated.slice(7)}`;
  };

  const handleNameBlur = () => {
    if (!businessName.trim()) {
      setNameValidationState('invalid');
      setValidationMessages((prev) => ({ ...prev, businessName: "El nombre del negocio es requerido." }));
      return;
    }
    if (businessName.length > 100) {
      setNameValidationState('invalid');
      setValidationMessages((prev) => ({ ...prev, businessName: "El nombre es demasiado extenso." }));
      return;
    }
    setNameValidationState('idle');
    setValidationMessages((prev) => ({ ...prev, businessName: "" }));
  };

  const handleWhatsappBlur = () => {
    const cleanPhone = whatsapp.replace(/\D/g, "");
    if (!cleanPhone.trim()) {
      setWhatsappValidationState('invalid');
      setValidationMessages((prev) => ({ ...prev, whatsapp: "El número de WhatsApp es requerido." }));
      return;
    }
    if (!/^[0-9]{8,11}$/.test(cleanPhone)) {
      setWhatsappValidationState('invalid');
      setValidationMessages((prev) => ({ ...prev, whatsapp: "El número debe tener entre 8 y 11 dígitos." }));
      return;
    }
    setWhatsappValidationState('idle');
    setValidationMessages((prev) => ({ ...prev, whatsapp: "" }));
  };

  const handleEmailBlur = () => {
    if (!responsibleEmail.trim()) {
      setEmailValidationState('invalid');
      setValidationMessages((prev) => ({ ...prev, responsibleEmail: "El email del responsable es requerido." }));
      return;
    }
    if (!/\S+@\S+\.\S+/.test(responsibleEmail)) {
      setEmailValidationState('invalid');
      setValidationMessages((prev) => ({ ...prev, responsibleEmail: "Ingresa un correo electrónico válido." }));
      return;
    }
    setEmailValidationState('idle');
    setValidationMessages((prev) => ({ ...prev, responsibleEmail: "" }));
  };

  const getStep1Percentage = () => {
    let total = 2;
    let completed = 0;
    if (businessName.trim()) completed++;
    if (businessType) completed++;
    if (businessType === "restaurante") {
      total = 3;
      if (restaurantCategory) completed++;
    }
    return completed / total;
  };

  const getStep2Percentage = () => {
    let completed = 0;
    if (responsibleName.trim()) completed++;
    if (whatsapp.trim() && whatsapp.replace(/\D/g, "").length >= 8) completed++;
    if (responsibleEmail.trim() && /\S+@\S+\.\S+/.test(responsibleEmail)) completed++;
    return completed / 3;
  };

  const getStep3Percentage = () => {
    return consentChecked ? 1 : 0;
  };

  const step1Percentage = getStep1Percentage();
  const step2Percentage = getStep2Percentage();
  const step3Percentage = getStep3Percentage();

  const validateStep1 = () => {
    const stepErrors: Record<string, string> = {};
    if (!businessName.trim()) {
      stepErrors.businessName = "El nombre del negocio es requerido.";
      setNameValidationState('invalid');
    } else if (businessName.length > 100) {
      stepErrors.businessName = "El nombre es demasiado extenso.";
      setNameValidationState('invalid');
    }

    if (!businessType) {
      stepErrors.businessType = "Selecciona un tipo de negocio.";
    }

    if (businessType === "restaurante" && !restaurantCategory) {
      stepErrors.restaurantCategory = "Selecciona una especialidad gastronómica.";
    }

    setValidationMessages((prev) => ({ ...prev, ...stepErrors }));
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const validateStep2 = () => {
    const stepErrors: Record<string, string> = {};
    if (!responsibleName.trim()) {
      stepErrors.responsibleName = "El nombre del responsable es requerido.";
    }

    if (!whatsapp.trim()) {
      stepErrors.whatsapp = "El número de WhatsApp es requerido.";
      setWhatsappValidationState('invalid');
    } else if (whatsapp.replace(/\D/g, "").length < 8) {
      stepErrors.whatsapp = "Ingresa un número válido.";
      setWhatsappValidationState('invalid');
    }

    if (!responsibleEmail.trim()) {
      stepErrors.responsibleEmail = "El email del responsable es requerido.";
      setEmailValidationState('invalid');
    } else if (!/\S+@\S+\.\S+/.test(responsibleEmail)) {
      stepErrors.responsibleEmail = "Ingresa un correo electrónico válido.";
      setEmailValidationState('invalid');
    }

    setValidationMessages((prev) => ({ ...prev, ...stepErrors }));
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const validateStep3 = () => {
    const stepErrors: Record<string, string> = {};
    if (!consentChecked) {
      stepErrors.consent = "Debes autorizar el contacto para continuar.";
    }
    if (message.length > 500) {
      stepErrors.message = "El mensaje no puede superar los 500 caracteres.";
    }
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNextStep = () => {
    setSubmitError("");
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setErrors({});
    setSubmitError("");
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: businessName,
          business_type: businessType,
          restaurant_category: restaurantCategory,
          responsible_name: responsibleName,
          whatsapp: whatsapp.replace(/\D/g, ""),
          country_code: selectedCountry.code,
          email: responsibleEmail,
          city: FIXED_LOCATION.city,
          province: FIXED_LOCATION.province,
          postal_code: FIXED_LOCATION.postal_code,
          message: message,
          consent: true,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al enviar la solicitud");
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitError(error instanceof Error ? error.message : "Ocurrió un error inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf6f1] dark:bg-[#1c1917] flex flex-col transition-colors duration-300 relative overflow-x-hidden">
      {/* ── Global ambient glow blobs ──────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute top-[-15%] left-[-8%] w-[500px] h-[500px] rounded-full bg-[#9a0002]/6 blur-[110px] animate-pulse" />
        <div className="absolute bottom-[-15%] right-[-8%] w-[400px] h-[400px] rounded-full bg-[#9a0002]/5 blur-[90px]" />
        <div className="absolute top-[40%] right-[10%] w-[300px] h-[300px] rounded-full bg-amber-400/5 blur-[80px] animate-pulse" />
      </div>

      {/* ── Top Navigation ─────────────────────────────────────── */}
      <header className="relative z-20 w-full max-w-[1200px] mx-auto px-6 md:px-10 py-5 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-[#ede4d9] dark:hover:bg-[#1c1917] border border-[#ddd4c8] dark:border-[#3d3732] text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-[#d4cfc9] transition-all select-none group"
        >
          <MaterialSymbol icon="arrow_back" size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Volver al Inicio</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#9a0002] to-[#6b0001] flex items-center justify-center text-white font-black text-base shadow-sm">
            B
          </div>
          <span className="hidden sm:inline font-extrabold text-sm tracking-tight text-gray-800 dark:text-gray-100">
            BolivarPide Socios
          </span>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════
          HERO — 2 columns: left=copy, right=form
      ════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 w-full max-w-[1200px] mx-auto px-6 md:px-10 pt-6 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
        {/* ── Left Column ──────────────────────────────────────── */}
        <div className="order-2 flex flex-col gap-8 lg:sticky lg:top-8 lg:order-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="w-full rounded-[28px] border border-[#ddd4c8] bg-[#faf6f1] p-8 shadow-sm dark:border-[#3d3732] dark:bg-[#1c1917]">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#9a0002]/20 bg-[#9a0002]/6 text-[#9a0002] text-xs font-bold mb-6">
                <MaterialSymbol icon="auto_awesome" size={11} />
                Plataforma de delivery local
              </div>

              {/* Headline */}
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white leading-[1.1] tracking-tight mb-4">
                Sumá tu negocio
                <br />
                <span className="text-[#9a0002]">a BolivarPide</span>
                <br />
                en San Carlos de Bolívar.
              </h1>

              {/* Tagline */}
              <p className="text-[15px] text-gray-500 dark:text-gray-400 max-w-[380px] leading-relaxed mb-8">
                Completá el formulario de contacto. Revisamos tu negocio manualmente y te contactamos por WhatsApp para activar tu cuenta.
              </p>

              {/* Secondary support channel */}
              <a
                href="https://wa.me/5491100000000?text=Hola%2C%20quiero%20registrar%20mi%20negocio%20en%20BolivarPide"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 transition-colors hover:text-[#1a9e4c] dark:text-gray-400 dark:hover:text-[#25d366]"
              >
                <MaterialSymbol icon="chat" size={16} className="text-[#25d366] group-hover:scale-110 transition-transform" />
                ¿Preferís hablar? Escribinos por WhatsApp
                <MaterialSymbol icon="arrow_forward" size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </motion.div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-[#9a0002]/20 via-[#ddd4c8] dark:via-[#3d3732] to-transparent" />

          {/* Features */}
          <div className="flex flex-col gap-4">
            {[
              { icon: "verified", title: "Revisión manual garantizada", desc: "Cada solicitud la revisamos personalmente para asegurar calidad en la plataforma.", delay: 0.42 },
              { icon: "trending_up", title: "Más visibilidad local", desc: "Tu negocio aparece frente a clientes que buscan delivery en San Carlos de Bolívar.", delay: 0.52 },
              { icon: "bolt", title: "Sin costos de activación", desc: "No pagás nada por registrarte. Te detallamos la comisión antes de activar tu cuenta.", delay: 0.62 },
            ].map(({ icon, title, desc, delay }) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay, duration: 0.45, ease: "easeOut" }}
                className="flex items-start gap-4 group"
              >
                <div className="w-10 h-10 flex-shrink-0 rounded-[14px] bg-gradient-to-br from-[#9a0002]/10 to-[#9a0002]/5 border border-[#9a0002]/12 flex items-center justify-center group-hover:scale-110 group-hover:from-[#9a0002]/18 transition-all duration-300">
                  <MaterialSymbol icon={icon} size={17} className="text-[#9a0002] group-hover:rotate-6 transition-transform" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100 leading-tight">{title}</h3>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Right Column: Form card ───────────────────────────── */}
        <div className="order-1 w-full lg:order-2">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="w-full bg-[#faf6f1] dark:bg-[#1c1917] border border-[#ddd4c8] dark:border-[#3d3732] rounded-[28px] shadow-sm p-6 md:p-8 flex flex-col justify-between min-h-[500px] relative overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                <motion.div
                  key="form-content"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col flex-1"
                >
                  {/* Form Steps Indicator */}
                  <div className="mb-6">
                    <OnboardingSteps
                      step={step}
                      isSubmitted={isSubmitted}
                      step1Percentage={step1Percentage}
                      step2Percentage={step2Percentage}
                      step3Percentage={step3Percentage}
                    />

                    <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                      <MaterialSymbol icon="store" className="text-[#9a0002] flex-shrink-0" size={22} />
                      <span>
                        {step === 1 && "Tu Negocio"}
                        {step === 2 && "Datos de Contacto"}
                        {step === 3 && "Confirmá tu Solicitud"}
                      </span>
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {step === 1 && "Contanos sobre tu local."}
                      {step === 2 && "Dejanos tus datos para contactarte."}
                      {step === 3 && "Revisá la información y envianos tu solicitud."}
                    </p>
                  </div>

                  {/* Form Fields */}
                  <div className="flex-1 flex flex-col justify-center">
                    {step === 1 && (
                      <div className="space-y-5">
                        {/* Business Name Field */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                            Nombre del Negocio
                          </label>
                          <div
                            className={cn(
                              "relative flex items-center bg-gray-50 dark:bg-[#1c1917] border rounded-xl px-3.5 py-3 transition-all duration-300",
                              nameValidationState === 'invalid' && "border-red-500 dark:border-red-600 focus-within:ring-1 focus-within:ring-red-500",
                              nameValidationState === 'idle' && "border-gray-200 dark:border-[#3d3732] focus-within:border-[#9a0002] focus-within:ring-1 focus-within:ring-[#9a0002]"
                            )}
                          >
                            <MaterialSymbol icon="store" size={16} className="text-gray-400 mr-2.5 flex-shrink-0" />
                            <div className="flex-1 pr-14">
                              <SmoothInput
                                placeholder="Ej. Pizzería Don Roque"
                                value={businessName}
                                maxLength={100}
                                onChange={(e) => {
                                  setBusinessName(e.target.value);
                                  setNameValidationState('idle');
                                  setValidationMessages((prev) => ({ ...prev, businessName: "" }));
                                  setErrors((prev) => ({ ...prev, businessName: "" }));
                                }}
                                onBlur={handleNameBlur}
                                className="text-xs font-bold text-gray-800 dark:text-gray-100"
                                wrapperClassName="h-5"
                              />
                            </div>
                            <div className="absolute right-3.5 flex items-center gap-2">
                              <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 select-none">
                                {100 - businessName.length}
                              </span>
                              {nameValidationState === 'invalid' && (
                                <MaterialSymbol icon="error" size={14} className="text-red-500 animate-in zoom-in duration-350" />
                              )}
                            </div>
                          </div>
                          {validationMessages.businessName && (
                            <div className="flex items-center gap-1.5 text-xs font-bold mt-1 text-red-500 animate-in slide-in-from-top-1 duration-200">
                              <MaterialSymbol icon="error" size={12} />
                              <span>{validationMessages.businessName}</span>
                            </div>
                          )}
                        </div>

                        {/* Business Type Selector */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                            Tipo de Negocio
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {BUSINESS_TYPES.map((type) => {
                              const isSelected = businessType === type.id;
                              return (
                                <motion.button
                                  type="button"
                                  key={type.id}
                                  onClick={() => {
                                    setBusinessType(type.id);
                                    if (type.id !== "restaurante") {
                                      setRestaurantCategory("");
                                    }
                                    setErrors((prev) => ({ ...prev, businessType: "" }));
                                  }}
                                  className={cn(
                                    "py-3 px-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer bg-white dark:bg-[#231f1c]",
                                    isSelected
                                      ? "border-2 border-[#9a0002] text-[#9a0002] font-extrabold shadow-sm"
                                      : "border-gray-200 dark:border-[#3d3732] text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-[#3d3732]"
                                  )}
                                >
                                  <MaterialSymbol icon={type.icon} size={18} />
                                  <span className="text-[10px] font-bold tracking-tight">{type.label}</span>
                                </motion.button>
                              );
                            })}
                          </div>
                          {errors.businessType && (
                            <div className="flex items-center gap-1.5 text-xs text-red-500 font-bold mt-1">
                              <MaterialSymbol icon="error" size={12} />
                              <span>{errors.businessType}</span>
                            </div>
                          )}
                        </div>

                        {/* Restaurant Specialties */}
                        <AnimatePresence>
                          {businessType === "restaurante" && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden space-y-1.5 pt-1"
                            >
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                  <MaterialSymbol icon="restaurant" size={14} className="text-[#9a0002]" />
                                  Especialidad Gastronómica
                                  <span className="text-[#9a0002]">*</span>
                                </label>
                                <span className="text-[10px] text-gray-400 font-medium">Selecciona 1 opción</span>
                              </div>
                              <div className="relative">
                                <div
                                  className={cn(
                                    "absolute top-0 left-0 right-[5px] h-6 bg-gradient-to-b from-white dark:from-[#1c1917] to-transparent pointer-events-none z-10 transition-opacity duration-300",
                                    specScrollState.isAtTop ? "opacity-0" : "opacity-100"
                                  )}
                                />
                                <div
                                  className={cn(
                                    "absolute bottom-0 left-0 right-[5px] h-6 bg-gradient-to-t from-white dark:from-[#1c1917] to-transparent pointer-events-none z-10 transition-opacity duration-300",
                                    specScrollState.isAtBottom ? "opacity-0" : "opacity-100"
                                  )}
                                />
                                <div
                                  ref={specScrollRef}
                                  onScroll={checkSpecScroll}
                                  className="max-h-[160px] overflow-y-auto pr-1 flex flex-wrap gap-1.5 custom-scrollbar pb-2 pt-0.5"
                                >
                                  {RESTAURANT_SPECIALTIES.map((cat) => {
                                    const isSelected = restaurantCategory === cat.id;
                                    return (
                                      <motion.button
                                        type="button"
                                        key={cat.id}
                                        onClick={() => {
                                          setRestaurantCategory(cat.id);
                                          setErrors((prev) => ({ ...prev, restaurantCategory: "" }));
                                        }}
                                        className={cn(
                                          "py-1.5 px-3 rounded-full text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-all",
                                          isSelected
                                            ? "bg-[#9a0002] text-white border-[#9a0002] shadow-sm"
                                            : "bg-white dark:bg-[#1c1917] text-gray-600 dark:text-gray-400 border-[#d6cdc0] dark:border-[#3d3732] hover:bg-gray-50 dark:hover:bg-[#2a2623]"
                                        )}
                                      >
                                        <MaterialSymbol icon={cat.icon} size={13} />
                                        <span>{cat.label}</span>
                                      </motion.button>
                                    );
                                  })}
                                </div>
                              </div>
                              {errors.restaurantCategory && (
                                <div className="flex items-center gap-1.5 text-xs text-red-500 font-bold mt-1">
                                  <MaterialSymbol icon="error" size={12} />
                                  <span>{errors.restaurantCategory}</span>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Not Applicable message for other categories */}
                        {businessType && businessType !== "restaurante" && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-3 bg-gray-50 dark:bg-[#1c1917] border border-dashed border-gray-200 dark:border-[#3d3732] rounded-xl text-center"
                          >
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                              Especialidad Gastronómica: No aplica para {BUSINESS_TYPES.find((b) => b.id === businessType)?.label}
                            </span>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-4.5">
                        {/* Responsible Name field */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                            Nombre del Responsable
                          </label>
                          <div
                            className={cn(
                              "relative flex items-center bg-gray-50 dark:bg-[#1c1917] border rounded-xl px-3.5 py-3 transition-all duration-300",
                              errors.responsibleName ? "border-red-500 dark:border-red-600 focus-within:ring-1 focus-within:ring-red-500" : "border-gray-200 dark:border-[#3d3732] focus-within:border-[#9a0002] focus-within:ring-1 focus-within:ring-[#9a0002]"
                            )}
                          >
                            <MaterialSymbol icon="person" size={16} className="text-gray-400 mr-2.5 flex-shrink-0" />
                            <div className="flex-1 pr-6">
                              <SmoothInput
                                placeholder="Ej. Juan Pérez"
                                value={responsibleName}
                                maxLength={100}
                                onChange={(e) => {
                                  setResponsibleName(e.target.value);
                                  setErrors((prev) => ({ ...prev, responsibleName: "" }));
                                }}
                                className="text-xs font-bold text-gray-800 dark:text-gray-100"
                                wrapperClassName="h-5"
                              />
                            </div>
                          </div>
                          {errors.responsibleName && (
                            <div className="flex items-center gap-1.5 text-xs text-red-500 font-bold mt-1 animate-in slide-in-from-top-1 duration-200">
                              <MaterialSymbol icon="error" size={12} />
                              <span>{errors.responsibleName}</span>
                            </div>
                          )}
                        </div>

                        {/* WhatsApp number field */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                            Número de WhatsApp del Negocio
                          </label>
                          <div
                            className={cn(
                              "relative flex items-center bg-gray-50 dark:bg-[#1c1917] border rounded-xl px-3.5 py-3 transition-all duration-300",
                              whatsappValidationState === 'invalid' && "border-red-500 dark:border-red-600 focus-within:ring-1 focus-within:ring-red-500",
                              whatsappValidationState === 'idle' && "border-gray-200 dark:border-[#3d3732] focus-within:border-[#9a0002] focus-within:ring-1 focus-within:ring-[#9a0002]"
                            )}
                          >
                            {/* Flag & Prefix Selector Dropdown */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setShowPrefixDropdown(!showPrefixDropdown)}
                                className="flex items-center gap-1 bg-gray-100 dark:bg-[#2a2623] hover:bg-[#ede4d9] dark:hover:bg-[#302c28] px-2 py-1.5 rounded-lg border border-[#d6cdc0] dark:border-[#3d3732] mr-2.5 select-none font-black text-[10px] text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                              >
                                <span className="text-xs select-none">{selectedCountry.flag}</span>
                                <span>{selectedCountry.code}</span>
                                <MaterialSymbol icon="expand_more" size={10} className={cn("text-gray-400 dark:text-gray-500 transition-transform duration-200", showPrefixDropdown && "transform rotate-180")} />
                              </button>

                              <AnimatePresence>
                                {showPrefixDropdown && (
                                  <>
                                    <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowPrefixDropdown(false)} />
                                    <motion.div
                                      initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                      transition={{ duration: 0.15 }}
                                      className="absolute left-0 mt-1.5 w-40 max-h-48 overflow-y-auto bg-white/80 dark:bg-[#231f1c]/80 backdrop-blur-md border border-gray-200 dark:border-[#3d3732] rounded-xl shadow-xl z-50 py-1.5 custom-scrollbar"
                                    >
                                      {COUNTRIES.map((c) => (
                                        <button
                                          key={c.code}
                                          type="button"
                                          onClick={() => {
                                            setSelectedCountry(c);
                                            setShowPrefixDropdown(false);
                                          }}
                                          className={cn(
                                            "w-full px-3 py-2 flex items-center gap-2.5 text-[10px] font-bold text-left hover:bg-[#ede4d9] dark:hover:bg-[#302c28] transition-colors cursor-pointer",
                                            selectedCountry.code === c.code ? "text-[#9a0002] bg-[#9a0002]/5" : "text-gray-700 dark:text-gray-300"
                                          )}
                                        >
                                          <span className="text-xs select-none">{c.flag}</span>
                                          <span className="w-8">{c.code}</span>
                                          <span className="text-gray-400 font-semibold truncate">{c.name}</span>
                                        </button>
                                      ))}
                                    </motion.div>
                                  </>
                                )}
                              </AnimatePresence>
                            </div>

                            <div className="flex-1 pr-6">
                              <SmoothInput
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="Ej. 11 2233 4455"
                                value={whatsapp}
                                onChange={(e) => {
                                  const formatted = formatPhoneNumber(e.target.value);
                                  setWhatsapp(formatted);
                                  setWhatsappValidationState('idle');
                                  setValidationMessages((prev) => ({ ...prev, whatsapp: "" }));
                                  setErrors((prev) => ({ ...prev, whatsapp: "" }));
                                }}
                                onBlur={handleWhatsappBlur}
                                className="text-xs font-bold text-gray-800 dark:text-gray-100"
                                wrapperClassName="h-5"
                              />
                            </div>

                            <div className="absolute right-3.5 flex items-center">
                              {whatsappValidationState === 'invalid' && (
                                <MaterialSymbol icon="error" size={14} className="text-red-500 animate-in zoom-in duration-350" />
                              )}
                            </div>
                          </div>
                          {validationMessages.whatsapp && (
                            <div className="flex items-center gap-1.5 text-xs text-red-500 font-bold mt-1 animate-in slide-in-from-top-1 duration-200">
                              <MaterialSymbol icon="error" size={12} />
                              <span>{validationMessages.whatsapp}</span>
                            </div>
                          )}
                        </div>

                        {/* Responsible Email field */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                            Email del Responsable
                          </label>
                          <div
                            className={cn(
                              "relative flex items-center bg-gray-50 dark:bg-[#1c1917] border rounded-xl px-3.5 py-3 transition-all duration-300",
                              emailValidationState === 'invalid' && "border-red-500 dark:border-red-600 focus-within:ring-1 focus-within:ring-red-500",
                              emailValidationState === 'idle' && "border-gray-200 dark:border-[#3d3732] focus-within:border-[#9a0002] focus-within:ring-1 focus-within:ring-[#9a0002]"
                            )}
                          >
                            <MaterialSymbol icon="mail" size={16} className="text-gray-400 mr-2.5 flex-shrink-0" />
                            <div className="flex-1 pr-6">
                              <SmoothInput
                                type="text"
                                placeholder="Ej. responsable@negocio.com"
                                value={responsibleEmail}
                                onChange={(e) => {
                                  setResponsibleEmail(e.target.value);
                                  setEmailValidationState('idle');
                                  setValidationMessages((prev) => ({ ...prev, responsibleEmail: "" }));
                                  setErrors((prev) => ({ ...prev, responsibleEmail: "" }));
                                }}
                                onBlur={handleEmailBlur}
                                className="text-xs font-bold text-gray-800 dark:text-gray-100"
                                wrapperClassName="h-5"
                              />
                            </div>
                            <div className="absolute right-3.5 flex items-center">
                              {emailValidationState === 'invalid' && (
                                <MaterialSymbol icon="error" size={14} className="text-red-500 animate-in zoom-in duration-350" />
                              )}
                            </div>
                          </div>
                          {validationMessages.responsibleEmail && (
                            <div className="flex items-center gap-1.5 text-xs text-red-500 font-bold mt-1 animate-in slide-in-from-top-1 duration-200">
                              <MaterialSymbol icon="error" size={12} />
                              <span>{validationMessages.responsibleEmail}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-5">
                        {/* Fixed Location Card */}
                        <div className="p-4 bg-gradient-to-br from-[#9a0002]/5 to-amber-50/50 dark:from-[#9a0002]/10 dark:to-[#2a2623] border border-[#9a0002]/15 dark:border-[#3d3732] rounded-2xl space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#9a0002]/10 border border-[#9a0002]/15 flex items-center justify-center flex-shrink-0">
                              <MaterialSymbol icon="location_on" size={18} className="text-[#9a0002]" />
                            </div>
                            <div>
                              <h3 className="text-xs font-bold text-gray-900 dark:text-[#d4cfc9] flex items-center gap-2">
                                Zona de operación
                                <span className="px-2 py-0.5 bg-[#9a0002]/10 text-[#9a0002] text-[8px] font-black rounded-full uppercase tracking-wide">
                                  Única
                                </span>
                              </h3>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                                Por el momento solo operamos en esta zona. Tu solicitud será evaluada para este área.
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-2.5 bg-white/70 dark:bg-[#1c1917]/70 rounded-xl border border-[#ddd4c8]/50 dark:border-[#3d3732]/50 text-center">
                              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Ciudad</span>
                              <span className="text-[10px] font-black text-gray-800 dark:text-[#d4cfc9]">{FIXED_LOCATION.city}</span>
                            </div>
                            <div className="p-2.5 bg-white/70 dark:bg-[#1c1917]/70 rounded-xl border border-[#ddd4c8]/50 dark:border-[#3d3732]/50 text-center">
                              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Provincia</span>
                              <span className="text-[10px] font-black text-gray-800 dark:text-[#d4cfc9]">{FIXED_LOCATION.province}</span>
                            </div>
                            <div className="p-2.5 bg-white/70 dark:bg-[#1c1917]/70 rounded-xl border border-[#ddd4c8]/50 dark:border-[#3d3732]/50 text-center">
                              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wide block mb-1">C.P.</span>
                              <span className="text-[10px] font-black text-gray-800 dark:text-[#d4cfc9]">{FIXED_LOCATION.postal_code}</span>
                            </div>
                          </div>
                        </div>

                        {/* Message field */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                            Mensaje opcional
                          </label>
                          <div className={cn(
                            "relative bg-gray-50 dark:bg-[#1c1917] border border-gray-200 dark:border-[#3d3732] focus-within:border-[#9a0002] focus-within:ring-1 focus-within:ring-[#9a0002] rounded-xl px-3.5 py-3 transition-all duration-300",
                            errors.message && "border-red-500 dark:border-red-600 focus-within:ring-red-500"
                          )}>
                            <textarea
                              placeholder="Contanos algo más sobre tu negocio..."
                              value={message}
                              maxLength={500}
                              onChange={(e) => {
                                setMessage(e.target.value);
                                setErrors((prev) => ({ ...prev, message: "" }));
                              }}
                              rows={3}
                              className="w-full bg-transparent outline-none text-xs font-bold text-gray-800 dark:text-gray-100 placeholder:text-gray-400 resize-none"
                            />
                            <div className="absolute bottom-2 right-3 text-[10px] font-black text-gray-400 dark:text-gray-500">
                              {message.length}/500
                            </div>
                          </div>
                          {errors.message && (
                            <div className="flex items-center gap-1.5 text-xs text-red-500 font-bold mt-1">
                              <MaterialSymbol icon="error" size={12} />
                              <span>{errors.message}</span>
                            </div>
                          )}
                        </div>

                        {/* Consent Checkbox */}
                        <div className="p-4 bg-gray-50 dark:bg-[#1c1917] border border-gray-200 dark:border-[#3d3732] rounded-2xl space-y-4">
                          <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <span className="w-2 h-2 bg-[#9a0002] rounded-full animate-pulse" />
                            Autorización de contacto
                          </h3>
                          <div className="flex items-start gap-3">
                            <div className="flex items-center h-5 mt-0.5">
                              <input
                                id="consent"
                                type="checkbox"
                                checked={consentChecked}
                                onChange={(e) => {
                                  setConsentChecked(e.target.checked);
                                  setErrors((prev) => ({ ...prev, consent: "" }));
                                }}
                                className="w-4 h-4 text-[#9a0002] focus:ring-[#9a0002] border-gray-300 dark:border-gray-700 rounded cursor-pointer"
                              />
                            </div>
                            <label htmlFor="consent" className="text-[11px] font-medium leading-relaxed text-gray-600 dark:text-gray-400 select-none cursor-pointer">
                              Autorizo a <span className="font-bold text-gray-800 dark:text-[#d4cfc9]">BolivarPide</span> a contactarme vía WhatsApp y email para coordinar la activación de mi negocio, conforme a la{" "}
                              <span className="text-[#9a0002] hover:underline cursor-pointer">Política de Privacidad</span>.
                            </label>
                          </div>
                          {errors.consent && (
                            <div className="flex items-center gap-1.5 text-xs text-red-500 font-bold mt-1">
                              <MaterialSymbol icon="error" size={12} />
                              <span>{errors.consent}</span>
                            </div>
                          )}
                        </div>

                        {/* Summary Review */}
                        <div className="overflow-hidden rounded-[20px] border border-[#ddd4c8] dark:border-[#3d3732]/80 bg-white dark:bg-[#1c1917] shadow-md">
                          <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-[#9a0002] px-4 py-3 flex items-center justify-between text-white select-none">
                            <div className="flex items-center gap-2">
                              <MaterialSymbol icon="check" size={15} className="text-white/90" />
                              <span className="text-[10px] font-extrabold uppercase tracking-wider">Resumen de tu solicitud</span>
                            </div>
                            <div className="w-6.5 h-6.5 rounded-full bg-white/10 flex items-center justify-center">
                              <MaterialSymbol icon="verified" size={14} className="text-white/90" />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 p-4.5 bg-gray-50/40 dark:bg-[#1c1917]/20">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-[#9a0002] flex-shrink-0">
                                <MaterialSymbol icon="store" size={15} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide block leading-none mb-1">Negocio</span>
                                <span className="text-xs font-extrabold text-gray-800 dark:text-[#d4cfc9] truncate block leading-tight">{businessName}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-500 dark:text-blue-400 flex-shrink-0">
                                <MaterialSymbol icon="store" size={15} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide block leading-none mb-1">Rubro</span>
                                <span className="text-xs font-extrabold text-gray-800 dark:text-[#d4cfc9] truncate block leading-tight capitalize">
                                  {BUSINESS_TYPES.find((b) => b.id === businessType)?.label}
                                  {businessType === "restaurante" && restaurantCategory && ` (${RESTAURANT_SPECIALTIES.find((c) => c.id === restaurantCategory)?.label})`}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400 flex-shrink-0">
                                <MaterialSymbol icon="smartphone" size={15} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide block leading-none mb-1">WhatsApp</span>
                                <span className="text-xs font-extrabold text-gray-800 dark:text-[#d4cfc9] truncate block leading-tight">{selectedCountry.code} {whatsapp}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-500 dark:text-indigo-400 flex-shrink-0">
                                <MaterialSymbol icon="mail" size={15} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide block leading-none mb-1">Email</span>
                                <span className="text-xs font-extrabold text-gray-800 dark:text-[#d4cfc9] truncate block leading-tight">{responsibleEmail}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 col-span-2">
                              <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-500 dark:text-amber-400 flex-shrink-0">
                                <MaterialSymbol icon="person" size={15} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide block leading-none mb-1">Responsable</span>
                                <span className="text-xs font-extrabold text-gray-800 dark:text-[#d4cfc9] truncate block leading-tight">{responsibleName}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Buttons */}
                  <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-100 dark:border-[#3d3732]">
                    {step > 1 ? (
                      <motion.button
                        type="button"
                        onClick={handlePrevStep}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="px-4 py-2.5 bg-gray-50 dark:bg-[#1c1917] border border-gray-200 dark:border-[#3d3732] text-xs font-bold text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-[#2a2623] transition-all select-none cursor-pointer"
                      >
                        Atrás
                      </motion.button>
                    ) : (
                      <div />
                    )}

                    {step < 3 ? (
                      <motion.button
                        type="button"
                        onClick={handleNextStep}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="px-5 py-2.5 bg-[#9a0002] hover:bg-[#850002] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 select-none cursor-pointer"
                      >
                        <span>Siguiente</span>
                        <MaterialSymbol icon="chevron_right" size={14} />
                      </motion.button>
                    ) : (
                      <motion.button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="px-6 py-2.5 bg-[#9a0002] text-white text-xs font-bold rounded-xl hover:bg-[#6b0001] transition-all shadow-lg shadow-red-500/15 flex items-center gap-1.5 select-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <MaterialSymbol icon="sync" size={14} className="animate-spin" />
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <>
                            <span>Enviar Solicitud</span>
                            <MaterialSymbol icon="check" size={14} />
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>

                  {submitError && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400 font-bold"
                    >
                      <MaterialSymbol icon="error" size={14} />
                      <span>{submitError}</span>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                /* Success View */
                <motion.div
                  key="success-content"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="flex flex-col items-center justify-center text-center py-8 space-y-6"
                >
                  {/* Animated check circle */}
                  <div className="relative">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 15 }}
                      className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center text-3xl shadow-inner relative"
                    >
                      <MaterialSymbol icon="check" size={40} />
                    </motion.div>
                    <motion.span
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                      className="absolute -top-2 -right-2 text-lg"
                    >
                      ✨
                    </motion.span>
                    <motion.span
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6, type: "spring" }}
                      className="absolute -bottom-2 -left-2 text-lg"
                    >
                      🎉
                    </motion.span>
                  </div>

                  <div className="space-y-2 max-w-sm">
                    <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                      ¡Solicitud recibida!
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-bold text-gray-800 dark:text-gray-200">{businessName}</span> ya está en nuestra lista de negocios por revisar.
                    </p>
                  </div>

                  {/* Success details panel */}
                  <div className="w-full max-w-sm bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl p-4.5 text-left space-y-3.5">
                    <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/20 pb-2">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Próximos pasos</span>
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[9px] font-black rounded-md">
                        24-48 HS
                      </span>
                    </div>

                    <ul className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 space-y-2 pl-1">
                      <li className="flex items-start gap-2">
                        <MaterialSymbol icon="check" size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                        Revisamos tu negocio manualmente.
                      </li>
                      <li className="flex items-start gap-2">
                        <MaterialSymbol icon="check" size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                        Te contactamos por WhatsApp para coordinar la activación.
                      </li>
                      <li className="flex items-start gap-2">
                        <MaterialSymbol icon="check" size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                        Configuramos tu cuenta y catálogo inicial.
                      </li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm pt-4">
                    <Link
                      href="/"
                      className="flex-1 py-3 bg-[#9a0002] hover:bg-[#850002] text-white text-xs font-bold rounded-xl transition-all text-center select-none cursor-pointer shadow-sm"
                    >
                      Volver al Inicio
                    </Link>
                    <Link
                      href="/negocio/registro"
                      className="flex-1 py-3 bg-gray-50 dark:bg-[#1c1917] border border-gray-200 dark:border-[#3d3732] text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-[#2a2623] transition-all text-center select-none cursor-pointer"
                    >
                      Enviar otra solicitud
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <AnimatedSection className="relative z-10 w-full max-w-[1200px] mx-auto px-6 md:px-10 py-16">
        <div className="relative overflow-hidden rounded-[28px] border border-[#ddd4c8]/70 dark:border-[#3d3732]/80 bg-white/70 dark:bg-[#231f1c]/70 backdrop-blur-md px-8 py-10 shadow-lg shadow-black/5">
          <div className="absolute inset-0 bg-gradient-to-br from-[#9a0002]/4 via-transparent to-transparent pointer-events-none rounded-[28px]" />
          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-[#ddd4c8]/60 dark:divide-gray-800/60">
            {[
              { value: "$0", label: "Costo de activación" },
              { value: "24-48h", label: "Revisión manual" },
              { value: "1 zona", label: "San Carlos de Bolívar" },
            ].map(({ value, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.45 }}
                className="text-center py-4 sm:py-0"
              >
                <p className="text-3xl font-black text-[#9a0002] leading-none">{value}</p>
                <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mt-1.5 uppercase tracking-wide">{label}</p>
              </motion.div>
            ))}
          </div>
          <div className="relative mt-8 pt-6 border-t border-[#ddd4c8]/60 dark:border-[#3d3732]/60 flex items-center justify-center gap-2 text-[12px] text-gray-500 dark:text-gray-400 font-bold">
            <MaterialSymbol icon="group" size={14} className="text-[#9a0002]" />
            <span>
              Estamos construyendo la red de negocios de{" "}
              <span className="text-gray-800 dark:text-gray-200 font-black">San Carlos de Bolívar</span>
            </span>
          </div>
        </div>
      </AnimatedSection>

      {/* FAQ */}
      <AnimatedSection className="relative z-10 w-full max-w-[1200px] mx-auto px-6 md:px-10 pb-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Preguntas frecuentes
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Todo lo que necesitás saber antes de registrarte</p>
        </div>
        <FaqAccordion />
      </AnimatedSection>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 text-center border-t border-[#ddd4c8]/50 dark:border-[#3d3732]/50">
        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
          © {new Date().getFullYear()} BolivarPide Inc. · Todos los derechos reservados
        </p>
      </footer>
    </div>
  );
}

// ─── FAQ Accordion ────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  { q: "¿En cuánto tiempo me contactan?", a: "Revisamos cada solicitud manualmente. Te escribimos por WhatsApp dentro de las 24-48 horas hábiles siguientes al envío." },
  { q: "¿Cuánto cobra BolivarPide a los negocios?", a: "Es un costo inicial ínfimo para levantar el local en el sistema y después un 7% por compra realizada." },
  { q: "¿En qué zonas operan?", a: "Por el momento operamos en San Carlos de Bolívar. Estamos buscando expandirnos constantemente: si te interesa la propuesta y tenés un local en otra ciudad o zona, ponete en contacto con nosotros para coordinar." },
  { q: "¿Quién hace el delivery de los pedidos?", a: "Estamos ampliando una red de repartidores locales a los cuales podés sumar tus propios contactos o repartidores de confianza para tu local." },
  { q: "¿Quién paga el envío?", a: "El costo de envío lo abona el cliente final. Como negocio socio, vos solo abonás la comisión correspondiente sobre la venta." },
  { q: "¿Puedo cambiar el perfil de mi negocio después?", a: "Sí, desde el panel de control podés actualizar fotos, horarios, menú, precios y datos de contacto en cualquier momento." },
  { q: "¿Qué pasa si tengo varias sucursales?", a: "Podés registrar todas las sucursales que quieras sin costo adicional. Simplemente tenés 1 solo costo inicial para levantar tu negocio en sí." },
];

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-2">
      {FAQ_ITEMS.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.04, duration: 0.4 }}
          className="overflow-hidden rounded-[18px] border border-[#ddd4c8]/70 dark:border-[#3d3732]/70 bg-white/60 dark:bg-[#231f1c]/60 backdrop-blur-sm"
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left cursor-pointer group"
          >
            <span className="font-bold text-sm text-gray-800 dark:text-gray-100 leading-snug">{item.q}</span>
            <motion.span
              animate={{ rotate: open === i ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="flex-shrink-0 w-7 h-7 rounded-full bg-[#9a0002]/8 border border-[#9a0002]/15 flex items-center justify-center group-hover:bg-[#9a0002]/15 transition-colors"
            >
              {open === i ? <MaterialSymbol icon="remove" size={13} className="text-[#9a0002]" /> : <MaterialSymbol icon="add" size={13} className="text-[#9a0002]" />}
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                key="answer"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              >
                <p className="px-6 pb-5 text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed border-t border-[#ddd4c8]/40 dark:border-[#3d3732]/40 pt-3">
                  {item.a}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}

// ─── OnboardingSteps: line stretches → wraps the next circle ─────────────────
function OnboardingSteps({
  step,
  isSubmitted,
  step1Percentage,
  step2Percentage,
  step3Percentage,
}: {
  step: number;
  isSubmitted: boolean;
  step1Percentage: number;
  step2Percentage: number;
  step3Percentage: number;
}) {
  const R = 16;
  const CY = 30;
  const C1X = 30;
  const C2X = 150;
  const C3X = 270;
  const STROKE = 3.5;

  const arcRight = (cx: number) => `M ${cx - R} ${CY} A ${R} ${R} 0 0 1 ${cx + R} ${CY}`;
  const arcLeft = (cx: number) => `M ${cx - R} ${CY} A ${R} ${R} 0 0 0 ${cx + R} ${CY}`;

  const lineStart1 = C1X + R;
  const lineEnd1 = C2X - R;
  const lineStart2 = C2X + R;
  const lineEnd2 = C3X - R;

  return (
    <div className="w-full max-w-sm mx-auto mb-6 relative select-none">
      <svg viewBox={`0 0 300 60`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="onbGrad" gradientUnits="userSpaceOnUse" x1="30" y1="30" x2="270" y2="30">
            <stop offset="0%" stopColor="#9a0002" />
            <stop offset="100%" stopColor="#6b0001" />
          </linearGradient>
        </defs>

        <line x1={C1X} y1={CY} x2={C3X} y2={CY} stroke="#e5e7eb" strokeWidth={STROKE} strokeLinecap="round" className="dark:[stroke:#3d3732]" />

        {[C1X, C2X, C3X].map((cx) => (
          <circle key={cx} cx={cx} cy={CY} r={R} fill="white" stroke="#e5e7eb" strokeWidth={2} className="dark:[fill:#231f1c] dark:[stroke:#3d3732]" />
        ))}

        <motion.line
          x1={lineStart1}
          y1={CY}
          y2={CY}
          stroke="url(#onbGrad)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          initial={{ x2: lineStart1, opacity: 0 }}
          animate={{ x2: step >= 2 ? lineEnd1 : lineStart1, opacity: step >= 2 ? 1 : 0 }}
          transition={{ x2: { duration: 0.55, ease: [0.4, 0, 0.2, 1] }, opacity: { duration: 0.12 } }}
        />

        {step >= 2 && (
          <>
            <motion.path
              d={arcRight(C2X)}
              fill="transparent"
              stroke="url(#onbGrad)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: step === 2 ? step2Percentage : 1 }}
              transition={{ pathLength: { delay: step === 2 ? 0.55 : 0, duration: 0.45, ease: "easeOut" } }}
            />
            <motion.path
              d={arcLeft(C2X)}
              fill="transparent"
              stroke="url(#onbGrad)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: step === 2 ? step2Percentage : 1 }}
              transition={{ pathLength: { delay: step === 2 ? 0.55 : 0, duration: 0.45, ease: "easeOut" } }}
            />
          </>
        )}

        <motion.line
          x1={lineStart2}
          y1={CY}
          y2={CY}
          stroke="url(#onbGrad)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          initial={{ x2: lineStart2, opacity: 0 }}
          animate={{ x2: step >= 3 ? lineEnd2 : lineStart2, opacity: step >= 3 ? 1 : 0 }}
          transition={{ x2: { duration: 0.55, ease: [0.4, 0, 0.2, 1] }, opacity: { duration: 0.12 } }}
        />

        {step >= 3 && (
          <>
            <motion.path
              d={arcRight(C3X)}
              fill="transparent"
              stroke="url(#onbGrad)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: step === 3 ? step3Percentage : 1 }}
              transition={{ pathLength: { delay: step === 3 ? 0.55 : 0, duration: 0.45, ease: "easeOut" } }}
            />
            <motion.path
              d={arcLeft(C3X)}
              fill="transparent"
              stroke="url(#onbGrad)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: step === 3 ? step3Percentage : 1 }}
              transition={{ pathLength: { delay: step === 3 ? 0.55 : 0, duration: 0.45, ease: "easeOut" } }}
            />
          </>
        )}

        <motion.path
          d={arcRight(C1X)}
          fill="transparent"
          stroke="url(#onbGrad)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: step === 1 ? step1Percentage : 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
        <motion.path
          d={arcLeft(C1X)}
          fill="transparent"
          stroke="url(#onbGrad)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: step === 1 ? step1Percentage : 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />

        <motion.circle
          cx={C1X}
          cy={CY}
          r={R}
          fill="url(#onbGrad)"
          initial={{ scale: 0 }}
          animate={{ scale: step > 1 ? 1 : 0 }}
          style={{ transformBox: "fill-box", transformOrigin: "center" } as React.CSSProperties}
          transition={{ type: "spring", stiffness: 280, damping: 20 }}
        />
        <motion.circle
          cx={C2X}
          cy={CY}
          r={R}
          fill="url(#onbGrad)"
          initial={{ scale: 0 }}
          animate={{ scale: step > 2 ? 1 : 0 }}
          style={{ transformBox: "fill-box", transformOrigin: "center" } as React.CSSProperties}
          transition={{ type: "spring", stiffness: 280, damping: 20 }}
        />
        <motion.circle
          cx={C3X}
          cy={CY}
          r={R}
          fill="url(#onbGrad)"
          initial={{ scale: 0 }}
          animate={{ scale: isSubmitted ? 1 : 0 }}
          style={{ transformBox: "fill-box", transformOrigin: "center" } as React.CSSProperties}
          transition={{ type: "spring", stiffness: 280, damping: 20 }}
        />

        {[
          { cx: C1X, n: "1", activeStep: 1, doneWhen: step > 1 },
          { cx: C2X, n: "2", activeStep: 2, doneWhen: step > 2 },
          { cx: C3X, n: "3", activeStep: 3, doneWhen: isSubmitted },
        ].map(({ cx, n, activeStep, doneWhen }) => (
          <motion.text
            key={n}
            x={cx}
            y={CY + 4}
            textAnchor="middle"
            fontSize="11"
            fontWeight="900"
            className="pointer-events-none select-none"
            animate={{ fill: doneWhen ? "#ffffff" : step === activeStep ? "#9a0002" : "#9ca3af" }}
            transition={{ duration: 0.25, delay: step === activeStep ? 0.55 : 0 }}
          >
            {n}
          </motion.text>
        ))}

        {[
          { cx: C1X, label: "Negocio", activeStep: 1 },
          { cx: C2X, label: "Contacto", activeStep: 2 },
          { cx: C3X, label: "Confirmar", activeStep: 3 },
        ].map(({ cx, label, activeStep }) => (
          <motion.text
            key={label}
            x={cx}
            y={CY + R + 11}
            textAnchor="middle"
            fontSize="7.5"
            fontWeight="700"
            letterSpacing="0.03em"
            animate={{
              fill: step === activeStep ? "#9a0002" : step > activeStep ? "#10b981" : "#9ca3af",
              opacity: step === activeStep ? 1 : 0.65,
            }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none select-none uppercase"
          >
            {label}
          </motion.text>
        ))}
      </svg>
    </div>
  );
}
