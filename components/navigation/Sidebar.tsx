"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  BookOpen,
  CheckSquare,
  History,
  FileCheck2,
  BarChart3,
  Bookmark,
  User,
  Settings,
  Shield,
  Palette,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeSelectorModal } from "@/components/theme/ThemeSelectorModal";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const STUDENT_NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Guided Learning",
    href: "/learning-path",
    icon: Compass,
    badge: "Smart",
  },
  {
    title: "Explore Subjects",
    href: "/subjects",
    icon: BookOpen,
  },
  {
    title: "Question Practice",
    href: "/practice",
    icon: CheckSquare,
  },
  {
    title: "Previous Year Questions",
    href: "/pyq",
    icon: History,
  },
  {
    title: "Mock Test Series",
    href: "/mock-tests",
    icon: FileCheck2,
    badge: "GATE 2026",
  },
  {
    title: "Performance Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Bookmarks",
    href: "/bookmarks",
    icon: Bookmark,
  },
  {
    title: "My Profile",
    href: "/profile",
    icon: User,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export const ADMIN_NAV_ITEM: NavItem = {
  title: "Admin Panel",
  href: "/admin",
  icon: Shield,
  badge: "Staff",
};

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);

  return (
    <>
      <aside
        className={cn(
          "relative flex flex-col justify-between h-screen bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] transition-all duration-300 z-30 select-none",
          isCollapsed ? "w-20" : "w-64 md:w-72",
          className
        )}
      >
        {/* Collapse toggle button for desktop */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3.5 top-7 w-7 h-7 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-strong)] items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm hover:scale-105 transition-all z-40"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Top Header / Brand Logo */}
        <div>
          <div className="p-5 pb-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <Link
              href="/dashboard"
              onClick={onNavigate}
              className="flex items-center gap-3 overflow-hidden"
            >
              <div className="relative w-10 h-10 shrink-0 rounded-xl overflow-hidden shadow-md border border-[var(--border-subtle)] bg-white/5">
                <Image
                  src="/images/codexpetra-logo.jpg"
                  alt="CodexPetra Logo"
                  width={40}
                  height={40}
                  className="object-contain w-10 h-10"
                  priority
                />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-base tracking-tight text-[var(--text-primary)]">
                      CodexPetra
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#8B16F7]/20 text-[#C42BEE] border border-[#8B16F7]/40">
                      GATE
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-[var(--text-muted)] truncate">
                    CSE Preparation
                  </span>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation Links List */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-210px)]">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {!isCollapsed ? "Student Portal" : "•••"}
            </div>

            {STUDENT_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all group relative",
                    isActive
                      ? "bg-gradient-to-r from-[#8B16F7]/20 to-[#C42BEE]/10 text-white border border-[#8B16F7]/40 shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)]/50"
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  {/* Active Indicator Line */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#8B16F7]"></span>
                  )}

                  <div className="flex items-center gap-3 truncate">
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        isActive
                          ? "text-[#C42BEE]"
                          : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
                      )}
                    />
                    {!isCollapsed && <span className="truncate">{item.title}</span>}
                  </div>

                  {!isCollapsed && item.badge && (
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0",
                        isActive
                          ? "bg-[#8B16F7] text-white"
                          : "bg-[var(--border-subtle)] text-[var(--text-secondary)]"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Separator for Admin Section */}
            <div className="pt-4 mt-2 border-t border-[var(--border-subtle)]">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {!isCollapsed ? "Management" : "•••"}
              </div>
              <Link
                href={ADMIN_NAV_ITEM.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all group",
                  pathname?.startsWith("/admin")
                    ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)]/50"
                )}
                title={isCollapsed ? ADMIN_NAV_ITEM.title : undefined}
              >
                <div className="flex items-center gap-3 truncate">
                  <ADMIN_NAV_ITEM.icon className="w-4 h-4 shrink-0 text-amber-500/80 group-hover:text-amber-500" />
                  {!isCollapsed && <span>{ADMIN_NAV_ITEM.title}</span>}
                </div>
                {!isCollapsed && ADMIN_NAV_ITEM.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-amber-500/20 text-amber-500">
                    {ADMIN_NAV_ITEM.badge}
                  </span>
                )}
              </Link>
            </div>
          </nav>
        </div>

        {/* Bottom Profile & Theme Switcher Footer */}
        <div className="p-3 border-t border-[var(--border-subtle)] space-y-2">
          {/* Quick Theme Switcher Button */}
          <button
            onClick={() => setIsThemeModalOpen(true)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)]/60 transition-colors border border-transparent hover:border-[var(--border-subtle)]",
              isCollapsed && "justify-center"
            )}
            title="Change Theme"
          >
            <div className="flex items-center gap-2.5">
              <Palette className="w-4 h-4 text-[#8B16F7]" />
              {!isCollapsed && <span>Appearance</span>}
            </div>
            {!isCollapsed && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--border-subtle)] text-[var(--text-muted)] capitalize">
                Theme
              </span>
            )}
          </button>

          {/* Student Profile Summary Pill */}
          <div
            className={cn(
              "flex items-center gap-3 p-2 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]",
              isCollapsed && "justify-center"
            )}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#8B16F7] to-[#C42BEE] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
              S
            </div>
            {!isCollapsed && (
              <div className="truncate flex-1">
                <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  Student Aspirant
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>GATE CSE 2026</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </>
  );
}

