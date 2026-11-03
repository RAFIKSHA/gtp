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
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { fetchSubjects, toggleTopicCompletion } from "@/lib/api/questions";
import type { SubjectItem, TopicItem } from "@/types/question";

export default function GuidedLearningPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [activeNotesTopic, setActiveNotesTopic] = useState<TopicItem | null>(null);

  useEffect(() => {
    async function loadSyllabus() {
      setLoading(true);
      try {
        const data = await fetchSubjects("CS");
        setSubjects(data);
        if (data.length > 0) {
          setExpandedSubject(data[0].slug);
        }
      } catch (err) {
        console.error("Failed to load syllabus:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSyllabus();
  }, []);

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
              Official GATE CSE Syllabus
            </Badge>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Follow the pedagogical sequence recommended for GATE Computer Science. Master concept notes and mark topics complete.
          </p>
        </div>

        <Link href="/subjects">
          <Button variant="secondary" size="sm" leftIcon={<BookOpen className="w-3.5 h-3.5" />}>
            Explore All Subjects
          </Button>
        </Link>
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
