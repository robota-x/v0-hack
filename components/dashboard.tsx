"use client";

import { useState } from "react";
import useSWR from "swr";
import { ChevronDown, Clock, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetcher } from "@/lib/fetcher";
import { timeAgo } from "@/lib/utils";
import type { Creator, Snapshot, SnapshotTheme } from "@/lib/db";

export function Dashboard({
  creator,
  snapshot: initial,
}: {
  creator: Creator;
  snapshot: Snapshot | null;
}) {
  const { data } = useSWR<{ snapshot: Snapshot | null }>(
    "/api/snapshots/latest",
    fetcher,
    { fallbackData: { snapshot: initial } },
  );
  const snapshot = data?.snapshot ?? initial;

  const themes = (snapshot?.themes ?? []) as SnapshotTheme[];
  const topThemes = themes.slice(0, 3);
  const [expandedCards, setExpandedCards] = useState<number[]>([]);
  const firstName = creator.name?.split(" ")[0] ?? "there";

  function toggleCard(index: number) {
    setExpandedCards((current) =>
      current.includes(index)
        ? current.filter((value) => value !== index)
        : [...current, index],
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Today's snapshot"
        title={`Hey ${firstName} — here's what's stirring.`}
        description={
          snapshot
            ? `Your last sweep was ${timeAgo(snapshot.created_at)}.`
            : "No snapshot yet. The feed appears after a secret workflow run."
        }
      />

      <div className="space-y-4 px-2">
        {themes.length === 0 ? (
          <EmptyState />
        ) : (
          <ol className="space-y-4">
            {topThemes.map((theme, i) => (
              <li key={`${theme.title}-${i}`}>
                <ThemeCard
                  theme={theme}
                  expanded={expandedCards.includes(i)}
                  onToggle={() => toggleCard(i)}
                />
              </li>
            ))}
          </ol>
        )}

        {snapshot && topThemes.length > 0 ? (
          <p className="flex items-center justify-center gap-1.5 pt-3 text-xs font-bold uppercase tracking-wider text-[#1e1b4b]/70">
            <Clock size={12} aria-hidden="true" />
            Updated {timeAgo(snapshot.created_at)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ThemeCard({
  theme,
  expanded,
  onToggle,
}: {
  theme: SnapshotTheme;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className="neo-shadow-hover">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left"
        aria-expanded={expanded}
      >
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold leading-snug text-[#1e1b4b] text-balance">
              {theme.title}
            </h2>
            <ChevronDown
              size={18}
              className={expanded ? "rotate-180 text-[#1e1b4b]" : "text-[#1e1b4b]"}
              aria-hidden="true"
            />
          </div>
          {expanded ? (
            <>
              {typeof theme.source_count === "number" ? (
                <Badge
                  tone="destructive"
                  className="shrink-0 whitespace-nowrap px-2 py-0.5 text-[10px]"
                >
                  {theme.source_count} sources
                </Badge>
              ) : null}
              <p className="text-sm leading-relaxed text-on-surface-variant text-pretty">
                {theme.summary}
              </p>
              {theme.why_it_matters ? (
                <p className="rounded-xl border-2 border-[#1e1b4b] bg-[#eef2ff] px-3 py-2 text-xs leading-relaxed text-[#1e1b4b]">
                  <span className="font-bold uppercase tracking-wide">
                    Why for you:{" "}
                  </span>
                  {theme.why_it_matters}
                </p>
              ) : null}
            </>
          ) : null}
        </CardContent>
      </button>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed border-[#1e1b4b]">
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="grid size-12 place-items-center rounded-full border-2 border-[#1e1b4b] bg-[#fef08a] text-[#1e1b4b]">
          <Sparkles size={22} aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-display text-lg font-extrabold text-[#1e1b4b]">
            Waiting for workflow output
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-on-surface-variant text-pretty">
            This dashboard will populate after the secret workflow URL runs and
            writes a snapshot.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
