"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  PlusCircle,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Layers,
  Search,
  Filter,
  X,
  Loader2,
  AlertTriangle,
  Code2,
  Cpu,
  Database,
  Network,
  HardDrive,
  Terminal,
  Binary,
  Calculator,
  Shield,
  FileCheck2,
  ArrowUpDown,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export interface AdminSubjectDetailItem {
  id: number;
  branch: string | null;
  branch_name: string | null;
  branch_code: string | null;
  paper: string | null;
  paper_code: string | null;
  code: string;
  name: string;
  slug: string;
  order_index: number;
  description: string;
  icon_name: string;
  is_active: boolean;
  is_published: boolean;
  topics_count: number;
  created_at: string;
}

interface SubjectManagementProps {
  branches: { id: string; name: string; code: string }[];
  gatePapers: { code: string; name: string }[];
  adminHeaders: Record<string, string>;
  onRefreshParent: () => Promise<void>;
}

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen,
  Code2,
  Cpu,
  Database,
  Network,
  HardDrive,
  Terminal,
  Binary,
  Calculator,
  Shield,
  Layers,
};

export default function SubjectManagement({
  branches,
  gatePapers,
  adminHeaders,
  onRefreshParent,
}: SubjectManagementProps) {
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || "");
  const [paperFilter, setPaperFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [subjects, setSubjects] = useState<AdminSubjectDetailItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formIcon, setFormIcon] = useState("BookOpen");
  const [formPaper, setFormPaper] = useState("");
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formIsPublished, setFormIsPublished] = useState<boolean>(true);

  // Fetch subjects for currently selected branch
  const fetchBranchSubjects = async (branchId: string) => {
    if (!branchId) return;
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    setLoading(true);
    try {
      const url = `${API_BASE}/api/v1/admin/subjects/?branch_id=${branchId}`;
      const res = await fetch(url, { headers: adminHeaders });
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
      }
    } catch (err) {
      console.error("Error fetching branch subjects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBranchId) {
      fetchBranchSubjects(selectedBranchId);
    }
  }, [selectedBranchId]);

  const activeBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  // Open Create Subject Modal
  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormName("");
    setFormCode(`${activeBranch?.code || "SUB"}-`);
    setFormSlug("");
    setFormDesc("");
    setFormIcon("BookOpen");
    setFormPaper("");
    setFormOrder(subjects.length + 1);
    setFormIsActive(true);
    setFormIsPublished(true);
    setModalError(null);
    setShowModal(true);
  };

  // Open Edit Subject Modal
  const handleOpenEdit = (subject: AdminSubjectDetailItem) => {
    setIsEditing(true);
    setEditingId(subject.id);
    setFormName(subject.name);
    setFormCode(subject.code || "");
    setFormSlug(subject.slug);
    setFormDesc(subject.description || "");
    setFormIcon(subject.icon_name || "BookOpen");
    setFormPaper(subject.paper || "");
    setFormOrder(subject.order_index);
    setFormIsActive(subject.is_active);
    setFormIsPublished(subject.is_published);
    setModalError(null);
    setShowModal(true);
  };

  // Auto-slugify on name change
  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!isEditing) {
      const slug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormSlug(slug);
    }
  };

  // Save Subject
  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      setModalError("Please provide both a subject name and subject code.");
      return;
    }

    setIsSaving(true);
    setModalError(null);

    const payload = {
      branch: selectedBranchId,
      paper: formPaper ? formPaper : null,
      name: formName.trim(),
      code: formCode.trim().toUpperCase(),
      slug: formSlug.trim() || formName.toLowerCase().replace(/\s+/g, "-"),
      description: formDesc.trim(),
      icon_name: formIcon,
      order_index: Number(formOrder) || 1,
      is_active: formIsActive,
      is_published: formIsPublished,
    };

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

    try {
      const url = isEditing && editingId
        ? `${API_BASE}/api/v1/admin/subjects/${editingId}/`
        : `${API_BASE}/api/v1/admin/subjects/`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: adminHeaders,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(
          typeof errJson === "object"
            ? Object.entries(errJson)
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ")
            : "Failed to save subject"
        );
      }

      await fetchBranchSubjects(selectedBranchId);
      await onRefreshParent();
      setShowModal(false);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Error saving subject");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Subject (with safeguard)
  const handleDelete = async (subject: AdminSubjectDetailItem) => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    if (
      !confirm(
        `Are you sure you want to delete subject "${subject.name}" (${subject.code}) from ${activeBranch?.name}?\n\nThis will remove the subject from this branch's curriculum.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/subjects/${subject.id}/`, {
        method: "DELETE",
        headers: adminHeaders,
      });

      if (res.ok) {
        await fetchBranchSubjects(selectedBranchId);
        await onRefreshParent();
      } else {
        alert("Failed to delete subject.");
      }
    } catch {
      alert("Error deleting subject.");
    }
  };

  // Filtered Subjects
  const filteredSubjects = subjects.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPaper = paperFilter === "ALL" || s.paper_code === paperFilter;
    return matchesSearch && matchesPaper;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Branch Switcher Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#8B16F7]" />
            Subject Management by Academic Branch
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Manage academic subjects independently for each engineering discipline. Add, reorder, and configure syllabus curriculum.
          </p>
        </div>

        {/* Branch Selector Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-[var(--bg-surface-elevated)] border border-[var(--border-strong)] rounded-xl px-3 py-1.5 shadow-sm">
            <span className="text-xs font-semibold text-[var(--text-muted)] whitespace-nowrap">
              Active Branch:
            </span>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-transparent text-xs font-bold text-[var(--text-primary)] focus:outline-none cursor-pointer"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                  {b.code} — {b.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Add Subject to {activeBranch?.code}
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder={`Search subjects in ${activeBranch?.code}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
          />
        </div>

        {/* Filter by Paper */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">Paper Filter:</span>
          <select
            value={paperFilter}
            onChange={(e) => setPaperFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Associated Papers</option>
            {gatePapers.map((p) => (
              <option key={p.code} value={p.code}>
                GATE {p.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-12 text-center rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#8B16F7] mx-auto" />
          <p className="text-xs text-[var(--text-muted)]">Loading subjects for {activeBranch?.name}...</p>
        </div>
      )}

      {/* Subjects Table */}
      {!loading && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-primary)]/80 text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
              <tr>
                <th className="py-3 px-4 font-semibold">Subject Code</th>
                <th className="py-3 px-4 font-semibold">Subject Name</th>
                <th className="py-3 px-3 font-semibold text-center">GATE Paper</th>
                <th className="py-3 px-3 font-semibold text-center">Syllabus Scope</th>
                <th className="py-3 px-3 font-semibold text-center">Order</th>
                <th className="py-3 px-3 font-semibold text-center">Status</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filteredSubjects.map((subject) => {
                const IconComp = ICON_MAP[subject.icon_name] || BookOpen;
                return (
                  <tr key={subject.id} className="hover:bg-[var(--bg-primary)]/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#C42BEE]">
                      <span className="px-2 py-0.5 rounded-md bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
                        {subject.code || "—"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#8B16F7]/10 border border-[#8B16F7]/20 flex items-center justify-center shrink-0">
                          <IconComp className="w-3.5 h-3.5 text-[#8B16F7]" />
                        </div>
                        <div>
                          <p className="font-bold text-[var(--text-primary)]">{subject.name}</p>
                          <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">{subject.description || "Core subject"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {subject.paper_code ? (
                        <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          GATE {subject.paper_code}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[var(--text-muted)]">General</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <Badge variant="magenta" size="sm">
                        {subject.topics_count} {subject.topics_count === 1 ? "Topic" : "Topics"}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-medium text-[var(--text-secondary)]">
                      #{subject.order_index}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(subject)}
                          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[#8B16F7] hover:bg-[#8B16F7]/10 transition-colors"
                          title="Edit Subject"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(subject)}
                          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Subject"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredSubjects.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[var(--text-muted)]">
                    No subjects found under {activeBranch?.name}. Click &quot;Add Subject to {activeBranch?.code}&quot; above to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT SUBJECT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-strong)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#C42BEE] uppercase tracking-wider">
                  Branch: {activeBranch?.name} ({activeBranch?.code})
                </span>
                <h3 className="text-base font-bold text-[var(--text-primary)] mt-0.5">
                  {isEditing ? "Edit Academic Subject" : `Add Subject to ${activeBranch?.code}`}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveSubject} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Subject Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Theory of Computation"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
                />
              </div>

              {/* Code & Slug */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Subject Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS-TOC"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. theory-of-computation"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
                  />
                </div>
              </div>

              {/* GATE Paper Association & Order */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    GATE Paper Association
                  </label>
                  <select
                    value={formPaper}
                    onChange={(e) => setFormPaper(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
                  >
                    <option value="">None / Branch Specific</option>
                    {gatePapers.map((p) => (
                      <option key={p.code} value={p.code}>
                        GATE {p.code} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Sequence Order Index
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formOrder}
                    onChange={(e) => setFormOrder(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
                  />
                </div>
              </div>

              {/* Icon Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Subject Icon
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {Object.keys(ICON_MAP).map((iconKey) => {
                    const Comp = ICON_MAP[iconKey];
                    const isSelected = formIcon === iconKey;
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setFormIcon(iconKey)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                          isSelected
                            ? "bg-[#8B16F7]/20 border-[#8B16F7] text-[#C42BEE]"
                            : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <Comp className="w-4 h-4" />
                        <span className="text-[9px] mt-1 font-mono truncate max-w-full">{iconKey}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Subject Overview
                </label>
                <textarea
                  rows={2}
                  placeholder="Summary of syllabus scope, prerequisites, and learning objectives..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSaving}
                  leftIcon={isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : undefined}
                >
                  {isSaving ? "Saving..." : isEditing ? "Save Changes" : `Add to ${activeBranch?.code}`}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

