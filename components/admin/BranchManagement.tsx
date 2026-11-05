"use client";

import React, { useState } from "react";
import {
  GitBranch,
  PlusCircle,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Laptop,
  Cpu,
  Zap,
  Layers,
  Database,
  Compass,
  Radio,
  Activity,
  BookOpen,
  Search,
  Filter,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export interface AdminBranchItem {
  id: string;
  name: string;
  code: string;
  slug: string;
  description: string;
  icon_name: string;
  display_order: number;
  is_active: boolean;
  is_published: boolean;
  gate_paper: string | null;
  gate_paper_code: string | null;
  gate_paper_name: string | null;
  connected_papers?: {
    mapping_id: string;
    paper_code: string;
    paper_name: string;
    is_primary: boolean;
    is_active: boolean;
  }[];
  subjects_count: number;
  created_at: string;
  updated_at?: string;
}

interface BranchManagementProps {
  branches: AdminBranchItem[];
  onRefresh: () => Promise<void>;
  adminHeaders: Record<string, string>;
}

// Icon dictionary
const ICON_MAP: Record<string, React.ElementType> = {
  Laptop,
  Cpu,
  Zap,
  Layers,
  Database,
  Compass,
  Radio,
  Activity,
  BookOpen,
  GitBranch,
};

export default function BranchManagement({
  branches,
  onRefresh,
  adminHeaders,
}: BranchManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "PUBLISHED">("ALL");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formIcon, setFormIcon] = useState("Layers");
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formIsPublished, setFormIsPublished] = useState<boolean>(true);
  const [formGatePaper, setFormGatePaper] = useState<string>("");

  // Open Create Modal
  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormName("");
    setFormCode("");
    setFormSlug("");
    setFormDesc("");
    setFormIcon("Laptop");
    setFormOrder(branches.length + 1);
    setFormIsActive(true);
    setFormIsPublished(true);
    setFormGatePaper("");
    setModalError(null);
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (branch: AdminBranchItem) => {
    setIsEditing(true);
    setEditingId(branch.id);
    setFormName(branch.name);
    setFormCode(branch.code);
    setFormSlug(branch.slug);
    setFormDesc(branch.description || "");
    setFormIcon(branch.icon_name || "Layers");
    setFormOrder(branch.display_order);
    setFormIsActive(branch.is_active);
    setFormIsPublished(branch.is_published);
    setFormGatePaper(branch.gate_paper || "");
    setModalError(null);
    setShowModal(true);
  };

  // Auto-generate slug and code suggestions from name
  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!isEditing) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormSlug(generatedSlug);
    }
  };

  // Submit Form (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      setModalError("Please provide both branch name and unique code.");
      return;
    }

    setIsSaving(true);
    setModalError(null);

    const payload: any = {
      name: formName.trim(),
      code: formCode.trim().toUpperCase(),
      slug: formSlug.trim() || formName.toLowerCase().replace(/\s+/g, "-"),
      description: formDesc.trim(),
      icon_name: formIcon,
      display_order: Number(formOrder) || 1,
      is_active: formIsActive,
      is_published: formIsPublished,
      gate_paper: formGatePaper ? formGatePaper : null,
    };

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

    try {
      const url = isEditing && editingId
        ? `${API_BASE}/api/v1/admin/branches/${editingId}/`
        : `${API_BASE}/api/v1/admin/branches/`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: adminHeaders,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(
          typeof errData === "object"
            ? Object.entries(errData)
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ")
            : "Failed to save branch"
        );
      }

      await onRefresh();
      setShowModal(false);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Error saving branch");
    } finally {
      setIsSaving(false);
    }
  };

  // Quick Toggle Status
  const handleToggleStatus = async (branchId: string, field: "is_active" | "is_published") => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/branches/${branchId}/toggle-status/`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ field }),
      });
      if (res.ok) {
        await onRefresh();
      } else {
        alert("Failed to toggle status.");
      }
    } catch {
      alert("Network error toggling branch status.");
    }
  };

  // Delete Branch (With Dependency Safeguard)
  const handleDelete = async (branch: AdminBranchItem) => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    if (
      !confirm(
        `Are you sure you want to delete branch "${branch.name}" (${branch.code})?\n\nThis operation checks for dependent subjects before proceeding.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/branches/${branch.id}/`, {
        method: "DELETE",
        headers: adminHeaders,
      });

      if (res.ok) {
        alert(`Branch "${branch.name}" was successfully removed.`);
        await onRefresh();
      } else {
        const errJson = await res.json();
        alert(`Cannot Delete: ${errJson.error || "Permission denied or dependency conflict."}`);
      }
    } catch {
      alert("Error deleting branch. Please check server logs.");
    }
  };

  // Filter branches
  const filteredBranches = branches.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === "ACTIVE") return matchesSearch && b.is_active;
    if (statusFilter === "PUBLISHED") return matchesSearch && b.is_published;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-[#8B16F7]" />
            Academic Engineering Branches
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Root entities of the Academic Content Hierarchy. Each branch houses subjects, syllabus units, and practice tests.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenCreate}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          Register New Branch
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search branches by code or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {(["ALL", "ACTIVE", "PUBLISHED"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === filter
                  ? "bg-[#8B16F7]/15 text-[#C42BEE] border border-[#8B16F7]/30"
                  : "bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)]"
              }`}
            >
              {filter === "ALL" ? `All Branches (${branches.length})` : filter}
            </button>
          ))}
        </div>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBranches.map((branch) => {
          const IconComp = ICON_MAP[branch.icon_name] || Layers;
          return (
            <Card
              key={branch.id}
              className={`transition-all hover:border-[#8B16F7]/40 ${
                !branch.is_active ? "opacity-60 bg-[var(--bg-surface)]/50" : ""
              }`}
            >
              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#8B16F7]/10 border border-[#8B16F7]/25 flex items-center justify-center shrink-0">
                      <IconComp className="w-5 h-5 text-[#8B16F7]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-extrabold px-1.5 py-0.5 rounded-md bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[#C42BEE]">
                          {branch.code}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] font-mono">
                          #{branch.display_order}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)] mt-0.5 line-clamp-1">
                        {branch.name}
                      </h3>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(branch)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[#8B16F7] hover:bg-[#8B16F7]/10 transition-colors"
                      title="Edit Branch"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(branch)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Branch"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2 min-h-[32px]">
                  {branch.description || "No specific curriculum overview provided."}
                </p>

                {/* Metadata Badges */}
                <div className="flex items-center justify-between text-xs pt-3 border-t border-[var(--border-subtle)]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="magenta" size="sm">
                      {branch.subjects_count} {branch.subjects_count === 1 ? "Subject" : "Subjects"}
                    </Badge>
                    {branch.connected_papers && branch.connected_papers.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1">
                        {branch.connected_papers.map((p) => (
                          <span
                            key={p.mapping_id}
                            className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md border ${
                              p.is_primary
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            }`}
                            title={`${p.paper_name} (${p.is_primary ? "Primary Paper" : "Secondary Choice"})`}
                          >
                            GATE {p.paper_code}
                            {p.is_primary ? " ★" : ""}
                          </span>
                        ))}
                      </div>
                    ) : branch.gate_paper_code ? (
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        GATE {branch.gate_paper_code}
                      </span>
                    ) : (
                      <span className="text-[10px] text-[var(--text-muted)]">No Paper Link</span>
                    )}
                  </div>

                  {/* Quick Toggles */}
                  <div className="flex items-center gap-1.5">
                    {/* Active Toggle */}
                    <button
                      onClick={() => handleToggleStatus(branch.id, "is_active")}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-md border flex items-center gap-1 transition-colors ${
                        branch.is_active
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}
                      title="Click to toggle Active state"
                    >
                      {branch.is_active ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                      {branch.is_active ? "Active" : "Inactive"}
                    </button>

                    {/* Published Toggle */}
                    <button
                      onClick={() => handleToggleStatus(branch.id, "is_published")}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-md border flex items-center gap-1 transition-colors ${
                        branch.is_published
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/25"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/25"
                      }`}
                      title="Click to toggle Published state in student portal"
                    >
                      {branch.is_published ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                      {branch.is_published ? "Published" : "Draft"}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredBranches.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3">
          <GitBranch className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">No branches match your filter</h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Try adjusting your search query or register a new branch.
          </p>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-strong)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-[#8B16F7]" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  {isEditing ? "Edit Academic Branch" : "Register New Academic Branch"}
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
            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Branch Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Full Branch Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mechanical Engineering"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
                />
              </div>

              {/* Code & Slug */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Branch Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ME"
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
                    placeholder="e.g. me"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
                  />
                </div>
              </div>

              {/* Linked GATE Paper & Display Order */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Bridge to GATE Paper
                  </label>
                  <select
                    value={formGatePaper}
                    onChange={(e) => setFormGatePaper(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
                  >
                    <option value="">None / Standalone Curriculum</option>
                    <option value="CS">CS — Computer Science & IT</option>
                    <option value="DA">DA — Data Science & AI</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Display Order Index
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
                  Visual Branch Icon
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.keys(ICON_MAP).map((iconKey) => {
                    const Comp = ICON_MAP[iconKey];
                    const isSelected = formIcon === iconKey;
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setFormIcon(iconKey)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all ${
                          isSelected
                            ? "bg-[#8B16F7]/20 border-[#8B16F7] text-[#C42BEE]"
                            : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <Comp className="w-4 h-4" />
                        <span className="text-[10px] mt-1 font-mono">{iconKey}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Branch Overview & Syllabus Scope
                </label>
                <textarea
                  rows={3}
                  placeholder="Summarize the core technical subjects and focus areas..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
                />
              </div>

              {/* Status Toggles */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="accent-[#8B16F7]"
                  />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-[var(--text-primary)]">Active Status</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Available in platform CMS</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsPublished}
                    onChange={(e) => setFormIsPublished(e.target.checked)}
                    className="accent-[#8B16F7]"
                  />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-[var(--text-primary)]">Publish to Students</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Visible in Student LMS</p>
                  </div>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
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
                  {isSaving ? "Saving Branch..." : isEditing ? "Save Changes" : "Create Branch"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

