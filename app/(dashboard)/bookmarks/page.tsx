"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark, Trash2, ArrowRight, Loader2, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { fetchBookmarkedQuestions, toggleQuestionBookmark } from "@/lib/api/questions";
import type { BookmarkItem } from "@/types/question";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadBookmarks() {
      setLoading(true);
      try {
        const data = await fetchBookmarkedQuestions();
        setBookmarks(data);
      } catch (err) {
        console.error("Failed to load bookmarks:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBookmarks();
  }, []);

  const handleRemove = async (questionId: string) => {
    try {
      await toggleQuestionBookmark(questionId);
      setBookmarks((prev) => prev.filter((b) => b.question.id !== questionId));
    } catch (err) {
      console.error("Failed to remove bookmark:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="pb-4 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
              Saved Bookmarks
            </h1>
            <Badge variant="orange" size="sm">
              {bookmarks.length} Saved
            </Badge>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Tricky and high-yield questions bookmarked during practice sessions for quick revision.
          </p>
        </div>

        <Link href="/practice">
          <Button variant="secondary" size="sm" leftIcon={<BookOpen className="w-3.5 h-3.5" />}>
            Practice More
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#8B16F7]" />
          <p className="text-xs text-[var(--text-secondary)]">Loading bookmarked questions...</p>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FF791E]/12 flex items-center justify-center text-[#FF791E] mx-auto">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-[var(--text-primary)]">
            No Bookmarked Questions Yet
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            Click the bookmark icon on any question in the Practice Module or PYQ section to save it here for fast revision.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((b) => (
            <div
              key={b.id}
              className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#8B16F7]/40 transition-all space-y-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="purple" size="sm">
                    {b.question.subject_name}
                  </Badge>
                  <Badge variant="outline" size="sm">
                    {b.question.topic_name}
                  </Badge>
                  <Badge variant="orange" size="sm">
                    {b.question.question_type}
                  </Badge>
                  {b.question.is_pyq && (
                    <Badge variant="warning" size="sm">
                      GATE {b.question.pyq_year}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRemove(b.question.id)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Remove from Bookmarks"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm font-medium text-[var(--text-primary)] leading-relaxed whitespace-pre-line line-clamp-3">
                {b.question.statement}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
                <span className="text-[11px] text-[var(--text-muted)]">
                  +{b.question.marks} Marks • {b.question.difficulty}
                </span>

                <Link href={`/practice?subject=${b.question.subject_slug}&topic=${b.question.topic_slug}`}>
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Practice Now
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
