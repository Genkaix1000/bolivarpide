"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { StatCard } from "@/components/business/StatCard";
import { cn } from "@/lib/utils";
import { MOCK_PRODUCTS, PanelProduct } from "@/lib/mockData";

// ── Types ────────────────────────────────────────────────────────────────────

type SortKey = "codeId" | "name" | "category" | "price" | "available" | "timePlaced" | "lastUpdated";
type SortDir = "asc" | "desc";

interface ColFilter {
  codeId: string;
  name: string;
  category: string;
  price: string;
  available: string;
  timePlaced: string;
  lastUpdated: string;
}

type SearchField = "name" | "category" | "codeId" | "price";

const SEARCH_FIELDS: { id: SearchField; label: string }[] = [
  { id: "name", label: "Nombre" },
  { id: "category", label: "Categoría" },
  { id: "codeId", label: "ID" },
  { id: "price", label: "Precio" },
];

const ALL_COLUMNS: { id: SortKey; label: string }[] = [
  { id: "codeId", label: "ID" },
  { id: "name", label: "Nombre" },
  { id: "category", label: "Categoría" },
  { id: "price", label: "Precio" },
  { id: "available", label: "Estado" },
  { id: "timePlaced", label: "Fecha Alta" },
  { id: "lastUpdated", label: "Última Edición" },
];

const PAGE_SIZE = 8;

const CATEGORY_OPTIONS = [
  "Pizzas",
  "Empanadas",
  "Hamburguesas",
  "Sándwiches",
  "Bebidas",
  "Postres",
  "Guarniciones",
];

function formatPrice(n: number) {
  return `$${n.toLocaleString("es-AR")}`;
}

// ── Column Resizer Hook ────────────────────────────────────────────────────────

function useResizableColumns(initialWidths: Record<string, number>) {
  const [widths, setWidths] = useState<Record<string, number>>(initialWidths);
  const resizingRef = useRef<{ col: string; startX: number; startW: number } | null>(null);

  const startResize = useCallback((col: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = { col, startX: e.clientX, startW: widths[col] || 120 };

    const onMouseMove = (moveEvt: MouseEvent) => {
      if (!resizingRef.current) return;
      const deltaX = moveEvt.clientX - resizingRef.current.startX;
      const newWidth = Math.max(60, resizingRef.current.startW + deltaX);
      setWidths((prev) => ({ ...prev, [resizingRef.current!.col]: newWidth }));
    };

    const onMouseUp = () => {
      resizingRef.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [widths]);

  return { widths, startResize };
}

// ── Column Picker Dropdown Component ──────────────────────────────────────────

function ColumnPickerPopover({
  visibleCols,
  onToggleCol,
}: {
  visibleCols: Record<SortKey, boolean>;
  onToggleCol: (col: SortKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const activeCount = Object.values(visibleCols).filter(Boolean).length;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-10 px-3.5 rounded-xl border border-gray-200 dark:border-[#3d3732] bg-white dark:bg-[#231f1c] text-xs font-bold text-gray-700 dark:text-gray-200 hover:border-[#9a0002]/40 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
      >
        <MaterialSymbol icon="view_column" size={17} className="text-[#9a0002]" />
        <span>Columnas ({activeCount}/{ALL_COLUMNS.length})</span>
        <MaterialSymbol icon="keyboard_arrow_down" size={16} className="text-gray-400" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.14 }}
            className="absolute left-0 top-11 z-50 w-52 bg-[#faf6f1] dark:bg-[#231f1c] border border-gray-200 dark:border-[#3d3732] rounded-2xl p-3 shadow-2xl space-y-1.5"
          >
            <div className="px-1 pb-1 border-b border-gray-200 dark:border-[#3d3732] text-[10px] font-black uppercase tracking-wider text-gray-400">
              Mostrar u Ocultar Columnas
            </div>

            {ALL_COLUMNS.map((col) => {
              const isChecked = visibleCols[col.id];
              return (
                <label
                  key={col.id}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-[#ede4d9] dark:hover:bg-[#302c28] text-xs font-semibold text-gray-800 dark:text-gray-200 cursor-pointer select-none transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleCol(col.id)}
                    className="w-4 h-4 rounded text-[#9a0002] focus:ring-[#9a0002] cursor-pointer accent-[#9a0002]"
                  />
                  <span>{col.label}</span>
                </label>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Page Component ────────────────────────────────────────────────────────

export default function CartaPage() {
  const [products, setProducts] = useState<PanelProduct[]>(MOCK_PRODUCTS);

  // Column visibility state
  const [visibleCols, setVisibleCols] = useState<Record<SortKey, boolean>>({
    codeId: true,
    name: true,
    category: true,
    price: true,
    available: true,
    timePlaced: true,
    lastUpdated: true,
  });

  const toggleCol = (col: SortKey) => {
    setVisibleCols((prev) => ({ ...prev, [col]: !prev[col] }));
  };

  // Table sorting & column filtering
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [colFilters, setColFilters] = useState<ColFilter>({
    codeId: "",
    name: "",
    category: "",
    price: "",
    available: "",
    timePlaced: "",
    lastUpdated: "",
  });
  const [page, setPage] = useState(1);

  // Searchbar real-time input
  const [searchField, setSearchField] = useState<SearchField>("name");
  const [searchQuery, setSearchQuery] = useState("");

  // Column widths with logical hierarchy:
  // ID -> Nombre -> Categoría -> Precio -> Estado -> Fecha Alta -> Última Edición -> Acciones
  const { widths, startResize } = useResizableColumns({
    codeId: 110,
    name: 220,
    category: 140,
    price: 110,
    available: 110,
    timePlaced: 160,
    lastUpdated: 160,
    actions: 120,
  });

  // Delete & Undo toast state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [lastDeleted, setLastDeleted] = useState<{ product: PanelProduct; index: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Drawer state for Create/Edit
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PanelProduct | null>(null);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Pizzas");
  const [newPrice, setNewPrice] = useState("");

  // ── Actions ────────────────────────────────────────────────────────────────

  const toggleAvailable = useCallback((id: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nowStr = new Date().toLocaleString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          return { ...p, available: !p.available, lastUpdated: nowStr };
        }
        return p;
      })
    );
  }, []);

  const initiateDelete = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = (product: PanelProduct) => {
    const idx = products.findIndex((p) => p.id === product.id);
    setLastDeleted({ product, index: idx });
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    setDeletingId(null);
    setToastMessage(`"${product.name}" ha sido eliminado`);
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  };

  const handleUndoDelete = () => {
    if (!lastDeleted) return;
    setProducts((prev) => {
      const copy = [...prev];
      copy.splice(lastDeleted.index, 0, lastDeleted.product);
      return copy;
    });
    setToastMessage(null);
    setLastDeleted(null);
  };

  const openNewDrawer = () => {
    setEditingProduct(null);
    setNewName("");
    setNewCategory("Pizzas");
    setNewPrice("");
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (product: PanelProduct) => {
    setEditingProduct(product);
    setNewName(product.name);
    setNewCategory(product.category);
    setNewPrice(String(product.price));
    setIsDrawerOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPrice) return;
    const price = parseFloat(newPrice) || 0;
    const nowStr = new Date().toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? { ...p, name: newName.trim(), category: newCategory, price, lastUpdated: nowStr }
            : p
        )
      );
    } else {
      const newProd: PanelProduct = {
        id: `prod-${Date.now()}`,
        codeId: String(Math.floor(1000000000 + Math.random() * 9000000000)),
        name: newName.trim(),
        category: newCategory,
        price,
        available: true,
        timePlaced: nowStr,
        lastUpdated: nowStr,
      };
      setProducts((prev) => [newProd, ...prev]);
    }
    setIsDrawerOpen(false);
  };

  const handleSort = (col: SortKey) => {
    if (col === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(col);
      setSortDir("asc");
    }
    setPage(1);
  };

  const handleColFilter = (col: keyof ColFilter, val: string) => {
    setColFilters((prev) => ({ ...prev, [col]: val }));
    setPage(1);
  };

  // ── Filter & Sort ──────────────────────────────────────────────────────────

  const filtered = products
    .filter((p) => {
      // Real-time searchbar query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const targetVal =
          searchField === "name"
            ? p.name
            : searchField === "category"
            ? p.category
            : searchField === "codeId"
            ? p.codeId || p.id
            : String(p.price);
        if (!targetVal.toLowerCase().includes(q)) return false;
      }
      // Inline column filters
      if (colFilters.codeId && !(p.codeId || p.id).toLowerCase().includes(colFilters.codeId.toLowerCase())) return false;
      if (colFilters.name && !p.name.toLowerCase().includes(colFilters.name.toLowerCase())) return false;
      if (colFilters.category && !p.category.toLowerCase().includes(colFilters.category.toLowerCase())) return false;
      if (colFilters.price && !String(p.price).includes(colFilters.price)) return false;
      if (colFilters.available && colFilters.available !== "all") {
        const wantAvail = colFilters.available === "yes";
        if (p.available !== wantAvail) return false;
      }
      if (colFilters.timePlaced && !(p.timePlaced || "").toLowerCase().includes(colFilters.timePlaced.toLowerCase())) return false;
      if (colFilters.lastUpdated && !(p.lastUpdated || "").toLowerCase().includes(colFilters.lastUpdated.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "codeId") cmp = (a.codeId || a.id).localeCompare(b.codeId || b.id);
      else if (sortKey === "name") cmp = a.name.localeCompare(b.name, "es");
      else if (sortKey === "category") cmp = a.category.localeCompare(b.category, "es");
      else if (sortKey === "price") cmp = a.price - b.price;
      else if (sortKey === "available") cmp = Number(b.available) - Number(a.available);
      else if (sortKey === "timePlaced") cmp = (a.timePlaced || "").localeCompare(b.timePlaced || "");
      else if (sortKey === "lastUpdated") cmp = (a.lastUpdated || "").localeCompare(b.lastUpdated || "");
      return sortDir === "asc" ? cmp : -cmp;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Total visible columns count for colSpan
  const visibleColCount = Object.values(visibleCols).filter(Boolean).length + 1; // +1 for Actions

  // KPIs
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.available).length;
  const pausedProducts = products.filter((p) => !p.available).length;
  const avgPrice = Math.round(products.reduce((acc, p) => acc + p.price, 0) / (totalProducts || 1));

  // ── Resizable Table Header Cell ─────────────────────────────────────────────

  const ResizableTh = ({
    col,
    label,
    icon,
  }: {
    col: SortKey;
    label: string;
    icon?: string;
  }) => {
    if (!visibleCols[col]) return null;

    return (
      <th
        style={{ width: widths[col] || "auto" }}
        className="relative py-3.5 px-3.5 align-middle select-none text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 border-r border-gray-100 dark:border-[#2a2623] last:border-r-0"
      >
        <button
          onClick={() => handleSort(col)}
          className="flex items-center justify-between gap-1.5 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer w-full text-left"
        >
          <span className="flex items-center gap-1 truncate">
            {icon && <span className="text-sm select-none">{icon}</span>}
            <span>{label}</span>
          </span>
          {col === sortKey ? (
            <MaterialSymbol
              icon={sortDir === "asc" ? "arrow_upward" : "arrow_downward"}
              size={13}
              className="text-[#9a0002] flex-shrink-0"
            />
          ) : (
            <MaterialSymbol icon="unfold_more" size={13} className="text-gray-300 dark:text-gray-600 opacity-60 flex-shrink-0" />
          )}
        </button>

        {/* Resize handle */}
        <div
          onMouseDown={(e) => startResize(col, e)}
          title="Arrastrá para cambiar ancho de columna"
          className="absolute top-0 right-0 bottom-0 w-2 cursor-col-resize hover:bg-[#9a0002]/30 active:bg-[#9a0002] transition-colors z-10"
        />
      </th>
    );
  };

  return (
    <div className="space-y-5 text-gray-800 dark:text-gray-200 max-w-[1280px] mx-auto relative pb-10">

      {/* ── Toast notification with Undo (consistent with theme) ────────────── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-[#faf6f1]/95 dark:bg-[#231f1c]/95 border border-gray-200 dark:border-[#3d3732] text-gray-900 dark:text-gray-100 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3.5 ring-1 ring-black/5 dark:ring-white/5"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <MaterialSymbol icon="check_circle" size={18} />
            </div>
            <span className="text-xs font-extrabold">{toastMessage}</span>
            {lastDeleted && (
              <button
                onClick={handleUndoDelete}
                className="px-3 py-1.5 bg-[#9a0002] hover:bg-[#7a0002] text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 flex items-center gap-1"
              >
                <MaterialSymbol icon="undo" size={14} />
                <span>Deshacer</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <MaterialSymbol icon="menu_book" size={26} className="text-[#9a0002]" />
            Gestión de Carta &amp; Menú
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Administrá tus platos, disponibilidad y catálogo en tiempo real
          </p>
        </div>
      </div>

      {/* ── Compact Stat Cards (Icon on left, compact height) ────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          icon="restaurant_menu"
          iconBg="bg-red-50 dark:bg-red-950/30"
          iconColor="text-[#9a0002]"
          value={String(totalProducts)}
          label="Total Productos"
        />
        <StatCard
          icon="check_circle"
          iconBg="bg-emerald-50 dark:bg-emerald-950/30"
          iconColor="text-emerald-500"
          value={String(activeProducts)}
          label="En Venta"
        />
        <StatCard
          icon="pause_circle"
          iconBg="bg-amber-50 dark:bg-amber-950/30"
          iconColor="text-amber-500"
          value={String(pausedProducts)}
          label="Pausados / Sin Stock"
        />
        <StatCard
          icon="payments"
          iconBg="bg-blue-50 dark:bg-blue-950/30"
          iconColor="text-blue-500"
          value={formatPrice(avgPrice)}
          label="Precio Promedio"
        />
      </div>

      {/* ── Toolbar (Estilo consistente con h-10 y rounded-xl) ────────── */}
      <div className="bg-[#faf6f1] dark:bg-[#1c1917] border border-gray-100 dark:border-[#3d3732] rounded-[20px] px-4 py-3 flex flex-wrap items-center gap-3 shadow-xs">

        {/* Tab buttons: Todos / Activos / Pausados */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {[
            { id: "all", label: "Todos" },
            { id: "yes", label: "Activos" },
            { id: "no", label: "Pausados" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleColFilter("available", tab.id === "all" ? "" : tab.id)}
              className={cn(
                "h-10 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center border",
                colFilters.available === (tab.id === "all" ? "" : tab.id)
                  ? "bg-[#9a0002] text-white border-[#9a0002] shadow-sm"
                  : "bg-white dark:bg-[#231f1c] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#3d3732] hover:border-gray-300 dark:hover:border-[#4d4742]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Column Visibility Selector (A la izquierda de la Searchbar) */}
        <ColumnPickerPopover visibleCols={visibleCols} onToggleCol={toggleCol} />

        {/* Searchbar: real-time input + field selector + colored search action button */}
        <div className="flex items-center gap-0 flex-1 min-w-[240px] h-10 px-3 bg-white dark:bg-[#231f1c] border border-gray-200 dark:border-[#3d3732] rounded-xl focus-within:border-[#9a0002]/50 transition-all shadow-xs">
          <input
            type="text"
            placeholder="Buscar en menú..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="flex-1 min-w-0 h-full bg-transparent text-xs font-semibold text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none"
          />
          <div className="h-4 w-px bg-gray-200 dark:bg-[#3d3732] mx-2 flex-shrink-0" />
          <select
            value={searchField}
            onChange={(e) => setSearchField(e.target.value as SearchField)}
            className="h-full bg-transparent text-[11px] font-bold text-gray-500 dark:text-gray-400 focus:outline-none cursor-pointer pr-1 flex-shrink-0"
          >
            {SEARCH_FIELDS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>

          {/* Search Button with colored accent background */}
          <div className="w-7 h-7 rounded-lg bg-[#9a0002] text-white flex items-center justify-center flex-shrink-0 ml-1.5 shadow-xs">
            <MaterialSymbol icon="search" size={16} />
          </div>
        </div>

        {/* New product button */}
        <button
          onClick={openNewDrawer}
          className="h-10 px-4 bg-[#9a0002] text-white text-xs font-bold rounded-xl hover:bg-[#850002] active:scale-95 transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap flex-shrink-0"
        >
          <MaterialSymbol icon="add" size={16} />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* ── Main Resizable CRUD Table ────────────────────────────────────────── */}
      <div className="bg-[#faf6f1] dark:bg-[#1c1917] border border-gray-200 dark:border-[#3d3732] rounded-[20px] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed">
            <thead>
              {/* Column Headers with Sort and Drag Resizer */}
              {/* Logical Hierarchy: ID -> Nombre -> Categoría -> Precio -> Estado -> Fecha Alta -> Última Edición -> Acciones */}
              <tr className="border-b border-gray-200 dark:border-[#3d3732] bg-[#f5f0ea]/70 dark:bg-[#231f1c]">
                <ResizableTh col="codeId" label="ID" />
                <ResizableTh col="name" label="Nombre" />
                <ResizableTh col="category" label="Categoría" />
                <ResizableTh col="price" label="Precio" />
                <ResizableTh col="available" label="Estado" />
                <ResizableTh col="timePlaced" label="Fecha Alta" />
                <ResizableTh col="lastUpdated" label="Última Edición" />

                {/* Actions column using app's MaterialSymbol icon for gear */}
                <th
                  style={{ width: widths.actions || 120 }}
                  className="py-3.5 px-3.5 align-middle text-center text-sm select-none border-l border-gray-100 dark:border-[#2a2623]"
                >
                  <span title="Acciones" className="inline-flex items-center justify-center text-gray-400 dark:text-gray-500">
                    <MaterialSymbol icon="settings" size={17} />
                  </span>
                </th>
              </tr>

              {/* Inline Column Filter Row */}
              <tr className="border-b border-gray-200 dark:border-[#3d3732] bg-[#fdfbf7] dark:bg-[#1c1917]">
                {/* ID Filter */}
                {visibleCols.codeId && (
                  <td className="px-2 py-1.5 align-middle border-r border-gray-100 dark:border-[#2a2623]">
                    <div className="relative flex items-center">
                      <MaterialSymbol icon="search" size={13} className="absolute left-2 text-gray-300 dark:text-gray-600" />
                      <input
                        type="text"
                        placeholder="Filtrar ID..."
                        value={colFilters.codeId}
                        onChange={(e) => handleColFilter("codeId", e.target.value)}
                        className="w-full pl-6 pr-2 py-1 bg-white dark:bg-[#231f1c] border border-gray-200 dark:border-[#3d3732] rounded-lg text-[11px] font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#9a0002]/50 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                      />
                    </div>
                  </td>
                )}

                {/* Name Filter */}
                {visibleCols.name && (
                  <td className="px-2 py-1.5 align-middle border-r border-gray-100 dark:border-[#2a2623]">
                    <div className="relative flex items-center">
                      <MaterialSymbol icon="search" size={13} className="absolute left-2 text-gray-300 dark:text-gray-600" />
                      <input
                        type="text"
                        placeholder="Filtrar nombre..."
                        value={colFilters.name}
                        onChange={(e) => handleColFilter("name", e.target.value)}
                        className="w-full pl-6 pr-2 py-1 bg-white dark:bg-[#231f1c] border border-gray-200 dark:border-[#3d3732] rounded-lg text-[11px] font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#9a0002]/50 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                      />
                    </div>
                  </td>
                )}

                {/* Category Filter */}
                {visibleCols.category && (
                  <td className="px-2 py-1.5 align-middle border-r border-gray-100 dark:border-[#2a2623]">
                    <div className="relative flex items-center">
                      <MaterialSymbol icon="search" size={13} className="absolute left-2 text-gray-300 dark:text-gray-600" />
                      <input
                        type="text"
                        placeholder="Filtrar cat..."
                        value={colFilters.category}
                        onChange={(e) => handleColFilter("category", e.target.value)}
                        className="w-full pl-6 pr-2 py-1 bg-white dark:bg-[#231f1c] border border-gray-200 dark:border-[#3d3732] rounded-lg text-[11px] font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#9a0002]/50 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                      />
                    </div>
                  </td>
                )}

                {/* Price Filter */}
                {visibleCols.price && (
                  <td className="px-2 py-1.5 align-middle border-r border-gray-100 dark:border-[#2a2623]">
                    <div className="relative flex items-center">
                      <MaterialSymbol icon="search" size={13} className="absolute left-2 text-gray-300 dark:text-gray-600" />
                      <input
                        type="text"
                        placeholder="Filtrar $..."
                        value={colFilters.price}
                        onChange={(e) => handleColFilter("price", e.target.value)}
                        className="w-full pl-6 pr-2 py-1 bg-white dark:bg-[#231f1c] border border-gray-200 dark:border-[#3d3732] rounded-lg text-[11px] font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#9a0002]/50 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                      />
                    </div>
                  </td>
                )}

                {/* Available Filter */}
                {visibleCols.available && (
                  <td className="px-2 py-1.5 align-middle border-r border-gray-100 dark:border-[#2a2623]">
                    <select
                      value={colFilters.available || "all"}
                      onChange={(e) => handleColFilter("available", e.target.value === "all" ? "" : e.target.value)}
                      className="w-full px-1.5 py-1 bg-white dark:bg-[#231f1c] border border-gray-200 dark:border-[#3d3732] rounded-lg text-[11px] font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#9a0002]/50 cursor-pointer"
                    >
                      <option value="all">Todos</option>
                      <option value="yes">Activo</option>
                      <option value="no">Pausado</option>
                    </select>
                  </td>
                )}

                {/* Fecha Alta Filter */}
                {visibleCols.timePlaced && (
                  <td className="px-2 py-1.5 align-middle border-r border-gray-100 dark:border-[#2a2623]">
                    <div className="relative flex items-center">
                      <MaterialSymbol icon="search" size={13} className="absolute left-2 text-gray-300 dark:text-gray-600" />
                      <input
                        type="text"
                        placeholder="Filtrar alta..."
                        value={colFilters.timePlaced}
                        onChange={(e) => handleColFilter("timePlaced", e.target.value)}
                        className="w-full pl-6 pr-2 py-1 bg-white dark:bg-[#231f1c] border border-gray-200 dark:border-[#3d3732] rounded-lg text-[11px] font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#9a0002]/50 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                      />
                    </div>
                  </td>
                )}

                {/* Última Edición Filter */}
                {visibleCols.lastUpdated && (
                  <td className="px-2 py-1.5 align-middle border-r border-gray-100 dark:border-[#2a2623]">
                    <div className="relative flex items-center">
                      <MaterialSymbol icon="search" size={13} className="absolute left-2 text-gray-300 dark:text-gray-600" />
                      <input
                        type="text"
                        placeholder="Filtrar edición..."
                        value={colFilters.lastUpdated}
                        onChange={(e) => handleColFilter("lastUpdated", e.target.value)}
                        className="w-full pl-6 pr-2 py-1 bg-white dark:bg-[#231f1c] border border-gray-200 dark:border-[#3d3732] rounded-lg text-[11px] font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#9a0002]/50 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                      />
                    </div>
                  </td>
                )}

                {/* Actions column filter placeholder */}
                <td className="px-2 py-1.5 align-middle text-center" />
              </tr>
            </thead>

            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={visibleColCount} className="py-14 text-center text-xs text-gray-400 align-middle">
                    <div className="flex flex-col items-center gap-2">
                      <MaterialSymbol icon="search_off" size={32} className="text-gray-300 dark:text-gray-600" />
                      <span>No se encontraron resultados con los filtros aplicados.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((product, idx) => {
                  const isDeleting = deletingId === product.id;
                  const isEven = idx % 2 === 0;

                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.12, delay: idx * 0.02 }}
                      className={cn(
                        "transition-all duration-200 border-b border-gray-100 dark:border-[#2a2623]/80",
                        // Subtle alternating background
                        isEven ? "bg-white/60 dark:bg-[#1c1917]" : "bg-[#f9f5f0]/50 dark:bg-[#231f1c]/40",
                        "hover:bg-[#f0e8de]/70 dark:hover:bg-[#2a2623]/70",
                        // VERY CLEAR DISABLED / PAUSED VISUAL STATE:
                        !product.available && "bg-gray-200/50 dark:bg-[#141210]/80 opacity-60 border-gray-200 dark:border-[#282420]",
                        // Highlight red if pending deletion
                        isDeleting && "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50 opacity-100 grayscale-0"
                      )}
                    >
                      {/* 1. ID */}
                      {visibleCols.codeId && (
                        <td className={cn(
                          "py-3.5 px-3.5 align-middle text-xs font-mono font-medium truncate border-r border-gray-100 dark:border-[#2a2623]/50",
                          product.available ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-600"
                        )}>
                          {product.codeId || product.id}
                        </td>
                      )}

                      {/* 2. Nombre */}
                      {visibleCols.name && (
                        <td className={cn(
                          "py-3.5 px-3.5 align-middle text-xs font-bold truncate border-r border-gray-100 dark:border-[#2a2623]/50 flex items-center justify-between gap-2",
                          product.available ? "text-gray-800 dark:text-gray-200" : "text-gray-400 dark:text-gray-500 line-through"
                        )}>
                          <span className="truncate">{product.name}</span>
                          {!product.available && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-900/50 flex-shrink-0 no-underline">
                              Pausado
                            </span>
                          )}
                        </td>
                      )}

                      {/* 3. Categoría */}
                      {visibleCols.category && (
                        <td className={cn(
                          "py-3.5 px-3.5 align-middle text-xs font-medium truncate border-r border-gray-100 dark:border-[#2a2623]/50",
                          product.available ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-600"
                        )}>
                          {product.category}
                        </td>
                      )}

                      {/* 4. Precio */}
                      {visibleCols.price && (
                        <td className={cn(
                          "py-3.5 px-3.5 align-middle text-xs font-bold border-r border-gray-100 dark:border-[#2a2623]/50",
                          product.available ? "text-gray-800 dark:text-gray-200" : "text-gray-400 dark:text-gray-600"
                        )}>
                          {formatPrice(product.price)}
                        </td>
                      )}

                      {/* 5. Estado switch */}
                      {visibleCols.available && (
                        <td className="py-3.5 px-3.5 align-middle text-center border-r border-gray-100 dark:border-[#2a2623]/50">
                          <button
                            onClick={() => toggleAvailable(product.id)}
                            title={product.available ? "Click para pausar" : "Click para activar"}
                            className={cn(
                              "w-9 h-5 rounded-full p-0.5 flex items-center transition-colors duration-300 cursor-pointer inline-flex flex-shrink-0 align-middle",
                              product.available ? "bg-[#9a0002]" : "bg-gray-300 dark:bg-[#3d3732]"
                            )}
                          >
                            <span
                              className={cn(
                                "w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 transform",
                                product.available ? "translate-x-4" : "translate-x-0"
                              )}
                            />
                          </button>
                        </td>
                      )}

                      {/* 6. Fecha Alta */}
                      {visibleCols.timePlaced && (
                        <td className={cn(
                          "py-3.5 px-3.5 align-middle text-xs font-medium truncate border-r border-gray-100 dark:border-[#2a2623]/50",
                          product.available ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-600"
                        )}>
                          {product.timePlaced || "15/10/2025 14:40"}
                        </td>
                      )}

                      {/* 7. Última Edición */}
                      {visibleCols.lastUpdated && (
                        <td className={cn(
                          "py-3.5 px-3.5 align-middle text-xs font-medium truncate border-r border-gray-100 dark:border-[#2a2623]/50",
                          product.available ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-600"
                        )}>
                          {product.lastUpdated || "16/01/2026 11:30"}
                        </td>
                      )}

                      {/* 8. Acciones: Editar + Borrar */}
                      <td className="py-3.5 px-3.5 align-middle text-center">
                        {isDeleting ? (
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center justify-center gap-1.5"
                          >
                            <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-tight">¿Eliminar?</span>
                            <button
                              onClick={() => confirmDelete(product)}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black rounded-lg transition-all cursor-pointer shadow-xs active:scale-95"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="px-2 py-1 bg-gray-200 dark:bg-[#3d3732] text-gray-700 dark:text-gray-300 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                            >
                              No
                            </button>
                          </motion.div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            {/* Editar button */}
                            <button
                              onClick={() => openEditDrawer(product)}
                              title="Editar producto"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-[#ede4d9] dark:hover:bg-[#2a2623] hover:text-[#9a0002] transition-colors cursor-pointer"
                            >
                              <MaterialSymbol icon="edit" size={16} />
                            </button>

                            {/* Borrar button */}
                            <button
                              onClick={() => initiateDelete(product.id)}
                              title="Eliminar producto"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 transition-colors cursor-pointer"
                            >
                              <MaterialSymbol icon="delete" size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-[#3d3732] bg-[#f9f5f0] dark:bg-[#1c1917]">
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            Mostrando{" "}
            <strong className="text-gray-800 dark:text-gray-200">
              {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} – {Math.min(page * PAGE_SIZE, filtered.length)}
            </strong>{" "}
            de{" "}
            <strong className="text-gray-800 dark:text-gray-200">{filtered.length}</strong>{" "}
            registros
          </span>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mr-2">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Página anterior"
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 dark:border-[#3d3732] bg-white dark:bg-[#231f1c] text-gray-500 hover:bg-[#ede4d9] dark:hover:bg-[#2a2623] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <MaterialSymbol icon="chevron_left" size={18} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label="Página siguiente"
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 dark:border-[#3d3732] bg-white dark:bg-[#231f1c] text-gray-500 hover:bg-[#ede4d9] dark:hover:bg-[#2a2623] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <MaterialSymbol icon="chevron_right" size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Slide-over Drawer for Creating/Editing Product ─────────────────────── */}
      <AnimatePresence>
        {isDrawerOpen && (
          <React.Fragment>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40"
            />

            {/* Panel from Right */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 230 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-[#faf6f1] dark:bg-[#1c1917] border-l border-gray-200 dark:border-[#3d3732] z-50 shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-gray-200 dark:border-[#3d3732] flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#9a0002] text-white flex items-center justify-center shadow-md">
                    <MaterialSymbol icon={editingProduct ? "edit" : "add_circle"} size={21} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white">
                      {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                    </h2>
                    <p className="text-xs text-gray-400">
                      {editingProduct ? "Modificá los datos del plato" : "Agregá un plato o bebida a tu menú"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label="Cerrar"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2a2623] transition-colors cursor-pointer"
                >
                  <MaterialSymbol icon="close" size={20} />
                </button>
              </div>

              {/* Drawer Form */}
              <form onSubmit={handleSave} className="p-6 space-y-5 flex-1 overflow-y-auto">
                {/* Nombre */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Pizza Napolitana Especial"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-[#231f1c] border border-gray-200 dark:border-[#3d3732] rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-[#9a0002]"
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                    Categoría *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-[#231f1c] border border-gray-200 dark:border-[#3d3732] rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-[#9a0002] cursor-pointer"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Precio */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                    Precio ($ ARS) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-gray-400">$</span>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="7500"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-white dark:bg-[#231f1c] border border-gray-200 dark:border-[#3d3732] rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-[#9a0002]"
                    />
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#9a0002] hover:bg-[#7a0002] text-white font-black text-sm rounded-xl shadow-lg transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                  >
                    <MaterialSymbol icon="save" size={18} />
                    <span>{editingProduct ? "Guardar Cambios" : "Agregar Producto"}</span>
                  </button>
                </div>
              </form>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-[#3d3732] text-center text-[11px] text-gray-400 flex-shrink-0">
                {editingProduct
                  ? "Los cambios se reflejarán inmediatamente en tu menú digital."
                  : "El nuevo producto se publicará inmediatamente en tu menú digital."}
              </div>
            </motion.aside>
          </React.Fragment>
        )}
      </AnimatePresence>
    </div>
  );
}
