"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, Award, FileText, ArrowRight, CheckCircle2, RotateCcw, AlertCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { MockTestItem } from "@/types/mockTest";

export default function MockTestsPage() {
  const [tests, setTests] = useState<MockTestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("All");

  const fetchMockTests = async () => {
    setLoading(true);
    setError(null);
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    try {
      const res = await fetch(`${API_BASE}/api/v1/mock-tests/`);
      if (!res.ok) throw new Error("Failed to load mock tests from server");
      const data: MockTestItem[] = await res.json();
      setTests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reach exam server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMockTests();
  }, []);

  const filteredTests = tests.filter((t) => {
    if (selectedFilter === "All") return true;
    return t.test_type === selectedFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="pb-4 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
              GATE Mock Examination Series
            </h1>
            <Badge variant="purple" size="sm">
              Live Simulation
            </Badge>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Official All-India standard mock tests and sectional papers with server-timed countdown, palette navigation, and instant evaluation.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl self-start sm:self-auto">
          {["All", "Full-Length", "Sectional"].map((f) => (
            <button
              key={f}
              onClick={() => setSelectedFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedFilter === f
                  ? "bg-gradient-to-r from-[#8B16F7] to-[#C42BEE] text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] animate-pulse space-y-4"
            >
              <div className="h-5 w-24 bg-[var(--border-subtle)] rounded-md" />
              <div className="h-6 w-3/4 bg-[var(--border-subtle)] rounded-md" />
              <div className="h-20 bg-[var(--border-subtle)] rounded-xl" />
              <div className="h-10 bg-[var(--border-subtle)] rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Error Fallback */}
      {error && !loading && (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchMockTests}>
            Retry Connection
          </Button>
        </div>
      )}

      {/* Tests Grid */}
      {!loading && !error && filteredTests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTests.map((test) => {
            const hasCompleted = test.student_attempt?.status === "submitted" || test.student_attempt?.status === "auto_submitted";
            const inProgress = test.student_attempt?.status === "in_progress";

            return (
              <div
                key={test.id}
                className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#8B16F7]/50 transition-all flex flex-col justify-between space-y-5 shadow-sm group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={test.test_type === "Full-Length" ? "purple" : "orange"} size="sm">
                      {test.test_type}
                    </Badge>
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      GATE {test.paper_code}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-[var(--text-primary)] group-hover:text-[#C42BEE] transition-colors leading-snug">
                    {test.title}
                  </h3>
                </div>

                {/* Exam Details Specs */}
                <div className="space-y-2 pt-3 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#C42BEE]" />
                      Duration
                    </span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {test.duration_minutes} Minutes
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-[#FF791E]" />
                      Total Marks
                    </span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {test.total_marks} Marks
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      Questions
                    </span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {test.total_questions} Questions
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Cutoff Score</span>
                    <span className="font-mono text-emerald-400 font-medium">
                      {test.passing_marks} M
                    </span>
                  </div>
                </div>

                {/* Attempt Status Banner */}
                {hasCompleted && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between text-emerald-400">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="font-medium">Completed</span>
                    </div>
                    <span className="font-mono font-bold">
                      {test.student_attempt?.score_obtained} / {test.total_marks} ({test.student_attempt?.accuracy_percentage}%)
                    </span>
                  </div>
                )}

                {inProgress && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between text-amber-400">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span className="font-medium">Active Session In Progress</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2 pt-1">
                  {hasCompleted ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/mock-tests/${test.id}/results?attemptId=${test.student_attempt?.attempt_id}`}
                        className="w-full"
                      >
                        <Button variant="secondary" size="sm" className="w-full text-xs">
                          View Analysis
                        </Button>
                      </Link>
                      <Link href={`/mock-tests/${test.id}`} className="w-full">
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full text-xs"
                          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                        >
                          Retake
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <Link href={`/mock-tests/${test.id}`} className="block w-full">
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        {inProgress ? "Resume Examination" : "Start Examination"}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredTests.length === 0 && (
        <div className="py-16 text-center text-xs text-[var(--text-muted)] space-y-3 border border-dashed border-[var(--border-subtle)] rounded-3xl bg-[var(--bg-surface)]">
          <FileText className="w-8 h-8 mx-auto text-[var(--text-muted)]" />
          <p className="font-semibold text-sm text-[var(--text-primary)]">
            No tests found in this category
          </p>
          <p className="max-w-xs mx-auto">
            Try switching filter tabs or check back as new examination papers are published.
          </p>
        </div>
      )}
    </div>
  );
}
