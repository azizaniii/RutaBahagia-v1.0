import { useEffect, useMemo, useRef, useState } from "react";
import { useOffice } from "../store";
import type { AutomationJob } from "../data";
import { Scramble, Reveal, Pill, StatusDot, SectionLabel, Modal, useToasts, ToastStack } from "../ui";
import { IcBolt, IcPlay, IcPlus, IcClock, IcTerminal, IcChevronD, IcCode, IcCopy, IcDatabase, IcAlert } from "../icons";

const ts = () => new Date().toLocaleTimeString(undefined, { hour12: false });

function buildLog(job: AutomationJob): string[] {
  const stamp = () => `[${ts()}]`;
  if (job.id === "job-attendance") {
    return [
      `${stamp()} spawn python runner · venv 3.12 · job ${job.id}`,
      `${stamp()} POST https://attendance.example.com/login … 200 OK`,
      `${stamp()} GET /export?fmt=csv … 401 Unauthorized`,
      `${stamp()} ERR service token expired — rotate in Settings → Secrets`,
      `${stamp()} exit 1 · nothing written to dataset "attendance"`,
    ];
  }
  if (job.id === "job-fx") {
    return [
      `${stamp()} spawn python runner · venv 3.12 · job ${job.id}`,
      `${stamp()} loading fx_reference_rates.py …`,
      `${stamp()} ERR no main() defined — script is still a placeholder`,
      `${stamp()} hint: paste the final Python code, save, and re-run`,
      `${stamp()} exit 1 · dataset "fx_rates" untouched`,
    ];
  }
  const rows = job.datasetId === "vendors" ? 6 : job.datasetId === "consultants" ? 8 : 6;
  return [
    `${stamp()} spawn python runner · venv 3.12 · job ${job.id}`,
    `${stamp()} GET ${job.target} … 200 OK (gzip, ${(Math.random() * 300 + 120).toFixed(0)} ms)`,
    `${stamp()} parsing payload … ${rows} candidate rows`,
    `${stamp()} validating schema · ${rows}/${rows} rows pass`,
    `${stamp()} upsert → dataset "${job.datasetId}" · ${rows} rows`,
    `${stamp()} OK finished — ${rows} rows written`,
  ];
}

interface HistoryRow {
  id: string;
  job: string;
  at: string;
  rows: number;
  duration: string;
  ok: boolean;
}

const SEED_HISTORY: HistoryRow[] = [
  { id: "h1", job: "Vendor price book scrape", at: "42 min ago", rows: 6, duration: "4.8s", ok: true },
  { id: "h2", job: "Attendance portal sync", at: "1 h ago", rows: 0, duration: "1.9s", ok: false },
  { id: "h3", job: "HRIS consultant registry pull", at: "7 h ago", rows: 8, duration: "6.2s", ok: true },
  { id: "h4", job: "Vendor price book scrape", at: "6 h ago", rows: 6, duration: "5.1s", ok: true },
  { id: "h5", job: "Branch registry geo-sync", at: "2 d ago", rows: 6, duration: "3.1s", ok: true },
];

const STATUS_PILL: Record<AutomationJob["status"], { tone: "green" | "amber" | "coral" | "faint"; label: string }> = {
  success: { tone: "green", label: "Healthy" },
  running: { tone: "amber", label: "Running" },
  failed: { tone: "coral", label: "Failing" },
  idle: { tone: "faint", label: "Idle" },
};

export default function Automations() {
  const { jobs, setJobStatus, completeRun, failRun, addJob, addEvent, datasets } = useOffice();
  const { toasts, push, dismiss } = useToasts();

  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<Record<string, string[]>>({});
  const [selected, setSelected] = useState<string>("job-vendors");
  const [scriptOpen, setScriptOpen] = useState<Record<string, boolean>>({});
  const [history, setHistory] = useState<HistoryRow[]>(SEED_HISTORY);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", target: "", schedule: "Hourly", runNow: true, script: "# my_scraper.py — runs inside the Ruta Bahagia sandbox\nimport requests\nfrom bs4 import BeautifulSoup\n\n# resp = requests.get(\"https://source.example.com/table\", timeout=20)\n# rows = [...]\n# ruta.upsert(dataset=\"my_dataset\", rows=rows, key=[\"id\"])" });

  const consoleRef = useRef<HTMLDivElement>(null);
  const timeouts = useRef<number[]>([]);
  useEffect(() => () => timeouts.current.forEach((t) => window.clearTimeout(t)), []);

  const activeLog = logs[selected] ?? [];
  useEffect(() => {
    const el = consoleRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [activeLog.length]);

  const runningJob = useMemo(() => jobs.find((j) => busy[j.id]), [jobs, busy]);
  useEffect(() => {
    if (runningJob) setSelected(runningJob.id);
  }, [runningJob]);

  const runJob = (job: AutomationJob) => {
    if (busy[job.id]) return;
    const lines = buildLog(job);
    setBusy((b) => ({ ...b, [job.id]: true }));
    setJobStatus(job.id, "running");
    setLogs((l) => ({ ...l, [job.id]: [`${ts()} queued ${job.name}`] }));
    lines.forEach((ln, i) => {
      const t = window.setTimeout(() => {
        setLogs((l) => ({ ...l, [job.id]: [...(l[job.id] ?? []), ln.replace(/^\[/, "[")] }));
        if (i === lines.length - 1) {
          const failed = ln.includes("ERR") || ln.includes("exit 1");
          const duration = `${(Math.random() * 4 + 2).toFixed(1)}s`;
          if (failed) {
            failRun(job.id, job.id === "job-attendance" ? "401 token expired" : "script placeholder — no main()");
            setHistory((h) => [{ id: `h-${Date.now()}`, job: job.name, at: "just now", rows: 0, duration, ok: false }, ...h]);
          } else {
            const rows = job.datasetId === "consultants" ? 8 : 6;
            completeRun(job.id, rows, duration);
            setHistory((h) => [{ id: `h-${Date.now()}`, job: job.name, at: "just now", rows, duration, ok: true }, ...h]);
          }
          setBusy((b) => ({ ...b, [job.id]: false }));
        }
      }, 420 * (i + 1));
      timeouts.current.push(t);
    });
  };

  const saveNew = () => {
    if (!form.name.trim() || !form.target.trim()) {
      push("Give the automation a name and a target URL.", "warn");
      return;
    }
    const job: AutomationJob = {
      id: `job-${Date.now()}`,
      name: form.name.trim(),
      target: form.target.trim(),
      schedule: form.schedule,
      status: "idle",
      lastRun: "never",
      rows: 0,
      duration: "—",
      datasetId: "custom",
      script: form.script,
    };
    addJob(job);
    addEvent("system", `Automation "${job.name}" registered (${job.schedule.toLowerCase()})`);
    setModal(false);
    setSelected(job.id);
    setLogs((l) => ({ ...l, [job.id]: [] }));
    push(`"${job.name}" added to the runner queue.`);
    if (form.runNow) runJob(job);
    setForm((f) => ({ ...f, name: "", target: "" }));
  };

  const copyScript = (s: string) => {
    navigator.clipboard?.writeText(s).then(
      () => push("Python script copied to clipboard."),
      () => push("Clipboard unavailable in this browser.", "warn"),
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel>Module 01 / Data automation</SectionLabel>
          <h1 className="mt-2 font-display text-[32px] font-bold leading-none tracking-tight sm:text-[38px]">
            <Scramble text="Automation runner" />
          </h1>
          <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-mute">
            Python jobs scrape external websites on schedule and upsert rows into live datasets —
            the same datasets that power mail merge.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <IcPlus size={14} /> New automation
        </button>
      </header>

      <div className="grid gap-4 xl:grid-cols-12">
        {/* job list */}
        <Reveal className="xl:col-span-7">
          <div className="space-y-3">
            {jobs.map((job, idx) => {
              const pill = STATUS_PILL[job.status];
              const isBusy = !!busy[job.id];
              const ds = datasets.find((d) => d.id === job.datasetId);
              return (
                <Reveal key={job.id} delay={idx * 50}>
                  <div className={`panel p-4 transition-colors ${isBusy ? "border-amber/40" : "hover:border-line2"}`}>
                    <div className="flex flex-wrap items-center gap-3">
                      <button className="min-w-0 flex-1 cursor-pointer text-left" onClick={() => setSelected(job.id)}>
                        <div className="flex items-center gap-2.5">
                          <span className={`font-display text-[15px] font-semibold tracking-tight ${selected === job.id ? "text-ink" : "text-ink/85"}`}>{job.name}</span>
                          <Pill tone={pill.tone}>
                            {job.status === "running" && <span className="spin-slow inline-block h-2 w-2 rounded-full border border-amber border-t-transparent" />}
                            {pill.label}
                          </Pill>
                        </div>
                        <p className="mt-1 truncate font-mono text-[11.5px] text-faint">{job.target}</p>
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          className={`btn px-3 py-1.5 text-[12.5px] ${isBusy ? "pointer-events-none opacity-60" : ""}`}
                          onClick={() => runJob(job)}
                        >
                          {isBusy ? <span className="spin-slow inline-block h-3 w-3 rounded-full border border-green border-t-transparent" /> : <IcPlay size={11} className="text-green" />}
                          {isBusy ? "Running" : "Run now"}
                        </button>
                        <button
                          className="btn-ghost px-2 py-1.5"
                          onClick={() => setScriptOpen((s) => ({ ...s, [job.id]: !s[job.id] }))}
                          aria-label="Toggle script"
                        >
                          <IcChevronD size={14} className={`transition-transform duration-200 ${scriptOpen[job.id] ? "rotate-180" : ""}`} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-line/60 pt-3 font-mono text-[11px] text-faint">
                      <span className="flex items-center gap-1.5"><IcClock size={12} /> {job.schedule}</span>
                      <span>last run · {job.lastRun}</span>
                      <span>{job.rows > 0 ? `${job.rows} rows · ${job.duration}` : "no rows yet"}</span>
                      <span className="flex items-center gap-1.5"><IcDatabase size={12} /> {ds ? ds.name : `dataset "${job.datasetId}"`}</span>
                      {job.note && <span className="flex items-center gap-1.5 text-coral"><IcAlert size={12} /> {job.note}</span>}
                    </div>

                    {scriptOpen[job.id] && (
                      <div className="rise mt-3 overflow-hidden rounded-md border border-line bg-bg">
                        <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
                          <span className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-widest text-faint">
                            <IcCode size={11} className="text-green" /> python · sandbox venv 3.12
                          </span>
                          <button className="btn-ghost px-2 py-0.5 text-[11px]" onClick={() => copyScript(job.script)}>
                            <IcCopy size={11} /> Copy
                          </button>
                        </div>
                        <pre className="max-h-56 overflow-auto px-4 py-3 font-mono text-[11.5px] leading-relaxed text-mute">
                          <code>{job.script}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Reveal>

        {/* console + history */}
        <div className="space-y-4 xl:col-span-5">
          <Reveal delay={100}>
            <div className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-faint">
                  <IcTerminal size={13} className="text-green" /> runner console
                </span>
                <span className="font-mono text-[11px] text-faint">
                  {jobs.find((j) => j.id === selected)?.name ?? "—"}
                </span>
              </div>
              <div ref={consoleRef} className="h-[264px] overflow-y-auto bg-[#0a0f0b] px-4 py-3 font-mono text-[11.5px] leading-[1.75]">
                {activeLog.length === 0 ? (
                  <p className="text-faint">$ idle — select a job and press <span className="text-green">Run now</span> to stream its output.</p>
                ) : (
                  activeLog.map((ln, i) => (
                    <p
                      key={i}
                      className={
                        ln.includes("ERR") || ln.includes("exit 1") ? "text-coral"
                        : ln.includes("OK") || ln.includes("upsert") ? "text-green"
                        : ln.includes("queued") ? "text-amber"
                        : "text-mute"
                      }
                    >
                      {ln.includes("[") ? ln : `$ ${ln}`}
                    </p>
                  ))
                )}
                {runningJob && <span className="cursor-blink inline-block h-[13px] w-[7px] translate-y-[2px] bg-green/80" />}
              </div>
            </div>
          </Reveal>

          <Reveal delay={170}>
            <div className="panel p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[15px] font-semibold tracking-tight">Recent runs</h2>
                <span className="font-mono text-[11px] text-faint">{history.length} recorded</span>
              </div>
              <ul className="mt-3 divide-y divide-line/60">
                {history.slice(0, 6).map((h) => (
                  <li key={h.id} className="flex items-center gap-3 py-2 text-[12.5px]">
                    <StatusDot tone={h.ok ? "green" : "coral"} />
                    <span className="min-w-0 flex-1 truncate text-ink/90">{h.job}</span>
                    <span className="font-mono text-[11px] text-faint">{h.ok ? `${h.rows} rows` : "failed"}</span>
                    <span className="font-mono text-[11px] text-faint">{h.duration}</span>
                    <span className="w-16 text-right font-mono text-[11px] text-faint">{h.at}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={230}>
            <div className="panel border-amber/25 bg-amber/[0.04] p-4">
              <p className="flex items-center gap-2 font-display text-[13.5px] font-semibold text-amber">
                <IcBolt size={14} /> Bring your own Python
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-mute">
                Paste any scraper — requests, BeautifulSoup, Selenium — into a job. The runner executes it in a
                sandboxed venv and routes results into a dataset via <code className="rounded bg-raise px-1 py-0.5 font-mono text-[11px] text-green">ruta.upsert()</code>.
              </p>
            </div>
          </Reveal>
        </div>
      </div>

      {/* new automation modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Register a new automation" wide>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">Name</span>
              <input className="field" placeholder="e.g. Competitor price watch" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </label>
            <label className="block">
              <span className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">Target URL</span>
              <input className="field font-mono text-[12px]" placeholder="https://source.example.com/table" value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">Schedule</span>
            <select className="field" value={form.schedule} onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))}>
              {["Every 30 min", "Hourly", "Every 6 hours", "Daily · 06:00", "Mondays · 07:30"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">Python script</span>
            <textarea
              className="field h-40 resize-none bg-bg font-mono text-[11.5px] leading-relaxed"
              spellCheck={false}
              value={form.script}
              onChange={(e) => setForm((f) => ({ ...f, script: e.target.value }))}
            />
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-mute">
            <input type="checkbox" checked={form.runNow} onChange={(e) => setForm((f) => ({ ...f, runNow: e.target.checked }))} className="h-4 w-4 accent-[#4cc38a]" />
            Run immediately after saving
          </label>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button className="btn" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={saveNew}><IcPlus size={13} /> Register job</button>
          </div>
        </div>
      </Modal>

      <ToastStack toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
