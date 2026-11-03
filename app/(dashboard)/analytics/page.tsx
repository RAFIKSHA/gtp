"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  AlertCircle,
  Award,
  CheckCircle2,
  Sparkles,
  BookOpen,
  ArrowRight,
  Clock,
  RotateCcw,
  ShieldCheck,
  Target,
  FileCheck2,
  Loader2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AnalyticsDashboardResponse } from "@/types/analytics";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/analytics/dashboard/");
      if (!res.ok) throw new Error("Failed to load analytics from server");
      const result: AnalyticsDashboardResponse = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error contacting analytics service");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#8B16F7]" />
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          Aggregating verified submissions and computing subject accuracy...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-center space-y-4 my-12">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Analytics Unavailable</h2>
        <p className="text-xs text-[var(--text-secondary)]">{error}</p>
        <Button variant="secondary" onClick={fetchAnalytics}>
          Retry
        </Button>
      </div>
    );
  }

  const { overview, subjects, recommendations, test_history } = data;
  const hasAttemptData = overview.total_questions_attempted > 0;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="pb-4 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
              Performance Analytics & Learning Insights
            </h1>
            <Badge variant="purple" size="sm">
              GATE {data.primary_paper} {data.target_year}
            </Badge>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Real performance telemetry derived from verified question attempts and full mock examination scores.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={fetchAnalytics}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
        >
          Refresh Data
        </Button>
      </div>

      {/* High-Level Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Accuracy */}
        <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3 shadow-sm hover:border-[#8B16F7]/50 transition-all">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-medium">True Question Accuracy</span>
            <div className="w-8 h-8 rounded-xl bg-[#8B16F7]/15 flex items-center justify-center text-[#8B16F7]">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[var(--text-primary)] font-mono">
              {hasAttemptData ? `${overview.accuracy_percentage}%` : "--"}
            </span>
          </div>
          <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)]">
            <div className="flex justify-between">
              <span>Attempts:</span>
              <span className="font-mono font-semibold text-[var(--text-primary)]">
                {overview.total_questions_attempted} questions
              </span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>Correct Answers:</span>
              <span className="font-mono font-bold">{overview.correct_count}</span>
            </div>
          </div>
        </div>

        {/* Negative Marking Impact */}
        <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3 shadow-sm hover:border-[#FF791E]/50 transition-all">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-medium">Negative Marks Penalty</span>
            <div className="w-8 h-8 rounded-xl bg-[#FF791E]/15 flex items-center justify-center text-[#FF791E]">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400 font-mono">
              -{overview.negative_marks_incurred}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">Marks</span>
          </div>
          <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)]">
            <div className="flex justify-between">
              <span>Incorrect MCQs:</span>
              <span className="font-mono font-bold text-rose-400">{overview.incorrect_count}</span>
            </div>
            <div className="flex justify-between text-[var(--text-muted)]">
              <span>MSQ/NAT Penalties:</span>
              <span className="font-mono">0.0 (Protected)</span>
            </div>
          </div>
        </div>

        {/* Mock Test Score Average */}
        <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3 shadow-sm hover:border-[#C42BEE]/50 transition-all">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-medium">Mock Test Average</span>
            <div className="w-8 h-8 rounded-xl bg-[#C42BEE]/15 flex items-center justify-center text-[#C42BEE]">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#C42BEE] font-mono">
              {overview.average_test_score !== null ? overview.average_test_score : "--"}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">M</span>
          </div>
          <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)]">
            <div className="flex justify-between">
              <span>Best Score:</span>
              <span className="font-mono font-bold text-emerald-400">
                {overview.best_test_score !== null ? `${overview.best_test_score} M` : "--"}
              </span>
            </div>
            <div className="flex justify-between text-[var(--text-muted)]">
              <span>Tests Completed:</span>
              <span className="font-mono">{overview.tests_completed_count}</span>
            </div>
          </div>
        </div>

        {/* Syllabus Coverage */}
        <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3 shadow-sm hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-medium">Syllabus Progress</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400 font-mono">
              {overview.syllabus_progress_percentage}%
            </span>
          </div>
          <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)]">
            <div className="flex justify-between">
              <span>Topics Mastered:</span>
              <span className="font-mono font-bold text-[var(--text-primary)]">
                {overview.completed_topics_count} / {overview.total_topics_count}
              </span>
            </div>
            <div className="w-full bg-[var(--bg-primary)] h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${overview.syllabus_progress_percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Recommendations Engine */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FF791E]" />
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Personalized Study & Revision Recommendations
            </h2>
          </div>
          <span className="text-xs text-[var(--text-muted)]">
            Rule-Based Adaptive Diagnostics
          </span>
        </div>

        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => {
              const isHigh = rec.priority === "High";
              const isStrength = rec.type === "strength";

              return (
                <div
                  key={rec.topic_id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                    isHigh
                      ? "bg-rose-500/5 border-rose-500/30 hover:border-rose-500/60"
                      : isStrength
                      ? "bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/60"
                      : "bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[#8B16F7]/40"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={isHigh ? "destructive" : isStrength ? "success" : "warning"}
                        size="sm"
                      >
                        {rec.badge}
                      </Badge>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                        Priority: {rec.priority}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-[var(--text-primary)]">
                      {rec.topic_name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      {rec.subject_name}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {rec.reason}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[var(--border-subtle)]/50 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      {rec.attempts > 0 ? `${rec.accuracy}% acc (${rec.attempts} attempts)` : "0 attempts"}
                    </span>
                    <Link href={`/practice?subject=${rec.subject_slug}`}>
                      <Button variant="secondary" size="sm" className="text-xs" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                        Practice Now
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-[var(--bg-surface)] border border-dashed border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)]">
            Complete additional practice questions to unlock personalized topic recommendations.
          </div>
        )}
      </div>

      {/* Subject-Wise Accuracy Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subject-Wise Accuracy & Performance Breakdown</CardTitle>
          <CardDescription>
            Live accuracy rates, question counts, and net marks scored across all 12 GATE CSE subjects.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] uppercase tracking-wider font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4 text-center">Topics</th>
                  <th className="py-3 px-4 text-center">Questions Attempted</th>
                  <th className="py-3 px-4 text-center">Correct</th>
                  <th className="py-3 px-4 text-center">Net Marks</th>
                  <th className="py-3 px-4 text-center">Accuracy</th>
                  <th className="py-3 px-4 text-center">Status Tag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {subjects.map((sub) => {
                  let badgeVariant: "default" | "success" | "destructive" | "warning" | "purple" = "default";
                  if (sub.status_tag === "Strong") badgeVariant = "success";
                  else if (sub.status_tag === "Needs Revision") badgeVariant = "destructive";
                  else if (sub.status_tag === "Developing") badgeVariant = "warning";
                  else if (sub.status_tag === "Moderate") badgeVariant = "purple";

                  return (
                    <tr key={sub.subject_id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[var(--text-primary)]">
                        {sub.subject_name}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-[var(--text-secondary)]">
                        {sub.total_topics}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-[var(--text-secondary)]">
                        {sub.questions_attempted}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-emerald-400 font-bold">
                        {sub.correct_count}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-[var(--text-primary)]">
                        {sub.net_marks > 0 ? `+${sub.net_marks}` : sub.net_marks}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        {sub.questions_attempted > 0 ? (
                          <span
                            className={
                              sub.accuracy_percentage >= 70
                                ? "text-emerald-400"
                                : sub.accuracy_percentage >= 40
                                ? "text-amber-400"
                                : "text-rose-400"
                            }
                          >
                            {sub.accuracy_percentage}%
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)]">--</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={badgeVariant} size="sm">
                          {sub.status_tag}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Mock Test Attempt History */}
      {test_history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Examination History</CardTitle>
            <CardDescription>
              Chronological log of full-length and sectional mock tests completed in the portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {test_history.map((th) => (
                <div
                  key={th.attempt_id}
                  className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[var(--text-primary)]">
                        {th.test_title}
                      </span>
                      <Badge variant="purple" size="sm">
                        {th.test_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] font-mono">
                      Completed: {th.completed_at ? new Date(th.completed_at).toLocaleDateString() : "Recent"} • Time: {Math.floor(th.time_spent_seconds / 60)}m
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-base font-extrabold font-mono text-[var(--text-primary)]">
                        {th.score_obtained} / {th.total_marks} M
                      </span>
                      <p className="text-[11px] font-mono text-emerald-400 font-semibold">
                        {th.accuracy_percentage}% Accuracy
                      </p>
                    </div>

                    <Link href={`/mock-tests/${th.test_id}/results?attemptId=${th.attempt_id}`}>
                      <Button variant="secondary" size="sm" className="text-xs">
                        Review Solutions
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
