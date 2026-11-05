"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  CheckSquare,
  FileCheck2,
  Target,
  ArrowRight,
  Sparkles,
  BookOpen,
  AlertCircle,
  Award,
  Clock,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { AnalyticsDashboardResponse } from "@/types/analytics";

export default function StudentDashboardPage() {
  const [greeting, setGreeting] = useState<string>("Welcome");
  const [analytics, setAnalytics] = useState<AnalyticsDashboardResponse | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    fetch(`${API_BASE}/api/v1/analytics/dashboard/`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: AnalyticsDashboardResponse | null) => {
        if (data) setAnalytics(data);
      })
      .catch(() => {});
  }, []);

  const overview = analytics?.overview;
  const recommendations = analytics?.recommendations || [];
  const primaryRecommendation = recommendations[0];
  const weakTopics = recommendations.filter((r) => r.type === "weak_topic");
  const strongTopics = recommendations.filter((r) => r.type === "strength");

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-r from-[var(--bg-surface)] via-[var(--bg-surface-elevated)] to-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm">
        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#8B16F7]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <Badge variant="purple" size="sm">
                <Sparkles className="w-3 h-3 mr-1" />
                Target Exam: GATE {analytics?.primary_paper || "CSE"} {analytics?.target_year || 2026}
              </Badge>
              <Badge variant="outline" size="sm">
                Active Track
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              {greeting},{" "}
              <span className="bg-gradient-to-r from-[#8B16F7] to-[#C42BEE] bg-clip-text text-transparent">
                {analytics?.student_name || "Aspirant"}!
              </span>
            </h1>
            <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed">
              Your personalized GATE Computer Science preparation dashboard. Track your syllabus
              mastery, solve verified PYQs, and follow your intelligent learning path.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/learning-path">
              <Button variant="gradient" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Continue Learning
              </Button>
            </Link>
            <Link href="/practice">
              <Button variant="secondary">Practice Questions</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Top Metrics Grid (Live Telemetry from Supabase) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <StatCard
          label="Total Questions Attempted"
          value={overview ? overview.total_questions_attempted : 0}
          description="MCQ, MSQ & NAT submissions"
          icon={<CheckSquare className="w-4 h-4" />}
          emptyStateText="Solve practice questions to build your stats"
        />

        <StatCard
          label="Overall Accuracy"
          value={overview && overview.total_questions_attempted > 0 ? `${overview.accuracy_percentage}%` : "--"}
          description="Correct / Total evaluated"
          icon={<Target className="w-4 h-4" />}
          emptyStateText="Calculated after your first attempts"
        />

        <StatCard
          label="Syllabus Topics Completed"
          value={overview ? `${overview.completed_topics_count} / ${overview.total_topics_count}` : "0 / 24"}
          description="GATE CSE official syllabus"
          icon={<BookOpen className="w-4 h-4" />}
          emptyStateText="Start with Discrete Mathematics"
        />

        <StatCard
          label="Mock Tests Completed"
          value={overview ? overview.tests_completed_count : 0}
          description="Sectional & Full-length tests"
          icon={<FileCheck2 className="w-4 h-4" />}
          emptyStateText="Take your first diagnostic test"
        />
      </div>

      {/* Recommended Next Step & Preparation Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended Activity Card */}
        <div className="lg:col-span-2 p-6 md:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#8B16F7]/15 flex items-center justify-center text-[#8B16F7]">
                  <Compass className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-purple)]">
                  Recommended Study Activity
                </span>
              </div>
              <Badge variant="purple" size="sm">
                Adaptive Recommendation
              </Badge>
            </div>

            <h3 className="text-lg md:text-xl font-bold text-[var(--text-primary)]">
              {primaryRecommendation
                ? `${primaryRecommendation.subject_name}: ${primaryRecommendation.topic_name}`
                : "Discrete Mathematics: Propositional & First-Order Logic"}
            </h3>
            <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed">
              {primaryRecommendation
                ? primaryRecommendation.reason
                : "Foundational subject for GATE CSE. Master truth tables, logical equivalences, quantifiers, and inference rules with step-by-step notes and verified PYQs."}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
              <span className="flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-[#C42BEE]" />
                Est. ~45 mins
              </span>
              <span>•</span>
              <span>Verified GATE Question Set</span>
            </div>

            <Link href={primaryRecommendation ? `/practice?subject=${primaryRecommendation.subject_slug}` : "/learning-path"}>
              <Button size="sm" variant="primary" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Start This Topic
              </Button>
            </Link>
          </div>
        </div>

        {/* Preparation Progress Gauge */}
        <div className="p-6 md:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col items-center justify-center text-center space-y-4">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Overall Syllabus Completion
          </h3>

          <ProgressRing
            progress={overview ? overview.syllabus_progress_percentage : 0}
            size={140}
            strokeWidth={12}
            label={`${overview ? overview.syllabus_progress_percentage : 0}%`}
            subtitle="Mastery"
          />

          <p className="text-xs text-[var(--text-muted)] max-w-xs leading-relaxed">
            Progress is automatically calculated from topic notes studied and question accuracy.
          </p>
        </div>
      </div>

      {/* Weak & Strong Topics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weak Topics */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/15 flex items-center justify-center text-rose-500">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <CardTitle>Focus Areas (Weak Topics)</CardTitle>
              </div>
              <Badge variant={weakTopics.length > 0 ? "destructive" : "outline"} size="sm">
                {weakTopics.length} Flagged
              </Badge>
            </div>
            <CardDescription>
              Topics where your accuracy falls below 55% with multiple attempted questions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weakTopics.length > 0 ? (
              <div className="space-y-2.5">
                {weakTopics.map((wt) => (
                  <div
                    key={wt.topic_id}
                    className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{wt.topic_name}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">{wt.subject_name}</p>
                    </div>
                    <span className="font-mono font-bold text-rose-400">
                      {wt.accuracy}% acc
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 px-4 rounded-xl border border-dashed border-[var(--border-subtle)] text-center space-y-2">
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  No weak topics detected yet
                </p>
                <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto">
                  Once you solve practice sets and mock tests, topics needing extra review will automatically appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Strong Topics */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-500">
                  <Award className="w-4 h-4" />
                </div>
                <CardTitle>Mastered Areas (Strong Topics)</CardTitle>
              </div>
              <Badge variant={strongTopics.length > 0 ? "success" : "outline"} size="sm">
                {strongTopics.length} Mastered
              </Badge>
            </div>
            <CardDescription>
              Topics where you maintain consistently high accuracy across multiple sessions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {strongTopics.length > 0 ? (
              <div className="space-y-2.5">
                {strongTopics.map((st) => (
                  <div
                    key={st.topic_id}
                    className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{st.topic_name}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">{st.subject_name}</p>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">
                      {st.accuracy}% acc
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 px-4 rounded-xl border border-dashed border-[var(--border-subtle)] text-center space-y-2">
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  No strong topics recorded yet
                </p>
                <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto">
                  Demonstrate proficiency with accurate submissions to add subjects to your mastery list.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
