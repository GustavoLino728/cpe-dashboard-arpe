"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Dashboards",
    items: [{ name: "Visão geral", href: "/", icon: "⌂" }],
  },
  {
    label: "Dados",
    items: [
      { name: "Atividades", href: "/atividades", icon: "▤" },
      { name: "Coordenadorias", href: "/coordenadorias", icon: "◔" },
      { name: "Planilhas", href: "/planilhas", icon: "☰" },
    ],
  },
  {
    label: "Sistema",
    items: [{ name: "Configuração", href: "/configuracao", icon: "⚙" }],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-sidebar text-[#C3D0DC] py-5 flex flex-col w-[220px] shrink-0 border-r border-line/10 h-full overflow-y-auto max-lg:w-full max-lg:flex-row max-lg:overflow-x-auto max-lg:overflow-y-visible max-lg:h-auto max-lg:py-3 max-lg:px-4 max-lg:items-center max-lg:justify-between max-lg:border-r-0 max-lg:border-b select-none">
      {/* Logo */}
      <div className="font-display font-bold text-[17px] text-white px-5 pb-6 tracking-[0.2px] flex items-center gap-2 max-lg:pb-0 max-lg:px-3">
        <span className="w-[26px] h-[26px] rounded-[7px] bg-teal flex items-center justify-center text-[13px] font-bold text-white">
          A
        </span>
        ARPE Painel
      </div>

      {/* Navegação com grupos */}
      <nav className="flex flex-col flex-1 gap-5 max-lg:flex-row max-lg:items-center max-lg:gap-1">
        {navGroups.map((group) => (
          <div key={group.label} className="flex flex-col max-lg:flex-row max-lg:items-center">
            {/* Label do grupo */}
            <div className="text-[10px] uppercase tracking-[1.5px] text-[#5E7286]/60 font-semibold px-5 mb-2 max-lg:hidden">
              {group.label}
            </div>

            {/* Itens do grupo */}
            <ul className="list-none m-0 p-0 flex flex-col max-lg:flex-row max-lg:gap-1">
              {group.items.map((item) => {
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
          </div>
        ))}
      </nav>

      <div className="mt-auto px-5 py-4 text-[11px] text-[#5E7286] max-lg:hidden">
        « Recolher menu
      </div>
    </aside>
  );
}
