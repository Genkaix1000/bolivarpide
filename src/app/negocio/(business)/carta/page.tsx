"use client";

import { useState } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";
import { MOCK_PRODUCTS } from "@/lib/mockData";

export default function CartaPage() {
  const [products, setProducts] = useState(MOCK_PRODUCTS);

  const toggleAvailable = (id: string) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, available: !p.available } : p)));
  };

  return (
    <div className="space-y-6 text-gray-800 dark:text-gray-200 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight">Mi Carta</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Gestioná tus productos y categorías</p>
        </div>

        <button className="px-4 py-2.5 bg-gradient-to-r from-[#9a0002] to-[#6b0001] text-white text-xs font-bold rounded-full hover:opacity-95 transition-all shadow-md shadow-red-500/20 cursor-pointer flex items-center gap-1.5 w-fit">
          <MaterialSymbol icon="add" size={15} />
          Agregar producto
        </button>
      </div>

      {/* Tabla de productos */}
      <div className="bg-[#faf6f1] dark:bg-[#1c1917] border border-gray-100 dark:border-[#3d3732] penpot-shadow rounded-[24px] p-5">
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-left min-w-[560px]">
            <thead>
              <tr className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                <th className="pb-3 px-1">Producto</th>
                <th className="pb-3 px-1">Categoría</th>
                <th className="pb-3 px-1">Precio</th>
                <th className="pb-3 px-1">Disponible</th>
                <th className="pb-3 px-1 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, idx) => (
                <tr
                  key={product.id}
                  className={cn(
                    "transition-opacity duration-300",
                    idx !== products.length - 1 && "border-b border-[#ddd4c8] dark:border-[#3d3732]/60",
                    !product.available && "opacity-50"
                  )}
                >
                  <td className="py-3 px-1 text-xs font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap">{product.name}</td>
                  <td className="py-3 px-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{product.category}</td>
                  <td className="py-3 px-1 text-xs font-black text-[#9a0002] whitespace-nowrap">
                    ${product.price.toLocaleString("es-AR")}
                  </td>
                  <td className="py-3 px-1">
                    <button
                      onClick={() => toggleAvailable(product.id)}
                      aria-label="Alternar disponibilidad"
                      className={cn(
                        "w-9 h-5 rounded-full relative transition-colors duration-300 cursor-pointer",
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
                  <td className="py-3 px-1">
                    <div className="flex items-center justify-end gap-1">
                      <button className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#ede4d9] dark:hover:bg-[#2a2623] hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer">
                        <MaterialSymbol icon="edit" size={14} />
                      </button>
                      <button className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-[#9a0002] transition-colors cursor-pointer">
                        <MaterialSymbol icon="delete" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
