"use client";

import { useState } from "react";
import useSWR from "swr";
import { AtSign, Hash, Plus, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetcher } from "@/lib/fetcher";
import type { FollowAccount, FollowHashtag } from "@/lib/db";

type FollowsResp = {
  accounts: FollowAccount[];
  hashtags: FollowHashtag[];
};

export function FollowManager() {
  const { data, mutate, isLoading } = useSWR<FollowsResp>(
    "/api/follows",
    fetcher,
  );

  return (
    <div>
      <PageHeader
        eyebrow="Your sphere"
        title="Who you follow"
        description="Add Instagram accounts and hashtags. We'll watch them on your behalf."
      />

      <div className="space-y-5 px-2">
        <Section
          icon={<AtSign size={16} aria-hidden="true" />}
          title="Accounts"
          placeholder="@username"
          items={(data?.accounts ?? []).map((a) => ({
            id: a.id,
            label: `@${a.username}`,
          }))}
          loading={isLoading}
          onAdd={async (raw) => {
            const res = await fetch("/api/follows/accounts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username: raw }),
            });
            if (!res.ok) {
              const { error } = await res.json().catch(() => ({}));
              throw new Error(error ?? "Could not add");
            }
            await mutate();
          }}
          onRemove={async (id) => {
            await fetch(`/api/follows/accounts/${id}`, { method: "DELETE" });
            await mutate();
          }}
        />

        <Section
          icon={<Hash size={16} aria-hidden="true" />}
          title="Hashtags"
          placeholder="#hashtag"
          items={(data?.hashtags ?? []).map((h) => ({
            id: h.id,
            label: `#${h.tag}`,
          }))}
          loading={isLoading}
          onAdd={async (raw) => {
            const res = await fetch("/api/follows/hashtags", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tag: raw }),
            });
            if (!res.ok) {
              const { error } = await res.json().catch(() => ({}));
              throw new Error(error ?? "Could not add");
            }
            await mutate();
          }}
          onRemove={async (id) => {
            await fetch(`/api/follows/hashtags/${id}`, { method: "DELETE" });
            await mutate();
          }}
        />
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  placeholder,
  items,
  loading,
  onAdd,
  onRemove,
}: {
  icon: React.ReactNode;
  title: string;
  placeholder: string;
  items: { id: number; label: string }[];
  loading: boolean;
  onAdd: (raw: string) => Promise<void>;
  onRemove: (id: number) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!value.trim()) return;
    setSubmitting(true);
    try {
      await onAdd(value);
      setValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="neo-shadow">
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-foreground">
          <span className="grid size-7 place-items-center rounded-full border-2 border-[#1e1b4b] bg-[#fef08a] text-[#1e1b4b]">
            {icon}
          </span>
          <h2 className="font-display text-lg font-extrabold text-[#1e1b4b]">
            {title}
          </h2>
          <span className="ml-auto rounded-full border-2 border-[#1e1b4b] bg-[#a3e635] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#1e1b4b]">
            {items.length}
          </span>
        </div>

        <form onSubmit={submit} className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            aria-label={`Add ${title.toLowerCase()}`}
          />
          <Button
            type="submit"
            size="md"
            disabled={submitting || !value.trim()}
            aria-label="Add"
          >
            <Plus size={16} aria-hidden="true" />
          </Button>
        </form>
        {error ? (
          <p className="text-xs font-semibold text-[#f43f5e]" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-on-surface-variant">Loading…</p>
        ) : items.length === 0 ? (
          <p className="rounded-xl border-2 border-dashed border-[#1e1b4b] bg-white/60 px-3 py-2.5 text-sm text-on-surface-variant">
            Nothing here yet. Add your first one above.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="group inline-flex items-center gap-1.5 rounded-full border-2 border-[#1e1b4b] bg-[#fef08a] px-3 py-1.5 text-sm font-semibold text-[#1e1b4b] transition-colors hover:bg-[#ffe975]"
                  aria-label={`Remove ${item.label}`}
                >
                  <span>{item.label}</span>
                  <X
                    size={14}
                    className="text-[#1e1b4b]/70 group-hover:text-[#f43f5e]"
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
