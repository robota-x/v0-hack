"use client";

import { useState } from "react";
import useSWR from "swr";
import { Sparkles, RefreshCw, Clock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const { data, mutate } = useSWR<{ snapshot: Snapshot | null }>(
    "/api/snapshots/latest",
    fetcher,
    { fallbackData: { snapshot: initial } },
  );
  const snapshot = data?.snapshot ?? initial;
  const [triggering, setTriggering] = useState(false);

  async function handleTrigger() {
    setTriggering(true);
    try {
      await fetch("/api/workflows/trigger", { method: "POST" });
      await mutate();
    } finally {
      setTriggering(false);
    }
  }

  const themes = (snapshot?.themes ?? []) as SnapshotTheme[];
  const firstName = creator.name?.split(" ")[0] ?? "there";

  return (
    <div>
      <PageHeader
        eyebrow="Today's snapshot"
        title={`Hey ${firstName} — here's what's stirring.`}
        description={
          snapshot
            ? `Your last sweep was ${timeAgo(snapshot.created_at)}.`
            : "No snapshot yet. Run a sweep to see what's trending in your sphere."
        }
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={handleTrigger}
            disabled={triggering}
            aria-label="Run sweep"
          >
            <RefreshCw
              size={14}
              className={triggering ? "animate-spin" : ""}
              aria-hidden="true"
            />
            {triggering ? "Running" : "Sweep"}
          </Button>
        }
      />

      <div className="space-y-3 px-5">
        {snapshot && snapshot.summary ? (
          <Card className="border-accent/40 bg-accent/15">
            <CardContent className="flex gap-3">
              <Sparkles
                size={18}
                className="mt-0.5 shrink-0 text-accent-foreground"
                aria-hidden="true"
              />
              <p className="text-sm leading-relaxed text-foreground">
                {snapshot.summary}
              </p>
            </CardContent>
          </Card>
        ) : null}

        {themes.length === 0 ? (
          <EmptyState onTrigger={handleTrigger} triggering={triggering} />
        ) : (
          <ol className="space-y-3">
            {themes.map((theme, i) => (
              <li key={`${theme.title}-${i}`}>
                <ThemeCard theme={theme} />
              </li>
            ))}
          </ol>
        )}

        {snapshot ? (
          <p className="flex items-center justify-center gap-1.5 pt-4 text-xs text-muted-foreground">
            <Clock size={12} aria-hidden="true" />
            Updated {timeAgo(snapshot.created_at)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ThemeCard({ theme }: { theme: SnapshotTheme }) {
  return (
    <Card>
      <CardContent className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-display text-xl text-primary">
              {String(theme.rank).padStart(2, "0")}
            </span>
            <h2 className="font-display text-lg leading-snug text-foreground text-balance">
              {theme.title}
            </h2>
          </div>
          {typeof theme.source_count === "number" ? (
            <Badge tone="primary">{theme.source_count} sources</Badge>
          ) : null}
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
          {theme.summary}
        </p>
        {theme.why_it_matters ? (
          <p className="rounded-md bg-muted px-3 py-2 text-xs leading-relaxed text-foreground">
            <span className="font-medium">Why for you: </span>
            {theme.why_it_matters}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function EmptyState({
  onTrigger,
  triggering,
}: {
  onTrigger: () => void;
  triggering: boolean;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-primary/15 text-primary">
          <Sparkles size={22} aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-display text-lg text-foreground">
            Your first sweep awaits
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground text-pretty">
            We'll scan the accounts and tags you follow, then surface the themes
            that matter to your niche.
          </p>
        </div>
        <Button onClick={onTrigger} disabled={triggering}>
          <RefreshCw
            size={14}
            className={triggering ? "animate-spin" : ""}
            aria-hidden="true"
          />
          {triggering ? "Running" : "Run first sweep"}
        </Button>
      </CardContent>
    </Card>
  );
}
