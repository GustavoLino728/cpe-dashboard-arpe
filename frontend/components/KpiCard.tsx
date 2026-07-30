import React from "react";

interface KpiCardProps {
  value: string | number;
  label: string;
  icon: React.ReactNode;
  accentColor: string;
}

export function KpiCard({ value, label, icon, accentColor }: KpiCardProps) {
  return (
    <div className="bg-panel border border-line/30 rounded-custom p-6 flex flex-col gap-4 transition-all duration-200 relative min-h-[120px]">
      {/* Ícone no canto superior direito — badge colorido como único acento */}
      <div
        className="absolute top-5 right-5 w-9 h-9 rounded-[10px] flex items-center justify-center"
        style={{
          backgroundColor: `${accentColor}14`,
          color: accentColor,
        }}
      >
        {icon}
      </div>

      {/* Dado principal + label discreta */}
      <div className="flex flex-col gap-1.5 mt-auto">
        <div className="font-mono-kpi text-[32px] font-semibold leading-none text-ink select-none tracking-tight">
          {value}
        </div>
        <div className="text-[12px] leading-tight text-ink-soft select-none">
          {label}
        </div>
      </div>
    </div>
  );
}
