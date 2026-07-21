"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { LogOut, Sun, Moon } from "lucide-react";

export function Topbar() {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Determine which tab is active based on the current URL
  const isDashboard = pathname === "/";
  const escopoParam = searchParams.get("escopo");
  const activeScope =
    isDashboard && escopoParam === "pessoal" ? "pessoal" : "coordenadoria";

  // Dynamic title based on current route and scope
  const pageTitle = isDashboard
    ? activeScope === "pessoal"
      ? "Visão pessoal"
      : "Visão geral"
    : pathname === "/atividades"
      ? "Atividades"
      : pathname === "/coordenadorias"
        ? "Coordenadorias"
        : pathname === "/planilhas"
          ? "Planilhas"
          : pathname === "/configuracao"
            ? "Configuração"
            : "Dashboard";

  const pageSubtitle = isDashboard
    ? "Monitoramento de Projetos Estratégicos"
    : "";

  return (
    <header className="flex justify-between items-start flex-wrap gap-4 select-none">
      {/* Esquerda: título da visão + tabs */}
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="font-display font-bold text-[20px] text-ink leading-tight">
            {pageTitle}
          </h1>
          {pageSubtitle && (
            <p className="text-[12.5px] text-ink-soft mt-0.5">
              {pageSubtitle}
            </p>
          )}
        </div>

        {/* Tabs de escopo — links discretos */}
        <div className="flex gap-5 text-[13px] text-ink-soft">
          <Link
            href="/"
            className={`pb-1 transition-all duration-150 no-underline border-b-2 ${
              activeScope === "coordenadoria" && isDashboard
                ? "text-ink font-semibold border-teal"
                : "border-transparent hover:text-ink"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/?escopo=pessoal"
            className={`pb-1 transition-all duration-150 no-underline border-b-2 ${
              activeScope === "pessoal" && isDashboard
                ? "text-ink font-semibold border-teal"
                : "border-transparent hover:text-ink"
            }`}
          >
            Visão pessoal
          </Link>
        </div>
      </div>

      {/* Direita: chip de usuário + toggle tema + logout */}
      <div className="flex items-center gap-4 text-[13px] text-ink-soft">
        {/* Chip de usuário */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-teal/15 text-teal flex items-center justify-center text-[13px] font-bold select-none">
            U
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-[12.5px] font-semibold text-ink leading-tight">
              Usuário
            </span>
            <span className="text-[11px] text-ink-soft leading-tight">
              Analista
            </span>
          </div>
        </div>

        {/* Separador sutil */}
        <div className="w-px h-5 bg-line/40" />

        {/* Toggle de tema — discreto, só texto + ícone */}
        <button
          id="themeToggle"
          onClick={toggleTheme}
          className="flex items-center gap-1.5 text-[12px] text-ink-soft hover:text-ink cursor-pointer bg-transparent border-none transition-colors duration-150"
        >
          {theme === "dark" ? (
            <Sun className="w-3.5 h-3.5" />
          ) : (
            <Moon className="w-3.5 h-3.5" />
          )}
          <span id="themeLabel">
            {theme === "dark" ? "Claro" : "Escuro"}
          </span>
        </button>

        {/* Separador sutil */}
        <div className="w-px h-5 bg-line/40" />

        {/* Logout */}
        <button
          className="flex items-center text-ink-soft hover:text-ink cursor-pointer bg-transparent border-none transition-colors duration-150"
          title="Sair"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
