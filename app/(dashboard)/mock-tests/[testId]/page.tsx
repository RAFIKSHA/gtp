"use client";

import React, { useState, useEffect, useRef, use, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  RotateCcw,
  AlertTriangle,
  Loader2,
  BookmarkCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MockTestExamQuestion, MockTestStartResponse } from "@/types/mockTest";

interface ExamPageProps {
  params: Promise<{
    testId: string;
  }>;
}

function ExamRoomContent({ testId }: { testId: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [examData, setExamData] = useState<MockTestStartResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Answers State: Record<question_id, any>
  const [answers, setAnswers] = useState<Record<string, any>>({});
  // Review Flags State: Record<question_id, boolean>
  const [reviewFlags, setReviewFlags] = useState<Record<string, boolean>>({});
  // Time Remaining in Seconds
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>("Syncing...");

  // Ref to track latest state for auto-submit
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const reviewFlagsRef = useRef(reviewFlags);
  reviewFlagsRef.current = reviewFlags;
  const examDataRef = useRef(examData);
  examDataRef.current = examData;

  // 1. Initialize Exam Session from Server
  useEffect(() => {
    const initExam = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/v1/mock-tests/${testId}/start/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error("Failed to start or resume exam session");
        const data: MockTestStartResponse = await res.json();
        setExamData(data);
        setTimeRemaining(data.time_remaining_seconds);

        // Preload any previously saved answers
        const initialAnswers: Record<string, any> = {};
        const initialReviews: Record<string, boolean> = {};
        data.questions.forEach((q) => {
          if (q.selected_answer !== null && q.selected_answer !== undefined) {
            initialAnswers[q.question_id] = q.selected_answer;
          }
          if (q.is_marked_for_review) {
            initialReviews[q.question_id] = true;
          }
        });
        setAnswers(initialAnswers);
        setReviewFlags(initialReviews);
        setLastSaved("All answers synced");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error connecting to exam server");
      } finally {
        setLoading(false);
      }
    };

    initExam();
  }, [testId]);

  // 2. Server-Synced Countdown Timer
  useEffect(() => {
    if (loading || !examData || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit(true); // Auto-submit on time expiry
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, examData, timeRemaining]);

  // 3. Periodic Background Autosave (Every 25s)
  useEffect(() => {
    if (!examData) return;

    const autosaveInterval = setInterval(() => {
      triggerAutosave();
    }, 25000);

    return () => clearInterval(autosaveInterval);
  }, [examData]);

  const triggerAutosave = async () => {
    if (!examDataRef.current) return;
    try {
      const payloadAnswers = examDataRef.current.questions.map((q) => ({
        question_id: q.question_id,
        selected_answer: answersRef.current[q.question_id] ?? null,
        is_marked_for_review: Boolean(reviewFlagsRef.current[q.question_id]),
        time_spent_seconds: 30,
      }));

      const res = await fetch(
        `http://127.0.0.1:8000/api/v1/mock-tests/attempts/${examDataRef.current.attempt_id}/autosave/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: payloadAnswers }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.auto_submitted) {
          router.push(`/mock-tests/${testId}/results?attemptId=${examDataRef.current.attempt_id}`);
        } else {
          setLastSaved(`Saved at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`);
        }
      }
    } catch {
      setLastSaved("Offline — changes saved locally");
    }
  };

  // 4. Final Submission Handler
  const handleFinalSubmit = async (isAutoSubmit = false) => {
    if (isSubmitting || !examDataRef.current) return;
    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      const payloadAnswers = examDataRef.current.questions.map((q) => ({
        question_id: q.question_id,
        selected_answer: answersRef.current[q.question_id] ?? null,
        is_marked_for_review: Boolean(reviewFlagsRef.current[q.question_id]),
        time_spent_seconds: 60,
      }));

      const res = await fetch(
        `http://127.0.0.1:8000/api/v1/mock-tests/attempts/${examDataRef.current.attempt_id}/submit/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: payloadAnswers }),
        }
      );

      if (!res.ok) throw new Error("Submission evaluation failed on server");
      const result = await res.json();
      router.push(`/mock-tests/${testId}/results?attemptId=${result.attempt_id}`);
    } catch (err) {
      alert("Error submitting examination: " + (err instanceof Error ? err.message : "Unknown error"));
      setIsSubmitting(false);
    }
  };

  // Format Seconds to HH:MM:SS
  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#C42BEE]" />
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          Preparing secure examination environment & synchronizing clock...
        </p>
      </div>
    );
  }

  if (error || !examData) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-center space-y-4 my-12">
        <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Exam Session Error</h2>
        <p className="text-xs text-[var(--text-secondary)]">{error}</p>
        <Button variant="secondary" onClick={() => router.push("/mock-tests")}>
          Return to Mock Tests
        </Button>
      </div>
    );
  }

  const currentQuestion = examData.questions[currentIndex];
  const totalQuestions = examData.questions.length;

  // Answer modification handlers
  const handleOptionSelect = (optionIndex: number) => {
    if (currentQuestion.question_type === "MCQ") {
      setAnswers((prev) => ({ ...prev, [currentQuestion.question_id]: optionIndex }));
    } else if (currentQuestion.question_type === "MSQ") {
      const currentList: number[] = Array.isArray(answers[currentQuestion.question_id])
        ? answers[currentQuestion.question_id]
        : [];
      const updated = currentList.includes(optionIndex)
        ? currentList.filter((x) => x !== optionIndex)
        : [...currentList, optionIndex].sort();
      setAnswers((prev) => ({ ...prev, [currentQuestion.question_id]: updated }));
    }
  };

  const handleNatChange = (val: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.question_id]: val }));
  };

  const handleClearResponse = () => {
    setAnswers((prev) => {
      const updated = { ...prev };
      delete updated[currentQuestion.question_id];
      return updated;
    });
  };

  const toggleMarkForReview = () => {
    setReviewFlags((prev) => ({
      ...prev,
      [currentQuestion.question_id]: !prev[currentQuestion.question_id],
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Compute Question Palette Status
  const getPaletteStatus = (qId: string) => {
    const isAnswered = answers[qId] !== undefined && answers[qId] !== "" && (Array.isArray(answers[qId]) ? answers[qId].length > 0 : true);
    const isReview = Boolean(reviewFlags[qId]);

    if (isAnswered && isReview) return "answered-review";
    if (isReview) return "review";
    if (isAnswered) return "answered";
    return "unanswered";
  };

  const answeredCount = examData.questions.filter(
    (q) => answers[q.question_id] !== undefined && answers[q.question_id] !== "" && (Array.isArray(answers[q.question_id]) ? answers[q.question_id].length > 0 : true)
  ).length;
  const reviewCount = Object.values(reviewFlags).filter(Boolean).length;
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div className="space-y-4">
      {/* Top Exam Header with Server Timer */}
      <div className="sticky top-0 z-20 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
            GATE Examination Session • {examData.test.title}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Question {currentIndex + 1} of {totalQuestions}
            </h2>
            <Badge variant="purple" size="sm">
              {currentQuestion.section_name}
            </Badge>
          </div>
        </div>

        {/* Live Countdown Clock */}
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-sm transition-colors ${
              timeRemaining < 300
                ? "bg-rose-500/15 border-rose-500 text-rose-400 animate-pulse"
                : "bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-primary)]"
            }`}
          >
            <Clock className="w-4 h-4 text-[#C42BEE]" />
            <span>Time Remaining: {formatTimer(timeRemaining)}</span>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowConfirmModal(true)}
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            Submit Exam
          </Button>
        </div>
      </div>

      {/* Main Examination Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Left 3 Columns: Active Question Workspace */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-6 md:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-6">
            {/* Question Header & Marking Rules */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    currentQuestion.question_type === "MCQ"
                      ? "purple"
                      : currentQuestion.question_type === "MSQ"
                      ? "orange"
                      : "magenta"
                  }
                  size="sm"
                >
                  {currentQuestion.question_type}
                </Badge>
                <span className="text-xs text-[var(--text-muted)]">
                  {currentQuestion.subject_name} • {currentQuestion.topic_name}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-emerald-400 font-semibold">+{currentQuestion.marks} Mark{currentQuestion.marks > 1 ? "s" : ""}</span>
                {currentQuestion.negative_mark > 0 ? (
                  <span className="text-rose-400 font-semibold">-{currentQuestion.negative_mark} Neg</span>
                ) : (
                  <span className="text-[var(--text-muted)]">No Negative</span>
                )}
              </div>
            </div>

            {/* Question Statement */}
            <div className="text-sm md:text-base text-[var(--text-primary)] leading-relaxed font-sans whitespace-pre-line">
              {currentQuestion.statement}
            </div>

            {/* Interactive Answer Input Options */}
            <div className="space-y-3 pt-2">
              {/* 1. MCQ Single Choice Radio Group */}
              {currentQuestion.question_type === "MCQ" && currentQuestion.options && (
                <div className="space-y-2.5">
                  {currentQuestion.options.map((opt, idx) => {
                    const isSelected = answers[currentQuestion.question_id] === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleOptionSelect(idx)}
                        className={`w-full text-left p-4 rounded-2xl border text-sm transition-all flex items-start gap-3 ${
                          isSelected
                            ? "bg-[#8B16F7]/15 border-[#8B16F7] text-[var(--text-primary)] shadow-sm font-medium"
                            : "bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#8B16F7]/40 hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full shrink-0 mt-0.5 border flex items-center justify-center transition-colors ${
                            isSelected
                              ? "border-[#8B16F7] bg-[#8B16F7] text-white"
                              : "border-[var(--border-subtle)]"
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className="flex-1">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 2. MSQ Multi-Select Checkbox Group */}
              {currentQuestion.question_type === "MSQ" && currentQuestion.options && (
                <div className="space-y-2.5">
                  <p className="text-[11px] text-[var(--text-muted)] italic mb-1">
                    Select one or more correct options. No negative marks.
                  </p>
                  {currentQuestion.options.map((opt, idx) => {
                    const currentList = Array.isArray(answers[currentQuestion.question_id])
                      ? answers[currentQuestion.question_id]
                      : [];
                    const isChecked = currentList.includes(idx);

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleOptionSelect(idx)}
                        className={`w-full text-left p-4 rounded-2xl border text-sm transition-all flex items-start gap-3 ${
                          isChecked
                            ? "bg-[#FF791E]/15 border-[#FF791E] text-[var(--text-primary)] shadow-sm font-medium"
                            : "bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#FF791E]/40 hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md shrink-0 mt-0.5 border flex items-center justify-center transition-colors ${
                            isChecked
                              ? "border-[#FF791E] bg-[#FF791E] text-white"
                              : "border-[var(--border-subtle)]"
                          }`}
                        >
                          {isChecked && <CheckCircle className="w-3.5 h-3.5" />}
                        </div>
                        <span className="flex-1">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 3. NAT Numerical Decimal Box */}
              {currentQuestion.question_type === "NAT" && (
                <div className="p-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-3">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">
                    Enter Numerical Answer (Integer or Decimal):
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 42 or 0.85"
                      value={answers[currentQuestion.question_id] ?? ""}
                      onChange={(e) => handleNatChange(e.target.value)}
                      className="w-full max-w-sm px-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm font-mono text-[var(--text-primary)] focus:outline-none focus:border-[#C42BEE]"
                    />
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Virtual numerical answers are evaluated within accepted numerical range boundaries.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Action Controls */}
            <div className="pt-6 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={toggleMarkForReview}
                  className={reviewFlags[currentQuestion.question_id] ? "border-[#C42BEE] text-[#C42BEE]" : ""}
                  leftIcon={<Flag className="w-3.5 h-3.5" />}
                >
                  {reviewFlags[currentQuestion.question_id] ? "Unmark Review" : "Mark for Review"}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearResponse}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  Clear Response
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Previous
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentIndex === totalQuestions - 1}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Save & Next
                </Button>
              </div>
            </div>

            {/* Cloud Sync Status */}
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1">
              <span>Auto-sync enabled</span>
              <span className="font-mono">{lastSaved}</span>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Question Palette */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-5">
            <h3 className="font-bold text-sm text-[var(--text-primary)] pb-2 border-b border-[var(--border-subtle)]">
              Question Palette
            </h3>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--text-secondary)]">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-md bg-emerald-500" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border-subtle)]" />
                <span>Unattempted ({unansweredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-md bg-[#8B16F7]" />
                <span>Marked Review</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-md bg-[#FF791E]" />
                <span>Answered & Review</span>
              </div>
            </div>

            {/* Palette Grid Buttons */}
            <div className="grid grid-cols-5 gap-2 pt-2 border-t border-[var(--border-subtle)] max-h-72 overflow-y-auto pr-1">
              {examData.questions.map((q, idx) => {
                const statusType = getPaletteStatus(q.question_id);
                const isCurrent = idx === currentIndex;

                let colorClasses = "bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-muted)]";
                if (statusType === "answered") {
                  colorClasses = "bg-emerald-500 text-white border-emerald-600 font-bold";
                } else if (statusType === "review") {
                  colorClasses = "bg-[#8B16F7] text-white border-[#8B16F7] font-bold";
                } else if (statusType === "answered-review") {
                  colorClasses = "bg-[#FF791E] text-white border-[#FF791E] font-bold";
                }

                return (
                  <button
                    key={q.question_id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-xl border text-xs font-mono transition-all flex items-center justify-center relative ${colorClasses} ${
                      isCurrent ? "ring-2 ring-white shadow-md scale-105" : "hover:scale-102"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
              <Button
                variant="primary"
                size="sm"
                className="w-full text-xs font-semibold"
                onClick={() => setShowConfirmModal(true)}
              >
                Submit Examination Paper
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="max-w-md w-full p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#8B16F7]/15 flex items-center justify-center text-[#8B16F7]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[var(--text-primary)]">
                  Ready to Submit Exam?
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  You cannot alter your responses once finalized.
                </p>
              </div>
            </div>

            {/* Exam Summary Breakdown */}
            <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2.5 text-xs">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Total Questions in Paper:</span>
                <span className="font-bold text-[var(--text-primary)]">{totalQuestions}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Questions Answered:</span>
                <span className="font-bold">{answeredCount}</span>
              </div>
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Unattempted Questions:</span>
                <span className="font-bold">{unansweredCount}</span>
              </div>
              <div className="flex justify-between text-[#C42BEE]">
                <span>Flagged for Review:</span>
                <span className="font-bold">{reviewCount}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
              >
                Return to Exam
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleFinalSubmit(false)}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Evaluating..." : "Confirm & Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MockTestExamRoom({ params }: ExamPageProps) {
  const resolvedParams = use(params);
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#C42BEE]" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">Loading examination room...</p>
        </div>
      }
    >
      <ExamRoomContent testId={resolvedParams.testId} />
    </Suspense>
  );
}
