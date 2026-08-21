import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { OfficeProvider, useOffice } from "./store";
import { SEED_FILES, type ViewId } from "./data";
import { StatusDot, SectionLabel } from "./ui";
import {
  LogoMark, IcGrid, IcBolt, IcMerge, IcTimeline, IcCloud, IcPenDoc, IcSearch, IcBell, IcChevronR, IcDatabase, IcDoc,
} from "./icons";
import Dashboard from "./views/Dashboard";
import Automations from "./views/Automations";
import MailMerge from "./views/MailMerge";
import TimelineView from "./views/TimelineView";
import FilesView from "./views/FilesView";
import EditorView from "./views/EditorView";

const NAV: { id: ViewId; label: string; icon: (p: { size?: number; className?: string }) => ReactNode; desc: string }[] = [
  { id: "dashboard", label: "Overview", icon: (p) => <IcGrid {...p} />, desc: "Operations pulse" },
  { id: "automations", label: "Automations", icon: (p) => <IcBolt {...p} />, desc: "Python runners" },
  { id: "merge", label: "Mail merge", icon: (p) => <IcMerge {...p} />, desc: "Docs × datasets" },
  { id: "timeline", label: "Timeline", icon: (p) => <IcTimeline {...p} />, desc: "Six-week plan" },
  { id: "files", label: "Files", icon: (p) => <IcCloud {...p} />, desc: "Nextcloud bridge" },
  { id: "editor", label: "Editor", icon: (p) => <IcPenDoc {...p} />, desc: "ONLYOFFICE" },
];

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return <span className="hidden font-mono text-[12px] tabular-nums text-mute lg:block">{now.toLocaleTimeString(undefined, { hour12: false })}</span>;
}

interface SearchHit {
  group: string;
  label: string;
  sub: string;
  icon: ReactNode;
  go: () => void;
}

function GlobalSearch() {
  const { go, jobs, templates, datasets, openDoc } = useOffice();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const hits = useMemo<SearchHit[]>(() => {
    const query = q.trim().toLowerCase();
    const out: SearchHit[] = [];
    if (!query) return out;
    jobs.filter((j) => j.name.toLowerCase().includes(query) || j.target.toLowerCase().includes(query)).slice(0, 3)
      .forEach((j) => out.push({ group: "Automations", label: j.name, sub: j.target, icon: <IcBolt size={13} className="text-green" />, go: () => go("automations") }));
    templates.filter((t) => t.name.toLowerCase().includes(query)).slice(0, 3)
      .forEach((t) => out.push({ group: "Templates", label: t.name, sub: `${t.body.split("\n").length} lines · ${t.updatedAt}`, icon: <IcDoc size={13} className="text-amber" />, go: () => go("merge") }));
    datasets.filter((d) => d.name.toLowerCase().includes(query)).slice(0, 3)
      .forEach((d) => out.push({ group: "Datasets", label: d.name, sub: `${d.rows.length} rows · ${d.updatedAt}`, icon: <IcDatabase size={13} className="text-cyan" />, go: () => go("merge") }));
    SEED_FILES.filter((f) => f.name.toLowerCase().includes(query)).slice(0, 4)
      .forEach((f) => out.push({ group: "Nextcloud", label: f.name, sub: `/${f.folder || "workspace"} · ${f.type}`, icon: <IcCloud size={13} className="text-cyan" />, go: () => (f.type === "folder" ? go("files") : openDoc(f)) }));
    return out.slice(0, 9);
  }, [q, jobs, templates, datasets, go, openDoc]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDoc);
    return () => window.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={boxRef} className="relative w-full max-w-[340px]">
      <IcSearch size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
      <input
        className="field py-2 pl-9 pr-3 text-[12.5px]"
        placeholder="Search jobs, templates, files…"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === "Escape" && (setOpen(false), (e.target as HTMLInputElement).blur())}
      />
      {open && q.trim() && (
        <div className="toast-in absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-lg border border-line2 bg-raise shadow-[0_24px_60px_-16px_rgba(3,7,4,0.9)]">
          {hits.length === 0 ? (
            <p className="px-4 py-5 text-center font-mono text-[11.5px] text-faint">No matches for “{q}” in this workspace.</p>
          ) : (
            hits.map((h, i) => (
              <button
                key={i}
                className="flex w-full cursor-pointer items-center gap-3 border-b border-line/50 px-3.5 py-2.5 text-left transition-colors last:border-0 hover:bg-lift"
                onClick={() => { h.go(); setOpen(false); setQ(""); }}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line bg-panel">{h.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium text-ink">{h.label}</span>
                  <span className="block truncate font-mono text-[10.5px] text-faint">{h.sub}</span>
                </span>
                <span className="shrink-0 font-mono text-[9.5px] uppercase tracking-wider text-faint">{h.group}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function BellTray() {
  const { events, go } = useOffice();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button className="btn-ghost relative px-2 py-2" onClick={() => setOpen((o) => !o)} aria-label="Notifications">
        <IcBell size={16} />
        <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-coral" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="toast-in absolute right-0 top-[calc(100%+8px)] z-50 w-[320px] overflow-hidden rounded-lg border border-line2 bg-raise shadow-[0_24px_60px_-16px_rgba(3,7,4,0.9)]">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <SectionLabel>Activity</SectionLabel>
              <span className="font-mono text-[10.5px] text-faint">{events.length} events</span>
            </div>
            {events.slice(0, 5).map((ev) => (
              <button key={ev.id} onClick={() => { setOpen(false); go("dashboard"); }} className="block w-full cursor-pointer border-b border-line/50 px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-lift">
                <p className="text-[12px] leading-snug text-ink/90">{ev.text}</p>
                <p className="mt-0.5 font-mono text-[10px] text-faint">{ev.at}</p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Shell() {
  const { view, go, jobs, activeDoc } = useOffice();
  const failing = jobs.filter((j) => j.status === "failed").length;
  const current = NAV.find((n) => n.id === view);

  return (
    <div className="flex min-h-screen">
      {/* sidebar */}
      <aside className="sticky top-0 z-40 flex h-screen w-[64px] shrink-0 flex-col border-r border-line bg-panel/80 backdrop-blur-sm xl:w-[236px]">
        <button className="flex cursor-pointer items-center gap-3 border-b border-line px-4 py-4 text-left xl:px-5" onClick={() => go("dashboard")}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-green/30 bg-green/10 text-green">
            <LogoMark size={20} />
          </span>
          <span className="hidden min-w-0 xl:block">
            <span className="block font-display text-[16px] font-bold leading-none tracking-tight">RUTA BAHAGIA</span>
            <span className="mt-1 block font-mono text-[9.5px] uppercase tracking-[0.22em] text-faint">Office OS</span>
          </span>
        </button>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 py-4 xl:px-3">
          <SectionLabel className="hidden px-2 pb-2 xl:block">Workspace</SectionLabel>
          {NAV.map((n) => {
            const isActive = view === n.id;
            return (
              <button
                key={n.id}
                onClick={() => go(n.id)}
                title={n.label}
                className={`group relative flex w-full cursor-pointer items-center gap-3 rounded-md px-2.5 py-2.5 text-left transition-all duration-150 ${
                  isActive ? "bg-raise text-ink" : "text-mute hover:bg-raise/60 hover:text-ink"
                }`}
              >
                <span className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-green transition-all duration-200 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"}`} />
                <span className={`shrink-0 transition-colors ${isActive ? "text-green" : ""}`}>{n.icon({ size: 17 })}</span>
                <span className="hidden min-w-0 flex-1 xl:block">
                  <span className="block text-[13px] font-semibold leading-tight">{n.label}</span>
                  <span className="block font-mono text-[9.5px] uppercase tracking-wider text-faint">{n.desc}</span>
                </span>
                {n.id === "automations" && failing > 0 && (
                  <span className="hidden rounded-full border border-coral/40 bg-coral/15 px-1.5 py-px font-mono text-[9.5px] font-semibold text-coral xl:block">{failing}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-line px-3 py-4 xl:px-4">
          <div className="hidden space-y-2 xl:block">
            {[
              { name: "Nextcloud", ok: true },
              { name: "ONLYOFFICE", ok: true },
              { name: "Python runner", ok: failing === 0 },
            ].map((s) => (
              <p key={s.name} className="flex items-center gap-2 font-mono text-[10.5px] text-faint">
                <StatusDot tone={s.ok ? "green" : "amber"} pulse={s.ok} /> {s.name} · {s.ok ? "ok" : "degraded"}
              </p>
            ))}
          </div>
          <div className="flex items-center gap-2.5 rounded-md border border-line bg-raise p-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan text-[11px] font-bold text-bg">RA</span>
            <span className="hidden min-w-0 xl:block">
              <span className="block truncate text-[12.5px] font-semibold leading-tight">Rania Adeyemi</span>
              <span className="block font-mono text-[9.5px] uppercase tracking-wider text-faint">Ops lead</span>
            </span>
            <IcChevronR size={12} className="ml-auto hidden shrink-0 text-faint xl:block" />
          </div>
        </div>
      </aside>

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
          <div className="flex items-center gap-4 px-5 py-3 lg:px-8">
            <span className="hidden shrink-0 font-mono text-[10.5px] uppercase tracking-[0.18em] text-faint md:block">
              Ruta Bahagia <span className="text-line2">/</span> <span className="text-mute">{current?.label}</span>
            </span>
            <div className="flex flex-1 justify-center px-2">
              <GlobalSearch />
            </div>
            <Clock />
            <BellTray />
            <span className="hidden h-6 w-px bg-line sm:block" />
            <button className="hidden cursor-pointer items-center gap-2 sm:flex" onClick={() => go("dashboard")} title="Workspace">
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-raise font-display text-[11px] font-bold text-green">HQ</span>
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-5 py-7 lg:px-8">
          <div key={view} className="view-enter mx-auto max-w-[1240px]">
            {view === "dashboard" && <Dashboard />}
            {view === "automations" && <Automations />}
            {view === "merge" && <MailMerge />}
            {view === "timeline" && <TimelineView />}
            {view === "files" && <FilesView />}
            {view === "editor" && <EditorView key={activeDoc?.id ?? "default"} />}
          </div>
        </main>

        <footer className="border-t border-line px-5 py-3 lg:px-8">
          <p className="font-mono text-[10.5px] text-faint">
            Ruta Bahagia Office OS · automation → merge → timeline → files → editor · session secured with workspace JWT
          </p>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <OfficeProvider>
      <Shell />
    </OfficeProvider>
  );
}
