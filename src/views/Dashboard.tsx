import { useEffect, useState } from "react";
import { useOffice } from "../store";
import { SEED_TASKS, TODAY_DAY, type EvType } from "../data";
import { Scramble, Reveal, CountUp, Spark, Pill, StatusDot, SectionLabel } from "../ui";
import { IcBolt, IcMerge, IcCloud, IcPenDoc, IcSettings, IcTimeline, IcArrowUR, IcChevronR, IcTerminal, IcDatabase } from "../icons";

const EV_META: Record<EvType, { icon: typeof IcBolt; tone: string }> = {
  automation: { icon: IcBolt, tone: "text-green" },
  merge: { icon: IcMerge, tone: "text-amber" },
  files: { icon: IcCloud, tone: "text-cyan" },
  editor: { icon: IcPenDoc, tone: "text-cyan" },
  system: { icon: IcSettings, tone: "text-mute" },
};

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export default function Dashboard() {
  const { events, jobs, mergedTotal, go, openDoc } = useOffice();
  const now = useClock();
  const activeJobs = jobs.filter((j) => j.status === "success" || j.status === "running").length;
  const upcoming = SEED_TASKS.filter((t) => t.start >= TODAY_DAY).slice(0, 4);

  const tiles = [
    {
      id: "automations" as const,
      name: "Data automation",
      desc: "Python runners scraping external sources on schedule",
      icon: IcBolt,
      meta: `${jobs.length} jobs · ${jobs.filter((j) => j.status === "failed").length} failing`,
      span: "lg:col-span-4",
      tint: "text-green",
    },
    {
      id: "merge" as const,
      name: "Mail merge",
      desc: "Push dataset rows into documents, Word-style",
      icon: IcMerge,
      meta: `${mergedTotal} docs merged this quarter`,
      span: "lg:col-span-4",
      tint: "text-amber",
    },
    {
      id: "timeline" as const,
      name: "Work timeline",
      desc: "Six-week plan across automation, docs & infra",
      icon: IcTimeline,
      meta: `${upcoming.length} items ahead of today`,
      span: "lg:col-span-4",
      tint: "text-coral",
    },
    {
      id: "files" as const,
      name: "Nextcloud files",
      desc: "Workspace files bridged from cloud.meridian.office",
      icon: IcCloud,
      meta: "34.2 GB of 100 GB synced",
      span: "lg:col-span-5",
      tint: "text-cyan",
    },
    {
      id: "editor" as const,
      name: "ONLYOFFICE editor",
      desc: "Document Server 8.2 — open any file to edit in place",
      icon: IcPenDoc,
      meta: "3 collaborators online",
      span: "lg:col-span-7",
      tint: "text-green",
    },
  ];

  return (
    <div className="space-y-6">
      {/* header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel>Console / Overview</SectionLabel>
          <h1 className="mt-2 font-display text-[32px] font-bold leading-none tracking-tight sm:text-[38px]">
            <Scramble text="Operations overview" />
          </h1>
          <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-mute">
            {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} · Meridian HQ workspace.
            Five modules, one pipeline: scrape → merge → ship.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Pill tone="green"><StatusDot tone="green" pulse /> All systems nominal</Pill>
          <div className="panel-raise px-3.5 py-2 font-mono text-[13px] tabular-nums text-green">
            {now.toLocaleTimeString(undefined, { hour12: false })}
          </div>
        </div>
      </header>

      {/* KPI band */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-12">
        <Reveal className="col-span-2 lg:col-span-5">
          <div className="panel relative h-full overflow-hidden p-5">
            <div className="flex items-start justify-between">
              <div>
                <SectionLabel>Rows ingested · 7 days</SectionLabel>
                <p className="mt-2 font-display text-[44px] font-bold leading-none tracking-tight text-ink">
                  <CountUp value={1284} />
                </p>
              </div>
              <Pill tone="green">▲ 18.4%</Pill>
            </div>
            <Spark data={[96, 140, 122, 178, 165, 210, 263]} className="mt-3 h-[52px] w-full" />
            <p className="mt-2 font-mono text-[11px] text-faint">across 4 datasets · peak Wed 09:00 (HRIS pull)</p>
          </div>
        </Reveal>

        <Reveal delay={70} className="lg:col-span-3">
          <div className="panel flex h-full flex-col justify-between p-5">
            <SectionLabel>Documents merged</SectionLabel>
            <p className="mt-2 font-display text-[40px] font-bold leading-none tracking-tight">
              <CountUp value={mergedTotal} />
            </p>
            <div className="mt-3 flex items-center gap-1.5">
              {[4, 6, 3, 8, 5, 9, 7].map((v, i) => (
                <span key={i} className="bar-in w-full rounded-sm bg-amber/50" style={{ height: `${v * 4 + 6}px`, animationDelay: `${i * 60}ms` }} />
              ))}
            </div>
            <p className="mt-2 font-mono text-[11px] text-faint">this quarter · 3 templates</p>
          </div>
        </Reveal>

        <Reveal delay={140} className="lg:col-span-2">
          <div className="panel flex h-full flex-col justify-between p-5">
            <SectionLabel>Active jobs</SectionLabel>
            <p className="mt-2 font-display text-[40px] font-bold leading-none tracking-tight text-green">
              <CountUp value={activeJobs} />
              <span className="text-[18px] text-faint">/{jobs.length}</span>
            </p>
            <p className="mt-3 flex items-center gap-2 font-mono text-[11px] text-faint">
              <StatusDot tone="coral" /> 1 failing · token rotation
            </p>
          </div>
        </Reveal>

        <Reveal delay={210} className="col-span-2 lg:col-span-2">
          <div className="panel flex h-full flex-col justify-between p-5">
            <SectionLabel>Sync health</SectionLabel>
            <p className="mt-2 font-display text-[40px] font-bold leading-none tracking-tight text-cyan">
              <CountUp value={99} suffix=".2%" />
            </p>
            <p className="mt-3 font-mono text-[11px] text-faint">Nextcloud ↔ Meridian bridge · 42 ms</p>
          </div>
        </Reveal>
      </div>

      {/* feed + integrations */}
      <div className="grid gap-4 lg:grid-cols-12">
        <Reveal className="lg:col-span-7">
          <div className="panel h-full p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[16px] font-semibold tracking-tight">Live operations feed</h2>
              <span className="flex items-center gap-2 font-mono text-[11px] text-green">
                <StatusDot tone="green" pulse /> streaming
              </span>
            </div>
            <ul className="mt-4 divide-y divide-line/60">
              {events.slice(0, 8).map((ev, i) => {
                const Meta = EV_META[ev.type];
                const Icon = Meta.icon;
                return (
                  <li key={ev.id} className={`${i < 3 ? "feed-in" : ""} group flex items-center gap-3 py-2.5`} style={{ animationDelay: `${i * 70}ms` }}>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line bg-raise ${Meta.tone}`}>
                      <Icon size={13} />
                    </span>
                    <p className="min-w-0 flex-1 truncate text-[13px] text-ink/90 transition-colors group-hover:text-ink">{ev.text}</p>
                    <span className="shrink-0 font-mono text-[11px] text-faint">{ev.at}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </Reveal>

        <div className="flex flex-col gap-4 lg:col-span-5">
          <Reveal delay={90}>
            <div className="panel p-5">
              <h2 className="font-display text-[16px] font-semibold tracking-tight">Integrations</h2>
              <div className="mt-3 space-y-3.5">
                {[
                  { name: "Nextcloud Hub 9", sub: "cloud.meridian.office · 34.2 GB / 100 GB", tone: "green" as const, to: "files" as const, bar: 34 },
                  { name: "ONLYOFFICE Document Server", sub: "v8.2.1 · JWT secured · 24 ms", tone: "green" as const, to: "editor" as const, bar: 0 },
                  { name: "Python runner", sub: "venv 3.12 · 5 jobs registered", tone: "amber" as const, to: "automations" as const, bar: 0 },
                ].map((it) => (
                  <button key={it.name} onClick={() => go(it.to)} className="group block w-full cursor-pointer text-left">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
                        <StatusDot tone={it.tone} pulse={it.tone === "green"} /> {it.name}
                      </span>
                      <span className="text-faint transition-all group-hover:translate-x-0.5 group-hover:text-ink"><IcChevronR size={13} /></span>
                    </div>
                    <p className="mt-0.5 pl-4 font-mono text-[11px] text-faint">{it.sub}</p>
                    {it.bar > 0 && (
                      <div className="ml-4 mt-2 h-1 overflow-hidden rounded-full bg-lift">
                        <div className="bar-in h-full rounded-full bg-green/70" style={{ width: `${it.bar}%` }} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={160}>
            <div className="panel flex-1 p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[16px] font-semibold tracking-tight">Up next on the timeline</h2>
                <button className="btn-ghost px-2 py-1 text-[12px]" onClick={() => go("timeline")}>Open <IcArrowUR size={12} /></button>
              </div>
              <ul className="mt-3 space-y-2.5">
                {upcoming.map((t) => (
                  <li key={t.id}>
                    <button onClick={() => go("timeline")} className="group flex w-full cursor-pointer items-center gap-3 rounded-md border border-transparent px-2 py-1.5 text-left transition-colors hover:border-line hover:bg-raise">
                      <span className={`font-mono text-[10.5px] tabular-nums ${t.start === TODAY_DAY ? "text-coral" : "text-faint"}`}>
                        {t.start === TODAY_DAY ? "today" : `in ${t.start - TODAY_DAY}d`}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-ink/90 group-hover:text-ink">{t.title}</span>
                      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-faint">{t.track}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>

      {/* module tiles */}
      <div>
        <Reveal>
          <div className="mb-3 flex items-center justify-between">
            <SectionLabel>Modules</SectionLabel>
            <span className="font-mono text-[11px] text-faint">05 connected</span>
          </div>
        </Reveal>
        <div className="grid gap-4 lg:grid-cols-12">
          {tiles.map((t, i) => {
            const Icon = t.icon;
            return (
              <Reveal key={t.id} delay={i * 60} className={t.span}>
                <button
                  onClick={() => (t.id === "editor" ? openDoc({ id: "f9", name: "offer-letter.docx", type: "docx", folder: "Templates", size: "22 KB", updated: "3 d ago", sync: "synced", owner: "JW" }) : go(t.id))}
                  className="panel group flex h-full w-full cursor-pointer flex-col justify-between gap-6 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-line2 hover:bg-raise"
                >
                  <div className="flex items-start justify-between">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-raise ${t.tint}`}>
                      <Icon size={17} />
                    </span>
                    <span className="text-faint transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink">
                      <IcArrowUR size={15} />
                    </span>
                  </div>
                  <div>
                    <p className="font-display text-[17px] font-semibold tracking-tight">{t.name}</p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-mute">{t.desc}</p>
                    <p className="mt-2.5 font-mono text-[11px] text-faint">{t.meta}</p>
                  </div>
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* footer strip */}
      <Reveal>
        <div className="panel flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3.5 font-mono text-[11px] text-faint">
          <span className="flex items-center gap-2 text-mute"><IcTerminal size={13} className="text-green" /> runner v2.4.1</span>
          <span className="flex items-center gap-2 text-mute"><IcDatabase size={13} className="text-cyan" /> 4 datasets · 20 rows hot</span>
          <span>region eu-west · build 2025.09.14</span>
          <span className="ml-auto hidden items-center gap-2 text-mute sm:flex"><StatusDot tone="green" pulse /> websocket · 42 ms</span>
        </div>
      </Reveal>
    </div>
  );
}
