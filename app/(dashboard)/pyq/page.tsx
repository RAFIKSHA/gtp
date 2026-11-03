"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  History,
  Calendar,
  Filter,
  Bookmark,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  fetchSubjects,
  fetchPracticeQuestions,
  submitQuestionAnswer,
  toggleQuestionBookmark,
} from "@/lib/api/questions";
import type { QuestionListItem, SubjectItem, EvaluationResult } from "@/types/question";

const PYQ_YEARS = [2024, 2023, 2022, 2021, 2020];

export default function PyqPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Filters
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("ALL");

  // Solvers state
  const [mcqAnswer, setMcqAnswer] = useState<number | null>(null);
  const [msqAnswer, setMsqAnswer] = useState<number[]>([]);
  const [natAnswer, setNatAnswer] = useState<string>("");
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const subs = await fetchSubjects("CS");
        setSubjects(subs);
      } catch (err) {
        console.error("Failed to load subjects:", err);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function loadPyqs() {
      setLoading(true);
      setEvaluation(null);
      resetInput();
      try {
        const data = await fetchPracticeQuestions({
          is_pyq: true,
          year: selectedYear,
          subject: selectedSubject || undefined,
          type: selectedType,
        });
        setQuestions(data);
        setCurrentIndex(0);
      } catch (err) {
        console.error("Failed to load PYQs:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPyqs();
  }, [selectedYear, selectedSubject, selectedType]);

  const resetInput = () => {
    setMcqAnswer(null);
    setMsqAnswer([]);
    setNatAnswer("");
  };

  const currentQuestion: QuestionListItem | undefined = questions[currentIndex];

  const toggleMsqOption = (index: number) => {
    if (evaluation) return;
    setMsqAnswer((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const triggerCelebration = () => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!prefersReducedMotion) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#8B16F7", "#C42BEE", "#FF791E", "#10B981"],
      });
    }
  };

  const handleSubmit = async () => {
    if (!currentQuestion) return;

    let payloadAnswer: any = null;
    if (currentQuestion.question_type === "MCQ") {
      if (mcqAnswer === null) return;
      payloadAnswer = mcqAnswer;
    } else if (currentQuestion.question_type === "MSQ") {
      if (msqAnswer.length === 0) return;
      payloadAnswer = msqAnswer;
    } else if (currentQuestion.question_type === "NAT") {
      if (!natAnswer.trim()) return;
      payloadAnswer = parseFloat(natAnswer);
    }

    setSubmitting(true);
    try {
      const result = await submitQuestionAnswer(currentQuestion.id, payloadAnswer, 35);
      setEvaluation(result);
      if (result.is_correct) triggerCelebration();
    } catch (err) {
      console.error("Failed to evaluate answer:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!currentQuestion) return;
    try {
      const res = await toggleQuestionBookmark(currentQuestion.id);
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === currentQuestion.id ? { ...q, is_bookmarked: res.is_bookmarked } : q
        )
      );
    } catch (err) {
      console.error("Failed to toggle bookmark:", err);
    }
  };

  const hasAnswerSelected =
    (currentQuestion?.question_type === "MCQ" && mcqAnswer !== null) ||
    (currentQuestion?.question_type === "MSQ" && msqAnswer.length > 0) ||
    (currentQuestion?.question_type === "NAT" && natAnswer.trim().length > 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
              Previous Year Questions (PYQs)
            </h1>
            <Badge variant="warning" size="sm">
              Official Archives
            </Badge>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Solve authentic official GATE Computer Science examination questions year by year with verified answer keys.
          </p>
        </div>
      </div>

      {/* Year Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedYear(undefined)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 border ${
            selectedYear === undefined
              ? "bg-[#8B16F7] text-white border-[#8B16F7] shadow-sm"
              : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[#8B16F7]"
          }`}
        >
          All Years
        </button>
        {PYQ_YEARS.map((yr) => (
          <button
            key={yr}
            onClick={() => setSelectedYear(yr)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 border ${
              selectedYear === yr
                ? "bg-[#8B16F7] text-white border-[#8B16F7] shadow-sm"
                : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[#8B16F7]"
            }`}
          >
            GATE {yr}
          </button>
        ))}
      </div>

      {/* Secondary Subject Filter */}
      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
          >
            <option value="ALL">All Types (MCQ, MSQ, NAT)</option>
            <option value="MCQ">MCQ</option>
            <option value="MSQ">MSQ</option>
            <option value="NAT">NAT</option>
          </select>
        </div>
      </div>

      {/* PYQ Question Card */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#8B16F7]" />
          <p className="text-xs text-[var(--text-secondary)]">Loading authentic GATE PYQs...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center space-y-3">
          <History className="w-12 h-12 text-[var(--text-muted)] mx-auto" />
          <h3 className="font-bold text-base text-[var(--text-primary)]">
            No official PYQs found for this filter selection
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            Try choosing &quot;All Years&quot; or resetting the subject filter.
          </p>
        </div>
      ) : currentQuestion ? (
        <div className="p-6 md:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="warning" size="sm">
                GATE {currentQuestion.pyq_year}
              </Badge>
              <Badge variant="purple" size="sm">
                {currentQuestion.subject_name}
              </Badge>
              <Badge variant="outline" size="sm">
                {currentQuestion.topic_name}
              </Badge>
              <Badge variant="orange" size="sm">
                {currentQuestion.question_type}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
              <span className="font-semibold text-emerald-500">
                +{currentQuestion.marks} Mark{currentQuestion.marks > 1 ? "s" : ""}
              </span>
              <span className="text-rose-500 font-medium">
                {currentQuestion.negative_mark > 0
                  ? `-${currentQuestion.negative_mark} Neg`
                  : "No Neg"}
              </span>
              <button
                onClick={handleBookmarkToggle}
                className={`p-1.5 rounded-lg transition-colors ${
                  currentQuestion.is_bookmarked
                    ? "text-[#FF791E] bg-[#FF791E]/15"
                    : "text-[var(--text-muted)] hover:text-[#FF791E] hover:bg-[var(--border-subtle)]"
                }`}
              >
                <Bookmark
                  className={`w-4 h-4 ${currentQuestion.is_bookmarked ? "fill-current" : ""}`}
                />
              </button>
            </div>
          </div>

          <div className="text-base md:text-lg font-medium text-[var(--text-primary)] leading-relaxed whitespace-pre-line font-sans">
            {currentQuestion.statement}
          </div>

          {/* MCQ Options */}
          {currentQuestion.question_type === "MCQ" && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((opt, index) => {
                const isSelected = mcqAnswer === index;
                const isCorrect = evaluation && evaluation.correct_answer === index;
                const isWrong = evaluation && isSelected && !evaluation.is_correct;

                return (
                  <div
                    key={index}
                    onClick={() => !evaluation && setMcqAnswer(index)}
                    className={`flex items-center gap-3.5 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      isCorrect
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-500 font-medium"
                        : isWrong
                        ? "bg-rose-500/10 border-rose-500 text-rose-500"
                        : isSelected
                        ? "bg-[#8B16F7]/12 border-[#8B16F7] text-[var(--text-primary)]"
                        : "bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-primary)]"
                    }`}
                  >
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs bg-[var(--border-subtle)]">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-sm font-mono">{opt}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* MSQ Options */}
          {currentQuestion.question_type === "MSQ" && currentQuestion.options && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--accent-magenta)] font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Multiple Select: One or more options may be correct.
              </p>
              {currentQuestion.options.map((opt, index) => {
                const isSelected = msqAnswer.includes(index);
                return (
                  <div
                    key={index}
                    onClick={() => toggleMsqOption(index)}
                    className={`flex items-center gap-3.5 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#C42BEE]/12 border-[#C42BEE] text-[var(--text-primary)]"
                        : "bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)] text-[var(--text-primary)]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="w-4 h-4 accent-[#C42BEE]"
                    />
                    <span className="text-sm font-mono">{opt}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* NAT Input */}
          {currentQuestion.question_type === "NAT" && (
            <div className="p-5 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] space-y-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                Enter numerical answer:
              </label>
              <input
                type="number"
                step="any"
                disabled={evaluation !== null}
                value={natAnswer}
                onChange={(e) => setNatAnswer(e.target.value)}
                placeholder="Numerical value"
                className="max-w-xs w-full px-4 py-2.5 rounded-xl text-sm font-mono bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentIndex === 0}
              onClick={() => {
                setCurrentIndex((prev) => Math.max(0, prev - 1));
                setEvaluation(null);
                resetInput();
              }}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Previous PYQ
            </Button>

            {!evaluation ? (
              <Button
                variant="primary"
                isLoading={submitting}
                disabled={!hasAnswerSelected}
                onClick={handleSubmit}
              >
                Submit Answer
              </Button>
            ) : (
              <Button
                variant="gradient"
                onClick={() => {
                  if (currentIndex < questions.length - 1) {
                    setCurrentIndex((prev) => prev + 1);
                    setEvaluation(null);
                    resetInput();
                  }
                }}
                disabled={currentIndex >= questions.length - 1}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Next PYQ
              </Button>
            )}
          </div>

          {/* Detailed Derivation */}
          {evaluation && (
            <div
              className={`p-6 rounded-2xl border space-y-4 animate-in fade-in duration-300 ${
                evaluation.is_correct
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-rose-500/10 border-rose-500/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">
                  {evaluation.is_correct ? "Correct! Well solved." : "Incorrect Solution."}
                </span>
                <Badge variant={evaluation.is_correct ? "success" : "destructive"} size="sm">
                  {evaluation.marks_awarded > 0
                    ? `+${evaluation.marks_awarded} Marks`
                    : `${evaluation.marks_awarded} Marks`}
                </Badge>
              </div>

              <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2 text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-line font-mono">
                <span className="font-bold text-sm text-[var(--accent-purple)] block font-sans">
                  Official GATE Solution Derivation:
                </span>
                {evaluation.detailed_explanation}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
