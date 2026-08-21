import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { IcX, IcCheck, IcAlert } from "./icons";

/* ------------------------- motion preferences ------------------------- */

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/* ----------------------------- scramble ----------------------------- */

const GLYPHS = "█▓▒░<>/\\|=+*#%@";

export function Scramble({ text, className = "" }: { text: string; className?: string }) {
  const reduced = useReducedMotion();
  const [out, setOut] = useState(reduced ? text : "");
  useEffect(() => {
    if (reduced) {
      setOut(text);
      return;
    }
    let frame = 0;
    const total = Math.max(14, text.length + 8);
    const id = window.setInterval(() => {
      frame += 1;
      const solved = Math.floor((frame / total) * text.length);
      let s = "";
      for (let i = 0; i < text.length; i++) {
        if (i < solved || text[i] === " ") s += text[i];
        else s += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      setOut(s);
      if (frame >= total) {
        setOut(text);
        window.clearInterval(id);
      }
    }, 34);
    return () => window.clearInterval(id);
  }, [text, reduced]);
  return <span className={className}>{out || "\u00A0"}</span>;
}

/* ------------------------------ reveal ------------------------------ */

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add("is-in");
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ------------------------------ count up ----------------------------- */

export function CountUp({ value, className = "", suffix = "" }: { value: number; className?: string; suffix?: string }) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(reduced ? value : 0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (reduced) {
      setN(value);
      return;
    }
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const dur = 1100;
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / dur);
        setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, reduced]);
  return (
    <span ref={ref} className={className}>
      {n.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ------------------------------ sparkline ---------------------------- */

export function Spark({ data, className = "", stroke = "#4cc38a", h = 44 }: { data: number[]; className?: string; stroke?: string; h?: number }) {
  const { d, area, len } = useMemo(() => {
    const w = 160;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const pts = data.map((v, i) => [
      (i / (data.length - 1)) * w,
      h - 6 - ((v - min) / (max - min || 1)) * (h - 12),
    ]);
    const path = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    const a = `${path} L${w},${h} L0,${h} Z`;
    let length = 0;
    for (let i = 1; i < pts.length; i++) {
      length += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    }
    return { d: path, area: a, len: Math.ceil(length) };
  }, [data, h]);
  return (
    <svg viewBox={`0 0 160 ${h}`} className={`spark ${className}`} preserveAspectRatio="none" style={{ "--dash": len } as CSSProperties}>
      <path d={area} fill={stroke} opacity="0.09" stroke="none" />
      <path d={d} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------- pills ------------------------------- */

export function StatusDot({ tone = "green", pulse = false }: { tone?: "green" | "amber" | "coral" | "cyan" | "faint"; pulse?: boolean }) {
  const map = {
    green: "bg-green" + (pulse ? " dot-live" : ""),
    amber: "bg-amber" + (pulse ? " dot-live-amber" : ""),
    coral: "bg-coral",
    cyan: "bg-cyan",
    faint: "bg-faint",
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${map[tone]}`} />;
}

const TONES: Record<string, string> = {
  green: "text-green border-green/30 bg-green/10",
  amber: "text-amber border-amber/30 bg-amber/10",
  coral: "text-coral border-coral/30 bg-coral/10",
  cyan: "text-cyan border-cyan/30 bg-cyan/10",
  faint: "text-mute border-line bg-raise",
};

export function Pill({ tone = "faint", children, className = "" }: { tone?: keyof typeof TONES; children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-[11px] font-semibold ${TONES[tone]} ${className}`}>{children}</span>;
}

/* ------------------------------- modal ------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#070b08]/75 p-4 pt-[9vh] backdrop-blur-[3px]" onMouseDown={onClose}>
      <div
        className={`toast-in w-full ${wide ? "max-w-2xl" : "max-w-lg"} panel border-line2 bg-raise shadow-[0_30px_80px_-20px_rgba(3,7,4,0.9)]`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="font-display text-[15px] font-semibold tracking-tight">{title}</h3>
          <button className="btn-ghost -mr-2 px-2 py-1" onClick={onClose} aria-label="Close dialog">
            <IcX size={15} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------- toast ------------------------------- */

export interface ToastMsg {
  id: number;
  kind: "ok" | "warn" | "err";
  text: string;
}

export function ToastStack({ toasts, dismiss }: { toasts: ToastMsg[]; dismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-[320px] flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="toast-in pointer-events-auto flex items-start gap-2.5 rounded-lg border border-line2 bg-raise px-3.5 py-3 shadow-[0_18px_40px_-12px_rgba(3,7,4,0.8)]">
          <span className={`mt-0.5 ${t.kind === "ok" ? "text-green" : t.kind === "warn" ? "text-amber" : "text-coral"}`}>
            {t.kind === "ok" ? <IcCheck size={15} /> : <IcAlert size={15} />}
          </span>
          <p className="flex-1 text-[12.5px] leading-snug text-ink">{t.text}</p>
          <button className="text-faint transition-colors hover:text-ink" onClick={() => dismiss(t.id)} aria-label="Dismiss">
            <IcX size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const idRef = useRef(0);
  const push = useCallback((text: string, kind: ToastMsg["kind"] = "ok") => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-3), { id, kind, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  return { toasts, push, dismiss };
}

/* ------------------------------ section ------------------------------ */

export function SectionLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-faint ${className}`}>{children}</p>;
}
