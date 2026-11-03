"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  CheckSquare,
  Filter,
  Bookmark,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  HelpCircle,
  BookOpen,
  Award,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import {
  fetchSubjects,
  fetchPracticeQuestions,
  submitQuestionAnswer,
  toggleQuestionBookmark,
} from "@/lib/api/questions";
import type { QuestionListItem, SubjectItem, EvaluationResult } from "@/types/question";

export default function PracticePage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");

  // Solver State for Current Question
  // MCQ: number (index), MSQ: number[] (indices), NAT: string
  const [mcqAnswer, setMcqAnswer] = useState<number | null>(null);
  const [msqAnswer, setMsqAnswer] = useState<number[]>([]);
  const [natAnswer, setNatAnswer] = useState<string>("");

  // Result State
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  // Load Subjects on mount
  useEffect(() => {
    async function loadSubjects() {
      try {
        const data = await fetchSubjects("CS");
        setSubjects(data);
      } catch (err) {
        console.error("Failed to load subjects:", err);
      }
    }
    loadSubjects();
  }, []);

  // Load Questions when filters change
  useEffect(() => {
    async function loadQuestions() {
      setLoading(true);
      setEvaluation(null);
      resetInput();
      try {
        const data = await fetchPracticeQuestions({
          subject: selectedSubject || undefined,
          topic: selectedTopic || undefined,
          type: selectedType,
          difficulty: selectedDifficulty,
        });
        setQuestions(data);
        setCurrentIndex(0);
      } catch (err) {
        console.error("Failed to load questions:", err);
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, [selectedSubject, selectedTopic, selectedType, selectedDifficulty]);

  const resetInput = () => {
    setMcqAnswer(null);
    setMsqAnswer([]);
    setNatAnswer("");
  };

  // Find currently selected subject object for dependent topic dropdown
  const activeSubjectObj = subjects.find((s) => s.slug === selectedSubject);

  const currentQuestion: QuestionListItem | undefined = questions[currentIndex];

  // Handle MSQ checkbox toggle
  const toggleMsqOption = (index: number) => {
    if (evaluation) return;
    setMsqAnswer((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Trigger celebration confetti respecting prefers-reduced-motion
  const triggerCelebration = () => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!prefersReducedMotion) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#8B16F7", "#C42BEE", "#FF791E", "#10B981"],
      });
    }
  };

  // Handle Answer Submission
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
      const result = await submitQuestionAnswer(currentQuestion.id, payloadAnswer, 30);
      setEvaluation(result);

      if (result.is_correct) {
        triggerCelebration();
      }
    } catch (err) {
      console.error("Failed to submit answer:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Bookmark Toggle
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
            Question Practice Module
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Solve curated MCQ, MSQ, and NAT questions with official GATE negative marking and instant evaluations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="purple" size="sm">
            Interactive Solver
          </Badge>
        </div>
      </div>

      {/* Dependent Filter Bar */}
      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Subject Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
            Subject
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setSelectedTopic(""); // Reset dependent topic
            }}
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

        {/* Dependent Topic Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
            Topic {activeSubjectObj ? `(${activeSubjectObj.topics.length})` : ""}
          </label>
          <select
            value={selectedTopic}
            disabled={!activeSubjectObj}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7] disabled:opacity-50"
          >
            <option value="">All Topics</option>
            {activeSubjectObj?.topics.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Question Type Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
            Question Type
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
          >
            <option value="ALL">All Formats</option>
            <option value="MCQ">MCQ (Single Choice)</option>
            <option value="MSQ">MSQ (Multi-Select)</option>
            <option value="NAT">NAT (Numerical)</option>
          </select>
        </div>

        {/* Difficulty Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
            Difficulty
          </label>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
          >
            <option value="ALL">All Levels</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Main Question Display */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#8B16F7]" />
          <p className="text-xs text-[var(--text-secondary)]">Loading practice questions from database...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center space-y-4">
          <HelpCircle className="w-12 h-12 text-[var(--text-muted)] mx-auto" />
          <h3 className="font-bold text-base text-[var(--text-primary)]">
            No questions match your selected filters
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
            Try adjusting your topic or question type filters to browse questions.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedSubject("");
              setSelectedTopic("");
              setSelectedType("ALL");
              setSelectedDifficulty("ALL");
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : currentQuestion ? (
        <div className="p-6 md:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm space-y-6">
          {/* Header Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="purple" size="sm">
                {currentQuestion.subject_name}
              </Badge>
              <Badge variant="outline" size="sm">
                {currentQuestion.topic_name}
              </Badge>
              <Badge
                variant={
                  currentQuestion.question_type === "MCQ"
                    ? "purple"
                    : currentQuestion.question_type === "MSQ"
                    ? "magenta"
                    : "orange"
                }
                size="sm"
              >
                {currentQuestion.question_type}
              </Badge>
              {currentQuestion.is_pyq && (
                <Badge variant="warning" size="sm">
                  GATE {currentQuestion.pyq_year}
                </Badge>
              )}
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
                title={currentQuestion.is_bookmarked ? "Remove Bookmark" : "Bookmark Question"}
              >
                <Bookmark
                  className={`w-4 h-4 ${currentQuestion.is_bookmarked ? "fill-current" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Question Index Progress */}
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>
              Question <strong className="text-[var(--text-primary)]">{currentIndex + 1}</strong> of{" "}
              {questions.length}
            </span>
            <span className="capitalize text-[11px] font-medium text-[var(--text-secondary)]">
              Difficulty: {currentQuestion.difficulty}
            </span>
          </div>

          {/* Statement */}
          <div className="text-base md:text-lg font-medium text-[var(--text-primary)] leading-relaxed whitespace-pre-line font-sans">
            {currentQuestion.statement}
          </div>

          {/* Solvers Based on Type */}
          {/* Format 1: MCQ (Single Select) */}
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
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isCorrect
                          ? "bg-emerald-500 text-white"
                          : isWrong
                          ? "bg-rose-500 text-white"
                          : isSelected
                          ? "bg-[#8B16F7] text-white"
                          : "bg-[var(--border-subtle)] text-[var(--text-secondary)]"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-sm font-mono">{opt}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Format 2: MSQ (Multiple Select) */}
          {currentQuestion.question_type === "MSQ" && currentQuestion.options && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--accent-magenta)] font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Multiple Select Question: One or more options may be correct.
              </p>
              {currentQuestion.options.map((opt, index) => {
                const isSelected = msqAnswer.includes(index);
                const isCorrectOption =
                  evaluation &&
                  Array.isArray(evaluation.correct_answer) &&
                  evaluation.correct_answer.includes(index);

                return (
                  <div
                    key={index}
                    onClick={() => toggleMsqOption(index)}
                    className={`flex items-center gap-3.5 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      isCorrectOption
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-500 font-medium"
                        : isSelected
                        ? "bg-[#C42BEE]/12 border-[#C42BEE] text-[var(--text-primary)]"
                        : "bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-primary)]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="w-4 h-4 accent-[#C42BEE] pointer-events-none"
                    />
                    <span className="w-6 h-6 rounded flex items-center justify-center font-bold text-xs bg-[var(--border-subtle)] text-[var(--text-secondary)]">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-sm font-mono">{opt}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Format 3: NAT (Numerical Answer Type) */}
          {currentQuestion.question_type === "NAT" && (
            <div className="p-5 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] space-y-3">
              <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                Enter your numerical answer (supports decimals):
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="any"
                  disabled={evaluation !== null}
                  value={natAnswer}
                  onChange={(e) => setNatAnswer(e.target.value)}
                  placeholder="e.g. 20 or 3.14"
                  className="max-w-xs w-full px-4 py-2.5 rounded-xl text-sm font-mono bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
                />
              </div>
            </div>
          )}

          {/* Actions & Submission Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
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
                Previous
              </Button>

              <Button
                variant="ghost"
                size="sm"
                disabled={!hasAnswerSelected || evaluation !== null}
                onClick={resetInput}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Clear
              </Button>
            </div>

            <div className="flex items-center gap-3">
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
                  {currentIndex < questions.length - 1 ? "Next Question" : "Set Completed"}
                </Button>
              )}
            </div>
          </div>

          {/* Instant Evaluation & Mathematical Derivation Drawer */}
          {evaluation && (
            <div
              className={`p-6 rounded-2xl border space-y-4 animate-in fade-in duration-300 ${
                evaluation.is_correct
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-rose-500/10 border-rose-500/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {evaluation.is_correct ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="font-bold text-sm text-emerald-500">
                        {evaluation.message}
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-rose-500" />
                      <span className="font-bold text-sm text-rose-500">
                        {evaluation.message}
                      </span>
                    </>
                  )}
                </div>

                <Badge variant={evaluation.is_correct ? "success" : "destructive"} size="sm">
                  {evaluation.marks_awarded > 0
                    ? `+${evaluation.marks_awarded} Marks`
                    : `${evaluation.marks_awarded} Marks`}
                </Badge>
              </div>

              {/* Step-by-Step Derivation */}
              <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2 text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-line font-mono">
                <span className="font-bold text-sm text-[var(--accent-purple)] block font-sans">
                  Detailed Mathematical Solution & Concept Proof:
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
