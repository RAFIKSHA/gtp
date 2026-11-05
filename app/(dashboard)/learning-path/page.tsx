"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  CheckCircle2,
  Lock,
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
  Loader2,
  GitBranch,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { fetchSubjects, fetchLearningBranches, toggleTopicCompletion, LearningBranch } from "@/lib/api/questions";
import { fetchStudentProfile } from "@/lib/api/student";
import type { SubjectItem, TopicItem } from "@/types/question";

export default function GuidedLearningPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [branches, setBranches] = useState<LearningBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("CSE");
  const [selectedPaper, setSelectedPaper] = useState<string>("CS");
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [activeNotesTopic, setActiveNotesTopic] = useState<TopicItem | null>(null);

  // 1. Initial Load: Profile & Branches
  useEffect(() => {
    async function initDiscipline() {
      try {
        const [profile, branchesList] = await Promise.all([
          fetchStudentProfile().catch(() => null),
          fetchLearningBranches().catch(() => []),
        ]);

        if (branchesList.length > 0) {
          setBranches(branchesList);
          // If student has enrolled branch or primary paper, select it
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
        console.error("Failed to initialize learning path:", err);
      }
    }
    initDiscipline();
  }, []);

  // 2. Fetch Syllabus Subjects when selectedBranch or selectedPaper changes
  useEffect(() => {
    async function loadSyllabus() {
      setLoading(true);
      try {
        const data = await fetchSubjects(selectedPaper, selectedBranch);
        setSubjects(data);
        if (data.length > 0) {
          setExpandedSubject(data[0].slug);
        } else {
          setExpandedSubject(null);
        }
      } catch (err) {
        console.error("Failed to load syllabus:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSyllabus();
  }, [selectedBranch, selectedPaper]);

  const handleToggleCompletion = async (topicId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await toggleTopicCompletion(topicId);
      setSubjects((prev) =>
        prev.map((subj) => ({
          ...subj,
          topics: subj.topics.map((top) =>
            top.id === topicId ? { ...top, is_completed: res.is_completed } : top
          ),
        }))
      );
    } catch (err) {
      console.error("Failed to toggle completion:", err);
    }
  };

  const activeBranchObj = branches.find((b) => b.code.toUpperCase() === selectedBranch.toUpperCase());

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
              Guided Learning Path
            </h1>
            <Badge variant="purple" size="sm">
              {activeBranchObj ? `${activeBranchObj.name} (${activeBranchObj.code})` : "GATE CSE Syllabus"}
            </Badge>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Follow the pedagogical sequence recommended for your academic branch. Master concept notes and mark topics complete.
          </p>
        </div>

        <Link href="/subjects">
          <Button variant="secondary" size="sm" leftIcon={<BookOpen className="w-3.5 h-3.5" />}>
            Explore All Subjects
          </Button>
        </Link>
      </div>

      {/* Dynamic Academic Discipline Selector Bar */}
      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[#8B16F7]">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
              Academic Branch
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                aria-label="Select Academic Branch"
                className="text-xs font-semibold bg-[var(--bg-surface-elevated)] border border-[var(--border-strong)] rounded-lg px-2.5 py-1 text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[#8B16F7]"
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
        </div>

        {/* Paper Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider mr-1">
            Target Paper:
          </span>
          {["CS", "DA"].map((paper) => (
            <button
              key={paper}
              onClick={() => setSelectedPaper(paper)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                selectedPaper === paper
                  ? "bg-[#8B16F7] text-white border-[#8B16F7] shadow-sm"
                  : "bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]"
              }`}
            >
              GATE {paper}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#8B16F7]" />
          <p className="text-xs text-[var(--text-secondary)]">Loading syllabus from database...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {subjects.map((subject, index) => {
            const isExpanded = expandedSubject === subject.slug;
            const completedCount = subject.topics.filter((t) => t.is_completed).length;

            return (
              <div
                key={subject.id}
                className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden transition-all shadow-sm"
              >
                {/* Subject Header Row */}
                <div
                  onClick={() => setExpandedSubject(isExpanded ? null : subject.slug)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-[var(--border-subtle)]/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#8B16F7]/12 flex items-center justify-center text-[#C42BEE] font-bold text-sm shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm md:text-base text-[var(--text-primary)]">
                          {subject.name}
                        </h3>
                        {index === 0 && (
                          <Badge variant="purple" size="sm">
                            Step 1
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-1">
                        {subject.description || `${subject.topics.length} Syllabus Topics`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-[var(--text-muted)] hidden sm:inline">
                      {completedCount} / {subject.topics.length} Complete
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                    )}
                  </div>
                </div>

                {/* Expanded Topics List */}
                {isExpanded && (
                  <div className="p-5 pt-0 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] space-y-3">
                    <div className="py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Syllabus Topics
                    </div>

                    {subject.topics.length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)] italic">
                        Topics will populate from database.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {subject.topics.map((topic, tIndex) => (
                          <div
                            key={topic.id}
                            className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[var(--accent-purple)]/40 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <button
                                onClick={(e) => handleToggleCompletion(topic.id, e)}
                                className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors border ${
                                  topic.is_completed
                                    ? "bg-emerald-500 border-emerald-500 text-white"
                                    : "border-[var(--border-strong)] text-transparent hover:border-emerald-500"
                                }`}
                                title={topic.is_completed ? "Completed" : "Mark as Completed"}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              <div>
                                <p className="text-xs font-semibold text-[var(--text-primary)]">
                                  {topic.name}
                                </p>
                                <span className="text-[10px] text-[var(--text-muted)]">
                                  {topic.questions_count} Practice Questions Available
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {topic.concept_notes && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setActiveNotesTopic(topic)}
                                  leftIcon={<FileText className="w-3.5 h-3.5 text-[#8B16F7]" />}
                                >
                                  Read Notes
                                </Button>
                              )}
                              <Link href={`/practice?subject=${subject.slug}&topic=${topic.slug}`}>
                                <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3 h-3" />}>
                                  Practice
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Concept Notes Modal Drawer */}
      {activeNotesTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[85vh] rounded-3xl bg-[var(--bg-surface-elevated)] border border-[var(--border-strong)] p-6 md:p-8 shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="font-bold text-base text-[var(--text-primary)]">
                  {activeNotesTopic.name}
                </h3>
                <span className="text-xs text-[var(--text-muted)]">Official Syllabus Notes</span>
              </div>
              <button
                onClick={() => setActiveNotesTopic(null)}
                className="p-1.5 rounded-lg hover:bg-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>

            <div className="py-5 overflow-y-auto max-h-[60vh] text-xs leading-relaxed text-[var(--text-primary)] whitespace-pre-line font-mono">
              {activeNotesTopic.concept_notes || "Concept notes for this topic are in preparation."}
            </div>

            <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">
                Press Esc or Close to return
              </span>
              <Button variant="primary" size="sm" onClick={() => setActiveNotesTopic(null)}>
                Close Notes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
