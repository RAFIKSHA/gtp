"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, ArrowRight, Loader2, Sparkles, GitBranch } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { fetchSubjects, fetchLearningBranches, LearningBranch } from "@/lib/api/questions";
import { fetchStudentProfile } from "@/lib/api/student";
import type { SubjectItem } from "@/types/question";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [branches, setBranches] = useState<LearningBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("CSE");
  const [selectedPaper, setSelectedPaper] = useState<string>("CS");
  const [loading, setLoading] = useState<boolean>(true);

  // Initial load
  useEffect(() => {
    async function init() {
      try {
        const [profile, branchesList] = await Promise.all([
          fetchStudentProfile().catch(() => null),
          fetchLearningBranches().catch(() => []),
        ]);

        if (branchesList.length > 0) {
          setBranches(branchesList);
          if (profile?.enrolled_branch_code) {
            setSelectedBranch(profile.enrolled_branch_code);
          } else if (branchesList[0]) {
            setSelectedBranch(branchesList[0].code);
          }
        }

        if (profile?.primary_paper) {
          setSelectedPaper(profile.primary_paper);
        }
      } catch (err) {
        console.error("Failed to init subjects page:", err);
      }
    }
    init();
  }, []);

  // Fetch subjects whenever selectedBranch or selectedPaper changes
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await fetchSubjects(selectedPaper, selectedBranch);
        setSubjects(data);
      } catch (err) {
        console.error("Failed to load subjects:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedBranch, selectedPaper]);

  const activeBranchObj = branches.find((b) => b.code.toUpperCase() === selectedBranch.toUpperCase());

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="pb-4 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
              Explore All Subjects
            </h1>
            <Badge variant="purple" size="sm">
              {activeBranchObj ? `${activeBranchObj.name} (${activeBranchObj.code})` : "GATE CSE"}
            </Badge>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Choose any subject freely to access official syllabus topics, concept formulas, and targeted practice sets.
          </p>
        </div>

        {/* Academic Branch Selector Dropdown */}
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-[#8B16F7]" />
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            aria-label="Filter subjects by Branch"
            className="text-xs font-semibold bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[#8B16F7]"
          >
            {branches.length === 0 ? (
              <option value="CSE">Computer Science & Engineering (CSE)</option>
            ) : (
              branches.map((b) => (
                <option key={b.id} value={b.code}>
                  {b.name} ({b.code})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#8B16F7]" />
          <p className="text-xs text-[var(--text-secondary)]">Loading subjects from database...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((subj, idx) => (
            <div
              key={subj.id}
              className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#8B16F7]/50 transition-all flex flex-col justify-between space-y-5 shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#8B16F7] uppercase tracking-wider">
                    SECTION {idx + 1} OF 12
                  </span>
                  <Badge variant="outline" size="sm">
                    {subj.topics_count} Topics
                  </Badge>
                </div>

                <h3 className="font-bold text-base md:text-lg text-[var(--text-primary)]">
                  {subj.name}
                </h3>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                  {subj.description || "Core GATE Computer Science examination syllabus topic."}
                </p>
              </div>

              <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <Link href={`/practice?subject=${subj.slug}`}>
                  <Button variant="secondary" size="sm">
                    Practice Questions
                  </Button>
                </Link>

                <Link href="/learning-path">
                  <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Syllabus
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
