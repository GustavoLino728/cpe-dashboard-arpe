"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { DashboardProvider } from "@/components/DashboardProvider";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Enquanto verifica auth, mostra loading sutil
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <Loader2 className="w-6 h-6 text-teal animate-spin" />
      </div>
    );
  }

  // Se não autenticado, não renderiza nada (redirect em andamento)
  if (!isAuthenticated) return null;

  return (
    <Suspense fallback={null}>
      <DashboardProvider>
        <div className="flex h-screen bg-bg text-ink max-lg:flex-col transition-colors duration-200 overflow-hidden">
          <Sidebar />
          <div className="flex flex-col flex-1 h-full min-w-0">
            <div className="shrink-0 pt-[22px] px-[30px] pb-[18px] max-lg:px-[20px] max-md:px-4">
              <Topbar />
            </div>
            <main className="flex-1 overflow-y-auto px-[30px] pb-[60px] max-lg:px-[20px] max-md:px-4 max-md:pb-12">
              {children}
            </main>
          </div>
        </div>
      </DashboardProvider>
    </Suspense>
  );
}

