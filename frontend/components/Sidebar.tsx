"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/components/DashboardProvider";
import { X } from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { name: "Visão geral", href: "/", icon: "⌂" },
  { name: "Atividades", href: "/atividades", icon: "▤" },
  { name: "Coordenadorias", href: "/coordenadorias", icon: "◔" },
  { name: "Planilhas", href: "/planilhas", icon: "☰" },
  { name: "Usuários", href: "/usuarios", icon: "👥" },
  { name: "Configuração", href: "/configuracao", icon: "⚙" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isMobileOpen, setIsMobileOpen, isDesktopOpen, toggleSidebar } = useDashboard();

  const filteredNavItems = navItems.filter((item) => {
    if (item.href === "/usuarios") {
      return user?.role === "admin";
    }
    return true;
  });

  return (
    <>
      {/* Backdrop overlay para fechar no Mobile */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/45 z-40 lg:hidden transition-opacity duration-300 cursor-pointer"
        />
      )}

      <aside
        className={`bg-sidebar text-[#C3D0DC] py-5 flex flex-col shrink-0 border-r border-line/10 h-full overflow-y-auto select-none transition-all duration-300 ease-in-out
          lg:relative lg:z-30
          ${isDesktopOpen ? "lg:w-[220px] lg:opacity-100 lg:pointer-events-auto" : "lg:w-0 lg:opacity-0 lg:pointer-events-none lg:border-r-0 lg:py-0"}
          max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:w-[240px] max-lg:shadow-2xl
          ${isMobileOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="px-5 pb-6 flex items-center justify-between max-lg:pb-4">
          <Link href="/" className="flex items-center">
            <img
              src="/logo-arpe-negativo.png"
              alt="ARPE Painel"
              className="h-[32px] w-auto object-contain"
            />
          </Link>
          {/* Botão de fechar para Mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            aria-label="Fechar menu"
            className="lg:hidden p-1.5 rounded-lg text-[#8A9DB0] hover:text-white hover:bg-white/10 transition-colors focus:outline-none border-none bg-transparent cursor-pointer flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navegação simples sem grupos */}
        <nav className="flex flex-col flex-1 gap-1">
          <ul className="list-none m-0 p-0 flex flex-col w-full gap-1">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href} className="w-full">
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 py-[9px] px-5 text-[13.5px] no-underline transition-all duration-150 rounded-lg mx-2 ${
                      isActive
                        ? "text-white font-semibold"
                        : "text-[#8A9DB0] hover:text-[#C3D0DC]"
                    }`}
                  >
                    <span
                      className={`w-[18px] text-center text-[14px] transition-colors duration-150 ${
                        isActive ? "text-teal" : ""
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

      </aside>
    </>
  );
}
