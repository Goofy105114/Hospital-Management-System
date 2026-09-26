"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useUiStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useUiStore();

  return (
    <div className="min-h-screen bg-[#faf8ff]">
      <Sidebar />
      <div
        className={cn(
          "transition-all duration-300 ease-in-out min-h-screen flex flex-col pl-0",
          sidebarOpen ? "md:pl-64" : "md:pl-[68px]"
        )}
      >
        <Header />
        <main className="relative pt-18 sm:pt-20 px-3 sm:px-6 lg:px-8 pb-16 flex-1 w-full max-w-[1600px] mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
