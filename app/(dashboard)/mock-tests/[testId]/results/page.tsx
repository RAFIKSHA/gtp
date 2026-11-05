"use client";

import React, { useState, useEffect, use, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BarChart3,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { MockTestResultResponse } from "@/types/mockTest";

interface ResultsPageProps {
  params: Promise<{
    testId: string;
  }>;
}

function ResultsContent({ testId }: { testId: string }) {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId");

  const [result, setResult] = useState<MockTestResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"All" | "Correct" | "Incorrect" | "Unattempted">("All");
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!attemptId) {
      setError("No attempt ID provided to retrieve results.");
      setLoading(false);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      try {
        const res = await fetch(`${API_BASE}/api/v1/mock-tests/attempts/${attemptId}/results/`);
        if (!res.ok) throw new Error("Could not load exam evaluation results from server");
        const data: MockTestResultResponse = await res.json();
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading results");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [attemptId]);

  const toggleSolution = (id: string) => {
    setExpandedSolutions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#8B16F7]" />
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          Retrieving official examination evaluation and mathematical solutions...
        </p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-center space-y-4 my-12">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Scorecard Unavailable</h2>
        <p className="text-xs text-[var(--text-secondary)]">{error}</p>
        <Link href="/mock-tests">
          <Button variant="secondary">Back to Mock Tests</Button>
        </Link>
      </div>
    );
  }

  const isQualified = result.score_obtained >= result.passing_marks;

  const filteredAnswers = result.answers.filter((ans) => {
    if (filterType === "All") return true;
    if (filterType === "Correct") return ans.is_correct;
    if (filterType === "Incorrect") return ans.is_answered && !ans.is_correct;
    if (filterType === "Unattempted") return !ans.is_answered;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <Link
            href="/mock-tests"
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Mock Tests
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
              Examination Performance Scorecard
            </h1>
            <Badge variant="purple" size="sm">
              {result.test_type}
            </Badge>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            {result.test_title} • Evaluated on server using official GATE marking scheme
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/mock-tests/${testId}`}>
            <Button variant="secondary" size="sm" leftIcon={<RotateCcw className="w-3.5 h-3.5" />}>
              Retake Exam
            </Button>
          </Link>
          <Link href="/analytics">
            <Button variant="primary" size="sm" leftIcon={<BarChart3 className="w-3.5 h-3.5" />}>
              View Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Score Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Score Obtained */}
        <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2 shadow-sm">
          <span className="text-xs text-[var(--text-muted)] font-medium">Score Obtained</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[var(--text-primary)] font-mono">
              {result.score_obtained}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              / {result.total_possible_marks}
            </span>
          </div>
          <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-muted)]">Cutoff: {result.passing_marks} M</span>
            <Badge variant={isQualified ? "success" : "warning"} size="sm">
              {isQualified ? "Cutoff Met" : "Below Cutoff"}
            </Badge>
          </div>
        </div>

        {/* Overall Accuracy */}
        <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2 shadow-sm">
          <span className="text-xs text-[var(--text-muted)] font-medium">Exam Accuracy</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#C42BEE] font-mono">
              {result.accuracy_percentage}%
            </span>
          </div>
          <div className="pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
            Based on {result.correct_count + result.incorrect_count} attempted questions
          </div>
        </div>

        {/* Question Breakdown Counts */}
        <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2 shadow-sm">
          <span className="text-xs text-[var(--text-muted)] font-medium">Questions Summary</span>
          <div className="flex items-center gap-3 text-sm font-mono pt-1">
            <span className="text-emerald-400 font-bold">{result.correct_count} Correct</span>
            <span className="text-rose-400 font-bold">{result.incorrect_count} Wrong</span>
            <span className="text-[var(--text-muted)]">{result.unattempted_count} Left</span>
          </div>
          <div className="pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
            Total {result.answers.length} Questions Evaluated
          </div>
        </div>

        {/* Time Spent */}
        <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2 shadow-sm">
          <span className="text-xs text-[var(--text-muted)] font-medium">Total Time Spent</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#FF791E] font-mono">
              {Math.floor(result.time_spent_seconds / 60)}m {result.time_spent_seconds % 60}s
            </span>
          </div>
          <div className="pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
            Allowed: {result.duration_minutes} Minutes
          </div>
        </div>
      </div>

      {/* Section / Subject-Wise Performance Breakdown */}
      {result.section_breakdown && result.section_breakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Subject-Wise Performance Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] uppercase tracking-wider font-mono text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4 text-center">Questions</th>
                    <th className="py-3 px-4 text-center">Attempted</th>
                    <th className="py-3 px-4 text-center">Correct</th>
                    <th className="py-3 px-4 text-center">Net Marks</th>
                    <th className="py-3 px-4 text-center">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {result.section_breakdown.map((sec, idx) => (
                    <tr key={idx} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[var(--text-primary)]">
                        {sec.subject}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-[var(--text-secondary)]">
                        {sec.total_questions}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-[var(--text-secondary)]">
                        {sec.attempted}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-emerald-400 font-bold">
                        {sec.correct}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-[var(--text-primary)]">
                        {sec.marks_awarded > 0 ? `+${sec.marks_awarded}` : sec.marks_awarded}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-mono font-bold ${
                            sec.accuracy >= 70
                              ? "text-emerald-400"
                              : sec.accuracy >= 40
                              ? "text-amber-400"
                              : "text-rose-400"
                          }`}
                        >
                          {sec.accuracy}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question-By-Question Detailed Solution Review */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Detailed Question Solutions & Proofs
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Review your answers alongside official answer keys and step-by-step mathematical explanations.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl self-start">
            {(["All", "Correct", "Incorrect", "Unattempted"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterType === t
                    ? "bg-gradient-to-r from-[#8B16F7] to-[#C42BEE] text-white shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Questions Accordion List */}
        <div className="space-y-4">
          {filteredAnswers.map((ans, idx) => {
            const isExpanded = expandedSolutions[ans.id] ?? true;

            return (
              <div
                key={ans.id}
                className={`rounded-3xl border transition-all overflow-hidden ${
                  ans.is_correct
                    ? "bg-emerald-500/5 border-emerald-500/25"
                    : ans.is_answered
                    ? "bg-rose-500/5 border-rose-500/25"
                    : "bg-[var(--bg-surface)] border-[var(--border-subtle)]"
                }`}
              >
                {/* Accordion Bar Header */}
                <div
                  onClick={() => toggleSolution(ans.id)}
                  className="p-5 cursor-pointer flex flex-wrap items-center justify-between gap-3 select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl font-mono text-xs font-bold flex items-center justify-center bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            ans.question_type === "MCQ"
                              ? "purple"
                              : ans.question_type === "MSQ"
                              ? "orange"
                              : "magenta"
                          }
                          size="sm"
                        >
                          {ans.question_type}
                        </Badge>
                        <span className="text-xs text-[var(--text-muted)]">
                          {ans.subject_name} • {ans.topic_name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {ans.is_correct ? (
                      <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Correct (+{ans.marks_awarded}M)
                      </span>
                    ) : ans.is_answered ? (
                      <span className="text-xs font-mono font-bold text-rose-400 flex items-center gap-1">
                        <XCircle className="w-4 h-4" /> Incorrect ({ans.marks_awarded}M)
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-[var(--text-muted)] flex items-center gap-1">
                        <HelpCircle className="w-4 h-4" /> Unattempted (0M)
                      </span>
                    )}

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                    )}
                  </div>
                </div>

                {/* Expanded Question & Mathematical Solution Content */}
                {isExpanded && (
                  <div className="p-6 pt-2 border-t border-[var(--border-subtle)]/50 space-y-5">
                    {/* Statement */}
                    <div className="text-sm text-[var(--text-primary)] whitespace-pre-line leading-relaxed font-sans">
                      {ans.statement}
                    </div>

                    {/* Options (for MCQ/MSQ) */}
                    {ans.options && ans.options.length > 0 && (
                      <div className="space-y-2">
                        {ans.options.map((opt, oIdx) => {
                          const isStudentSelected =
                            ans.question_type === "MCQ"
                              ? ans.selected_answer === oIdx
                              : Array.isArray(ans.selected_answer) && ans.selected_answer.includes(oIdx);

                          const isCorrectOption =
                            ans.question_type === "MCQ"
                              ? ans.correct_answer === oIdx
                              : Array.isArray(ans.correct_answer) && ans.correct_answer.includes(oIdx);

                          let optBorder = "border-[var(--border-subtle)] bg-[var(--bg-surface)]";
                          if (isCorrectOption) {
                            optBorder = "border-emerald-500 bg-emerald-500/10 text-emerald-300 font-medium";
                          } else if (isStudentSelected && !isCorrectOption) {
                            optBorder = "border-rose-500 bg-rose-500/10 text-rose-300 line-through";
                          }

                          return (
                            <div
                              key={oIdx}
                              className={`p-3 rounded-xl border text-xs flex items-center justify-between ${optBorder}`}
                            >
                              <span>{opt}</span>
                              {isCorrectOption && (
                                <Badge variant="success" size="sm">
                                  Correct Key
                                </Badge>
                              )}
                              {isStudentSelected && !isCorrectOption && (
                                <Badge variant="destructive" size="sm">
                                  Your Choice
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* NAT Answer Comparison */}
                    {ans.question_type === "NAT" && (
                      <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">Your Submitted Value:</span>
                          <span className="font-bold text-[var(--text-primary)]">
                            {ans.selected_answer ?? "None (Unanswered)"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">Accepted Range / Key:</span>
                          <span className="font-bold text-emerald-400">
                            {typeof ans.correct_answer === "object"
                              ? `${ans.correct_answer.min} to ${ans.correct_answer.max}`
                              : ans.correct_answer}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Step-by-Step Mathematical Explanation Proof */}
                    <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#8B16F7]">
                        <Sparkles className="w-4 h-4 text-[#C42BEE]" />
                        <span>Step-by-Step Concept & Mathematical Proof</span>
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] whitespace-pre-line leading-relaxed font-sans pt-1">
                        {ans.detailed_explanation}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function MockTestResultsPage({ params }: ResultsPageProps) {
  const resolvedParams = use(params);
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#8B16F7]" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">Loading scorecard...</p>
        </div>
      }
    >
      <ResultsContent testId={resolvedParams.testId} />
    </Suspense>
  );
}
