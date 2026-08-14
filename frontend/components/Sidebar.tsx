"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

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

  const filteredNavItems = navItems.filter((item) => {
    if (item.href === "/usuarios") {
      return user?.role === "admin";
    }
    return true;
  });

  return (
    <aside className="bg-sidebar text-[#C3D0DC] py-5 flex flex-col w-[220px] shrink-0 border-r border-line/10 h-full overflow-y-auto max-lg:w-full max-lg:flex-row max-lg:overflow-x-auto max-lg:overflow-y-visible max-lg:h-auto max-lg:py-3 max-lg:px-4 max-lg:items-center max-lg:justify-between max-lg:border-r-0 max-lg:border-b select-none">
      {/* Logo */}
      <div className="px-5 pb-6 flex items-center max-lg:pb-0 max-lg:px-3">
        <Link href="/" className="flex items-center">
          <img
            src="/logo-arpe-negativo.png"
            alt="ARPE Painel"
            className="h-[32px] w-auto object-contain"
          />
        </Link>
      </div>

      {/* Navegação simples sem grupos */}
      <nav className="flex flex-col flex-1 gap-1 max-lg:flex-row max-lg:items-center">
        <ul className="list-none m-0 p-0 flex flex-col w-full max-lg:flex-row max-lg:gap-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 py-[9px] px-5 text-[13.5px] no-underline transition-all duration-150 max-lg:py-2 max-lg:px-3 rounded-lg mx-2 max-lg:mx-0 ${
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

      <div className="mt-auto px-5 py-4 text-[11px] text-[#5E7286] max-lg:hidden">
        « Recolher menu
      </div>
    </aside>
  );
}
