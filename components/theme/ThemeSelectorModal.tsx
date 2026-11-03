"use client";

import React, { useState } from "react";
import { Check, Palette, X } from "lucide-react";
import { useTheme, Theme } from "@/context/ThemeContext";

interface ThemeOption {
  id: Theme;
  name: string;
  subtitle: string;
  description: string;
  bgPreview: string;
  cardPreview: string;
  textPreview: string;
  accentColor: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "obsidian",
    name: "Obsidian Black",
    subtitle: "Brand Dark Mode",
    description: "Deep near-black background, dark surfaces, high-contrast white text with vibrant purple actions.",
    bgPreview: "#09090D",
    cardPreview: "#12131A",
    textPreview: "#FFFFFF",
    accentColor: "#8B16F7",
  },
  {
    id: "crisp",
    name: "Crisp White",
    subtitle: "High-Clarity Light Mode",
    description: "Clean pure white canvas, soft borders, crisp dark typography, and vivid purple accents.",
    bgPreview: "#FFFFFF",
    cardPreview: "#F8FAFC",
    textPreview: "#111827",
    accentColor: "#8B16F7",
  },
  {
    id: "warm",
    name: "Warm Study Mode",
    subtitle: "Eye-Comfort Paper Tone",
    description: "Parchment cream background, beige study cards, and warm typography designed for long reading sessions.",
    bgPreview: "#FBF8F1",
    cardPreview: "#F2ECE0",
    textPreview: "#2A241F",
    accentColor: "#8B16F7",
  },
];

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThemeSelectorModal({ isOpen, onClose }: ThemeSelectorModalProps) {
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-strong)] p-6 md:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#8B16F7]/15 flex items-center justify-center text-[#C42BEE]">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Select Visual Theme
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Personalize your study atmosphere across all devices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Visual Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          {THEME_OPTIONS.map((item) => {
            const isSelected = theme === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setTheme(item.id)}
                className={`relative cursor-pointer rounded-xl p-4 transition-all border-2 text-left flex flex-col justify-between ${
                  isSelected
                    ? "border-[#8B16F7] shadow-lg ring-2 ring-[#8B16F7]/30"
                    : "border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
                }`}
                style={{ backgroundColor: item.bgPreview }}
              >
                {/* Checkmark Badge */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#8B16F7] text-white flex items-center justify-center shadow-md">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                <div>
                  {/* Miniature Visual Layout Mockup */}
                  <div
                    className="w-full h-20 rounded-lg p-2.5 mb-3 flex flex-col justify-between border"
                    style={{
                      backgroundColor: item.cardPreview,
                      borderColor: isSelected ? "#8B16F7" : "rgba(128,128,128,0.2)",
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.accentColor }}
                      ></div>
                      <div
                        className="h-2 w-12 rounded"
                        style={{ backgroundColor: item.textPreview, opacity: 0.8 }}
                      ></div>
                    </div>
                    <div className="space-y-1">
                      <div
                        className="h-1.5 w-full rounded"
                        style={{ backgroundColor: item.textPreview, opacity: 0.3 }}
                      ></div>
                      <div
                        className="h-1.5 w-3/4 rounded"
                        style={{ backgroundColor: item.textPreview, opacity: 0.3 }}
                      ></div>
                    </div>
                    <div
                      className="h-3 w-14 rounded-md text-[8px] flex items-center justify-center font-bold text-white"
                      style={{ backgroundColor: item.accentColor }}
                    >
                      Action
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <h3
                    className="font-bold text-sm"
                    style={{ color: item.textPreview }}
                  >
                    {item.name}
                  </h3>
                  <p
                    className="text-[11px] font-medium opacity-70 mb-2"
                    style={{ color: item.textPreview }}
                  >
                    {item.subtitle}
                  </p>
                  <p
                    className="text-[11px] leading-relaxed opacity-60"
                    style={{ color: item.textPreview }}
                  >
                    {item.description}
                  </p>
                </div>

                {/* Color swatches */}
                <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10 flex items-center gap-1.5">
                  <span
                    className="w-4 h-4 rounded-full border border-black/15 shadow-inner"
                    style={{ backgroundColor: item.bgPreview }}
                  ></span>
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.accentColor }}
                  ></span>
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: "#C42BEE" }}
                  ></span>
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: "#FF791E" }}
                  ></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
          <p className="text-xs text-[var(--text-muted)]">
            Selection is saved automatically to your device.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-[#8B16F7] to-[#C42BEE] text-white hover:opacity-95 shadow-md shadow-[#8B16F7]/20 transition-all"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}

