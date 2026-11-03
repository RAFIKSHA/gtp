"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  Server,
  Database,
  Palette,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import type { HealthCheckResponse } from "@/types/api";

type ThemeOption = "obsidian" | "crisp" | "warm";

export default function Home() {
  const [currentTheme, setCurrentTheme] = useState<ThemeOption>("obsidian");
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const applyTheme = (theme: ThemeOption) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("codexpetra-theme", theme);
  };

  const fetchHealthStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/health/", {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data: HealthCheckResponse = await res.json();
      setHealth(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reach Django backend server at http://127.0.0.1:8000"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedTheme = (localStorage.getItem("codexpetra-theme") as ThemeOption) || "obsidian";
    applyTheme(savedTheme);
    fetchHealthStatus();
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 md:p-12 transition-colors duration-300">
      {/* Top Header */}
      <header className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pb-8 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 shrink-0 rounded-xl overflow-hidden shadow-lg border border-[var(--border-subtle)] bg-white/5">
            <Image
              src="/images/codexpetra-logo.jpg"
              alt="CodexPetra Logo"
              width={48}
              height={48}
              className="object-contain w-12 h-12"
              priority
            />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              CodexPetra <span className="text-[#8B16F7]">GATE</span> Portal
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Computer Science & Information Technology (CS & IT)
            </p>
          </div>
        </div>

        {/* Theme Switcher Quick Toggle */}
        <div className="flex items-center gap-2 bg-[var(--bg-surface)] p-1.5 rounded-xl border border-[var(--border-subtle)]">
          <Palette className="w-4 h-4 text-[var(--accent-purple)] ml-2" />
          <span className="text-xs font-medium text-[var(--text-secondary)] mr-1">
            Theme:
          </span>
          <button
            onClick={() => applyTheme("obsidian")}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
              currentTheme === "obsidian"
                ? "bg-[#8B16F7] text-white shadow-md"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Obsidian
          </button>
          <button
            onClick={() => applyTheme("crisp")}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
              currentTheme === "crisp"
                ? "bg-[#8B16F7] text-white shadow-md"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Crisp White
          </button>
          <button
            onClick={() => applyTheme("warm")}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
              currentTheme === "warm"
                ? "bg-[#8B16F7] text-white shadow-md"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Warm Study
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-6xl w-full mx-auto my-10 space-y-10">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#8B16F7]/10 text-[#C42BEE] border border-[#8B16F7]/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Phase 1 — Project Foundation Active</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Empowering Your <span className="bg-gradient-to-r from-[#8B16F7] via-[#C42BEE] to-[#FF791E] bg-clip-text text-transparent">GATE Journey</span>
          </h2>
          <p className="text-sm md:text-base text-[var(--text-secondary)] leading-relaxed">
            High-performance EdTech platform tailored for GATE CSE aspirants. 
            Structured learning paths, official PYQs, full-length timed mock tests, and real student analytics.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="/checkin"
              className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[#8B16F7] to-[#C42BEE] text-white shadow-lg shadow-[#8B16F7]/25 hover:opacity-95 transition-all flex items-center gap-2"
            >
              <span>Student Check-in (Orientation)</span>
              <Sparkles className="w-4 h-4" />
            </a>
            <a
              href="/dashboard"
              className="px-6 py-3 rounded-xl font-bold text-sm bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--text-primary)] hover:border-[#8B16F7] transition-all flex items-center gap-2"
            >
              <span>Dashboard</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href="/learning-path"
              className="px-6 py-3 rounded-xl font-bold text-sm bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--text-primary)] hover:border-[#8B16F7] transition-all"
            >
              Learning Path
            </a>
          </div>
        </div>

        {/* Live System Architecture Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Frontend Card */}
          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-4 shadow-sm hover:border-[var(--accent-purple)]/50 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#8B16F7]/15 flex items-center justify-center text-[#C42BEE]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">
                Next.js 16 + React 19
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Modern App Router, TypeScript, and Tailwind CSS v4 styling engine.
              </p>
            </div>
            <div className="pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)] space-y-1">
              <div className="flex justify-between">
                <span>Domain</span>
                <span className="font-mono text-[var(--text-primary)]">localhost:3000</span>
              </div>
              <div className="flex justify-between">
                <span>Theme Engine</span>
                <span className="font-mono text-[#C42BEE] capitalize">{currentTheme}</span>
              </div>
            </div>
          </div>

          {/* Backend Card (Live Round-Trip Monitor) */}
          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-4 shadow-sm hover:border-[var(--accent-purple)]/50 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#8B16F7]/15 flex items-center justify-center text-[#C42BEE]">
                <Server className="w-5 h-5" />
              </div>
              <button
                onClick={fetchHealthStatus}
                title="Refresh Status"
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 p-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">
                Django REST API
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Business logic, evaluation integrity, CORS middleware, and authentication.
              </p>
            </div>
            <div className="pt-2 border-t border-[var(--border-subtle)] text-xs space-y-2">
              {loading ? (
                <div className="text-[var(--text-muted)] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  Checking API connection...
                </div>
              ) : health ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-emerald-500 font-medium">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Status
                    </span>
                    <span className="font-mono uppercase">{health.status}</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-muted)]">
                    <span>Endpoint</span>
                    <span className="font-mono text-[var(--text-primary)]">/api/v1/health/</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-muted)]">
                    <span>API Version</span>
                    <span className="font-mono text-[var(--text-primary)]">{health.version}</span>
                  </div>
                </div>
              ) : (
                <div className="text-amber-500 text-xs">
                  <p className="font-medium">Backend not reached</p>
                  <p className="text-[var(--text-muted)] text-[10px] mt-0.5">
                    Run: <code className="font-mono text-[var(--text-primary)]">backend/.venv/bin/python backend/manage.py runserver</code>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Database Card */}
          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-4 shadow-sm hover:border-[var(--accent-purple)]/50 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#FF791E]/15 flex items-center justify-center text-[#FF791E]">
                <Database className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                PostgreSQL
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">
                Supabase Dedicated DB
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Relational schema for student progress, official syllabus, questions, and attempts.
              </p>
            </div>
            <div className="pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)] space-y-1">
              <div className="flex justify-between">
                <span>Database Engine</span>
                <span className="font-mono text-[var(--text-primary)] capitalize">
                  {health?.database.engine || "Configured (PostgreSQL/SQLite)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Connection Status</span>
                <span className="font-mono text-emerald-500">
                  {health?.database.connected ? "Connected" : "Standby"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Three Themes Preview Showcase */}
        <div className="p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                Three Complete Theme Modes
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Click any card below to test the full-app theme transition in real time:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Theme 1: Obsidian */}
            <div
              onClick={() => applyTheme("obsidian")}
              className={`cursor-pointer p-4 rounded-xl border-2 transition-all bg-[#09090D] text-white ${
                currentTheme === "obsidian"
                  ? "border-[#8B16F7] shadow-lg shadow-[#8B16F7]/20 ring-2 ring-[#8B16F7]/30"
                  : "border-[#232536] hover:border-[#8B16F7]/50"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-sm">1. Obsidian Black</span>
                {currentTheme === "obsidian" && (
                  <CheckCircle2 className="w-4 h-4 text-[#C42BEE]" />
                )}
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Near-black `#09090D` background, subtle borders, white text, and `#8B16F7` purple actions.
              </p>
              <div className="mt-4 flex gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#09090D] border border-white/20"></span>
                <span className="w-5 h-5 rounded-full bg-[#8B16F7]"></span>
                <span className="w-5 h-5 rounded-full bg-[#C42BEE]"></span>
                <span className="w-5 h-5 rounded-full bg-[#FF791E]"></span>
              </div>
            </div>

            {/* Theme 2: Crisp White */}
            <div
              onClick={() => applyTheme("crisp")}
              className={`cursor-pointer p-4 rounded-xl border-2 transition-all bg-[#FFFFFF] text-[#111827] ${
                currentTheme === "crisp"
                  ? "border-[#8B16F7] shadow-lg shadow-[#8B16F7]/20 ring-2 ring-[#8B16F7]/30"
                  : "border-[#E2E8F0] hover:border-[#8B16F7]/50"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-sm">2. Crisp White</span>
                {currentTheme === "crisp" && (
                  <CheckCircle2 className="w-4 h-4 text-[#8B16F7]" />
                )}
              </div>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Pure `#FFFFFF` background, high-contrast dark text, clean borders, and purple highlights.
              </p>
              <div className="mt-4 flex gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#FFFFFF] border border-zinc-300"></span>
                <span className="w-5 h-5 rounded-full bg-[#8B16F7]"></span>
                <span className="w-5 h-5 rounded-full bg-[#C42BEE]"></span>
                <span className="w-5 h-5 rounded-full bg-[#FF791E]"></span>
              </div>
            </div>

            {/* Theme 3: Warm Study */}
            <div
              onClick={() => applyTheme("warm")}
              className={`cursor-pointer p-4 rounded-xl border-2 transition-all bg-[#FBF8F1] text-[#2A241F] ${
                currentTheme === "warm"
                  ? "border-[#8B16F7] shadow-lg shadow-[#8B16F7]/20 ring-2 ring-[#8B16F7]/30"
                  : "border-[#E3D9C6] hover:border-[#8B16F7]/50"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-sm">3. Warm Study Mode</span>
                {currentTheme === "warm" && (
                  <CheckCircle2 className="w-4 h-4 text-[#8B16F7]" />
                )}
              </div>
              <p className="text-xs text-[#5C5248] leading-relaxed">
                Parchment `#FBF8F1` background, warm typography, gentle for long study sessions.
              </p>
              <div className="mt-4 flex gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#FBF8F1] border border-[#CDC0A6]"></span>
                <span className="w-5 h-5 rounded-full bg-[#8B16F7]"></span>
                <span className="w-5 h-5 rounded-full bg-[#C42BEE]"></span>
                <span className="w-5 h-5 rounded-full bg-[#FF791E]"></span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto pt-8 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-secondary)]">
        <div>
          © 2026 <strong className="text-[var(--text-primary)]">CodexPetra</strong>. All rights reserved.
        </div>
        <div className="flex items-center gap-6">
          <span>Phase 1 Verification Complete</span>
          <span className="font-mono text-[#8B16F7]">gate.codexpetra.com</span>
        </div>
      </footer>
    </div>
  );
}
