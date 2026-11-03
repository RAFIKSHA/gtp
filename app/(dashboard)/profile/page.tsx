"use client";

import React, { useState, useEffect } from "react";
import { User, CheckCircle2, Save, Sparkles, BookOpen, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { fetchGatePapers, fetchStudentProfile, submitStudentOnboarding } from "@/lib/api/student";
import type { GatePaper, StudentProfile, PrepLevel } from "@/types/student";

export default function ProfilePage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [papers, setPapers] = useState<GatePaper[]>([]);
  const [profile, setProfile] = useState({
    fullName: "Student Aspirant",
    email: "student@codexpetra.com",
    qualification: "B.Tech / B.E.",
    academicYear: "3rd Year",
    collegeName: "",
    graduationYear: 2027,
    targetGateYear: 2026,
    selectedPaper: "CS",
    secondaryPaper: "",
    previousAttemptScore: "",
    prepLevel: "Beginner" as PrepLevel,
    dailyPrepTime: "2-3 Hours",
    learningMethod: "Concept First + PYQs",
    isOnboarded: false,
  });

  // Calculate allowed secondary papers based on selected primary paper
  const currentPrimaryPaper = papers.find((p) => p.code === profile.selectedPaper);
  const allowedSecondaries = currentPrimaryPaper
    ? papers.filter((p) => currentPrimaryPaper.allowed_secondary_papers.includes(p.code))
    : [];

  useEffect(() => {
    async function loadProfile() {
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
          setProfile({
            fullName: profileData.full_name || "Student Aspirant",
            email: profileData.email || "student@codexpetra.com",
            qualification: profileData.qualification || "B.Tech / B.E.",
            academicYear: profileData.academic_year || "3rd Year",
            collegeName: profileData.college_name || "",
            graduationYear: profileData.graduation_year || 2027,
            targetGateYear: profileData.target_gate_year || 2026,
            selectedPaper: profileData.primary_paper || "CS",
            secondaryPaper: profileData.secondary_paper || "",
            previousAttemptScore: profileData.previous_attempt_score ? String(profileData.previous_attempt_score) : "",
            prepLevel: profileData.prep_level || "Beginner",
            dailyPrepTime: profileData.daily_prep_hours || "2-3 Hours",
            learningMethod: profileData.preferred_learning_method || "Concept First + PYQs",
            isOnboarded: profileData.is_onboarded || false,
          });
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setIsSaved(false);

    try {
      const payload: Partial<StudentProfile> = {
        full_name: profile.fullName,
        qualification: profile.qualification,
        academic_year: profile.academicYear,
        college_name: profile.collegeName,
        graduation_year: profile.graduationYear ? Number(profile.graduationYear) : null,
        target_gate_year: Number(profile.targetGateYear),
        primary_paper: profile.selectedPaper,
        secondary_paper: profile.secondaryPaper ? profile.secondaryPaper : null,
        prep_level: profile.prepLevel,
        daily_prep_hours: profile.dailyPrepTime,
        preferred_learning_method: profile.learningMethod,
        previous_attempt_score: profile.previousAttemptScore ? parseFloat(profile.previousAttemptScore) : null,
      };

      await submitStudentOnboarding(payload);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to save profile changes. Please verify server connection."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B16F7]" />
        <p className="text-xs text-[var(--text-secondary)]">Loading your preparation profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="pb-4 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
            Student Profile & Onboarding Preferences
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Review and update your target examination, daily preparation goals, and academic credentials.
          </p>
        </div>

        <Badge variant={profile.isOnboarded ? "success" : "purple"} size="sm">
          {profile.isOnboarded ? "Check-in Complete" : "Pending Check-in"}
        </Badge>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Identity */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#8B16F7]/15 flex items-center justify-center text-[#8B16F7]">
                <User className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>CodexPetra Identity</CardTitle>
                <CardDescription>Synced via secure Single Sign-On</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={profile.email}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-[var(--bg-surface-elevated)]/50 border border-[var(--border-subtle)] text-[var(--text-muted)] cursor-not-allowed"
              />
            </div>
          </CardContent>
        </Card>

        {/* Academic & GATE Target Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#FF791E]/15 flex items-center justify-center text-[#FF791E]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>GATE Target & Academic Information</CardTitle>
                <CardDescription>Tailors the guided syllabus sequence and recommendations</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Target GATE Year
              </label>
              <select
                value={profile.targetGateYear}
                onChange={(e) => setProfile({ ...profile, targetGateYear: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
              >
                <option value="2026">GATE 2026</option>
                <option value="2027">GATE 2027</option>
                <option value="2028">GATE 2028</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Primary GATE Paper
              </label>
              <select
                value={profile.selectedPaper}
                onChange={(e) => {
                  const newPrimary = e.target.value;
                  setProfile({
                    ...profile,
                    selectedPaper: newPrimary,
                    secondaryPaper: "",
                  });
                }}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
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
                Secondary GATE Paper <span className="text-[var(--text-muted)] font-normal">(Allowed combinations)</span>
              </label>
              <select
                value={profile.secondaryPaper}
                onChange={(e) => setProfile({ ...profile, secondaryPaper: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
              >
                <option value="">None (Primary paper only)</option>
                {allowedSecondaries.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Current Preparation Level
              </label>
              <select
                value={profile.prepLevel}
                onChange={(e) => setProfile({ ...profile, prepLevel: e.target.value as PrepLevel })}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
              >
                <option value="Beginner">Beginner (Starting from basics)</option>
                <option value="Intermediate">Intermediate (Completed coursework)</option>
                <option value="Advanced">Advanced (Revision & Mock tests)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Daily Study Commitment
              </label>
              <select
                value={profile.dailyPrepTime}
                onChange={(e) => setProfile({ ...profile, dailyPrepTime: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
              >
                <option value="1-2 Hours">1-2 Hours</option>
                <option value="2-3 Hours">2-3 Hours</option>
                <option value="4+ Hours">4+ Hours</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-between">
          {isSaved ? (
            <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Preferences updated and saved in database!
            </span>
          ) : (
            <span />
          )}

          <Button
            type="submit"
            variant="primary"
            isLoading={saving}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}
