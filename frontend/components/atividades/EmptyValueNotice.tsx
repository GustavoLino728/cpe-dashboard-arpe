"use client";

import React from "react";
import { Info, X } from "lucide-react";

interface EmptyCellProps {
  fieldLabel?: string;
  onNotifyEmpty?: (fieldLabel?: string) => void;
}

export function EmptyCell({ fieldLabel, onNotifyEmpty }: EmptyCellProps) {
  const tooltipText = "Campo sem preenchimento na planilha de origem (Google Sheets).";

  return (
    <button
      type="button"
      title={tooltipText}
      aria-label={fieldLabel ? `${fieldLabel}: ${tooltipText}` : tooltipText}
      onClick={(event) => {
        event.stopPropagation();
        onNotifyEmpty?.(fieldLabel);
      }}
      className="group relative inline-flex items-center justify-center rounded px-1 py-0.5 text-ink-soft/75 hover:text-ink hover:bg-line/20 transition-colors cursor-help focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
    >
      <span className="font-mono-kpi">—</span>
      <span
        role="tooltip"
        className="pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100 transition-opacity duration-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-40 w-max max-w-[230px] rounded-md border border-line bg-ink text-bg px-2.5 py-1.5 text-[11px] font-normal leading-snug shadow-lg text-center"
      >
        Sem preenchimento na planilha original
      </span>
    </button>
  );
}

interface EmptyFieldToastProps {
  message: string | null;
  onClose: () => void;
}

export function EmptyFieldToast({ message, onClose }: EmptyFieldToastProps) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 max-w-sm rounded-lg border border-teal/30 bg-panel px-4 py-3 text-[12.5px] text-ink shadow-xl animate-[fadeIn_0.2s_ease-out]"
    >
      <Info className="w-4 h-4 shrink-0 text-teal" />
      <span className="flex-1 leading-snug">{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar aviso"
        className="p-1 rounded text-ink-soft hover:text-ink hover:bg-line/20 transition-colors cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
