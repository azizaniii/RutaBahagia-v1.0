import { useMemo, useRef, useState } from "react";
import { useOffice } from "../store";
import { SEED_FILES, type CloudFile, type FileType } from "../data";
import { Scramble, Reveal, SectionLabel, Pill, StatusDot, useToasts, ToastStack } from "../ui";
import { FILE_ICON, FILE_TINT, IcCloud, IcFolder, IcSync, IcUpload, IcSearch, IcGridView, IcListView, IcChevronR, IcPenDoc, IcLink, IcDownload, IcExternal, IcCheck } from "../icons";

const extType = (name: string): FileType => {
  const e = name.split(".").pop()?.toLowerCase() ?? "";
  if (["doc", "docx"].includes(e)) return "docx";
  if (["xls", "xlsx"].includes(e)) return "xlsx";
  if (e === "pdf") return "pdf";
  if (e === "csv") return "csv";
  if (["ppt", "pptx"].includes(e)) return "pptx";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(e)) return "img";
  return "docx";
};

const fmtSize = (b: number) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

const OFFICE_TYPES: FileType[] = ["docx", "xlsx", "csv"];

export default function FilesView() {
  const { openDoc, addEvent } = useOffice();
  const { toasts, push, dismiss } = useToasts();

  const [files, setFiles] = useState<CloudFile[]>(SEED_FILES);
  const [path, setPath] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"grid" | "list">("list");
  const fileInput = useRef<HTMLInputElement>(null);

  const current = path.join("/");
  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return files
      .filter((f) => f.folder === current)
      .filter((f) => !q || f.name.toLowerCase().includes(q))
      .sort((a, b) => (a.type === "folder" ? -1 : 1) - (b.type === "folder" ? -1 : 1) || a.name.localeCompare(b.name));
  }, [files, current, query]);

  const enter = (f: CloudFile) => {
    if (f.type === "folder") {
      setPath((p) => [...p, f.name]);
      setQuery("");
    } else if (OFFICE_TYPES.includes(f.type)) {
      openDoc(f);
    } else {
      downloadFile(f);
    }
  };

  const downloadFile = (f: CloudFile) => {
    const blob = new Blob([`Meridian workspace export\nfile: ${f.name}\npath: /${f.folder}\nsynced from cloud.meridian.office\n`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = f.name;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    push(`Downloading ${f.name} from Nextcloud…`);
  };

  const copyLink = (f: CloudFile) => {
    const link = `https://cloud.meridian.office/s/${f.id}${f.id.length < 6 ? "x7q2" : ""}`;
    navigator.clipboard?.writeText(link).then(
      () => push(`Share link copied · ${f.name}`),
      () => push("Clipboard unavailable in this browser.", "warn"),
    );
  };

  const onUpload = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const f = list[0];
    const id = `up-${Date.now()}`;
    const entry: CloudFile = {
      id,
      name: f.name,
      type: extType(f.name),
      folder: current,
      size: fmtSize(f.size),
      updated: "just now",
      sync: "syncing",
      owner: "RA",
    };
    setFiles((fs) => [entry, ...fs]);
    addEvent("files", `Uploading ${f.name} → /${current || "root"}`);
    window.setTimeout(() => {
      setFiles((fs) => fs.map((x) => (x.id === id ? { ...x, sync: "synced" } : x)));
      addEvent("files", `${f.name} synced to Nextcloud`);
      push(`${f.name} uploaded and synced to Nextcloud.`);
    }, 2000);
    if (fileInput.current) fileInput.current.value = "";
  };

  const crumbs = [{ label: "meridian-workspace", path: [] as string[] }, ...path.map((p, i) => ({ label: p, path: path.slice(0, i + 1) }))];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel>Module 04 / Nextcloud bridge</SectionLabel>
          <h1 className="mt-2 font-display text-[32px] font-bold leading-none tracking-tight sm:text-[38px]">
            <Scramble text="Workspace files" />
          </h1>
          <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-mute">
            Live view of the team's Nextcloud — browse, upload and hand any document straight to ONLYOFFICE.
          </p>
        </div>
        <div className="flex gap-2">
          <input ref={fileInput} type="file" className="hidden" onChange={(e) => onUpload(e.target.files)} />
          <a className="btn" href="https://nextcloud.com" target="_blank" rel="noreferrer">
            <IcExternal size={13} /> Open Nextcloud
          </a>
          <button className="btn-primary" onClick={() => fileInput.current?.click()}>
            <IcUpload size={13} /> Upload file
          </button>
        </div>
      </header>

      {/* connection card */}
      <Reveal>
        <div className="panel grid gap-5 p-5 lg:grid-cols-12">
          <div className="flex items-center gap-4 lg:col-span-4">
            <span className="float-y flex h-12 w-12 items-center justify-center rounded-xl border border-cyan/30 bg-cyan/10 text-cyan">
              <IcCloud size={22} />
            </span>
            <div>
              <p className="flex items-center gap-2 font-display text-[15.5px] font-semibold tracking-tight">
                Nextcloud Hub 9 <Pill tone="green"><StatusDot tone="green" pulse /> Connected</Pill>
              </p>
              <p className="mt-0.5 font-mono text-[11.5px] text-faint">https://cloud.meridian.office · WebDAV + JWT</p>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="flex items-baseline justify-between">
              <SectionLabel>Storage</SectionLabel>
              <span className="font-mono text-[11.5px] text-mute"><span className="text-ink">34.2 GB</span> of 100 GB</span>
            </div>
            <div className="mt-2 flex h-2.5 gap-[3px] overflow-hidden rounded-full bg-lift">
              <span className="bar-in h-full rounded-l-full bg-cyan/70" style={{ width: "54%", animationDelay: "100ms" }} title="Documents 18.4 GB" />
              <span className="bar-in h-full bg-green/70" style={{ width: "27%", animationDelay: "250ms" }} title="Media 9.1 GB" />
              <span className="bar-in h-full bg-amber/70" style={{ width: "19%", animationDelay: "400ms" }} title="Archive 6.7 GB" />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10.5px] text-faint">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-cyan/80" /> Documents 18.4 GB</span>
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-green/80" /> Media 9.1 GB</span>
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber/80" /> Archive 6.7 GB</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line pt-4 lg:col-span-3 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
            <div>
              <p className="flex items-center gap-2 text-[13px] font-medium text-ink">
                <IcSync size={13} className="text-green" /> Synced just now
              </p>
              <p className="mt-0.5 font-mono text-[10.5px] text-faint">bridge v1.8 · 214 files watched</p>
            </div>
            <Pill tone="cyan">42 ms</Pill>
          </div>
        </div>
      </Reveal>

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto font-mono text-[12px]">
          {crumbs.map((c, i) => (
            <span key={i} className="flex shrink-0 items-center gap-1">
              {i > 0 && <IcChevronR size={11} className="text-faint" />}
              <button
                onClick={() => setPath(c.path)}
                className={`cursor-pointer rounded px-1.5 py-0.5 transition-colors ${i === crumbs.length - 1 ? "bg-raise text-ink" : "text-mute hover:bg-raise hover:text-ink"}`}
              >
                {c.label}
              </button>
            </span>
          ))}
        </nav>
        <div className="relative">
          <IcSearch size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
          <input
            className="field w-[220px] py-1.5 pl-8 text-[12.5px]"
            placeholder={`Search in ${path[path.length - 1] ?? "workspace"}…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex overflow-hidden rounded-md border border-line">
          <button className={`cursor-pointer px-2.5 py-1.5 transition-colors ${mode === "grid" ? "bg-raise text-green" : "text-faint hover:text-ink"}`} onClick={() => setMode("grid")} aria-label="Grid view">
            <IcGridView size={14} />
          </button>
          <button className={`cursor-pointer border-l border-line px-2.5 py-1.5 transition-colors ${mode === "list" ? "bg-raise text-green" : "text-faint hover:text-ink"}`} onClick={() => setMode("list")} aria-label="List view">
            <IcListView size={14} />
          </button>
        </div>
      </div>

      {/* items */}
      {items.length === 0 ? (
        <Reveal>
          <div className="panel flex flex-col items-center justify-center gap-3 p-14 text-center">
            <IcFolder size={28} className="text-faint" />
            <p className="text-[14px] font-medium text-mute">Nothing here{query ? ` matches “${query}”` : " yet"}.</p>
            <p className="max-w-xs font-mono text-[11.5px] text-faint">Drop a file into the uploader above — it lands in this folder and syncs to Nextcloud.</p>
          </div>
        </Reveal>
      ) : mode === "list" ? (
        <Reveal>
          <div className="panel overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-line bg-raise/50">
                <tr>
                  <th className="th">Name</th>
                  <th className="th hidden sm:table-cell">Size</th>
                  <th className="th hidden md:table-cell">Modified</th>
                  <th className="th">Sync</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((f, i) => {
                  const Icon = f.type === "folder" ? IcFolder : FILE_ICON[f.type] ?? IcFolder;
                  const tint = FILE_TINT[f.type] ?? "#8da08f";
                  return (
                    <tr
                      key={f.id}
                      className="rise group cursor-pointer border-b border-line/50 transition-colors last:border-0 hover:bg-raise/70"
                      style={{ animationDelay: `${i * 35}ms` }}
                      onDoubleClick={() => enter(f)}
                      onClick={() => f.type === "folder" && enter(f)}
                    >
                      <td className="flex items-center gap-3 px-3 py-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line bg-raise" style={{ color: tint }}>
                          <Icon size={15} />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium text-ink">{f.name}</span>
                          <span className="font-mono text-[10.5px] text-faint sm:hidden">{f.size ?? `${files.filter((x) => x.folder === `${current ? current + "/" : ""}${f.name}`).length} items`}</span>
                        </span>
                      </td>
                      <td className="hidden px-3 py-2.5 font-mono text-[11.5px] text-mute sm:table-cell">
                        {f.type === "folder" ? `${files.filter((x) => x.folder === `${current ? current + "/" : ""}${f.name}`).length} items` : f.size}
                      </td>
                      <td className="hidden px-3 py-2.5 font-mono text-[11.5px] text-faint md:table-cell">{f.updated}</td>
                      <td className="px-3 py-2.5">
                        {f.sync === "syncing" ? (
                          <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-amber">
                            <span className="spin-slow inline-block h-2.5 w-2.5 rounded-full border border-amber border-t-transparent" /> syncing
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-green"><IcCheck size={11} /> synced</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-end gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                          {f.type !== "folder" && OFFICE_TYPES.includes(f.type) && (
                            <button className="btn-ghost px-2 py-1 text-[11.5px] hover:text-cyan" onClick={(e) => { e.stopPropagation(); openDoc(f); }} title="Open in ONLYOFFICE">
                              <IcPenDoc size={13} />
                            </button>
                          )}
                          {f.type !== "folder" && (
                            <button className="btn-ghost px-2 py-1" onClick={(e) => { e.stopPropagation(); copyLink(f); }} title="Copy share link">
                              <IcLink size={13} />
                            </button>
                          )}
                          {f.type !== "folder" && (
                            <button className="btn-ghost px-2 py-1" onClick={(e) => { e.stopPropagation(); downloadFile(f); }} title="Download">
                              <IcDownload size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Reveal>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {items.map((f, i) => {
            const Icon = f.type === "folder" ? IcFolder : FILE_ICON[f.type] ?? IcFolder;
            const tint = FILE_TINT[f.type] ?? "#8da08f";
            return (
              <Reveal key={f.id} delay={i * 40}>
                <button
                  className="panel group flex w-full cursor-pointer flex-col items-start gap-3 p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:border-line2 hover:bg-raise"
                  onClick={() => enter(f)}
                  onDoubleClick={() => enter(f)}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-raise transition-transform duration-200 group-hover:scale-110" style={{ color: tint }}>
                    <Icon size={19} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] font-semibold text-ink">{f.name}</span>
                    <span className="mt-0.5 flex items-center gap-1.5 font-mono text-[10.5px] text-faint">
                      {f.type === "folder" ? "folder" : f.size} · {f.sync === "syncing" ? <span className="text-amber">syncing…</span> : <span className="text-green">synced</span>}
                    </span>
                  </span>
                </button>
              </Reveal>
            );
          })}
        </div>
      )}

      <Reveal delay={80}>
        <p className="flex items-center gap-2 font-mono text-[11px] text-faint">
          <IcCloud size={13} className="text-cyan" /> Files open in ONLYOFFICE write straight back to <span className="text-mute">/{current || "meridian-workspace"}</span> via the WebDAV bridge.
        </p>
      </Reveal>

      <ToastStack toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
