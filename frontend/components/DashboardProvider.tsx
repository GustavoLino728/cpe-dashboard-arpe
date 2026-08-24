"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export type Scope = "coordenadoria" | "pessoal";

interface DashboardContextType {
  scope: Scope;
  setScope: (scope: Scope) => void;
  selectedCoord: string;
  setSelectedCoord: (coord: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isDesktopOpen: boolean;
  setIsDesktopOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Scope is derived directly from the URL — no useState needed
  const escopoParam = searchParams.get("escopo");
  const scope: Scope = escopoParam === "pessoal" ? "pessoal" : "coordenadoria";

  // setScope navigates to "/" with the appropriate search param
  const setScope = useCallback(
    (newScope: Scope) => {
      if (newScope === "pessoal") {
        if (pathname !== "/" || escopoParam !== "pessoal") {
          router.push("/?escopo=pessoal");
        }
      } else {
        if (pathname !== "/" || escopoParam) {
          router.push("/");
        }
      }
    },
    [router, pathname, escopoParam]
  );

  const [selectedCoord, setSelectedCoord] = useState<string>("todas");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const toggleSidebar = useCallback(() => {
    if (window.innerWidth < 1024) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsDesktopOpen((prev) => !prev);
    }
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        scope,
        setScope,
        selectedCoord,
        setSelectedCoord,
        isMobileOpen,
        setIsMobileOpen,
        isDesktopOpen,
        setIsDesktopOpen,
        toggleSidebar,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
