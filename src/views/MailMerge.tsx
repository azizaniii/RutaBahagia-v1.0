import { useMemo, useRef, useState, type ReactNode } from "react";
import { useOffice } from "../store";
import { TOKEN_RE, mergeRow, tokensIn, type CloudFile } from "../data";
import { Scramble, Reveal, Pill, SectionLabel, useToasts, ToastStack, StatusDot } from "../ui";
import { IcMerge, IcDownload, IcPenDoc, IcDoc, IcDatabase, IcPlus, IcAlert, IcCheck } from "../icons";

function download(name: string, content: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function renderMerged(body: string, row: Record<string, string>): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;
  let k = 0;
  TOKEN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN_RE.exec(body)) !== null) {
    if (m.index > last) parts.push(body.slice(last, m.index));
    const key = m[1];
    if (row[key] !== undefined) parts.push(<mark key={k++} className="merge-val">{row[key]}</mark>);
    else parts.push(<mark key={k++} className="merge-miss">{`{{${key}}}`}</mark>);
    last = m.index + m[0].length;
  }
  if (last < body.length) parts.push(body.slice(last));
  return parts;
}

export default function MailMerge() {
  const { templates, setTemplateBody, datasets, mergedTotal, bumpMerged, addEvent, openDoc } = useOffice();
  const { toasts, push, dismiss } = useToasts();

  const [tplId, setTplId] = useState(templates[0].id);
  const [dsId, setDsId] = useState(datasets[0].id);
  const [rowIdx, setRowIdx] = useState(0);
  const [results, setResults] = useState<{ name: string; text: string }[]>([]);
  const [merging, setMerging] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const tpl = templates.find((t) => t.id === tplId) ?? templates[0];
  const ds = datasets.find((d) => d.id === dsId) ?? datasets[0];
  const row = ds.rows[Math.min(rowIdx, ds.rows.length - 1)];

  const bodyTokens = tokensIn(tpl.body);
  const missing = bodyTokens.filter((t) => !ds.columns.includes(t));
  const unused = ds.columns.filter((c) => !bodyTokens.includes(c));

  const insertToken = (col: string) => {
    const ta = taRef.current;
    const token = `{{${col}}}`;
    if (!ta) {
      setTemplateBody(tpl.id, tpl.body + token);
      return;
    }
    const s = ta.selectionStart ?? tpl.body.length;
    const e = ta.selectionEnd ?? tpl.body.length;
    const next = tpl.body.slice(0, s) + token + tpl.body.slice(e);
    setTemplateBody(tpl.id, next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = s + token.length;
    });
  };

  const mergeAll = () => {
    if (missing.length > 0) {
      push(`Unresolved fields: ${missing.join(", ")}. Map them or remove the tokens.`, "warn");
      return;
    }
    setMerging(true);
    window.setTimeout(() => {
      const out = ds.rows.map((r) => ({ name: r[ds.columns[0]] ?? "record", text: mergeRow(tpl.body, r) }));
      setResults(out);
      bumpMerged(out.length);
      addEvent("merge", `${out.length} × "${tpl.name}" merged from ${ds.name}`);
      setMerging(false);
      push(`${out.length} documents merged from ${ds.name}.`);
    }, 900);
  };

  const openBatchInOffice = () => {
    if (results.length === 0) return;
    const content = results.map((r) => r.text).join("\n\n──────────────────────────────\n\n");
    const file: CloudFile = {
      id: `merged-${Date.now()}`,
      name: `${tpl.name.toLowerCase().replace(/\s+/g, "-")}-batch.docx`,
      type: "docx",
      folder: "Documents",
      size: `${Math.max(4, Math.round(content.length / 1024))} KB`,
      updated: "just now",
      sync: "synced",
      owner: "RA",
      content,
    };
    addEvent("editor", `${file.name} opened in ONLYOFFICE`);
    openDoc(file);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel>Module 02 / Mail merge</SectionLabel>
          <h1 className="mt-2 font-display text-[32px] font-bold leading-none tracking-tight sm:text-[38px]">
            <Scramble text="Mail merge studio" />
          </h1>
          <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-mute">
            Push live dataset rows into document templates — the Word-style merge, wired straight to
            the automation runner. <span className="text-ink/80">{mergedTotal} documents merged this quarter.</span>
          </p>
        </div>
        <button className="btn-primary" onClick={mergeAll} disabled={merging}>
          {merging ? <span className="spin-slow inline-block h-3.5 w-3.5 rounded-full border border-green border-t-transparent" /> : <IcMerge size={14} />}
          {merging ? "Merging…" : `Merge all ${ds.rows.length} records`}
        </button>
      </header>

      {merging && (
        <div className="h-1 overflow-hidden rounded-full bg-lift">
          <div className="bar-in h-full w-full bg-amber" style={{ animationDuration: "0.9s" }} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-12">
        {/* templates */}
        <Reveal className="lg:col-span-3">
          <div className="panel h-full p-4">
            <SectionLabel>Templates</SectionLabel>
            <div className="mt-3 space-y-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTplId(t.id); setResults([]); }}
                  className={`block w-full cursor-pointer rounded-md border p-3 text-left transition-all duration-150 ${
                    t.id === tplId ? "border-amber/40 bg-amber/[0.06]" : "border-line bg-raise hover:border-line2"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <IcDoc size={14} className={t.id === tplId ? "text-amber" : "text-faint"} />
                    <span className="flex-1 truncate text-[13px] font-semibold">{t.name}</span>
                  </span>
                  <span className="mt-1.5 block font-mono text-[10.5px] text-faint">
                    {tokensIn(t.body).length} fields · {t.updatedAt}
                  </span>
                </button>
              ))}
            </div>

            <SectionLabel className="mt-6">Data source</SectionLabel>
            <div className="mt-3 space-y-2">
              {datasets.map((d) => (
                <button
                  key={d.id}
                  onClick={() => { setDsId(d.id); setRowIdx(0); setResults([]); }}
                  className={`block w-full cursor-pointer rounded-md border p-3 text-left transition-all duration-150 ${
                    d.id === dsId ? "border-green/40 bg-green/[0.06]" : "border-line bg-raise hover:border-line2"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <IcDatabase size={14} className={d.id === dsId ? "text-green" : "text-faint"} />
                    <span className="flex-1 truncate text-[13px] font-semibold">{d.name}</span>
                  </span>
                  <span className="mt-1.5 block font-mono text-[10.5px] text-faint">
                    {d.rows.length} rows · from "{d.source}" · {d.updatedAt}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {/* template editor */}
        <Reveal delay={70} className="lg:col-span-5">
          <div className="panel flex h-full flex-col p-4">
            <div className="flex items-center justify-between">
              <SectionLabel>Template body · {tpl.name}</SectionLabel>
              <Pill tone={missing.length ? "coral" : "green"}>
                {missing.length ? <IcAlert size={11} /> : <IcCheck size={11} />}
                {missing.length ? `${missing.length} unmapped` : "all fields mapped"}
              </Pill>
            </div>
            <textarea
              ref={taRef}
              value={tpl.body}
              onChange={(e) => setTemplateBody(tpl.id, e.target.value)}
              spellCheck={false}
              className="field mt-3 min-h-[300px] flex-1 resize-none bg-bg font-mono text-[12px] leading-relaxed"
            />
            <div className="mt-3">
              <p className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">Insert field from {ds.name}</p>
              <div className="flex flex-wrap gap-1.5">
                {ds.columns.map((c) => (
                  <button
                    key={c}
                    onClick={() => insertToken(c)}
                    className={`chip cursor-pointer transition-all hover:-translate-y-px hover:border-green/50 hover:text-green ${
                      bodyTokens.includes(c) ? "border-green/30 text-green" : ""
                    }`}
                  >
                    <IcPlus size={10} /> {`{{${c}}}`}
                  </button>
                ))}
              </div>
              {unused.length > 0 && (
                <p className="mt-2.5 font-mono text-[10.5px] text-faint">
                  Available but unused: <span className="text-mute">{unused.map((u) => `{{${u}}}`).join("  ")}</span>
                </p>
              )}
              {missing.length > 0 && (
                <p className="mt-2.5 flex items-center gap-1.5 font-mono text-[10.5px] text-coral">
                  <IcAlert size={11} /> Not in dataset: {missing.map((u) => `{{${u}}}`).join("  ")}
                </p>
              )}
            </div>
          </div>
        </Reveal>

        {/* data rows + preview */}
        <div className="space-y-4 lg:col-span-4">
          <Reveal delay={130}>
            <div className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <SectionLabel>Records · {ds.name}</SectionLabel>
                <span className="font-mono text-[11px] text-faint">{ds.rows.length} rows</span>
              </div>
              <div className="max-h-[190px] overflow-y-auto">
                {ds.rows.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => setRowIdx(i)}
                    className={`flex w-full cursor-pointer items-center gap-2.5 border-b border-line/50 px-4 py-2 text-left transition-colors last:border-0 ${
                      i === rowIdx ? "bg-green/[0.08]" : "hover:bg-raise"
                    }`}
                  >
                    <span className={`font-mono text-[10.5px] tabular-nums ${i === rowIdx ? "text-green" : "text-faint"}`}>{String(i + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">{r[ds.columns[0]]}</span>
                    <span className="truncate font-mono text-[10.5px] text-faint">{r[ds.columns[1]]}</span>
                    {i === rowIdx && <StatusDot tone="green" />}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={190}>
            <div className="panel p-4">
              <div className="flex items-center justify-between">
                <SectionLabel>Preview · record {rowIdx + 1}</SectionLabel>
                <button
                  className="btn-ghost px-2 py-1 text-[11.5px]"
                  onClick={() => {
                    download(`${ds.columns[0]}-${(row[ds.columns[0]] ?? "record").toLowerCase().replace(/\s+/g, "-")}.txt`, mergeRow(tpl.body, row));
                    push("Merged document downloaded as .txt");
                  }}
                >
                  <IcDownload size={12} /> .txt
                </button>
              </div>
              <div className="paper mt-3 max-h-[340px] overflow-y-auto px-6 py-5">
                <pre className="font-body text-[12.5px] leading-relaxed" style={{ whiteSpace: "pre-wrap", fontFamily: "var(--font-body)" }}>
                  {renderMerged(tpl.body, row)}
                </pre>
              </div>
              <p className="mt-2.5 font-mono text-[10.5px] text-faint">
                <mark className="merge-val">amber</mark> = merged value · <mark className="merge-miss">red</mark> = unresolved field
              </p>
            </div>
          </Reveal>
        </div>
      </div>

      {/* results */}
      {results.length > 0 && (
        <Reveal>
          <div className="panel p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-[16px] font-semibold tracking-tight">
                  Merge output — {results.length} documents
                </h2>
                <p className="mt-0.5 font-mono text-[11px] text-faint">"{tpl.name}" × {ds.name} · generated just now</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn"
                  onClick={() => {
                    const html = `<html><head><meta charset="utf-8"><title>${tpl.name} — batch</title></head><body style="font-family:Georgia,serif;max-width:720px;margin:40px auto;line-height:1.6">` +
                      results.map((r) => `<article style="page-break-after:always;margin-bottom:48px"><pre style="white-space:pre-wrap;font-family:inherit">${r.text.replace(/</g, "&lt;")}</pre></article>`).join("") +
                      `</body></html>`;
                    download(`${tpl.name.toLowerCase().replace(/\s+/g, "-")}-batch.html`, html, "text/html;charset=utf-8");
                    push("Batch downloaded — one .html, page breaks between records.");
                  }}
                >
                  <IcDownload size={13} /> Download all (.html)
                </button>
                <button className="btn-primary" onClick={openBatchInOffice}>
                  <IcPenDoc size={13} /> Open batch in ONLYOFFICE
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {results.map((r, i) => (
                <div key={i} className="rise group rounded-md border border-line bg-raise p-3 transition-colors hover:border-line2" style={{ animationDelay: `${i * 45}ms` }}>
                  <div className="flex items-center gap-2">
                    <IcDoc size={13} className="text-amber" />
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">{r.name}</span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 font-mono text-[10.5px] leading-relaxed text-faint">{r.text.split("\n").find(Boolean)}</p>
                  <button
                    className="mt-2 flex items-center gap-1.5 font-mono text-[10.5px] text-mute transition-colors hover:text-green"
                    onClick={() => { download(`${r.name.toLowerCase().replace(/\s+/g, "-")}.txt`, r.text); push(`Saved ${r.name}.txt`); }}
                  >
                    <IcDownload size={10} /> download .txt
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      <ToastStack toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
