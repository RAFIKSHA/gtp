"use client";

import React, { useState } from "react";
import {
  Link2,
  PlusCircle,
  Trash2,
  CheckCircle2,
  XCircle,
  FileText,
  GitBranch,
  Search,
  Filter,
  X,
  Loader2,
  AlertTriangle,
  Star,
  Layers,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export interface BranchGateMappingItem {
  id: string;
  branch: string;
  branch_name: string;
  branch_code: string;
  gate_paper: string;
  gate_paper_code: string;
  gate_paper_name: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
}

export interface GatePaperItem {
  code: string;
  name: string;
  is_active: boolean;
  connected_branches_count: number;
  connected_branches: {
    mapping_id: string;
    branch_id: string;
    branch_name: string;
    branch_code: string;
    is_primary: boolean;
    is_active: boolean;
  }[];
}

interface GatePaperMappingProps {
  mappings: BranchGateMappingItem[];
  gatePapers: GatePaperItem[];
  branches: { id: string; name: string; code: string }[];
  onRefresh: () => Promise<void>;
  adminHeaders: Record<string, string>;
}

export default function GatePaperMapping({
  mappings,
  gatePapers,
  branches,
  onRefresh,
  adminHeaders,
}: GatePaperMappingProps) {
  const [viewMode, setViewMode] = useState<"BY_BRANCH" | "BY_PAPER">("BY_BRANCH");
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || "");
  const [searchQuery, setSearchQuery] = useState("");

  // Connect Modal State
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [modalBranchId, setModalBranchId] = useState("");
  const [modalPaperCode, setModalPaperCode] = useState("");
  const [modalIsPrimary, setModalIsPrimary] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const handleOpenConnect = (branchId?: string) => {
    setModalBranchId(branchId || selectedBranchId || branches[0]?.id || "");
    // Default to first paper not already mapped to this branch
    const mappedPaperCodes = mappings
      .filter((m) => m.branch === (branchId || selectedBranchId || branches[0]?.id))
      .map((m) => m.gate_paper_code);
    const available = gatePapers.find((p) => !mappedPaperCodes.includes(p.code));
    setModalPaperCode(available?.code || gatePapers[0]?.code || "");
    setModalIsPrimary(mappedPaperCodes.length === 0);
    setModalError(null);
    setShowConnectModal(true);
  };

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalBranchId || !modalPaperCode) {
      setModalError("Please select both an engineering branch and a GATE examination paper.");
      return;
    }

    setIsSubmitting(true);
    setModalError(null);
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/branch-gate-mappings/`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          branch: modalBranchId,
          gate_paper: modalPaperCode,
          is_primary: modalIsPrimary,
          is_active: true,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to create mapping.");
      }

      await onRefresh();
      setShowConnectModal(false);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Error creating mapping");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnect = async (mapping: BranchGateMappingItem) => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    if (
      !confirm(
        `Are you sure you want to disconnect ${mapping.branch_name} (${mapping.branch_code}) from GATE ${mapping.gate_paper_code}?\n\nStudents in this branch will no longer be mapped to this examination paper.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/branch-gate-mappings/${mapping.id}/`, {
        method: "DELETE",
        headers: adminHeaders,
      });

      if (res.ok) {
        await onRefresh();
      } else {
        alert("Failed to disconnect paper mapping.");
      }
    } catch {
      alert("Network error disconnecting mapping.");
    }
  };

  const handleTogglePrimary = async (mappingId: string) => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/branch-gate-mappings/${mappingId}/toggle-primary/`, {
        method: "POST",
        headers: adminHeaders,
      });
      if (res.ok) await onRefresh();
    } catch {
      alert("Error toggling primary status.");
    }
  };

  // Filtered lists
  const activeBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];
  const branchMappings = mappings.filter((m) => m.branch === activeBranch?.id);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Link2 className="w-5 h-5 text-[#8B16F7]" />
            Branch &amp; GATE Paper Mapping System
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Connect each academic stream to one or more official GATE papers. Supports multi-paper branches (e.g. CSE to CS &amp; DA).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs">
            <button
              onClick={() => setViewMode("BY_BRANCH")}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                viewMode === "BY_BRANCH"
                  ? "bg-[#8B16F7] text-white"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              By Branch
            </button>
            <button
              onClick={() => setViewMode("BY_PAPER")}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                viewMode === "BY_PAPER"
                  ? "bg-[#8B16F7] text-white"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              By GATE Paper
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenConnect(selectedBranchId)}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Connect GATE Paper
          </Button>
        </div>
      </div>

      {/* VIEW MODE 1: BY BRANCH */}
      {viewMode === "BY_BRANCH" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Branch Selector Sidebar */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">
              Select Branch ({branches.length})
            </span>
            <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
              {branches.map((b) => {
                const isSelected = b.id === activeBranch?.id;
                const mappedCount = mappings.filter((m) => m.branch === b.id).length;
                return (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBranchId(b.id)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-[#8B16F7]/15 border-[#8B16F7] text-[var(--text-primary)] shadow-sm"
                        : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                    }`}
                  >
                    <div>
                      <span className="font-mono font-bold text-[#C42BEE] mr-1.5">{b.code}</span>
                      <span className="font-medium">{b.name}</span>
                    </div>
                    <Badge variant={mappedCount > 0 ? "magenta" : "outline"} size="sm">
                      {mappedCount} {mappedCount === 1 ? "Paper" : "Papers"}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mapped Papers Display */}
          <div className="md:col-span-3 space-y-4">
            <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-[#8B16F7]" />
                  {activeBranch?.name} ({activeBranch?.code})
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Connected examination papers eligible for students of this engineering discipline.
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleOpenConnect(activeBranch?.id)}
                leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
              >
                Add Paper
              </Button>
            </div>

            {/* Mappings Table */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-primary)]/80 text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">GATE Paper</th>
                    <th className="py-3 px-3 font-semibold text-center">Paper Type</th>
                    <th className="py-3 px-3 font-semibold text-center">Status</th>
                    <th className="py-3 px-3 font-semibold">Connected Date</th>
                    <th className="py-3 px-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {branchMappings.map((m) => (
                    <tr key={m.id} className="hover:bg-[var(--bg-primary)]/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            GATE {m.gate_paper_code}
                          </span>
                          <span className="font-semibold text-[var(--text-primary)]">
                            {m.gate_paper_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => handleTogglePrimary(m.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition-colors ${
                            m.is_primary
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                              : "bg-purple-500/10 text-purple-400 border-purple-500/25"
                          }`}
                          title="Click to toggle Primary vs Secondary paper"
                        >
                          <Star className={`w-3 h-3 ${m.is_primary ? "fill-emerald-400" : ""}`} />
                          {m.is_primary ? "Primary Target" : "Secondary Option"}
                        </button>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-[var(--text-muted)] font-mono text-[11px]">
                        {new Date(m.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDisconnect(m)}
                          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Disconnect GATE Paper"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {branchMappings.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-xs text-[var(--text-muted)]">
                        No GATE papers mapped to this branch yet. Click &quot;Add Paper&quot; above to connect one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: BY GATE PAPER */}
      {viewMode === "BY_PAPER" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gatePapers.map((paper) => (
            <Card key={paper.code}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center font-mono font-extrabold text-blue-400 text-sm">
                      {paper.code}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">
                        GATE {paper.code} — {paper.name}
                      </h3>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {paper.connected_branches_count} eligible academic branches
                      </p>
                    </div>
                  </div>

                  <Badge variant="outline" size="sm">
                    {paper.is_active ? "Active Exam" : "Inactive"}
                  </Badge>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Eligible Branches:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {paper.connected_branches.map((b) => (
                      <span
                        key={b.mapping_id}
                        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-medium ${
                          b.is_primary
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                            : "bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)]"
                        }`}
                      >
                        <span className="font-mono font-bold">{b.branch_code}</span>
                        <span>{b.branch_name}</span>
                        {b.is_primary && <span className="text-[9px] font-bold text-emerald-400">(Primary)</span>}
                      </span>
                    ))}
                    {paper.connected_branches.length === 0 && (
                      <span className="text-xs text-[var(--text-muted)] italic">
                        No engineering branches mapped to this paper.
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* CONNECT PAPER MODAL */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-strong)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-[#8B16F7]" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Connect GATE Examination Paper
                </h3>
              </div>
              <button
                onClick={() => setShowConnectModal(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConnectSubmit} className="p-5 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Branch Select */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Engineering Branch *
                </label>
                <select
                  value={modalBranchId}
                  onChange={(e) => setModalBranchId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} — {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Paper Select */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  GATE Examination Paper *
                </label>
                <select
                  value={modalPaperCode}
                  onChange={(e) => setModalPaperCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B16F7]"
                >
                  {gatePapers.map((p) => (
                    <option key={p.code} value={p.code}>
                      GATE {p.code} — {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Primary vs Secondary Option */}
              <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalIsPrimary}
                    onChange={(e) => setModalIsPrimary(e.target.checked)}
                    className="accent-[#8B16F7]"
                  />
                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                    Primary Exam Paper
                  </span>
                </label>
                <p className="text-[10px] text-[var(--text-muted)] pl-5">
                  Check if this is the default curriculum paper for students of this branch (e.g. CS for CSE). Uncheck if this is a secondary / dual-paper option (e.g. DA for CSE).
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowConnectModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                  leftIcon={isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : undefined}
                >
                  {isSubmitting ? "Connecting..." : "Confirm Mapping"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

