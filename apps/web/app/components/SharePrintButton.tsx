"use client";

import React from "react";

export function SharePrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden h-8 px-3 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors flex items-center gap-1.5 shadow-sm"
    >
      📄 Download PDF
    </button>
  );
}