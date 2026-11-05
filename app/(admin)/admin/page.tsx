"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  GitBranch,
  Link2,
  BookOpen,
  PlusCircle,
  FileCheck2,
  Users,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  Edit3,
  HelpCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  Search,
  Filter,
  X,
  Loader2,
  Send,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import BranchManagement, { AdminBranchItem } from "@/components/admin/BranchManagement";
import GatePaperMapping, { BranchGateMappingItem, GatePaperItem } from "@/components/admin/GatePaperMapping";
import SubjectManagement from "@/components/admin/SubjectManagement";

interface AdminOverviewData {
  metrics: {
    total_students: number;
    active_students: number;
    total_branches?: number;
    total_subjects: number;
    total_topics: number;
    total_questions: number;
    total_pyqs: number;
    published_tests: number;
    total_test_attempts: number;
  };
  recent_activity: {
    id: string;
    student_name: string;
    subject_name: string;
    question_type: string;
    is_correct: boolean;
    marks_awarded: number;
    timestamp: string;
  }[];
}

interface AdminQuestionItem {
  id: string;
  topic: number;
  topic_name: string;
  subject_name: string;
  question_type: "MCQ" | "MSQ" | "NAT";
  statement: string;
  options: string[] | null;
  correct_answer: any;
  detailed_explanation: string;
  marks: number;
  negative_mark: number;
  is_pyq: boolean;
  pyq_year: number | null;
  difficulty: string;
}

interface AdminSubjectItem {
  id: number;
  name: string;
  slug: string;
  paper_code: string;
  order_index: number;
  topics_count: number;
}

interface AdminStudentItem {
  id: string;
  full_name: string;
  email: string;
  target_gate_year: number;
  paper_code: string;
  qualification: string;
  academic_year: string;
  is_onboarded: boolean;
  attempts_count: number;
  tests_completed: number;
  average_accuracy: number;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "branches" | "mappings" | "subjects" | "questions" | "students">("overview");
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [branches, setBranches] = useState<AdminBranchItem[]>([]);
  const [mappings, setMappings] = useState<BranchGateMappingItem[]>([]);
  const [gatePapers, setGatePapers] = useState<GatePaperItem[]>([]);
  const [questions, setQuestions] = useState<AdminQuestionItem[]>([]);
  const [subjects, setSubjects] = useState<AdminSubjectItem[]>([]);
  const [students, setStudents] = useState<AdminStudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & filter in Question Bank
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("All");

  // New Question Modal State
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  const [newQType, setNewQType] = useState<"MCQ" | "MSQ" | "NAT">("MCQ");
  const [newTopicId, setNewTopicId] = useState<number>(1);
  const [newStatement, setNewStatement] = useState("");
  const [newOptions, setNewOptions] = useState<string[]>(["Option A", "Option B", "Option C", "Option D"]);
  const [newCorrectMcq, setNewCorrectMcq] = useState<number>(0);
  const [newCorrectMsq, setNewCorrectMsq] = useState<number[]>([0]);
  const [newCorrectNat, setNewCorrectNat] = useState<string>("");
  const [newExplanation, setNewExplanation] = useState("");
  const [newMarks, setNewMarks] = useState<number>(1);
  const [newDifficulty, setNewDifficulty] = useState<string>("Medium");
  const [newIsPyq, setNewIsPyq] = useState<boolean>(false);
  const [newPyqYear, setNewPyqYear] = useState<number>(2024);

  // Base API URL
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  // Headers for role-protected admin requests
  const adminHeaders = {
    "Content-Type": "application/json",
    "X-Admin-Role": "true",
  };

  const loadAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch overview
      const ovRes = await fetch(`${API_BASE}/api/v1/admin/overview/`, { headers: adminHeaders });
      if (!ovRes.ok) {
        const errBody = await ovRes.text().catch(() => "");
        throw new Error(`Admin auth error (${ovRes.status}): ${errBody || "Could not authenticate administrative session"}`);
      }
      const ovData = await ovRes.json();
      setOverview(ovData);

      // 1B. Fetch branches (Stage 2)
      const branchRes = await fetch(`${API_BASE}/api/v1/admin/branches/`, { headers: adminHeaders });
      if (branchRes.ok) setBranches(await branchRes.json());

      // 1C. Fetch GATE Papers and Mappings (Stage 2)
      const paperRes = await fetch(`${API_BASE}/api/v1/admin/gate-papers/`, { headers: adminHeaders });
      if (paperRes.ok) setGatePapers(await paperRes.json());

      const mapRes = await fetch(`${API_BASE}/api/v1/admin/branch-gate-mappings/`, { headers: adminHeaders });
      if (mapRes.ok) setMappings(await mapRes.json());

      // 2. Fetch questions
      const qRes = await fetch(`${API_BASE}/api/v1/admin/questions/`, { headers: adminHeaders });
      if (qRes.ok) setQuestions(await qRes.json());

      // 3. Fetch subjects
      const subRes = await fetch(`${API_BASE}/api/v1/admin/subjects/`, { headers: adminHeaders });
      if (subRes.ok) setSubjects(await subRes.json());

      // 4. Fetch students
      const studRes = await fetch(`${API_BASE}/api/v1/admin/students/`, { headers: adminHeaders });
      if (studRes.ok) setStudents(await studRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading admin console");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Handle Question Creation
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatement.trim()) return alert("Please enter the question statement.");

    setIsCreatingQuestion(true);
    try {
      let correctAnswerKey: any = newCorrectMcq;
      let negativeMarkVal = 0.33;

      if (newQType === "MCQ") {
        correctAnswerKey = newCorrectMcq;
        negativeMarkVal = newMarks === 1 ? 0.33 : 0.66;
      } else if (newQType === "MSQ") {
        correctAnswerKey = newCorrectMsq;
        negativeMarkVal = 0.0;
      } else if (newQType === "NAT") {
        correctAnswerKey = parseFloat(newCorrectNat) || 0.0;
        negativeMarkVal = 0.0;
      }

      const payload = {
        topic: newTopicId,
        question_type: newQType,
        statement: newStatement,
        options: newQType === "NAT" ? null : newOptions,
        correct_answer: correctAnswerKey,
        detailed_explanation: newExplanation || "Standard concept proof and mathematical derivation.",
        marks: newMarks,
        negative_mark: negativeMarkVal,
        difficulty: newDifficulty,
        is_pyq: newIsPyq,
        pyq_year: newIsPyq ? newPyqYear : null,
      };

      const res = await fetch(`${API_BASE}/api/v1/admin/questions/`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(JSON.stringify(errJson));
      }

      setShowQuestionModal(false);
      setNewStatement("");
      setNewExplanation("");
      await loadAdminData(); // Refresh table
      alert("Question successfully published to question bank!");
    } catch (err) {
      alert("Failed to create question: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsCreatingQuestion(false);
    }
  };

  // Handle Question Delete
  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/questions/${questionId}/`, {
        method: "DELETE",
        headers: adminHeaders,
      });
      if (res.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      } else {
        alert("Failed to delete question");
      }
    } catch {
      alert("Error deleting question");
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.statement.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subject_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "All" || q.question_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-6 md:p-12 space-y-8">
      {/* Top Header */}
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Student Portal
            </Link>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              CodexPetra GATE Administration
            </h1>
            <Badge variant="warning" size="sm">
              Role: Admin
            </Badge>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Manage question banks, verify official PYQs, author mock tests, and monitor student telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="http://127.0.0.1:8000/admin/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Shield className="w-3.5 h-3.5 text-amber-500" />}
            >
              Django Superuser Console
            </Button>
          </a>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowQuestionModal(true)}
            leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
          >
            Author New Question
          </Button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="max-w-6xl mx-auto flex items-center gap-2 p-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl overflow-x-auto">
        {[
          { id: "overview", label: "Overview & Telemetry", icon: Shield },
          { id: "branches", label: "Branch Management", icon: GitBranch },
          { id: "mappings", label: "GATE Paper Mapping", icon: Link2 },
          { id: "subjects", label: "Subject Management", icon: BookOpen },
          { id: "questions", label: "Question Bank & PYQs", icon: Layers },
          { id: "students", label: "Registered Students", icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-gradient-to-r from-[#8B16F7] to-[#C42BEE] text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#8B16F7]" />
          <p className="text-xs text-[var(--text-muted)]">Loading administrative telemetry...</p>
        </div>
      )}

      {error && !loading && (
        <div className="max-w-6xl mx-auto p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={loadAdminData}>
            Retry
          </Button>
        </div>
      )}

      {/* TAB 1: OVERVIEW */}
      {!loading && !error && activeTab === "overview" && overview && (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Operational Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
              <span className="text-[11px] text-[var(--text-muted)] font-medium">Academic Branches</span>
              <p className="text-2xl font-extrabold text-blue-400 font-mono">
                {overview.metrics.total_branches ?? branches.length}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] font-mono">
                {branches.filter((b) => b.is_published).length} published to LMS
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
              <span className="text-[11px] text-[var(--text-muted)] font-medium">Registered Students</span>
              <p className="text-2xl font-extrabold text-[var(--text-primary)] font-mono">
                {overview.metrics.total_students}
              </p>
              <p className="text-[10px] text-emerald-400 font-mono">
                {overview.metrics.active_students} actively preparing
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
              <span className="text-[11px] text-[var(--text-muted)] font-medium">Question Bank</span>
              <p className="text-2xl font-extrabold text-[#8B16F7] font-mono">
                {overview.metrics.total_questions}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] font-mono">
                {overview.metrics.total_pyqs} official PYQs
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
              <span className="text-[11px] text-[var(--text-muted)] font-medium">Mock Test Papers</span>
              <p className="text-2xl font-extrabold text-[#C42BEE] font-mono">
                {overview.metrics.published_tests}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] font-mono">
                {overview.metrics.total_test_attempts} exam sessions
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-[var(--text-muted)] font-medium">Curriculum Scope</span>
              <p className="text-2xl font-extrabold text-emerald-400 font-mono">
                {overview.metrics.total_subjects} Subjects
              </p>
              <p className="text-[10px] text-[var(--text-muted)] font-mono">
                {overview.metrics.total_topics} syllabus topics
              </p>
            </div>
          </div>

          {/* Recent Platform Activity Stream */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Student Activity Log</CardTitle>
              <CardDescription>Live examination and question submission attempts across the portal.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] uppercase tracking-wider font-mono text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Student</th>
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-3 text-center">Type</th>
                      <th className="py-2.5 px-3 text-center">Result</th>
                      <th className="py-2.5 px-3 text-center">Marks Awarded</th>
                      <th className="py-2.5 px-3 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {overview.recent_activity.map((act) => (
                      <tr key={act.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                        <td className="py-3 px-3 font-semibold text-[var(--text-primary)]">
                          {act.student_name}
                        </td>
                        <td className="py-3 px-3 text-[var(--text-secondary)]">
                          {act.subject_name}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          <Badge variant="outline" size="sm">{act.question_type}</Badge>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {act.is_correct ? (
                            <Badge variant="success" size="sm">Correct</Badge>
                          ) : (
                            <Badge variant="destructive" size="sm">Incorrect</Badge>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold">
                          {act.marks_awarded > 0 ? `+${act.marks_awarded}` : act.marks_awarded}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[var(--text-muted)] text-[11px]">
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 1B: BRANCH MANAGEMENT (Stage 2) */}
      {!loading && !error && activeTab === "branches" && (
        <div className="max-w-6xl mx-auto">
          <BranchManagement
            branches={branches}
            onRefresh={loadAdminData}
            adminHeaders={adminHeaders}
          />
        </div>
      )}

      {/* TAB 1C: GATE PAPER MAPPING (Stage 2) */}
      {!loading && !error && activeTab === "mappings" && (
        <div className="max-w-6xl mx-auto">
          <GatePaperMapping
            mappings={mappings}
            gatePapers={gatePapers}
            branches={branches.map((b) => ({ id: b.id, name: b.name, code: b.code }))}
            onRefresh={loadAdminData}
            adminHeaders={adminHeaders}
          />
        </div>
      )}

      {/* TAB 1D: SUBJECT MANAGEMENT FOR EVERY BRANCH (Stage 3) */}
      {!loading && !error && activeTab === "subjects" && (
        <div className="max-w-6xl mx-auto">
          <SubjectManagement
            branches={branches.map((b) => ({ id: b.id, name: b.name, code: b.code }))}
            gatePapers={gatePapers.map((p) => ({ code: p.code, name: p.name }))}
            adminHeaders={adminHeaders}
            onRefreshParent={loadAdminData}
          />
        </div>
      )}

      {/* TAB 2: QUESTIONS MANAGEMENT */}
      {!loading && !error && activeTab === "questions" && (
        <div className="max-w-6xl mx-auto space-y-5">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search questions by statement or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)]">Type:</span>
              {["All", "MCQ", "MSQ", "NAT"].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterType === t
                      ? "bg-[#8B16F7] text-white"
                      : "bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Question List Table */}
          <Card>
            <CardHeader>
              <CardTitle>Verified Question Repository ({filteredQuestions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] uppercase tracking-wider font-mono text-[10px]">
                    <tr>
                      <th className="py-3 px-3">Subject / Topic</th>
                      <th className="py-3 px-3">Statement Preview</th>
                      <th className="py-3 px-3 text-center">Type</th>
                      <th className="py-3 px-3 text-center">Marks</th>
                      <th className="py-3 px-3 text-center">GATE PYQ</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {filteredQuestions.map((q) => (
                      <tr key={q.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                        <td className="py-3 px-3">
                          <p className="font-semibold text-[var(--text-primary)]">{q.subject_name}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">{q.topic_name}</p>
                        </td>
                        <td className="py-3 px-3 max-w-md truncate text-[var(--text-secondary)]">
                          {q.statement}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge variant="outline" size="sm">{q.question_type}</Badge>
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          +{q.marks}M / -{q.negative_mark}M
                        </td>
                        <td className="py-3 px-3 text-center">
                          {q.is_pyq ? (
                            <Badge variant="purple" size="sm">GATE {q.pyq_year}</Badge>
                          ) : (
                            <span className="text-[var(--text-muted)] font-mono">Practice</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: SUBJECTS & SYLLABUS */}
      {!loading && !error && activeTab === "subjects" && (
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="purple" size="sm">
                    Order #{sub.order_index}
                  </Badge>
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">
                    {sub.paper_code}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">{sub.name}</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {sub.topics_count} core syllabus topics configured
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: STUDENTS REGISTRY */}
      {!loading && !error && activeTab === "students" && (
        <div className="max-w-6xl mx-auto space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registered Student Aspirants ({students.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] uppercase tracking-wider font-mono text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Target Year</th>
                      <th className="py-3 px-4">Primary Paper</th>
                      <th className="py-3 px-4 text-center">Questions Solved</th>
                      <th className="py-3 px-4 text-center">Tests Taken</th>
                      <th className="py-3 px-4 text-center">Average Accuracy</th>
                      <th className="py-3 px-4 text-center">Onboarding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {students.map((st) => (
                      <tr key={st.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-[var(--text-primary)]">{st.full_name}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">{st.email || "aspirant@codexpetra.com"}</p>
                        </td>
                        <td className="py-3 px-4 font-mono">{st.target_gate_year}</td>
                        <td className="py-3 px-4 font-mono font-bold text-[#8B16F7]">
                          GATE {st.paper_code || "CS"}
                        </td>
                        <td className="py-3 px-4 text-center font-mono">{st.attempts_count}</td>
                        <td className="py-3 px-4 text-center font-mono">{st.tests_completed}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">
                          {st.average_accuracy}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          {st.is_onboarded ? (
                            <Badge variant="success" size="sm">Confirmed</Badge>
                          ) : (
                            <Badge variant="outline" size="sm">Pending</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AUTHOR QUESTION MODAL */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
          <div className="max-w-2xl w-full p-6 md:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="font-bold text-base text-[var(--text-primary)]">
                  Author New GATE Question
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Supports MCQ, MSQ, and NAT types with official GATE marking schemes.
                </p>
              </div>
              <button
                onClick={() => setShowQuestionModal(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="space-y-4 text-xs">
              {/* Type, Marks, Difficulty Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--text-primary)]">Question Type</label>
                  <select
                    value={newQType}
                    onChange={(e) => setNewQType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                  >
                    <option value="MCQ">MCQ (Single Option)</option>
                    <option value="MSQ">MSQ (Multiple Correct)</option>
                    <option value="NAT">NAT (Numerical Range)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--text-primary)]">Marks Scheme</label>
                  <select
                    value={newMarks}
                    onChange={(e) => setNewMarks(parseInt(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                  >
                    <option value={1}>1 Mark (MCQ -0.33 Neg)</option>
                    <option value={2}>2 Marks (MCQ -0.66 Neg)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--text-primary)]">Difficulty</label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Question Statement */}
              <div className="space-y-1">
                <label className="font-semibold text-[var(--text-primary)]">
                  Question Statement (Supports Markdown and LaTeX)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Consider a relational database table R(A, B, C)..."
                  value={newStatement}
                  onChange={(e) => setNewStatement(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-sans focus:outline-none focus:border-[#8B16F7]"
                />
              </div>

              {/* Options for MCQ / MSQ */}
              {(newQType === "MCQ" || newQType === "MSQ") && (
                <div className="space-y-2">
                  <label className="font-semibold text-[var(--text-primary)]">
                    Answer Options & Select Correct Key
                  </label>
                  {newOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type={newQType === "MCQ" ? "radio" : "checkbox"}
                        name="correct_answer"
                        checked={newQType === "MCQ" ? newCorrectMcq === idx : newCorrectMsq.includes(idx)}
                        onChange={() => {
                          if (newQType === "MCQ") {
                            setNewCorrectMcq(idx);
                          } else {
                            setNewCorrectMsq((prev) =>
                              prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx]
                            );
                          }
                        }}
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...newOptions];
                          updated[idx] = e.target.value;
                          setNewOptions(updated);
                        }}
                        className="flex-1 p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* NAT Correct Answer */}
              {newQType === "NAT" && (
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--text-primary)]">
                    Correct Numerical Answer
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 42 or 3.14"
                    value={newCorrectNat}
                    onChange={(e) => setNewCorrectNat(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono"
                  />
                </div>
              )}

              {/* Detailed Mathematical Explanation */}
              <div className="space-y-1">
                <label className="font-semibold text-[var(--text-primary)]">
                  Step-by-Step Mathematical Explanation & Proof
                </label>
                <textarea
                  rows={3}
                  placeholder="Step 1: Compute candidate keys using functional dependencies..."
                  value={newExplanation}
                  onChange={(e) => setNewExplanation(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
                />
              </div>

              {/* PYQ Checkbox */}
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsPyq}
                    onChange={(e) => setNewIsPyq(e.target.checked)}
                  />
                  <span>Official GATE Previous Year Question (PYQ)</span>
                </label>

                {newIsPyq && (
                  <div className="flex items-center gap-2">
                    <span>Year:</span>
                    <input
                      type="number"
                      value={newPyqYear}
                      onChange={(e) => setNewPyqYear(parseInt(e.target.value))}
                      className="w-20 p-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] font-mono text-center"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowQuestionModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isCreatingQuestion}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  {isCreatingQuestion ? "Publishing..." : "Publish Question"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
