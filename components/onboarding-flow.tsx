"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { InterestChips } from "@/components/interest-chips";
import { cn } from "@/lib/utils";
import type { Creator } from "@/lib/db";

const TOTAL_STEPS = 5;

type Draft = {
  name: string;
  niche: string;
  interests: string[];
  style: string;
  accounts: string[];
  hashtags: string[];
};

export function OnboardingFlow({ initial }: { initial?: Creator }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    name: initial?.name ?? "",
    niche: initial?.niche ?? "",
    interests: initial?.interests ?? [],
    style: initial?.style ?? "",
    accounts: [],
    hashtags: [],
  });

  function next() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function finish() {
    setSubmitting(true);
    try {
      // 1. Save profile + mark onboarded
      await fetch("/api/creator", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          niche: draft.niche.trim(),
          interests: draft.interests,
          style: draft.style.trim(),
          onboarded: true,
        }),
      });

      // 2. Seed follow list (best-effort, run sequentially to keep it simple)
      for (const username of draft.accounts) {
        await fetch("/api/follows/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
      }
      for (const tag of draft.hashtags) {
        await fetch("/api/follows/hashtags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tag }),
        });
      }

      router.replace("/");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const canAdvance = (() => {
    if (step === 0) return true; // welcome
    if (step === 1) return draft.name.trim().length > 0;
    if (step === 2) return draft.niche.trim().length > 0;
    if (step === 3) return true; // interests + style optional
    if (step === 4) return true; // follows optional
    return false;
  })();

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex items-center gap-2 px-5 pt-6">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= step ? "bg-primary" : "bg-muted",
            )}
            aria-hidden="true"
          />
        ))}
      </div>

      <div className="flex flex-1 flex-col px-5 pt-8">
        {step === 0 ? <Welcome /> : null}
        {step === 1 ? (
          <StepShell
            eyebrow="Step 1 of 4"
            title="What should we call you?"
            description="Just a first name is fine — keeps the dashboard friendly."
          >
            <Input
              autoFocus
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Mira"
            />
          </StepShell>
        ) : null}
        {step === 2 ? (
          <StepShell
            eyebrow="Step 2 of 4"
            title="What's your niche?"
            description="A short phrase. We use this to filter signal from noise."
          >
            <Input
              autoFocus
              value={draft.niche}
              onChange={(e) => setDraft({ ...draft, niche: e.target.value })}
              placeholder="Sustainable fashion"
            />
          </StepShell>
        ) : null}
        {step === 3 ? (
          <StepShell
            eyebrow="Step 3 of 4"
            title="Your interests & style"
            description="Optional, but it sharpens our recommendations."
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Interests</p>
                <InterestChips
                  value={draft.interests}
                  onChange={(interests) => setDraft({ ...draft, interests })}
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Voice & style</p>
                <Textarea
                  value={draft.style}
                  onChange={(e) =>
                    setDraft({ ...draft, style: e.target.value })
                  }
                  placeholder="Warm, curious, mid-length carousels with hand-drawn details."
                />
              </div>
            </div>
          </StepShell>
        ) : null}
        {step === 4 ? (
          <StepShell
            eyebrow="Step 4 of 4"
            title="Who should we watch?"
            description="Add a few starter accounts and tags. You can add more later."
          >
            <div className="space-y-4">
              <SeedList
                label="Accounts"
                placeholder="@username"
                items={draft.accounts}
                onChange={(accounts) => setDraft({ ...draft, accounts })}
                normalize={(v) =>
                  v.trim().replace(/^@/, "").toLowerCase()
                }
              />
              <SeedList
                label="Hashtags"
                placeholder="#hashtag"
                items={draft.hashtags}
                onChange={(hashtags) => setDraft({ ...draft, hashtags })}
                normalize={(v) =>
                  v.trim().replace(/^#/, "").toLowerCase()
                }
              />
            </div>
          </StepShell>
        ) : null}
      </div>

      <footer className="sticky bottom-0 flex items-center gap-2 border-t border-border bg-background/90 px-5 py-4 backdrop-blur">
        {step > 0 ? (
          <Button
            variant="ghost"
            onClick={back}
            disabled={submitting}
            aria-label="Back"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back
          </Button>
        ) : null}
        <div className="ml-auto">
          {step < TOTAL_STEPS - 1 ? (
            <Button onClick={next} disabled={!canAdvance}>
              {step === 0 ? "Get started" : "Continue"}
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          ) : (
            <Button onClick={finish} disabled={submitting}>
              {submitting ? "Setting up…" : "Open my dashboard"}
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

function Welcome() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <div className="grid size-16 place-items-center rounded-full bg-primary/15 text-primary">
        <Sparkles size={28} aria-hidden="true" />
      </div>
      <h1 className="mt-5 font-display text-4xl leading-tight text-balance">
        Meet your creator companion.
      </h1>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground text-pretty">
        We watch your sphere of interest on Instagram and surface the trends
        that actually fit your voice. No noise, no chasing.
      </p>
      <Card className="mt-8 w-full text-left">
        <CardContent className="space-y-2 text-sm">
          <Bullet>Tell us a little about your work</Bullet>
          <Bullet>Add accounts and tags to follow</Bullet>
          <Bullet>Get a daily snapshot — ranked for you</Bullet>
        </CardContent>
      </Card>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2.5">
      <span
        className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
        aria-hidden="true"
      />
      <span className="leading-relaxed text-foreground">{children}</span>
    </p>
  );
}

function StepShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {eyebrow}
      </p>
      <h1 className="mt-2 font-display text-3xl leading-tight text-balance">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
        {description}
      </p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function SeedList({
  label,
  placeholder,
  items,
  onChange,
  normalize,
}: {
  label: string;
  placeholder: string;
  items: string[];
  onChange: (items: string[]) => void;
  normalize: (raw: string) => string;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const value = normalize(draft);
    if (!value) return;
    if (items.includes(value)) {
      setDraft("");
      return;
    }
    onChange([...items, value]);
    setDraft("");
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <Button type="button" onClick={add} disabled={!draft.trim()}>
          Add
        </Button>
      </div>
      {items.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <li
              key={item}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs"
            >
              <span>
                {label === "Accounts" ? `@${item}` : `#${item}`}
              </span>
              <button
                type="button"
                onClick={() =>
                  onChange(items.filter((i) => i !== item))
                }
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${item}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
