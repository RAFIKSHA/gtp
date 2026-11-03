"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Bell,
  Palette,
  ChevronRight,
  BookOpen,
  Search,
  ExternalLink,
} from "lucide-react";
import { ThemeSelectorModal } from "@/components/theme/ThemeSelectorModal";

interface TopbarProps {
  onMenuClick: () => void;
}

const ROUTE_TITLES: Record<string, { title: string; category: string }> = {
  "/dashboard": { title: "Student Dashboard", category: "Overview" },
  "/learning-path": { title: "Guided Learning Path", category: "Study" },
  "/subjects": { title: "Explore All Subjects", category: "Syllabus" },
  "/practice": { title: "Question Practice", category: "Practice" },
  "/pyq": { title: "Previous Year Questions", category: "Exam Archive" },
  "/mock-tests": { title: "Mock Test Series", category: "Exams" },
  "/analytics": { title: "Performance Analytics", category: "Insights" },
  "/bookmarks": { title: "Saved Bookmarks", category: "Personal" },
  "/profile": { title: "My Profile & Onboarding", category: "Account" },
  "/settings": { title: "Portal Settings", category: "Preferences" },
  "/admin": { title: "Administrator Panel", category: "Administration" },
};

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);

  // Match the route title
  const currentRoute = ROUTE_TITLES[pathname] || {
    title: "GATE Preparation",
    category: "Portal",
  };

  return (
    <>
      <header className="sticky top-0 z-20 h-16 bg-[var(--bg-surface)]/80 backdrop-blur-md border-b border-[var(--border-subtle)] px-4 md:px-8 flex items-center justify-between transition-colors">
        {/* Left: Hamburger menu + Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <Link
              href="/dashboard"
              className="hover:text-[var(--text-primary)] transition-colors"
            >
              GATE Portal
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[var(--border-strong)]" />
            <span className="text-[var(--text-secondary)] font-medium hidden sm:inline">
              {currentRoute.category}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-[var(--border-strong)] hidden sm:inline" />
            <span className="text-[var(--text-primary)] font-bold truncate max-w-[160px] sm:max-w-none">
              {currentRoute.title}
            </span>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Paper Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#8B16F7]/10 border border-[#8B16F7]/30 text-xs font-semibold text-[#C42BEE]">
            <BookOpen className="w-3.5 h-3.5" />
            <span>CS — Computer Science & IT</span>
          </div>

          {/* Quick Theme Switcher Button */}
          <button
            onClick={() => setIsThemeModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all shadow-sm"
            title="Switch Theme"
          >
            <Palette className="w-3.5 h-3.5 text-[#8B16F7]" />
            <span className="hidden sm:inline">Theme</span>
          </button>

          {/* Notifications Trigger */}
          <button
            className="relative p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF791E]"></span>
          </button>

          {/* Student Avatar */}
          <Link
            href="/profile"
            className="flex items-center gap-2 p-1 pl-1.5 rounded-full border border-[var(--border-subtle)] hover:border-[var(--accent-purple)] transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#8B16F7] to-[#C42BEE] flex items-center justify-center text-white font-bold text-xs">
              S
            </div>
          </Link>
        </div>
      </header>

      {/* Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </>
  );
}

