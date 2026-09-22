"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { PageSkeleton } from "./PageSkeleton";
import { useUiStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useUiStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready
        .then(() => {
          setIsReady(true);
        })
        .catch(() => {
          setIsReady(true);
        });
    } else {
      setIsReady(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8ff]">
      <Sidebar />
      <div
        className={cn(
          "transition-all duration-300 ease-in-out min-h-screen flex flex-col",
          sidebarOpen ? "pl-64" : "pl-[68px]"
        )}
      >
        <Header />
        <main className="relative pt-20 px-4 sm:px-6 lg:px-8 pb-16 flex-1 w-full max-w-[1600px] mx-auto">
          {!isReady ? (
            <PageSkeleton />
          ) : (
            <div className="transition-opacity duration-200 animate-in fade-in">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
