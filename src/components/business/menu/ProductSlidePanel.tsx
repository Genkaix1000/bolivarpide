"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";
import type { MenuCategoryView, ProductOptionGroup } from "@/lib/business/menuTypes";
import { saveMenuProductAction } from "@/lib/business/menuActions";
import {
  MENU_ICON_OPTS,
  MENU_PHOTO_OPTS,
  optimizeImageFile,
} from "@/lib/images/optimizeImage";
import { MENU_IMAGE_FRAME_CLASS } from "@/lib/images/menuImageSpec";
import { ImageSourceActions } from "@/components/menu/ImageSourceActions";
import {
  extrasGroupFromRows,
  parseMenuOptionGroups,
  splitExtrasFromOptions,
} from "@/lib/business/menuOptionTypes";

const QUICK_EXTRAS = [
  { label: "Bacon", price: 800 },
  { label: "Huevo frito", price: 500 },
  { label: "Cheddar", price: 600 },
  { label: "Papas extra", price: 1200 },
];

type SelectOptionGroup = { title: string; choices: string[] };
type ExtraRow = { label: string; pricePesos: string };

const QUICK_INGREDIENTS = [
  "Cheddar",
  "Bacon",
  "Pepinillos",
  "Cebolla crispy",
  "Tomate",
  "Lechuga",
  "Huevo frito",
  "Salsa barbacoa",
  "Mayonesa de la casa",
];

const OPTION_GROUP_TEMPLATES = [
  { title: "Punto de cocción", choices: ["Jugoso", "A punto", "Bien cocido"] },
  { title: "Tipo de pan", choices: ["Pan de papa", "Brioche", "Sin TACC"] },
  { title: "Salsa de acompañamiento", choices: ["Barbacoa", "Alioli", "Mostaza dulce"] },
];

type Props = {
  open: boolean;
  onClose: () => void;
  businessId: string;
  categories: MenuCategoryView[];
  editing?: {
    id: string;
    name: string;
    description?: string | null;
    categoryId: string;
    price: number;
    iconUrl?: string;
    photoUrl?: string;
    iconPath?: string | null;
    photoPath?: string | null;
    ingredients?: string[];
    options?: ProductOptionGroup[];
  } | null;
  onSaved: () => void;
};

function formatPriceInput(val: string | number): string {
  if (val === "" || val === null || val === undefined) return "";
  const numeric = typeof val === "number" ? Math.round(val) : parseInt(String(val).replace(/\D/g, ""), 10);
  if (isNaN(numeric) || numeric === 0) return "";
  return numeric.toLocaleString("es-AR");
}

function SectionBadge({ isRequired, helpText }: { isRequired: boolean; helpText?: string }) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="relative inline-flex items-center gap-1.5 ml-auto">
      {isRequired ? (
        <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-[#9a0002] dark:bg-red-950/40 dark:text-red-400">
          * Obligatorio
        </span>
      ) : (
        <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500 dark:bg-[#2a2623] dark:text-stone-400">
          Opcional
        </span>
      )}

      {helpText && (
        <>
          <button
            type="button"
            onClick={() => setShowHelp((h) => !h)}
            title="Ver más información"
            className="flex h-4 w-4 items-center justify-center rounded-full bg-stone-200 text-[10px] font-bold text-stone-600 hover:bg-stone-300 dark:bg-[#2a2623] dark:text-stone-300 dark:hover:bg-[#38332f] cursor-pointer"
          >
            ?
          </button>
          <AnimatePresence>
            {showHelp && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-6 z-50 w-64 rounded-xl border border-[#e8e0d6] bg-white p-3 text-[11px] leading-relaxed text-stone-700 shadow-xl dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-stone-200"
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="font-bold text-[#9a0002] dark:text-red-400">
                    Consejo
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowHelp(false)}
                    className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  >
                    ✕
                  </button>
                </div>
                <p>{helpText}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

export function ProductSlidePanel({
  open,
  onClose,
  businessId,
  categories,
  editing,
  onSaved,
}: Props) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [rawPrice, setRawPrice] = useState("");
  const [description, setDescription] = useState("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | undefined>(undefined);
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(undefined);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState("");
  const [optionGroups, setOptionGroups] = useState<SelectOptionGroup[]>([]);
  const [extras, setExtras] = useState<ExtraRow[]>([]);
  const [extraLabel, setExtraLabel] = useState("");
  const [extraPrice, setExtraPrice] = useState("");
  const [pending, setPending] = useState(false);
  const [iconProcessing, setIconProcessing] = useState(false);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(editing?.id);

  useEffect(() => {
    if (open) {
      if (editing) {
        setName(editing.name);
        setCategoryId(editing.categoryId || categories[0]?.id || "");
        setRawPrice(editing.price ? String(Math.round(editing.price)) : "");
        setDescription(editing.description || "");
        setIconPreview(editing.iconUrl);
        setPhotoPreview(editing.photoUrl);
        setIconFile(null);
        setPhotoFile(null);
        setIngredients(editing.ingredients || []);
        const parsed = parseMenuOptionGroups(editing.options || []);
        const { extrasGroup, optionGroups: ogs } = splitExtrasFromOptions(parsed);
        setOptionGroups(
          ogs.map((g) => ({
            title: g.title,
            choices: g.choices.map((c) => (typeof c === "string" ? c : c.label)),
          })),
        );
        setExtras(
          extrasGroup?.choices.map((c) => ({
            label: c.label,
            pricePesos: c.price_cents > 0 ? String(Math.round(c.price_cents / 100)) : "",
          })) ?? [],
        );
      } else {
        setName("");
        setCategoryId(categories[0]?.id || "");
        setRawPrice("");
        setDescription("");
        setIconPreview(undefined);
        setPhotoPreview(undefined);
        setIconFile(null);
        setPhotoFile(null);
        setIngredients([]);
        setOptionGroups([]);
        setExtras([]);
      }
      setError(null);
      setIngredientInput("");
      setExtraLabel("");
      setExtraPrice("");
    }
  }, [open, editing, categories]);

  // Price handler with Argentine Pesos formatting
  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    setRawPrice(raw);
    if (error) setError(null);
  }

  // Ingredient add / remove
  function addIngredient(val: string) {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (!ingredients.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      setIngredients((prev) => [...prev, trimmed]);
    }
    setIngredientInput("");
  }

  function removeIngredient(idx: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  }

  // Option Groups Handlers
  function addOptionGroup(template?: { title: string; choices: string[] }) {
    setOptionGroups((prev) => [
      ...prev,
      template
        ? { title: template.title, choices: [...template.choices] }
        : { title: "", choices: [] },
    ]);
  }

  function updateOptionGroupTitle(groupIdx: number, title: string) {
    setOptionGroups((prev) =>
      prev.map((g, i) => (i === groupIdx ? { ...g, title } : g))
    );
  }

  function addChoiceToGroup(groupIdx: number, choice: string) {
    const trimmed = choice.trim();
    if (!trimmed) return;
    setOptionGroups((prev) =>
      prev.map((g, i) =>
        i === groupIdx && !g.choices.includes(trimmed)
          ? { ...g, choices: [...g.choices, trimmed] }
          : g
      )
    );
  }

  function removeChoiceFromGroup(groupIdx: number, choiceIdx: number) {
    setOptionGroups((prev) =>
      prev.map((g, i) =>
        i === groupIdx
          ? { ...g, choices: g.choices.filter((_, ci) => ci !== choiceIdx) }
          : g
      )
    );
  }

  function removeOptionGroup(groupIdx: number) {
    setOptionGroups((prev) => prev.filter((_, i) => i !== groupIdx));
  }

  function addExtra(label: string, pricePesos: string) {
    const trimmed = label.trim();
    if (!trimmed) return;
    const pesos = parseInt(pricePesos.replace(/\D/g, ""), 10);
    if (!pesos || pesos <= 0) {
      setError("El extra necesita un precio mayor a $0.");
      return;
    }
    if (extras.some((e) => e.label.toLowerCase() === trimmed.toLowerCase())) return;
    setExtras((prev) => [...prev, { label: trimmed, pricePesos: String(pesos) }]);
    setExtraLabel("");
    setExtraPrice("");
    setError(null);
  }

  function removeExtra(idx: number) {
    setExtras((prev) => prev.filter((_, i) => i !== idx));
  }

  async function applyIconFile(file: File) {
    setIconProcessing(true);
    setError(null);
    try {
      const optimized = await optimizeImageFile(file, MENU_ICON_OPTS);
      setIconFile(optimized);
      setIconPreview(URL.createObjectURL(optimized));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al optimizar el ícono.");
    } finally {
      setIconProcessing(false);
    }
  }

  async function applyPhotoFile(file: File) {
    setPhotoProcessing(true);
    setError(null);
    try {
      const optimized = await optimizeImageFile(file, MENU_PHOTO_OPTS);
      setPhotoFile(optimized);
      setPhotoPreview(URL.createObjectURL(optimized));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al optimizar la foto.");
    } finally {
      setPhotoProcessing(false);
    }
  }

  async function handlePickIcon(file: File) {
    await applyIconFile(file);
  }

  async function handlePickPhoto(file: File) {
    await applyPhotoFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const priceNum = parseInt(rawPrice, 10);
    if (!name.trim() || !categoryId || isNaN(priceNum) || priceNum <= 0) {
      setError("Completá el nombre, categoría y un precio válido.");
      return;
    }

    const hasIcon = iconFile || editing?.iconPath || iconPreview;
    if (!hasIcon) {
      setError("El ícono del producto es obligatorio para mostrarlo en el menú.");
      return;
    }

    setPending(true);
    try {
      const fd = new FormData();
      fd.set("businessId", businessId);
      if (editing?.id) fd.set("id", editing.id);
      fd.set("name", name.trim());
      fd.set("categoryId", categoryId);
      fd.set("price", String(priceNum));
      fd.set("description", description.trim());
      fd.set("ingredients", JSON.stringify(ingredients));
      const selectGroups = optionGroups
        .filter((g) => g.title.trim() && g.choices.length > 0)
        .map((g) => ({
          title: g.title.trim(),
          kind: "select" as const,
          choices: g.choices,
        }));
      const extrasGroup = extrasGroupFromRows(
        extras.map((e) => ({
          label: e.label,
          pricePesos: parseInt(e.pricePesos, 10) || 0,
        })),
      );
      const allOptions = parseMenuOptionGroups([
        ...selectGroups,
        ...(extrasGroup ? [extrasGroup] : []),
      ]);
      fd.set("options", JSON.stringify(allOptions));

      if (editing?.iconPath) fd.set("existingIconPath", editing.iconPath);
      if (editing?.photoPath) fd.set("existingPhotoPath", editing.photoPath);
      if (iconFile) fd.set("iconFile", iconFile);
      if (photoFile) fd.set("photoFile", photoFile);

      await saveMenuProductAction(fd);
      onSaved();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo guardar.";
      setError(
        msg.includes("Body exceeded") || msg.includes("1 MB")
          ? "Las fotos son muy pesadas. Esperá a que termine “Optimizando…” o probá con otra imagen."
          : msg,
      );
    } finally {
      setPending(false);
    }
  }

  if (typeof document === "undefined") return null;

  const content = (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Cerrar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[75] bg-black/55 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-full sm:max-w-[440px] flex-col border-l border-[#e8e0d6] bg-[#faf6f1] shadow-2xl dark:border-[#3d3732] dark:bg-[#161412]"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-[#e8e0d6] px-5 py-4 dark:border-[#3d3732]">
              <div>
                <h2 className="text-[17px] font-bold text-stone-900 dark:text-stone-100">
                  {isEdit ? "Editar producto" : "Agregar producto"}
                </h2>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Personalizá los datos de tu plato para el menú
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-stone-400 hover:bg-stone-200/60 dark:hover:bg-[#2a2623] transition-colors"
              >
                <MaterialSymbol icon="close" size={20} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-5">
                
                {/* 1. Nombre y Categoría (Obligatorios) */}
                <div className="space-y-3 rounded-2xl bg-white p-4 border border-[#e8e0d6] dark:border-[#3d3732] dark:bg-[#1c1917] shadow-2xs">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[12px] font-bold text-stone-800 dark:text-stone-200">
                        Nombre del plato
                      </label>
                      <SectionBadge isRequired={true} />
                    </div>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Hamburguesa Doble Cheddar"
                      className="w-full rounded-xl border border-stone-200 bg-[#faf6f1]/60 px-3.5 py-2.5 text-[13px] font-medium placeholder:text-stone-400 focus:border-[#9a0002]/50 focus:bg-white focus:outline-none dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-stone-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[12px] font-bold text-stone-800 dark:text-stone-200">
                          Categoría
                        </label>
                      </div>
                      <select
                        required
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full rounded-xl border border-stone-200 bg-[#faf6f1]/60 px-3 py-2.5 text-[12px] font-semibold text-stone-800 focus:border-[#9a0002]/50 focus:bg-white focus:outline-none dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-stone-200"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Formatted Price Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[12px] font-bold text-stone-800 dark:text-stone-200">
                          Precio
                        </label>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-[13px] font-bold text-[#9a0002] dark:text-red-400 pointer-events-none">
                          $
                        </span>
                        <input
                          required
                          type="text"
                          inputMode="numeric"
                          value={formatPriceInput(rawPrice)}
                          onChange={handlePriceChange}
                          placeholder="4.500"
                          className="w-full rounded-xl border border-stone-200 bg-[#faf6f1]/60 pl-7 pr-3 py-2.5 text-[13px] font-extrabold text-stone-900 focus:border-[#9a0002]/50 focus:bg-white focus:outline-none dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-stone-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Ícono y foto (mismo tamaño) */}
                <div className="space-y-3 rounded-2xl bg-white p-4 border border-[#e8e0d6] dark:border-[#3d3732] dark:bg-[#1c1917] shadow-2xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[12px] font-bold text-stone-800 dark:text-stone-200">
                          Ícono
                        </label>
                        <SectionBadge isRequired={true} />
                      </div>
                      <div
                        className={cn(
                          MENU_IMAGE_FRAME_CLASS,
                          "rounded-2xl border-2 border-dashed",
                          iconPreview
                            ? "border-[#9a0002]/40 bg-[#9a0002]/5"
                            : "border-stone-200 bg-stone-50 dark:border-[#3d3732] dark:bg-[#231f1c]",
                        )}
                      >
                        {iconPreview ? (
                          <img
                            src={iconPreview}
                            alt="Ícono"
                            className="h-full w-full rounded-2xl object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <MaterialSymbol icon="add_photo_alternate" size={24} className="text-stone-400" />
                          </div>
                        )}
                        {iconProcessing && (
                          <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 text-[10px] font-semibold text-white">
                            Optimizando…
                          </span>
                        )}
                      </div>
                      <ImageSourceActions
                        disabled={iconProcessing}
                        compact
                        className="mt-2"
                        onPick={handlePickIcon}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[12px] font-bold text-stone-800 dark:text-stone-200">
                          Foto real
                        </label>
                        <SectionBadge
                          isRequired={false}
                          helpText="Foto de portada en la carta pública."
                        />
                      </div>
                      <div
                        className={cn(
                          MENU_IMAGE_FRAME_CLASS,
                          "rounded-2xl border-2 border-dashed",
                          photoPreview
                            ? "border-[#9a0002]/30 bg-[#9a0002]/5"
                            : "border-stone-200 bg-stone-50 dark:border-[#3d3732] dark:bg-[#231f1c]",
                        )}
                      >
                        {photoPreview ? (
                          <img
                            src={photoPreview}
                            alt="Foto real"
                            className="h-full w-full rounded-2xl object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <MaterialSymbol icon="add_photo_alternate" size={24} className="text-stone-400" />
                          </div>
                        )}
                        {photoProcessing && (
                          <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 text-[10px] font-semibold text-white">
                            Optimizando…
                          </span>
                        )}
                      </div>
                      <ImageSourceActions
                        disabled={photoProcessing}
                        compact
                        className="mt-2"
                        onPick={handlePickPhoto}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Ingredientes (Opcional con Tooltip & Chips) */}
                <div className="space-y-3 rounded-2xl bg-white p-4 border border-[#e8e0d6] dark:border-[#3d3732] dark:bg-[#1c1917] shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-bold text-stone-800 dark:text-stone-200">
                      Ingredientes
                    </label>
                    <SectionBadge
                      isRequired={false}
                      helpText="Impulsá tus resultados: tus platos aparecerán en búsquedas específicas (ej. 'cheddar', 'sin cebolla') y los clientes podrán pedir 'sin tal ingrediente' fácilmente."
                    />
                  </div>

                  <div className="flex gap-2">
                    <input
                      value={ingredientInput}
                      onChange={(e) => setIngredientInput(e.target.value)}
                      placeholder="Ej. Panceta crispy"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addIngredient(ingredientInput);
                        }
                      }}
                      className="flex-1 rounded-xl border border-stone-200 bg-[#faf6f1]/60 px-3 py-2 text-[12px] font-medium placeholder:text-stone-400 focus:border-[#9a0002]/50 focus:bg-white focus:outline-none dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-stone-100"
                    />
                    <button
                      type="button"
                      onClick={() => addIngredient(ingredientInput)}
                      disabled={!ingredientInput.trim()}
                      aria-label="Agregar ingrediente"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#9a0002] text-white disabled:opacity-40 hover:bg-[#800002] cursor-pointer transition-colors shadow-xs"
                    >
                      <MaterialSymbol icon="add" size={22} />
                    </button>
                  </div>

                  {/* Chips cargados */}
                  {ingredients.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {ingredients.map((ing, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-lg bg-stone-50 border border-stone-200 px-2.5 py-1 text-[11px] font-bold text-stone-800 dark:bg-[#231f1c] dark:border-[#3d3732] dark:text-stone-200"
                        >
                          {ing}
                          <button
                            type="button"
                            onClick={() => removeIngredient(idx)}
                            className="text-stone-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer ml-0.5"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Sugerencias rápidas */}
                  <div className="pt-1">
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
                      Sugeridos:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {QUICK_INGREDIENTS.filter(
                        (q) => !ingredients.some((i) => i.toLowerCase() === q.toLowerCase())
                      ).map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => addIngredient(q)}
                          className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-medium text-stone-600 hover:border-[#9a0002]/40 hover:text-[#9a0002] dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-stone-400 cursor-pointer transition-colors"
                        >
                          + {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Opciones / Seleccionables Personalizados */}
                <div className="space-y-3 rounded-2xl bg-white p-4 border border-[#e8e0d6] dark:border-[#3d3732] dark:bg-[#1c1917] shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-bold text-stone-800 dark:text-stone-200">
                      Opciones adicionales
                    </label>
                    <SectionBadge
                      isRequired={false}
                      helpText="Creá grupos de opciones para que el cliente elija (ej. Punto de cocción: Jugoso / A punto / Cocido, Tipo de pan, etc.)."
                    />
                  </div>

                  {/* Grupos creados */}
                  {optionGroups.map((group, groupIdx) => (
                    <div
                      key={groupIdx}
                      className="rounded-xl border border-stone-200 bg-stone-50/60 p-3 dark:border-[#3d3732] dark:bg-[#231f1c] space-y-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          value={group.title}
                          onChange={(e) => updateOptionGroupTitle(groupIdx, e.target.value)}
                          placeholder="Título del grupo (ej. Punto de cocción)"
                          className="flex-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[12px] font-bold placeholder:text-stone-400 focus:border-[#9a0002]/50 focus:outline-none dark:border-[#3d3732] dark:bg-[#1c1917] dark:text-stone-100"
                        />
                        <button
                          type="button"
                          onClick={() => removeOptionGroup(groupIdx)}
                          title="Eliminar grupo de opciones"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 cursor-pointer transition-colors"
                        >
                          <MaterialSymbol icon="delete" size={16} />
                        </button>
                      </div>

                      {/* Choices Pills */}
                      <div className="flex flex-wrap gap-1.5">
                        {group.choices.map((choice, choiceIdx) => (
                          <span
                            key={choiceIdx}
                            className="inline-flex items-center gap-1 rounded-full bg-white border border-stone-200 px-2.5 py-0.5 text-[11px] font-bold text-stone-800 dark:bg-[#1c1917] dark:border-[#3d3732] dark:text-stone-200 shadow-2xs"
                          >
                            {choice}
                            <button
                              type="button"
                              onClick={() => removeChoiceFromGroup(groupIdx, choiceIdx)}
                              className="text-stone-400 hover:text-red-600 cursor-pointer ml-0.5"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* Add choice input */}
                      <div className="flex gap-1.5 pt-0.5">
                        <input
                          id={`choice-input-${groupIdx}`}
                          placeholder="Agregar opción (ej. Jugoso)..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const target = e.target as HTMLInputElement;
                              addChoiceToGroup(groupIdx, target.value);
                              target.value = "";
                            }
                          }}
                          className="flex-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-[11px] placeholder:text-stone-400 focus:border-[#9a0002]/50 focus:outline-none dark:border-[#3d3732] dark:bg-[#1c1917] dark:text-stone-100"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const el = document.getElementById(
                              `choice-input-${groupIdx}`
                            ) as HTMLInputElement | null;
                            if (el && el.value) {
                              addChoiceToGroup(groupIdx, el.value);
                              el.value = "";
                            }
                          }}
                          className="rounded-lg bg-stone-200 px-2.5 py-1 text-[11px] font-bold text-stone-700 hover:bg-stone-300 dark:bg-[#38332f] dark:text-stone-200 cursor-pointer transition-colors"
                        >
                          + Opción
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Buttons to Add New Group */}
                  <div className="pt-1 space-y-1.5">
                    <button
                      type="button"
                      onClick={() => addOptionGroup()}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#e8e0d6] bg-[#faf6f1] py-2 text-[12px] font-bold text-stone-700 hover:border-[#9a0002]/40 hover:text-[#9a0002] dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-stone-200 transition-colors cursor-pointer"
                    >
                      <MaterialSymbol icon="add" size={16} />
                      + Crear grupo de opciones
                    </button>

                    {optionGroups.length === 0 && (
                      <div className="flex flex-wrap gap-1 items-center pt-0.5">
                        <span className="text-[10px] text-stone-400 font-medium">Plantillas:</span>
                        {OPTION_GROUP_TEMPLATES.map((tmpl, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => addOptionGroup(tmpl)}
                            className="rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[10px] font-medium text-stone-600 hover:border-[#9a0002]/40 hover:text-[#9a0002] dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-stone-300 transition-colors cursor-pointer"
                          >
                            + {tmpl.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Extras con precio (multi-select en el pedido) */}
                <div className="space-y-3 rounded-2xl bg-white p-4 border border-[#e8e0d6] dark:border-[#3d3732] dark:bg-[#1c1917] shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-bold text-stone-800 dark:text-stone-200">
                      Extras
                    </label>
                    <SectionBadge
                      isRequired={false}
                      helpText="Agregados opcionales con precio (bacon, huevo, etc.). El cliente puede elegir varios y el total se suma al plato."
                    />
                  </div>

                  <div className="flex gap-2">
                    <input
                      value={extraLabel}
                      onChange={(e) => setExtraLabel(e.target.value)}
                      placeholder="Nombre (ej. Bacon)"
                      className="flex-1 rounded-xl border border-stone-200 bg-[#faf6f1]/60 px-3 py-2 text-[12px] font-medium placeholder:text-stone-400 focus:border-[#9a0002]/50 focus:bg-white focus:outline-none dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-stone-100"
                    />
                    <div className="relative w-24 shrink-0">
                      <span className="absolute left-2.5 top-2 text-[12px] font-bold text-[#9a0002] pointer-events-none">
                        $
                      </span>
                      <input
                        value={extraPrice}
                        onChange={(e) => setExtraPrice(e.target.value.replace(/\D/g, ""))}
                        inputMode="numeric"
                        placeholder="800"
                        className="w-full rounded-xl border border-stone-200 bg-[#faf6f1]/60 pl-6 pr-2 py-2 text-[12px] font-bold focus:border-[#9a0002]/50 focus:bg-white focus:outline-none dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-stone-100"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => addExtra(extraLabel, extraPrice)}
                      disabled={!extraLabel.trim() || !extraPrice}
                      aria-label="Agregar extra"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#9a0002] text-white disabled:opacity-40 hover:bg-[#800002] cursor-pointer transition-colors shadow-xs"
                    >
                      <MaterialSymbol icon="add" size={22} />
                    </button>
                  </div>

                  {extras.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {extras.map((ex, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-bold text-stone-800 dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-stone-200"
                        >
                          {ex.label}
                          <span className="text-[#9a0002] dark:text-red-400">
                            +${Number(ex.pricePesos).toLocaleString("es-AR")}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeExtra(idx)}
                            className="text-stone-400 hover:text-red-600 cursor-pointer ml-0.5"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-0.5">
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
                      Sugeridos:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {QUICK_EXTRAS.filter(
                        (q) => !extras.some((e) => e.label.toLowerCase() === q.label.toLowerCase()),
                      ).map((q) => (
                        <button
                          key={q.label}
                          type="button"
                          onClick={() => addExtra(q.label, String(q.price))}
                          className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-medium text-stone-600 hover:border-[#9a0002]/40 hover:text-[#9a0002] dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-stone-400 cursor-pointer transition-colors"
                        >
                          + {q.label} ${q.price.toLocaleString("es-AR")}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 6. Descripción del plato (Opcional) */}
                <div className="space-y-2 rounded-2xl bg-white p-4 border border-[#e8e0d6] dark:border-[#3d3732] dark:bg-[#1c1917] shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-bold text-stone-800 dark:text-stone-200">
                      Descripción
                    </label>
                    <SectionBadge isRequired={false} helpText="Breve resumen o recomendación del chef para tentar a tus clientes." />
                  </div>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ej. Doble medallón de carne de 120g con triple cheddar fundido y pan de papa artesanal."
                    className="w-full rounded-xl border border-stone-200 bg-[#faf6f1]/60 px-3.5 py-2 text-[12px] font-medium placeholder:text-stone-400 focus:border-[#9a0002]/50 focus:bg-white focus:outline-none dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-stone-100"
                  />
                </div>

                {error && (
                  <p className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-[12px] font-bold text-red-700 dark:text-red-300">
                    {error}
                  </p>
                )}
              </div>

              {/* Footer Submit Button */}
              <div className="shrink-0 border-t border-[#e8e0d6] px-5 py-4 dark:border-[#3d3732] bg-white/70 dark:bg-[#1c1917]/70 backdrop-blur-xs">
                <button
                  type="submit"
                  disabled={pending || iconProcessing || photoProcessing}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#9a0002] py-3 text-[14px] font-bold text-white hover:bg-[#850002] disabled:opacity-60 transition-colors shadow-md shadow-[#9a0002]/20"
                >
                  {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Publicar en carta"}
                </button>
              </div>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
