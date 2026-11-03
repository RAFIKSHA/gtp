"use client";

import React, { useState } from "react";
import { Palette, Volume2, Sparkles, Check, Moon, Sun, BookOpen } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { useTheme, Theme } from "@/context/ThemeContext";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [animationsEnabled, setAnimationsEnabled] = useState<boolean>(true);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="pb-4 border-b border-[var(--border-subtle)]">
        <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
          Portal Settings
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Customize your appearance theme, examination preferences, and accessibility options.
        </p>
      </div>

      {/* Visual Theme Selection (All 3 Themes) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#8B16F7]/15 flex items-center justify-center text-[#8B16F7]">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>Appearance Theme</CardTitle>
              <CardDescription>
                Choose between three high-contrast study themes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Obsidian Black */}
            <div
              onClick={() => setTheme("obsidian")}
              className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                theme === "obsidian"
                  ? "border-[#8B16F7] shadow-lg ring-2 ring-[#8B16F7]/30 bg-[#09090D] text-white"
                  : "border-[var(--border-subtle)] bg-[#09090D] text-white opacity-80 hover:opacity-100"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">Obsidian Black</span>
                  {theme === "obsidian" && <Check className="w-4 h-4 text-[#C42BEE]" />}
                </div>
                <p className="text-[11px] text-zinc-400">
                  Near-black background `#09090D` with `#8B16F7` purple actions.
                </p>
              </div>
              <div className="mt-4 flex gap-1.5">
                <span className="w-4 h-4 rounded-full bg-[#09090D] border border-white/20"></span>
                <span className="w-4 h-4 rounded-full bg-[#8B16F7]"></span>
                <span className="w-4 h-4 rounded-full bg-[#C42BEE]"></span>
              </div>
            </div>

            {/* Crisp White */}
            <div
              onClick={() => setTheme("crisp")}
              className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                theme === "crisp"
                  ? "border-[#8B16F7] shadow-lg ring-2 ring-[#8B16F7]/30 bg-[#FFFFFF] text-[#111827]"
                  : "border-[var(--border-subtle)] bg-[#FFFFFF] text-[#111827] opacity-80 hover:opacity-100"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">Crisp White</span>
                  {theme === "crisp" && <Check className="w-4 h-4 text-[#8B16F7]" />}
                </div>
                <p className="text-[11px] text-zinc-600">
                  Pure white background with sharp, dark typography.
                </p>
              </div>
              <div className="mt-4 flex gap-1.5">
                <span className="w-4 h-4 rounded-full bg-[#FFFFFF] border border-zinc-300"></span>
                <span className="w-4 h-4 rounded-full bg-[#8B16F7]"></span>
                <span className="w-4 h-4 rounded-full bg-[#C42BEE]"></span>
              </div>
            </div>

            {/* Warm Study */}
            <div
              onClick={() => setTheme("warm")}
              className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                theme === "warm"
                  ? "border-[#8B16F7] shadow-lg ring-2 ring-[#8B16F7]/30 bg-[#FBF8F1] text-[#2A241F]"
                  : "border-[var(--border-subtle)] bg-[#FBF8F1] text-[#2A241F] opacity-80 hover:opacity-100"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">Warm Study Mode</span>
                  {theme === "warm" && <Check className="w-4 h-4 text-[#8B16F7]" />}
                </div>
                <p className="text-[11px] text-[#5C5248]">
                  Parchment cream `#FBF8F1` tone engineered for eye comfort.
                </p>
              </div>
              <div className="mt-4 flex gap-1.5">
                <span className="w-4 h-4 rounded-full bg-[#FBF8F1] border border-[#CDC0A6]"></span>
                <span className="w-4 h-4 rounded-full bg-[#8B16F7]"></span>
                <span className="w-4 h-4 rounded-full bg-[#C42BEE]"></span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility & Reduced Motion */}
      <Card>
        <CardHeader>
          <CardTitle>Accessibility & Animation</CardTitle>
          <CardDescription>
            Configure celebration effects and reduced motion preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
            <div>
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                Celebration Indicators
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                Display lightweight celebrations on correct answer submissions
              </p>
            </div>
            <input
              type="checkbox"
              checked={animationsEnabled}
              onChange={(e) => setAnimationsEnabled(e.target.checked)}
              className="w-4 h-4 accent-[#8B16F7]"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                Audio Feedback
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                Play subtle sound cues on exam timer warnings
              </p>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="w-4 h-4 accent-[#8B16F7]"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

