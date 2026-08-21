import { useCallback, useEffect, useRef, useState } from "react";
import { useOffice } from "../store";
import type { CloudFile } from "../data";
import { Pill, StatusDot, useToasts, ToastStack, SectionLabel } from "../ui";
import { FILE_ICON, FILE_TINT, IcArrowL, IcBold, IcItalic, IcUnder, IcStrike, IcAlignL, IcAlignC, IcAlignR, IcUl, IcOl, IcUndo, IcRedo, IcShare, IcSave, IcLink, IcCheck, IcX } from "../icons";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const DEFAULT_DOC: CloudFile = { id: "f9", name: "offer-letter.docx", type: "docx", folder: "Templates", size: "22 KB", updated: "3 d ago", sync: "synced", owner: "JW" };

const DEFAULT_HTML = `<h1>Consultant Offer Letter</h1>
<p><b>Meridian Group · People Operations</b><br>14 Harbour Quay, Rotterdam</p>
<h2>1. The offer</h2>
<p>Following your interviews with the operations team, we are delighted to extend this offer of employment. The terms below reflect what was discussed during your final conversation with the panel.</p>
<ul>
<li>Position and grade, effective from the start date</li>
<li>Starting compensation, reviewed at each quarterly calibration</li>
<li>Reporting line and primary workspace</li>
</ul>
<h2>2. Acceptance</h2>
<p>This offer remains valid for <b>ten (10) business days</b>. Please countersign and return the attached copy to <u>people-ops@meridian.office</u>.</p>
<p>We look forward to welcoming you aboard.</p>`;

const FONTS = ["IBM Plex Sans", "Space Grotesk", "Georgia", "IBM Plex Mono"];
const SIZES: { label: string; v: string }[] = [
  { label: "10", v: "1" }, { label: "12", v: "2" }, { label: "14", v: "3" }, { label: "18", v: "4" }, { label: "24", v: "5" }, { label: "32", v: "6" }, { label: "48", v: "7" },
];
const INK_COLORS = ["#212a23", "#b3402e", "#1f6f4a", "#275e8e", "#8a6420"];

const COLLABORATORS = [
  { init: "JW", color: "#e2a33c", state: "editing" },
  { init: "MK", color: "#e0604a", state: "viewing" },
  { init: "LC", color: "#4cc38a", state: "viewing" },
];

function initialHtml(doc: CloudFile): string {
  if (doc.content) {
    return doc.content
      .split("\n")
      .map((l) => (l.trim() === "" ? "<p><br></p>" : `<p>${esc(l).replace(/─+/g, "</p><hr style='border:none;border-top:1px solid #c9c2b2'><p>")}</p>`))
      .join("");
  }
  return DEFAULT_HTML;
}

export default function EditorView() {
  const { activeDoc, closeDoc, addEvent } = useOffice();
  const { toasts, push, dismiss } = useToasts();
  const doc = activeDoc ?? DEFAULT_DOC;

  const [html] = useState(() => initialHtml(doc));
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [counts, setCounts] = useState({ words: 0, chars: 0 });
  const [zoom, setZoom] = useState(100);
  const [active, setActive] = useState({ b: false, i: false, u: false });
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<number>(0);

  useEffect(() => {
    const el = editorRef.current;
    if (el) setCounts({ words: (el.textContent ?? "").trim().split(/\s+/).filter(Boolean).length, chars: (el.textContent ?? "").length });
  }, [html]);

  const refreshState = useCallback(() => {
    try {
      setActive({
        b: document.queryCommandState("bold"),
        i: document.queryCommandState("italic"),
        u: document.queryCommandState("underline"),
      });
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", refreshState);
    return () => document.removeEventListener("selectionchange", refreshState);
  }, [refreshState]);

  const exec = (cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    refreshState();
    onInput();
  };

  const onInput = () => {
    const el = editorRef.current;
    if (el) setCounts({ words: (el.textContent ?? "").trim().split(/\s+/).filter(Boolean).length, chars: (el.textContent ?? "").length });
    setSaveState("saving");
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      setSaveState("saved");
      addEvent("editor", `Autosaved ${doc.name} → /${doc.folder}`);
    }, 1100);
  };

  const Icon = FILE_ICON[doc.type] ?? FILE_ICON.docx;
  const tint = FILE_TINT[doc.type] ?? "#58b7c6";

  const toolBtn = (on: boolean) =>
    `flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border transition-all duration-100 ${
      on ? "border-green/50 bg-green/15 text-green" : "border-transparent text-mute hover:bg-raise hover:text-ink"
    }`;

  const divider = <span className="mx-1 h-5 w-px bg-line" />;

  return (
    <div className="space-y-4">
      {/* doc bar */}
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn px-2.5 py-1.5" onClick={closeDoc}>
          <IcArrowL size={14} /> Files
        </button>
        <div className="flex items-center gap-2 rounded-md border border-line bg-raise py-1 pl-2.5 pr-1.5">
          <span style={{ color: tint }}><Icon size={15} /></span>
          <span className="text-[13px] font-semibold">{doc.name}</span>
          <span className="chip border-0 bg-transparent px-1 py-0 font-mono text-[10px]">/{doc.folder}</span>
          <button className="rounded p-1 text-faint transition-colors hover:bg-lift hover:text-ink" onClick={closeDoc} aria-label="Close tab">
            <IcX size={12} />
          </button>
        </div>
        <Pill tone="cyan">ONLYOFFICE · Docs 8.2</Pill>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex -space-x-2">
            {COLLABORATORS.map((c) => (
              <span
                key={c.init}
                title={`${c.init} is ${c.state}`}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-bg text-[9.5px] font-bold text-bg"
                style={{ backgroundColor: c.color }}
              >
                {c.init}
              </span>
            ))}
          </div>
          <span className="hidden font-mono text-[11px] text-faint sm:block">3 online</span>
          <button
            className="btn px-3 py-1.5 text-[12.5px]"
            onClick={() => {
              navigator.clipboard?.writeText(`https://office.meridian.office/d/${doc.id}`).then(
                () => push("Editor link copied — share it with your team."),
                () => push("Clipboard unavailable in this browser.", "warn"),
              );
            }}
          >
            <IcShare size={13} /> Share
          </button>
          <button
            className="btn-primary px-3 py-1.5 text-[12.5px]"
            onClick={() => {
              setSaveState("saved");
              addEvent("editor", `${doc.name} saved to Nextcloud manually`);
              push(`${doc.name} saved to /${doc.folder}.`);
            }}
          >
            <IcSave size={13} /> Save
          </button>
        </div>
      </div>

      {/* ribbon */}
      <div className="panel overflow-x-auto">
        <div className="flex items-center gap-1 whitespace-nowrap px-3 py-2">
          <button className={toolBtn(false)} onClick={() => exec("undo")} title="Undo"><IcUndo size={15} /></button>
          <button className={toolBtn(false)} onClick={() => exec("redo")} title="Redo"><IcRedo size={15} /></button>
          {divider}
          <select className="field w-[150px] cursor-pointer py-1.5 text-[12px]" defaultValue="IBM Plex Sans" onChange={(e) => exec("fontName", e.target.value)} title="Font">
            {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <select className="field w-[70px] cursor-pointer py-1.5 text-[12px]" defaultValue="3" onChange={(e) => exec("fontSize", e.target.value)} title="Size">
            {SIZES.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
          </select>
          {divider}
          <button className={toolBtn(active.b)} onClick={() => exec("bold")} title="Bold"><IcBold size={15} /></button>
          <button className={toolBtn(active.i)} onClick={() => exec("italic")} title="Italic"><IcItalic size={15} /></button>
          <button className={toolBtn(active.u)} onClick={() => exec("underline")} title="Underline"><IcUnder size={15} /></button>
          <button className={toolBtn(false)} onClick={() => exec("strikeThrough")} title="Strikethrough"><IcStrike size={15} /></button>
          {divider}
          <span className="flex items-center gap-1">
            {INK_COLORS.map((c) => (
              <button key={c} className="h-5 w-5 cursor-pointer rounded-full border border-line transition-transform hover:scale-125" style={{ backgroundColor: c }} onClick={() => exec("foreColor", c)} title="Text color" />
            ))}
          </span>
          {divider}
          <button className={toolBtn(false)} onClick={() => exec("justifyLeft")} title="Align left"><IcAlignL size={15} /></button>
          <button className={toolBtn(false)} onClick={() => exec("justifyCenter")} title="Align center"><IcAlignC size={15} /></button>
          <button className={toolBtn(false)} onClick={() => exec("justifyRight")} title="Align right"><IcAlignR size={15} /></button>
          {divider}
          <button className={toolBtn(false)} onClick={() => exec("insertUnorderedList")} title="Bullet list"><IcUl size={15} /></button>
          <button className={toolBtn(false)} onClick={() => exec("insertOrderedList")} title="Numbered list"><IcOl size={15} /></button>
          {divider}
          <button
            className={toolBtn(false)}
            onClick={() => {
              const url = window.prompt("Link URL", "https://");
              if (url) exec("createLink", url);
            }}
            title="Insert link"
          >
            <IcLink size={15} />
          </button>

          <span className="ml-auto flex items-center gap-2 pl-4 font-mono text-[11px] text-faint">
            {saveState === "saving" ? (
              <span className="flex items-center gap-1.5 text-amber"><span className="spin-slow inline-block h-2.5 w-2.5 rounded-full border border-amber border-t-transparent" /> saving…</span>
            ) : (
              <span className="flex items-center gap-1.5 text-green"><IcCheck size={11} /> saved to Nextcloud</span>
            )}
          </span>
        </div>
      </div>

      {/* page */}
      <div className="panel relative overflow-hidden px-4 py-8 sm:px-8">
        <SectionLabel className="absolute left-4 top-3 hidden sm:block">Editing room · eu-west</SectionLabel>
        <div className="mx-auto transition-all duration-200" style={{ width: `${Math.min(100, (zoom / 100) * 100)}%`, maxWidth: `${(zoom / 100) * 840}px` }}>
          <div className="paper relative px-8 py-10 sm:px-14 sm:py-12">
            {/* remote cursor */}
            <div className="float-y pointer-events-none absolute right-10 top-24 z-10 hidden sm:block">
              <span className="block h-5 w-[2px] bg-[#e2a33c]" />
              <span className="mt-0.5 block rounded-sm bg-[#e2a33c] px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[#1c1406]">JW</span>
            </div>
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={onInput}
              dangerouslySetInnerHTML={{ __html: html }}
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      {/* status bar */}
      <div className="panel flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 font-mono text-[11px] text-faint">
        <span className="flex items-center gap-2 text-mute">
          <StatusDot tone="green" pulse /> Document Server 8.2.1 · connected · JWT verified
        </span>
        <span>{counts.words} words · {counts.chars} chars</span>
        <span className="hidden sm:inline">write-back → /{doc.folder}/{doc.name}</span>
        <label className="ml-auto flex items-center gap-2">
          zoom
          <input type="range" min={60} max={160} step={10} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-28 accent-[#4cc38a]" />
          <span className="w-9 text-right tabular-nums text-mute">{zoom}%</span>
        </label>
      </div>

      <ToastStack toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
