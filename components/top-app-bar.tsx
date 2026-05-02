"use client";

import { Bell } from "lucide-react";

export function TopAppBar() {
  return (
    <header className="fixed left-1/2 top-0 z-50 flex w-full max-w-md -translate-x-1/2 items-center justify-between border-b-2 border-[#1e1b4b] bg-white/80 px-6 py-4 backdrop-blur-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center gap-3">
        <div
          className="grid size-10 place-items-center rounded-full border-2 border-[#1e1b4b] bg-[#fef08a] text-sm font-extrabold text-[#1e1b4b]"
          aria-hidden="true"
        >
          CC
        </div>
        <p className="text-2xl font-black italic tracking-tighter text-indigo-700">
          Creator Companion
        </p>
      </div>
      <button
        type="button"
        className="grid size-10 place-items-center rounded-full border-2 border-[#1e1b4b] bg-white text-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-indigo-50 active:translate-y-0.5"
        aria-label="Notifications"
      >
        <Bell size={18} strokeWidth={2.25} aria-hidden="true" />
      </button>
    </header>
  );
}
