"use client";

import { useState } from "react";
import { BusinessCard } from "./BusinessCard";
import { CreateBusinessCard } from "./CreateBusinessCard";
import { HubHeader } from "./HubHeader";
import type { MembershipRow } from "@/lib/business/queries";

export function HubBusinessGrid({ memberships }: { memberships: MembershipRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = memberships.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = m.businesses?.name?.toLowerCase() || "";
    const address = m.businesses?.address?.toLowerCase() || "";
    const city = m.businesses?.city?.toLowerCase() || "";
    return name.includes(q) || address.includes(q) || city.includes(q);
  });

  return (
    <div className="space-y-8">
      <HubHeader
        activeCount={memberships.length}
        searchQuery={search}
        onSearchChange={setSearch}
      />

      {/* Grid of businesses + Add card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* "+ Add new business" card always prominent */}
        <CreateBusinessCard />

        {/* User's existing businesses */}
        {filtered.map((m) => (
          <BusinessCard key={m.id} membership={m} />
        ))}
      </div>

      {filtered.length === 0 && search && (
        <div className="text-center py-12 text-stone-500 dark:text-stone-400">
          No se encontraron locales que coincidan con &quot;{search}&quot;.
        </div>
      )}
    </div>
  );
}
