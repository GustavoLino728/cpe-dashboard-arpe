"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Sun, Moon, Check, ChevronDown, Bell, Inbox, ShieldAlert, CheckCheck } from "lucide-react";
import { Menu, MenuButton, MenuItems, MenuItem, Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useNotifications } from "@/hooks/useNotifications";

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return "Agora mesmo";

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Agora mesmo";
    if (diffMins < 60) return `Há ${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Há ${diffHours} h`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `Há ${diffDays} dias`;

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function Topbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const isDashboard = pathname === "/";
  const escopoParam = searchParams.get("escopo");
  const activeScope =
    isDashboard && escopoParam === "pessoal" ? "pessoal" : "coordenadoria";

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
        {/* Popover de Notificações */}
        <Popover as="div" className="relative inline-block text-left">
          <PopoverButton className="relative flex items-center justify-center p-2 rounded-lg text-ink-soft hover:bg-line/10 dark:hover:bg-line/5 hover:text-ink transition-colors cursor-pointer border-none bg-transparent focus:outline-none">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-panel animate-[pulse_2s_infinite]">
                {unreadCount}
              </span>
            )}
          </PopoverButton>

          <PopoverPanel
            transition
            className="absolute right-0 z-55 mt-2 w-80 sm:w-96 origin-top-right rounded-lg bg-panel border border-line shadow-lg focus:outline-none transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            <div className="flex flex-col max-h-[480px]">
              {/* Cabeçalho */}
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <h3 className="font-display font-bold text-[14px] text-ink">
                  Notificações
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="flex items-center gap-1 font-sans text-[11.5px] font-semibold text-teal hover:text-teal/80 cursor-pointer border-none bg-transparent transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Marcar todas como lidas
                  </button>
                )}
              </div>

              {/* Lista de Notificações */}
              <div className="overflow-y-auto flex-1 divide-y divide-line/40 max-h-[380px]">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-line/10 text-ink-soft/60 flex items-center justify-center mb-3">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <p className="font-display font-semibold text-[13px] text-ink leading-snug">
                      Nenhuma notificação
                    </p>
                    <p className="text-[11.5px] text-ink-soft mt-1 leading-normal max-w-[200px]">
                      Você receberá avisos sobre prazos de atividades e alertas aqui.
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        if (!notif.is_read) {
                          markAsRead(notif.id);
                        }
                      }}
                      className={`flex gap-3 p-4 hover:bg-line/5 cursor-pointer transition-colors relative ${
                        !notif.is_read ? "bg-teal/5 dark:bg-teal/5" : ""
                      }`}
                    >
                      {/* Indicador de Tipo de Notificação (Ícone) */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        notif.type === "urgente" || notif.type === "deadline"
                          ? "bg-rose-500/10 text-rose-500"
                          : notif.type === "alerta"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-teal-500/10 text-teal"
                      }`}>
                        {notif.type === "urgente" || notif.type === "deadline" ? (
                          <ShieldAlert className="w-4 h-4" />
                        ) : (
                          <Bell className="w-4 h-4" />
                        )}
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <p className={`text-[12.5px] truncate leading-snug ${
                            !notif.is_read ? "font-bold text-ink" : "font-medium text-ink-soft"
                          }`}>
                            {notif.title}
                          </p>
                          <span className="flex-shrink-0 text-[10px] text-ink-soft/70 mt-0.5 whitespace-nowrap">
                            {formatRelativeTime(notif.created_at)}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-ink-soft leading-normal break-words">
                          {notif.content}
                        </p>
                      </div>

                      {/* Ponto azul de Não Lida */}
                      {!notif.is_read && (
                        <span className="absolute top-1/2 right-3 -translate-y-1/2 w-2 h-2 rounded-full bg-teal" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </PopoverPanel>
        </Popover>

        <Menu as="div" className="relative inline-block text-left">
          <MenuButton className="flex items-center gap-2.5 cursor-pointer rounded-lg p-1.5 hover:bg-line/10 dark:hover:bg-line/5 transition-colors focus:outline-none select-none border-none bg-transparent text-left">
            <div className="w-8 h-8 rounded-full bg-teal/15 text-teal flex items-center justify-center text-[13px] font-bold select-none uppercase">
              {user?.name?.charAt(0) ?? "U"}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-[12.5px] font-semibold text-ink leading-tight">
                {user?.name ?? "Usuário"}
              </span>
              <span className="text-[11px] text-ink-soft leading-tight">
                {user?.email ?? ""}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-ink-soft" />
          </MenuButton>

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
                  onClick={handleLogout}
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
