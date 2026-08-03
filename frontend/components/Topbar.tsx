"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { LogOut, Sun, Moon, Check, ChevronDown } from "lucide-react";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";

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
      </div>

      {/* Direita: Menu suspenso do Usuário */}
      <div className="flex items-center gap-4 text-[13px] text-ink-soft">
        <Menu as="div" className="relative inline-block text-left">
          <div>
            <MenuButton className="flex items-center gap-2.5 cursor-pointer rounded-lg p-1.5 hover:bg-line/10 dark:hover:bg-line/5 transition-colors focus:outline-none select-none">
              <div className="w-8 h-8 rounded-full bg-teal/15 text-teal flex items-center justify-center text-[13px] font-bold">
                U
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-[12.5px] font-semibold text-ink leading-tight">
                  Usuário
                </span>
                <span className="text-[11px] text-ink-soft leading-tight">
                  Analista
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-ink-soft" />
            </MenuButton>
          </div>

          <MenuItems
            transition
            className="absolute right-0 z-55 mt-2 w-48 origin-top-right rounded-lg bg-panel border border-line p-1 shadow-lg focus:outline-none transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            {/* Opção Modo Escuro */}
            <MenuItem>
              {({ focus }) => (
                <button
                  onClick={toggleTheme}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-[13px] font-medium text-left cursor-pointer border-none bg-transparent transition-colors ${
                    focus ? "bg-bg text-ink" : "text-ink-soft"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {theme === "dark" ? (
                      <Moon className="w-4 h-4 text-teal" />
                    ) : (
                      <Sun className="w-4 h-4 text-ink-soft" />
                    )}
                    Modo escuro
                  </span>
                  {theme === "dark" && (
                    <Check className="w-4 h-4 text-teal" />
                  )}
                </button>
              )}
            </MenuItem>

            {/* Separador */}
            <div className="my-1 h-px bg-line/40" />

            {/* Opção Sair */}
            <MenuItem>
              {({ focus }) => (
                <button
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium text-left cursor-pointer border-none bg-transparent transition-colors ${
                    focus ? "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400" : "text-ink-soft"
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              )}
            </MenuItem>
          </MenuItems>
        </Menu>
      </div>
    </header>
  );
}
