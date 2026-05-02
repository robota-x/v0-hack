"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { InterestChips } from "@/components/interest-chips";
import type { Creator } from "@/lib/db";

export function ProfileEditor({ initial }: { initial: Creator }) {
  const [name, setName] = useState(initial.name ?? "");
  const [niche, setNiche] = useState(initial.niche ?? "");
  const [interests, setInterests] = useState<string[]>(initial.interests ?? []);
  const [style, setStyle] = useState(initial.style ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/creator", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, niche, interests, style }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Your profile"
        title="The lens we filter through"
        description="The more we know about you, the better we can rank what matters."
      />

      <form onSubmit={save} className="space-y-4 px-2">
        <Card className="neo-shadow">
          <CardContent className="space-y-4">
            <Field label="Name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mira"
                required
              />
            </Field>
            <Field
              label="Your niche"
              hint="One short phrase. Think 'sustainable fashion' or 'indie game dev'."
            >
              <Input
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="Sustainable fashion"
              />
            </Field>
            <Field
              label="Interests"
              hint="What you actively dig into. Press enter to add."
            >
              <InterestChips value={interests} onChange={setInterests} />
            </Field>
            <Field
              label="Your voice & style"
              hint="A few sentences on tone, format, what you make."
            >
              <Textarea
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                placeholder="Warm, curious, mid-length carousels with hand-drawn details. I avoid trend-chasing."
              />
            </Field>
          </CardContent>
        </Card>

        <Button
          type="submit"
          size="lg"
          className="w-full justify-center"
          disabled={saving}
        >
          {saved ? (
            <>
              <Check size={16} aria-hidden="true" /> Saved
            </>
          ) : saving ? (
            "Saving…"
          ) : (
            "Save changes"
          )}
        </Button>
      </form>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-bold uppercase tracking-wider text-[#1e1b4b]">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="block text-xs text-on-surface-variant">{hint}</span>
      ) : null}
    </label>
  );
}
