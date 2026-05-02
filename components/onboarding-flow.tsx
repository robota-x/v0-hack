"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Creator } from "@/lib/db";

const TOTAL_STEPS = 4;

type Draft = {
  name: string;
  niche: string;
  accounts: string[];
  hashtags: string[];
};

export function OnboardingFlow({
  initial,
  initialAccounts = [],
  initialHashtags = [],
}: {
  initial?: Creator;
  initialAccounts?: string[];
  initialHashtags?: string[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({
    name: initial?.name ?? "",
    niche: initial?.niche ?? "",
    accounts: [...initialAccounts],
    hashtags: [...initialHashtags],
  });

  function next() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function finish() {
    setFinishError(null);
    setSubmitting(true);
    try {
      // 1. Save profile + mark onboarded
      const patchRes = await fetch("/api/creator", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          niche: draft.niche.trim(),
          interests: initial?.interests ?? [],
          style: initial?.style ?? "",
          onboarded: true,
        }),
      });
      if (!patchRes.ok) {
        throw new Error("Could not save profile");
      }

      const syncRes = await fetch("/api/follows/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accounts: draft.accounts,
          hashtags: draft.hashtags,
        }),
      });
      if (!syncRes.ok) {
        const err = await syncRes.json().catch(() => ({}));
        throw new Error(
          typeof err.error === "string" ? err.error : "Could not sync follows",
        );
      }

      router.replace("/");
      router.refresh();
    } catch (e) {
      setFinishError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const canAdvance = (() => {
    if (step === 0) return true; // welcome
    if (step === 1) return draft.name.trim().length > 0;
    if (step === 2) return draft.niche.trim().length > 0;
    if (step === 3) return true; // follows optional
    return false;
  })();

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="neo-glass mx-2 mt-2 flex items-center gap-2 px-5 py-4">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-2 flex-1 rounded-full border border-[#1e1b4b] transition-colors",
              i <= step ? "bg-[#a3e635]" : "bg-white/60",
            )}
            aria-hidden="true"
          />
        ))}
      </div>

      <div className="flex flex-1 flex-col px-2 pt-6">
        {step === 0 ? <Welcome /> : null}
        {step === 1 ? (
          <StepShell
            eyebrow="Step 1 of 3"
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
            eyebrow="Step 2 of 3"
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
            eyebrow="Step 3 of 3"
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

      <footer className="sticky bottom-0 mt-6 flex flex-col gap-2 border-t-2 border-[#1e1b4b] bg-white/80 px-2 py-4 backdrop-blur">
        {finishError ? (
          <p className="text-center text-sm font-semibold text-[#f43f5e]" role="alert">
            {finishError}
          </p>
        ) : null}
        <div className="flex items-center gap-2">
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
        </div>
      </footer>
    </div>
  );
}

function Welcome() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <div className="grid size-16 place-items-center rounded-full border-2 border-[#1e1b4b] bg-[#fef08a] text-[#1e1b4b]">
        <Sparkles size={28} aria-hidden="true" />
      </div>
      <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight text-balance text-[#1e1b4b]">
        Meet your creator companion.
      </h1>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-on-surface-variant text-pretty">
        We watch your sphere of interest on Instagram and surface the trends
        that actually fit your voice. No noise, no chasing.
      </p>
      <Card className="neo-shadow mt-8 w-full text-left">
        <CardContent className="space-y-2 text-sm">
          <Bullet>Share your name and niche</Bullet>
          <Bullet>Add accounts and hashtags to watch</Bullet>
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
        className="mt-1.5 size-2 shrink-0 rounded-full bg-[#f43f5e]"
        aria-hidden="true"
      />
      <span className="leading-relaxed text-on-surface">{children}</span>
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
    <div className="neo-glass flex flex-1 flex-col p-6">
      <p className="inline-flex w-fit rounded-full border-2 border-[#1e1b4b] bg-[#fef08a] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#1e1b4b]">
        {eyebrow}
      </p>
      <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-balance text-[#1e1b4b]">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-on-surface-variant text-pretty">
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
      <p className="text-sm font-bold uppercase tracking-wider text-[#1e1b4b]">
        {label}
      </p>
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
              className="inline-flex items-center gap-1 rounded-full border-2 border-[#1e1b4b] bg-[#fef08a] px-2.5 py-1 text-xs font-semibold text-[#1e1b4b]"
            >
              <span>
                {label === "Accounts" ? `@${item}` : `#${item}`}
              </span>
              <button
                type="button"
                onClick={() =>
                  onChange(items.filter((i) => i !== item))
                }
                className="text-[#1e1b4b]/70 hover:text-[#f43f5e]"
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
