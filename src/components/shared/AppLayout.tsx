"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-72">
        <Header />
        <main className="relative pt-16 min-h-screen bg-background w-full px-space-6 pb-space-12">
          {children}
        </main>
      </div>
    </div>
  );
}
