"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  GraduationCap,
  Calendar,
  Clock,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { fetchGatePapers, fetchStudentProfile, submitStudentOnboarding } from "@/lib/api/student";
import type { GatePaper, StudentProfile, PrepLevel } from "@/types/student";

export default function StudentCheckInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [papers, setPapers] = useState<GatePaper[]>([]);
  const [formData, setFormData] = useState({
    fullName: "Student Aspirant",
    email: "student@codexpetra.com",
    qualification: "B.Tech / B.E.",
    academicYear: "3rd Year",
    collegeName: "",
    graduationYear: 2027,
    targetGateYear: 2026,
    primaryPaper: "CS",
    secondaryPaper: "",
    previousAttemptScore: "",
    prepLevel: "Beginner" as PrepLevel,
    dailyPrepHours: "2-3 Hours",
    preferredLearningMethod: "Concept First + PYQs",
  });

  // Allowed secondary papers based on selected primary paper
  const currentPrimaryPaper = papers.find((p) => p.code === formData.primaryPaper);
  const allowedSecondaries = currentPrimaryPaper
    ? papers.filter((p) => currentPrimaryPaper.allowed_secondary_papers.includes(p.code))
    : [];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [papersData, profileData] = await Promise.all([
          fetchGatePapers().catch(() => [
            { code: "CS", name: "Computer Science & Information Technology", is_active: true, allowed_secondary_papers: ["DA", "EC"] },
            { code: "DA", name: "Data Science & Artificial Intelligence", is_active: true, allowed_secondary_papers: ["CS"] },
          ]),
          fetchStudentProfile().catch(() => null),
        ]);

        setPapers(papersData);

        if (profileData) {
          setFormData({
            fullName: profileData.full_name || "Student Aspirant",
            email: profileData.email || "student@codexpetra.com",
            qualification: profileData.qualification || "B.Tech / B.E.",
            academicYear: profileData.academic_year || "3rd Year",
            collegeName: profileData.college_name || "",
            graduationYear: profileData.graduation_year || 2027,
            targetGateYear: profileData.target_gate_year || 2026,
            primaryPaper: profileData.primary_paper || "CS",
            secondaryPaper: profileData.secondary_paper || "",
            previousAttemptScore: profileData.previous_attempt_score ? String(profileData.previous_attempt_score) : "",
            prepLevel: (profileData.prep_level as PrepLevel) || "Beginner",
            dailyPrepHours: profileData.daily_prep_hours || "2-3 Hours",
            preferredLearningMethod: profileData.preferred_learning_method || "Concept First + PYQs",
          });
        }
      } catch (err) {
        console.error("Failed to load onboarding info:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const payload: Partial<StudentProfile> = {
        full_name: formData.fullName,
        qualification: formData.qualification,
        academic_year: formData.academicYear,
        college_name: formData.collegeName,
        graduation_year: formData.graduationYear ? Number(formData.graduationYear) : null,
        target_gate_year: Number(formData.targetGateYear),
        primary_paper: formData.primaryPaper,
        secondary_paper: formData.secondaryPaper ? formData.secondaryPaper : null,
        prep_level: formData.prepLevel,
        daily_prep_hours: formData.dailyPrepHours,
        preferred_learning_method: formData.preferredLearningMethod,
        previous_attempt_score: formData.previousAttemptScore
          ? parseFloat(formData.previousAttemptScore)
          : null,
      };

      await submitStudentOnboarding(payload);
      // Seamlessly transition to dashboard
      router.push("/dashboard");
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to confirm profile information. Please verify your connection."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col justify-between p-4 md:p-10 transition-colors">
      {/* Top Brand Bar */}
      <div className="max-w-3xl w-full mx-auto flex items-center justify-between pb-6 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 shrink-0 rounded-xl overflow-hidden shadow-md border border-[var(--border-subtle)] bg-white/5">
            <Image
              src="/images/codexpetra-logo.jpg"
              alt="CodexPetra Logo"
              width={40}
              height={40}
              className="object-contain w-10 h-10"
              priority
            />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-[var(--text-primary)]">
              CodexPetra <span className="text-[#8B16F7]">GATE</span>
            </span>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Student Profile Check-in & Orientation
            </p>
          </div>
        </div>

        <Badge variant="purple" size="sm">
          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
          Verified Account
        </Badge>
      </div>

      {/* Main Check-In Form */}
      <main className="max-w-3xl w-full mx-auto my-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Welcome Intro Header */}
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#8B16F7]/12 text-[#C42BEE] border border-[#8B16F7]/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Step 1 of 1 • One-Time Check-In</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Confirm Your <span className="bg-gradient-to-r from-[#8B16F7] to-[#C42BEE] bg-clip-text text-transparent">GATE Preparation Profile</span>
            </h1>
            <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed">
              We prefilled your profile from your existing account. Please confirm or adjust your target exam year and paper selections so we can structure your personalized learning path.
            </p>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Identity & Credentials */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#8B16F7]" />
                Academic Background & Identity
              </CardTitle>
              <CardDescription>
                Synced with your CodexPetra account
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-surface-elevated)]/50 border border-[var(--border-subtle)] text-[var(--text-muted)] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Degree / Qualification
                </label>
                <select
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
                >
                  <option value="B.Tech / B.E.">B.Tech / B.E. (Engineering)</option>
                  <option value="BCA">BCA (Computer Applications)</option>
                  <option value="B.Sc CS/IT">B.Sc Computer Science / IT</option>
                  <option value="MCA">MCA (Master of Computer Applications)</option>
                  <option value="M.Tech">M.Tech / M.E.</option>
                  <option value="Other">Other Equivalent Qualification</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Current Academic Status
                </label>
                <select
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
                >
                  <option value="2nd Year">2nd Year Student</option>
                  <option value="3rd Year">3rd Year Student (Eligible for GATE)</option>
                  <option value="Final Year (4th)">Final Year Student (Eligible for GATE)</option>
                  <option value="Graduated">Graduated / Working Professional</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  College or University <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. National Institute of Technology, Trichy"
                  value={formData.collegeName}
                  onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: GATE Examination Goals & Paper Combinations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-[#FF791E]" />
                GATE Target & Official Paper Combinations
              </CardTitle>
              <CardDescription>
                Validated against official GATE examination guidelines
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Target Exam Year
                </label>
                <select
                  value={formData.targetGateYear}
                  onChange={(e) => setFormData({ ...formData, targetGateYear: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
                >
                  <option value="2026">GATE 2026</option>
                  <option value="2027">GATE 2027</option>
                  <option value="2028">GATE 2028</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Primary GATE Paper <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.primaryPaper}
                  onChange={(e) => {
                    const newPrimary = e.target.value;
                    setFormData({
                      ...formData,
                      primaryPaper: newPrimary,
                      secondaryPaper: "", // Reset secondary on primary change
                    });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
                >
                  {papers.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.code} — {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Optional Secondary Paper <span className="text-[var(--text-muted)] font-normal">(Two-paper option)</span>
                </label>
                <select
                  value={formData.secondaryPaper}
                  onChange={(e) => setFormData({ ...formData, secondaryPaper: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
                >
                  <option value="">None (Primary paper only)</option>
                  {allowedSecondaries.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.code} — {p.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  Only officially permitted secondary papers for {formData.primaryPaper} are shown.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Previous GATE Attempt Score <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 42.5 (leave blank if first attempt)"
                  value={formData.previousAttemptScore}
                  onChange={(e) => setFormData({ ...formData, previousAttemptScore: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Study Habits & Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#C42BEE]" />
                Daily Preparation Habits
              </CardTitle>
              <CardDescription>
                Customizes your daily study goals and learning pace
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Preparation Level
                </label>
                <select
                  value={formData.prepLevel}
                  onChange={(e) => setFormData({ ...formData, prepLevel: e.target.value as PrepLevel })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
                >
                  <option value="Beginner">Beginner (Starting from basics)</option>
                  <option value="Intermediate">Intermediate (Coursework done)</option>
                  <option value="Advanced">Advanced (Revision & Mocks)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Daily Study Time
                </label>
                <select
                  value={formData.dailyPrepHours}
                  onChange={(e) => setFormData({ ...formData, dailyPrepHours: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
                >
                  <option value="1-2 Hours">1-2 Hours daily</option>
                  <option value="2-3 Hours">2-3 Hours daily</option>
                  <option value="4+ Hours">4+ Hours daily</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Preferred Method
                </label>
                <select
                  value={formData.preferredLearningMethod}
                  onChange={(e) => setFormData({ ...formData, preferredLearningMethod: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
                >
                  <option value="Concept First + PYQs">Concept Notes + PYQs</option>
                  <option value="Question First">Question-Driven Study</option>
                  <option value="Mock Test Revision">High-Yield Revision</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Submission Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--border-subtle)]">
            <p className="text-xs text-[var(--text-muted)] text-center sm:text-left">
              Saved directly to your dedicated GATE database. You can adjust this anytime in Profile settings.
            </p>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              isLoading={submitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Confirm & Enter GATE Portal
            </Button>
          </div>
        </form>
      </main>

      {/* Footer */}
      <footer className="max-w-3xl w-full mx-auto pt-6 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)]">
        © 2026 CodexPetra GATE Preparation Portal • Secure Single Sign-On Integration
      </footer>
    </div>
  );
}
