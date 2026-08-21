import { useMemo, useState } from "react";
import { useOffice } from "../store";
import { SEED_TASKS, TODAY_DAY, OWNERS, type TimelineTask, type TaskStatus } from "../data";
import { Scramble, Reveal, SectionLabel, Pill, StatusDot } from "../ui";
import { IcTimeline, IcX, IcCheck, IcAlert, IcClock } from "../icons";

const DAYS = 42;
const START = new Date(2025, 8, 1); // Sep 1, 2025 — a Monday
const dayDate = (d: number) => new Date(START.getTime() + d * 86400000);
const dayLabel = (d: number) => dayDate(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const pct = (d: number) => `${(d / DAYS) * 100}%`;

const TRACKS: TimelineTask["track"][] = ["Automation", "Documents", "Infrastructure"];
const TRACK_TONE: Record<string, string> = { Automation: "text-green", Documents: "text-amber", Infrastructure: "text-cyan" };

const STATUS_META: Record<TaskStatus, { label: string; cls: string; dot: "green" | "amber" | "coral" | "faint" }> = {
  done: { label: "Done", cls: "bg-green/25 border-green/50", dot: "green" },
  active: { label: "In progress", cls: "bg-green/75 border-green", dot: "green" },
  todo: { label: "Queued", cls: "bg-lift border-line2", dot: "faint" },
  blocked: {
    label: "Blocked",
    cls: "bg-coral/20 border-coral/60",
    dot: "coral",
  },
};

export default function TimelineView() {
  const { addEvent } = useOffice();
  const [tasks, setTasks] = useState<TimelineTask[]>(SEED_TASKS);
  const [filter, setFilter] = useState<"All" | TimelineTask["track"]>("All");
  const [openId, setOpenId] = useState<string | null>(null);

  const weeks = useMemo(() => Array.from({ length: 6 }, (_, i) => dayLabel(i * 7)), []);
  const open = tasks.find((t) => t.id === openId) ?? null;

  const setStatus = (id: string, status: TaskStatus) => {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status } : t)));
    const t = tasks.find((x) => x.id === id);
    if (t) addEvent("system", `"${t.title}" marked ${STATUS_META[status].label.toLowerCase()}`);
  };

  const counts = useMemo(() => {
    const c: Record<TaskStatus, number> = { done: 0, active: 0, todo: 0, blocked: 0 };
    tasks.forEach((t) => { if (!t.milestone) c[t.status]++; });
    return c;
  }, [tasks]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel>Module 03 / Work timeline</SectionLabel>
          <h1 className="mt-2 font-display text-[32px] font-bold leading-none tracking-tight sm:text-[38px]">
            <Scramble text="Six-week work plan" />
          </h1>
          <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-mute">
            {dayLabel(0)} → {dayLabel(DAYS - 1)} · three tracks, {tasks.filter((t) => t.milestone).length} milestones.
            Today sits at day {TODAY_DAY + 1} of the cycle.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["All", ...TRACKS] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`chip cursor-pointer transition-all duration-150 ${
                filter === f ? "border-green/50 bg-green/10 text-green" : "hover:border-line2 hover:text-ink"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      {/* legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {(Object.keys(STATUS_META) as TaskStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-2 font-mono text-[11px] text-mute">
            <StatusDot tone={STATUS_META[s].dot} /> {STATUS_META[s].label} · {counts[s]}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-3 font-mono text-[11px] text-faint">
          {Object.entries(OWNERS).map(([k, o]) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full text-[8px] font-bold text-bg" style={{ backgroundColor: o.color, width: 18, height: 18 }}>{k}</span>
              {o.name.split(" ")[0]}
            </span>
          ))}
        </span>
      </div>

      {/* gantt */}
      <Reveal>
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[880px]">
              {/* week header */}
              <div className="flex border-b border-line bg-raise/60">
                <div className="w-[228px] shrink-0 border-r border-line px-4 py-2.5">
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">Workstream</span>
                </div>
                <div className="relative flex-1">
                  <div className="grid grid-cols-6">
                    {weeks.map((w, i) => (
                      <div key={w} className={`border-r border-line/60 px-2.5 py-2.5 font-mono text-[11px] last:border-0 ${i * 7 <= TODAY_DAY && TODAY_DAY < (i + 1) * 7 ? "text-green" : "text-faint"}`}>
                        {w}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* rows */}
              {TRACKS.filter((tr) => filter === "All" || filter === tr).map((track) => (
                <div key={track}>
                  <div className="flex items-center border-b border-line/70 bg-panel">
                    <div className={`w-[228px] shrink-0 border-r border-line px-4 py-2 font-display text-[13px] font-semibold ${TRACK_TONE[track]}`}>
                      {track}
                    </div>
                    <div className="relative h-8 flex-1">
                      {/* day grid */}
                      {Array.from({ length: DAYS - 1 }, (_, i) => (
                        <span key={i} className={`absolute top-0 h-full w-px ${(i + 1) % 7 === 0 ? "bg-line" : "bg-line/40"}`} style={{ left: pct(i + 1) }} />
                      ))}
                      <span className="absolute top-0 z-10 h-full w-px border-l border-dashed border-coral/70" style={{ left: pct(TODAY_DAY + 0.5) }} />
                    </div>
                  </div>

                  {tasks.filter((t) => t.track === track).map((t, ti) => {
                    const owner = OWNERS[t.owner];
                    const meta = STATUS_META[t.status];
                    return (
                      <div key={t.id} className="group flex items-center border-b border-line/50 transition-colors last:border-0 hover:bg-raise/50">
                        <div className="flex w-[228px] shrink-0 cursor-pointer items-center gap-2.5 border-r border-line px-4 py-2" onClick={() => setOpenId(t.id)}>
                          <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[8.5px] font-bold text-bg" style={{ backgroundColor: owner.color }}>
                            {t.owner}
                          </span>
                          <span className="truncate text-[12.5px] text-ink/90 transition-colors group-hover:text-ink">{t.title}</span>
                          {t.milestone && <span className="ml-auto rotate-45 border border-amber bg-amber/30" style={{ width: 8, height: 8 }} />}
                        </div>
                        <div className="relative h-9 flex-1">
                          {Array.from({ length: DAYS - 1 }, (_, i) => (
                            <span key={i} className={`absolute top-0 h-full w-px ${(i + 1) % 7 === 0 ? "bg-line/70" : "bg-line/30"}`} style={{ left: pct(i + 1) }} />
                          ))}
                          {/* today */}
                          <span className="absolute top-0 z-10 h-full w-px border-l border-dashed border-coral/70" style={{ left: pct(TODAY_DAY + 0.5) }} />

                          {t.milestone ? (
                            <button
                              onClick={() => setOpenId(t.id)}
                              className="absolute top-1/2 z-20 -translate-y-1/2 cursor-pointer"
                              style={{ left: `calc(${pct(t.start + 0.5)} - 7px)` }}
                              aria-label={t.title}
                            >
                              <span className="block rotate-45 border-2 border-amber bg-bg transition-transform duration-200 hover:scale-125" style={{ width: 13, height: 13 }} />
                              <span className="pointer-events-none absolute -top-7 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-md border border-line2 bg-raise px-2 py-1 font-mono text-[10.5px] text-ink opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                                ◆ {t.title} · {dayLabel(t.start)}
                              </span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setOpenId(t.id)}
                              className={`bar-in absolute top-1/2 z-20 flex h-[22px] -translate-y-1/2 cursor-pointer items-center overflow-hidden rounded-[5px] border px-2 transition-all duration-150 hover:brightness-125 ${meta.cls}`}
                              style={{
                                left: pct(t.start),
                                width: pct(t.end - t.start + 1),
                                animationDelay: `${ti * 70}ms`,
                                ...(t.status === "blocked" ? { backgroundImage: "repeating-linear-gradient(45deg, rgba(224,96,74,0.25) 0 6px, transparent 6px 12px)" } : {}),
                              }}
                            >
                              <span className={`truncate font-mono text-[10px] font-semibold ${t.status === "active" ? "text-bg" : "text-ink/80"}`}>
                                {t.end - t.start + 1}d
                              </span>
                              <span className="pointer-events-none absolute -top-8 left-2 z-30 whitespace-nowrap rounded-md border border-line2 bg-raise px-2 py-1 font-mono text-[10.5px] text-ink opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                                {t.title} · {dayLabel(t.start)}–{dayLabel(t.end)}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          {/* today footer */}
          <div className="flex items-center gap-2 border-t border-line bg-raise/40 px-4 py-2 font-mono text-[11px] text-faint">
            <IcClock size={12} className="text-coral" />
            Today · {dayLabel(TODAY_DAY)} — day {TODAY_DAY + 1}/{DAYS}. Click any bar for details.
            <span className="ml-auto hidden sm:inline">{dayLabel(DAYS - 1)} · cycle end</span>
          </div>
        </div>
      </Reveal>

      {/* milestones strip */}
      <Reveal delay={120}>
        <div className="panel p-5">
          <SectionLabel>Milestones</SectionLabel>
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-4">
            {tasks.filter((t) => t.milestone).map((t) => (
              <button key={t.id} onClick={() => setOpenId(t.id)} className="group flex cursor-pointer items-center gap-3 text-left">
                <span className="rotate-45 border-2 border-amber bg-amber/20 transition-transform duration-200 group-hover:scale-125" style={{ width: 12, height: 12 }} />
                <span>
                  <span className="block font-display text-[14px] font-semibold tracking-tight group-hover:text-amber">{t.title}</span>
                  <span className="font-mono text-[11px] text-faint">
                    {dayLabel(t.start)} · in {t.start - TODAY_DAY} days · {t.track}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      {/* detail drawer */}
      {open && (
        <div className="fixed inset-0 z-50" onMouseDown={() => setOpenId(null)}>
          <div className="absolute inset-0 bg-[#070b08]/60 backdrop-blur-[2px]" />
          <div
            className="toast-in absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-line2 bg-raise shadow-[-30px_0_80px_-30px_rgba(3,7,4,0.9)]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <Pill tone="faint" className={TRACK_TONE[open.track]}>{open.track}</Pill>
              <button className="btn-ghost px-2 py-1" onClick={() => setOpenId(null)} aria-label="Close details"><IcX size={15} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <h2 className="font-display text-[20px] font-bold leading-tight tracking-tight">{open.title}</h2>
              <p className="mt-1 font-mono text-[11.5px] text-faint">
                {dayLabel(open.start)} → {dayLabel(open.end)} · {open.end - open.start + 1} day{open.end - open.start ? "s" : ""}
              </p>

              <div className="mt-5 flex items-center gap-3 rounded-md border border-line bg-panel p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold text-bg" style={{ backgroundColor: OWNERS[open.owner].color }}>
                  {open.owner}
                </span>
                <div>
                  <p className="text-[13px] font-semibold">{OWNERS[open.owner].name}</p>
                  <p className="font-mono text-[11px] text-faint">workstream owner</p>
                </div>
              </div>

              <p className="mt-5 text-[13px] leading-relaxed text-mute">{open.note}</p>

              <p className="mt-6 font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">Set status</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(Object.keys(STATUS_META) as TaskStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(open.id, s)}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-[12.5px] font-medium transition-all duration-150 ${
                      open.status === s ? "border-green/50 bg-green/10 text-green" : "border-line bg-panel text-mute hover:border-line2 hover:text-ink"
                    }`}
                  >
                    {s === "done" ? <IcCheck size={12} /> : s === "blocked" ? <IcAlert size={12} /> : <StatusDot tone={STATUS_META[s].dot} />}
                    {STATUS_META[s].label}
                  </button>
                ))}
              </div>

              <div className="mt-6 rounded-md border border-line bg-panel p-3 font-mono text-[11px] leading-relaxed text-faint">
                {open.start <= TODAY_DAY && open.end >= TODAY_DAY ? (
                  <span className="text-coral">● in-flight — today falls inside this window</span>
                ) : open.end < TODAY_DAY ? (
                  <span>● closed window · archived to the ledger</span>
                ) : (
                  <span>● starts in {open.start - TODAY_DAY} day{open.start - TODAY_DAY === 1 ? "" : "s"}</span>
                )}
              </div>
            </div>
            <div className="border-t border-line px-5 py-3">
              <button className="btn w-full justify-center" onClick={() => setOpenId(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <Reveal delay={60}>
        <p className="flex items-center gap-2 font-mono text-[11px] text-faint">
          <IcTimeline size={13} className="text-green" /> Plan synced from the ops ledger · edits write back to the shared timeline.
        </p>
      </Reveal>
    </div>
  );
}
