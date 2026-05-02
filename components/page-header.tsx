import * as React from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-4 px-2 pb-5 pt-2">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="inline-flex rounded-full border-2 border-[#1e1b4b] bg-[#fef08a] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#1e1b4b]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-balance text-[#1e1b4b]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface-variant text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0 pt-1">{action}</div> : null}
    </header>
  );
}
