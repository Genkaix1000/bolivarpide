"use client";

import React from "react";

interface HighlightTextProps {
  text: string;
  query: string;
  className?: string;
  highlightClassName?: string;
}

export function HighlightText({
  text,
  query,
  className = "",
  highlightClassName = "bg-[#9a0002]/15 text-[#9a0002] dark:bg-[#9a0002]/30 dark:text-red-300 font-bold rounded-[3px] px-0.5",
}: HighlightTextProps) {
  if (!query || !query.trim() || !text) {
    return <span className={className}>{text}</span>;
  }

  const cleanQuery = query.trim();
  // Escape regex special chars
  const escaped = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");

  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.toLowerCase() === cleanQuery.toLowerCase()) {
          return (
            <mark key={i} className={highlightClassName}>
              {part}
            </mark>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </span>
  );
}
