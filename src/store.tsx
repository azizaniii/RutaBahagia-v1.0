import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  SEED_JOBS,
  SEED_DATASETS,
  SEED_TEMPLATES,
  SEED_EVENTS,
  nextEvId,
  type AutomationJob,
  type Dataset,
  type Template,
  type OfficeEvent,
  type EvType,
  type CloudFile,
  type ViewId,
} from "./data";

interface OfficeCtx {
  view: ViewId;
  go: (v: ViewId) => void;

  jobs: AutomationJob[];
  setJobStatus: (id: string, status: AutomationJob["status"], patch?: Partial<AutomationJob>) => void;
  addJob: (job: AutomationJob) => void;
  completeRun: (id: string, rows: number, duration: string) => void;
  failRun: (id: string, note: string) => void;

  datasets: Dataset[];
  templates: Template[];
  setTemplateBody: (id: string, body: string) => void;

  events: OfficeEvent[];
  addEvent: (type: EvType, text: string) => void;

  mergedTotal: number;
  bumpMerged: (n: number) => void;

  activeDoc: CloudFile | null;
  openDoc: (f: CloudFile) => void;
  closeDoc: () => void;
}

const Ctx = createContext<OfficeCtx | null>(null);

export function OfficeProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ViewId>("dashboard");
  const [jobs, setJobs] = useState(SEED_JOBS);
  const [datasets, setDatasets] = useState(SEED_DATASETS);
  const [templates, setTemplates] = useState(SEED_TEMPLATES);
  const [events, setEvents] = useState(SEED_EVENTS);
  const [mergedTotal, setMergedTotal] = useState(46);
  const [activeDoc, setActiveDoc] = useState<CloudFile | null>(null);

  const go = useCallback((v: ViewId) => {
    setView(v);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const addEvent = useCallback((type: EvType, text: string) => {
    setEvents((ev) => [{ id: nextEvId(), type, text, at: "just now" }, ...ev].slice(0, 40));
  }, []);

  const setJobStatus = useCallback((id: string, status: AutomationJob["status"], patch?: Partial<AutomationJob>) => {
    setJobs((js) => js.map((j) => (j.id === id ? { ...j, status, ...patch } : j)));
  }, []);

  const addJob = useCallback((job: AutomationJob) => {
    setJobs((js) => [job, ...js]);
  }, []);

  const completeRun = useCallback(
    (id: string, rows: number, duration: string) => {
      setJobs((js) => js.map((j) => (j.id === id ? { ...j, status: "success", rows, duration, lastRun: "just now", note: undefined } : j)));
      setDatasets((ds) => {
        const job = SEED_JOBS.find((j) => j.id === id);
        const target = jobs.find((j) => j.id === id)?.datasetId ?? job?.datasetId;
        return ds.map((d) => (d.id === target ? { ...d, updatedAt: "just now" } : d));
      });
      const name = jobs.find((j) => j.id === id)?.name ?? "Automation";
      addEvent("automation", `${name} finished — ${rows} rows in ${duration}`);
    },
    [jobs, addEvent],
  );

  const failRun = useCallback(
    (id: string, note: string) => {
      setJobs((js) => js.map((j) => (j.id === id ? { ...j, status: "failed", lastRun: "just now", note } : j)));
      const name = jobs.find((j) => j.id === id)?.name ?? "Automation";
      addEvent("automation", `${name} failed · ${note}`);
    },
    [jobs, addEvent],
  );

  const setTemplateBody = useCallback((id: string, body: string) => {
    setTemplates((ts) => ts.map((t) => (t.id === id ? { ...t, body, updatedAt: "Edited just now" } : t)));
  }, []);

  const bumpMerged = useCallback(
    (n: number) => {
      setMergedTotal((m) => m + n);
    },
    [],
  );

  const openDoc = useCallback(
    (f: CloudFile) => {
      setActiveDoc(f);
      setView("editor");
      window.scrollTo({ top: 0 });
    },
    [],
  );

  const closeDoc = useCallback(() => {
    setView("files");
  }, []);

  const value = useMemo(
    () => ({
      view, go,
      jobs, setJobStatus, addJob, completeRun, failRun,
      datasets, templates, setTemplateBody,
      events, addEvent,
      mergedTotal, bumpMerged,
      activeDoc, openDoc, closeDoc,
    }),
    [view, go, jobs, setJobStatus, addJob, completeRun, failRun, datasets, templates, setTemplateBody, events, addEvent, mergedTotal, bumpMerged, activeDoc, openDoc, closeDoc],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOffice() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOffice must be used inside OfficeProvider");
  return ctx;
}
