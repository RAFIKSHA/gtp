"use client";

import React, { useState, Suspense } from "react";
import { Sidebar } from "@/components/navigation/Sidebar";
import { Topbar } from "@/components/navigation/Topbar";
import { MobileDrawer } from "@/components/navigation/MobileDrawer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Suspense fallback={<div className="w-64 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)]" />}>
          <Sidebar />
        </Suspense>
      </div>

      {/* Mobile Drawer */}
      <Suspense fallback={null}>
        <MobileDrawer
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
      </Suspense>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Suspense fallback={<div className="h-16 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]" />}>
          <Topbar onMenuClick={() => setMobileMenuOpen(true)} />
        </Suspense>
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--text-muted)]">Loading content...</div>}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
