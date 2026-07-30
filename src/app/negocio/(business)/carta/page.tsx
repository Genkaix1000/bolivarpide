"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { StatCard } from "@/components/business/StatCard";
import { cn } from "@/lib/utils";
import { MOCK_PRODUCTS, PanelProduct } from "@/lib/mockData";

export default function CartaPage() {
  const [products, setProducts] = useState<PanelProduct[]>(MOCK_PRODUCTS);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Form states for new product drawer
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Pizzas");
  const [newPrice, setNewPrice] = useState("");

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const toggleAvailable = (id: string) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, available: !p.available } : p)));
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPrice) return;
    const newProd: PanelProduct = {
      id: `prod-${Date.now()}`,
      name: newName.trim(),
      category: newCategory,
      price: parseFloat(newPrice) || 0,
      available: true,
    };
    setProducts([newProd, ...products]);
    setNewName("");
    setNewPrice("");
    setIsDrawerOpen(false);
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    }
    return true;
  });

  // KPI Calculations
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.available).length;
  const pausedProducts = products.filter((p) => !p.available).length;
  const avgPrice = Math.round(products.reduce((acc, p) => acc + p.price, 0) / (totalProducts || 1));

  return (
    <div className="space-y-6 text-gray-800 dark:text-gray-200 max-w-[1280px] mx-auto relative">
      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <MaterialSymbol icon="menu_book" size={26} className="text-[#9a0002]" />
            Gestión de Carta & Menú
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Administrá tus platos, categorías, precios y disponibilidad en tiempo real
          </p>
        </div>

        <button
          onClick={() => setIsDrawerOpen(true)}
          className="px-5 py-3 bg-gradient-to-r from-[#9a0002] to-[#6b0001] text-white text-xs font-bold rounded-2xl hover:opacity-95 transition-all shadow-md shadow-red-950/20 cursor-pointer flex items-center gap-2 w-fit active:scale-95"
        >
          <MaterialSymbol icon="add_circle" size={18} />
          <span>+ NUEVO PRODUCTO</span>
        </button>
      </div>

      {/* ── Top Row: 4 KPI Cards Contextual to Menu/Carta ─────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="restaurant_menu"
          iconBg="bg-red-50 dark:bg-red-950/30"
          iconColor="text-[#9a0002]"
          value={String(totalProducts)}
          label="Total de Productos"
        />
        <StatCard
          icon="check_circle"
          iconBg="bg-emerald-50 dark:bg-emerald-950/30"
          iconColor="text-emerald-500"
          value={String(activeProducts)}
          label="Disponibles en Menú"
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
          value={`$${avgPrice.toLocaleString("es-AR")}`}
          label="Precio Promedio Plato"
        />
      </div>

      {/* ── Filter Bar & Actions (Table Bar) ─────────────────────────────────── */}
      <div className="bg-[#faf6f1] dark:bg-[#1c1917] border border-gray-100 dark:border-[#3d3732] penpot-shadow rounded-[24px] p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 custom-scrollbar">
          <button
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border",
              selectedCategory === "all"
                ? "bg-[#9a0002] text-white border-[#9a0002] shadow-sm"
                : "bg-white/80 dark:bg-[#231f1c] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#3d3732] hover:border-gray-300"
            )}
          >
            Todos ({products.length})
          </button>
          {categories.map((cat) => {
            const count = products.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border",
                  selectedCategory === cat
                    ? "bg-[#9a0002] text-white border-[#9a0002] shadow-sm"
                    : "bg-white/80 dark:bg-[#231f1c] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#3d3732] hover:border-gray-300"
                )}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Search & Counter */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <MaterialSymbol icon="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto o categoría..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-white dark:bg-[#231f1c] border border-gray-200 dark:border-[#3d3732] rounded-xl text-xs font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#9a0002]"
            />
          </div>
        </div>
      </div>

      {/* ── Main Data Table ─────────────────────────────────────────────────── */}
      <div className="bg-[#faf6f1] dark:bg-[#1c1917] border border-gray-100 dark:border-[#3d3732] penpot-shadow rounded-[24px] p-5">
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-200 dark:border-[#3d3732]">
                <th className="pb-3 px-3">Producto</th>
                <th className="pb-3 px-3">Categoría</th>
                <th className="pb-3 px-3">Precio</th>
                <th className="pb-3 px-3">Estado</th>
                <th className="pb-3 px-3 text-center">Disponible</th>
                <th className="pb-3 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-gray-400">
                    No se encontraron productos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product, idx) => (
                  <tr
                    key={product.id}
                    className={cn(
                      "transition-colors duration-200 hover:bg-white/40 dark:hover:bg-[#231f1c]/40",
                      idx !== filteredProducts.length - 1 && "border-b border-[#ddd4c8]/60 dark:border-[#3d3732]/60",
                      !product.available && "opacity-60"
                    )}
                  >
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#9a0002]/10 text-[#9a0002] flex items-center justify-center font-black text-xs">
                          {product.name.charAt(0)}
                        </div>
                        <span className="text-xs font-extrabold text-gray-900 dark:text-gray-100">{product.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">{product.category}</td>
                    <td className="py-3.5 px-3 text-xs font-black text-[#9a0002]">
                      ${product.price.toLocaleString("es-AR")}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border",
                          product.available
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40"
                            : "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40"
                        )}
                      >
                        {product.available ? "En Venta" : "Pausado"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => toggleAvailable(product.id)}
                        aria-label="Alternar disponibilidad"
                        className={cn(
                          "w-9 h-5 rounded-full relative transition-colors duration-300 cursor-pointer inline-block",
                          product.available ? "bg-[#9a0002]" : "bg-gray-300 dark:bg-[#3d3732]"
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300",
                            product.available ? "translate-x-[18px]" : "translate-x-0.5"
                          )}
                        />
                      </button>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="Editar producto"
                          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#ede4d9] dark:hover:bg-[#2a2623] hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
                        >
                          <MaterialSymbol icon="edit" size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          title="Eliminar producto"
                          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-[#9a0002] transition-colors cursor-pointer"
                        >
                          <MaterialSymbol icon="delete" size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Slide-over Drawer for Creating New Items (Left/Sidebar Overlay) ────── */}
      <AnimatePresence>
        {isDrawerOpen && (
          <React.Fragment>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40"
            />

            {/* Slide-out Drawer Panel from Left */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 w-full max-w-md bg-[#faf6f1] dark:bg-[#1c1917] border-r border-gray-200 dark:border-[#3d3732] z-50 shadow-2xl flex flex-col justify-between"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-gray-200 dark:border-[#3d3732] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#9a0002] text-white flex items-center justify-center shadow-md">
                    <MaterialSymbol icon="add_circle" size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white">Nuevo Producto</h2>
                    <p className="text-xs text-gray-500">Agregá un plato o bebida a tu menú</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2a2623] transition-colors cursor-pointer"
                >
                  <MaterialSymbol icon="close" size={20} />
                </button>
              </div>

              {/* Drawer Form */}
              <form onSubmit={handleAddProduct} className="p-6 space-y-4 flex-1 overflow-y-auto">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
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

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                    Categoría *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-[#231f1c] border border-gray-200 dark:border-[#3d3732] rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-[#9a0002]"
                  >
                    <option value="Pizzas">Pizzas</option>
                    <option value="Empanadas">Empanadas</option>
                    <option value="Hamburguesas">Hamburguesas</option>
                    <option value="Sándwiches">Sándwiches</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Postres">Postres</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                    Precio ($ ARS) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="7500"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-[#231f1c] border border-gray-200 dark:border-[#3d3732] rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-[#9a0002]"
                  />
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-[#3d3732] space-y-2">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Modificadores sugeridos según rubro:</span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#2a2623] text-gray-600 dark:text-gray-400 text-xs font-medium">
                      + Ingredientes extra
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#2a2623] text-gray-600 dark:text-gray-400 text-xs font-medium">
                      + Tipo de cocción
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#2a2623] text-gray-600 dark:text-gray-400 text-xs font-medium">
                      + Horario dinámico
                    </span>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#9a0002] hover:bg-[#7a0002] text-white font-black text-sm rounded-xl shadow-lg transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                  >
                    <MaterialSymbol icon="save" size={18} />
                    <span>Guardar Producto</span>
                  </button>
                </div>
              </form>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-[#3d3732] text-center text-xs text-gray-400">
                El nuevo producto se publicará inmediatamente en tu menú digital.
              </div>
            </motion.aside>
          </React.Fragment>
        )}
      </AnimatePresence>
    </div>
  );
}
