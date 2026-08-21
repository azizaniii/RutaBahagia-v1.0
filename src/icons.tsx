import type { SVGProps, ReactNode } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = ({ size = 16, ...rest }: P, children: ReactNode, filled = false) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke={filled ? "none" : "currentColor"}
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
);

/* brand */
export const LogoMark = (p: P) =>
  base(p, <>
    <circle cx="12" cy="12" r="8.2" />
    <path d="M12 3.8v16.4M3.8 12h16.4" opacity=".55" strokeWidth="1.1" />
    <ellipse cx="12" cy="12" rx="3.6" ry="8.2" strokeWidth="1.3" />
  </>);

/* navigation */
export const IcGrid = (p: P) =>
  base(p, <>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <path d="M17 13.8v6.4M13.8 17h6.4" />
  </>);

export const IcBolt = (p: P) =>
  base(p, <path d="M13 2.5 5.2 13.2h5.1L9.9 21.5 18.8 10.3h-5.4L13 2.5Z" />);

export const IcMerge = (p: P) =>
  base(p, <>
    <path d="M4 5.5c6.5 0 9.5 3 9.8 6.5" />
    <path d="M20 5.5C13.5 5.5 10.5 8.5 10.2 12" />
    <path d="M12 12v7.5" />
    <path d="m8.8 16.5 3.2 3.3 3.2-3.3" />
    <circle cx="4" cy="5.5" r="1.6" />
    <circle cx="20" cy="5.5" r="1.6" />
  </>);

export const IcTimeline = (p: P) =>
  base(p, <>
    <path d="M3.5 5h17M3.5 12h17M3.5 19h17" opacity=".4" strokeWidth="1.1" />
    <rect x="5" y="3.4" width="8" height="3.2" rx="1.2" />
    <rect x="9" y="10.4" width="10" height="3.2" rx="1.2" />
    <rect x="6.5" y="17.4" width="6" height="3.2" rx="1.2" />
  </>);

export const IcCloud = (p: P) =>
  base(p, <path d="M7 18.5a4.2 4.2 0 0 1-.6-8.36 5.6 5.6 0 0 1 10.9-1.1A4.6 4.6 0 0 1 17 18.5H7Z" />);

export const IcPenDoc = (p: P) =>
  base(p, <>
    <path d="M13.5 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5v-9" />
    <path d="M9 8h4M9 12h3" opacity=".6" strokeWidth="1.3" />
    <path d="m19.4 3.4 1.2 1.2-6 6-1.7.5.5-1.7 6-6Z" />
  </>);

/* generic */
export const IcSearch = (p: P) => base(p, <><circle cx="10.5" cy="10.5" r="6" /><path d="m15.2 15.2 5.3 5.3" /></>);
export const IcPlay = (p: P) => base(p, <path d="M8 5.5v13l10-6.5-10-6.5Z" />, true);
export const IcPlus = (p: P) => base(p, <path d="M12 5v14M5 12h14" />);
export const IcCheck = (p: P) => base(p, <path d="m5 12.5 4.5 4.5L19 7.5" />);
export const IcX = (p: P) => base(p, <path d="m6 6 12 12M18 6 6 18" />);
export const IcAlert = (p: P) => base(p, <><path d="M12 3.5 2.8 19.5h18.4L12 3.5Z" /><path d="M12 10v4M12 16.8v.4" /></>);
export const IcClock = (p: P) => base(p, <><circle cx="12" cy="12" r="8.2" /><path d="M12 7.5V12l3 2.2" /></>);
export const IcChevronR = (p: P) => base(p, <path d="m9 5.5 6.5 6.5L9 18.5" />);
export const IcChevronD = (p: P) => base(p, <path d="m5.5 9 6.5 6.5L18.5 9" />);
export const IcArrowL = (p: P) => base(p, <><path d="M19 12H5" /><path d="m11 6-6 6 6 6" /></>);
export const IcArrowUR = (p: P) => base(p, <><path d="M7 17 17 7" /><path d="M9 7h8v8" /></>);
export const IcExternal = (p: P) => base(p, <><path d="M10 5H6a1.5 1.5 0 0 0-1.5 1.5V18A1.5 1.5 0 0 0 6 19.5h11.5A1.5 1.5 0 0 0 19 18v-4" /><path d="M13.5 4.5H19.5V10.5" /><path d="M19 5 11 13" /></>);
export const IcDownload = (p: P) => base(p, <><path d="M12 4v11" /><path d="m7 11 5 5 5-5" /><path d="M4.5 20h15" /></>);
export const IcUpload = (p: P) => base(p, <><path d="M12 15V4" /><path d="m7 8 5-5 5 5" /><path d="M4.5 20h15" /></>);
export const IcShare = (p: P) => base(p, <><circle cx="6" cy="12" r="2.4" /><circle cx="17.5" cy="5.5" r="2.4" /><circle cx="17.5" cy="18.5" r="2.4" /><path d="m8.2 10.8 7-4M8.2 13.2l7 4" /></>);
export const IcSync = (p: P) => base(p, <><path d="M4.5 12a7.5 7.5 0 0 1 13-5.2l2 1.9" /><path d="M19.5 4.5v4.2h-4.2" /><path d="M19.5 12a7.5 7.5 0 0 1-13 5.2l-2-1.9" /><path d="M4.5 19.5v-4.2h4.2" /></>);
export const IcTerminal = (p: P) => base(p, <><rect x="3" y="4.5" width="18" height="15" rx="2" /><path d="m7 9.5 3.5 2.8L7 15M13 15.5h4" /></>);
export const IcDatabase = (p: P) => base(p, <><ellipse cx="12" cy="5.5" rx="7.5" ry="2.8" /><path d="M4.5 5.5v13c0 1.55 3.36 2.8 7.5 2.8s7.5-1.25 7.5-2.8v-13" /><path d="M4.5 12c0 1.55 3.36 2.8 7.5 2.8s7.5-1.25 7.5-2.8" /></>);
export const IcLink = (p: P) => base(p, <><path d="M9.5 14.5 14.5 9.5" /><path d="M11 6.8 13 4.9a3.8 3.8 0 0 1 5.4 5.4l-2 1.9" /><path d="M13 17.2l-2 1.9a3.8 3.8 0 0 1-5.4-5.4l2-1.9" /></>);
export const IcFilter = (p: P) => base(p, <path d="M4 6h16M7 12h10M10 18h4" />);
export const IcListView = (p: P) => base(p, <><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none" /><circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="4.5" cy="18" r="1" fill="currentColor" stroke="none" /></>);
export const IcGridView = (p: P) => base(p, <><rect x="4" y="4" width="6.5" height="6.5" rx="1" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" /></>);
export const IcFolder = (p: P) => base(p, <path d="M3.5 7A1.5 1.5 0 0 1 5 5.5h4.2l2 2.5H19A1.5 1.5 0 0 1 20.5 9.5v8A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5V7Z" />, true);
export const IcDoc = (p: P) => base(p, <><path d="M6 3.5h8l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V3.5Z" /><path d="M14 3.5V8h4.5" /><path d="M9 12h6M9 15.5h6" opacity=".6" strokeWidth="1.3" /></>);
export const IcSheet = (p: P) => base(p, <><rect x="4.5" y="3.5" width="15" height="17" rx="1.5" /><path d="M4.5 9h15M10 9v11.5M15 9v11.5" opacity=".7" strokeWidth="1.3" /></>);
export const IcPdf = (p: P) => base(p, <><path d="M6 3.5h8l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V3.5Z" /><path d="M14 3.5V8h4.5" /><path d="M8.5 13h7M8.5 16.5h5" strokeWidth="2" /></>);
export const IcCsv = (p: P) => base(p, <><rect x="4.5" y="3.5" width="15" height="17" rx="1.5" /><path d="M9 8v8M15 8v8M4.5 12h15" opacity=".7" strokeWidth="1.3" /></>);
export const IcSlide = (p: P) => base(p, <><rect x="3.5" y="4.5" width="17" height="12" rx="1.5" /><path d="M12 16.5V20M8 20h8" /><path d="m9 13 2.5-3 2 2 2.5-3.5" opacity=".7" strokeWidth="1.4" /></>);
export const IcImage = (p: P) => base(p, <><rect x="3.5" y="4.5" width="17" height="15" rx="1.5" /><circle cx="9" cy="10" r="1.6" /><path d="m5 18 4.8-4.5 3 2.7L17 12l3.5 3.5" /></>);
export const IcBell = (p: P) => base(p, <><path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10Z" /><path d="M10 18.5a2 2 0 0 0 4 0" /></>);
export const IcSettings = (p: P) => base(p, <><circle cx="12" cy="12" r="3" /><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" /></>);
export const IcCode = (p: P) => base(p, <><path d="m8 7-5 5 5 5M16 7l5 5-5 5" /></>);
export const IcCopy = (p: P) => base(p, <><rect x="8.5" y="8.5" width="12" height="12" rx="2" /><path d="M15.5 5.5v-1a2 2 0 0 0-2-2h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h1" transform="translate(1 1)" /></>);
export const IcDot = (p: P) => base(p, <circle cx="12" cy="12" r="5" />, true);

/* editor ribbon */
export const IcBold = (p: P) => base(p, <><path d="M8 4.5h5a3.3 3.3 0 0 1 0 6.6H8zM8 11.1h6a3.4 3.4 0 0 1 0 6.9H8z" strokeWidth="2" /></>);
export const IcItalic = (p: P) => base(p, <path d="M10.5 4.5H18M6 19.5h7.5M14.5 4.5l-5 15" />);
export const IcUnder = (p: P) => base(p, <><path d="M7 4.5V11a5 5 0 0 0 10 0V4.5" /><path d="M6 19.5h12" /></>);
export const IcStrike = (p: P) => base(p, <><path d="M7.5 7.2C8 5.6 9.7 4.5 12 4.5c2.6 0 4.2 1.2 4.6 3M16.8 16.6c-.6 1.7-2.4 2.9-4.8 2.9-2.7 0-4.5-1.3-4.9-3.2" /><path d="M4.5 12h15" /></>);
export const IcAlignL = (p: P) => base(p, <path d="M4.5 6h15M4.5 10.5h10M4.5 15h15M4.5 19.5h7" />);
export const IcAlignC = (p: P) => base(p, <path d="M4.5 6h15M7 10.5h10M4.5 15h15M8.5 19.5h7" />);
export const IcAlignR = (p: P) => base(p, <path d="M4.5 6h15M9.5 10.5h10M4.5 15h15M12.5 19.5h7" />);
export const IcUl = (p: P) => base(p, <><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1.1" fill="currentColor" stroke="none" /><circle cx="4.5" cy="12" r="1.1" fill="currentColor" stroke="none" /><circle cx="4.5" cy="18" r="1.1" fill="currentColor" stroke="none" /></>);
export const IcOl = (p: P) => base(p, <><path d="M10 6h10M10 12h10M10 18h10" /><path d="M4.5 5l1.5-1v4M4 9h3" strokeWidth="1.3" /><path d="M4 12.2c0-.9.8-1.5 1.6-1.5.8 0 1.4.5 1.4 1.3 0 1.2-3 2.5-3 3.5h3.2" strokeWidth="1.3" transform="translate(0 0)" /></>);
export const IcUndo = (p: P) => base(p, <><path d="M4.5 8.5 8.5 4.5M4.5 8.5l4 4" transform="translate(0 3)" /><path d="M4.5 11.5h10a5 5 0 0 1 0 10h-3" transform="translate(0 -3)" /></>);
export const IcRedo = (p: P) => base(p, <><path d="m19.5 11.5-4-4M19.5 11.5l-4 4" transform="translate(0 3)" /><path d="M19.5 11.5h-10a5 5 0 0 0 0 10h3" transform="translate(0 -3)" /></>);
export const IcType = (p: P) => base(p, <><path d="M5 7V4.5h14V7" /><path d="M12 4.5v15M9 19.5h6" /></>);
export const IcSave = (p: P) => base(p, <><path d="M5 4.5h11l3.5 3.5v11a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V6A1.5 1.5 0 0 1 5 4.5Z" /><path d="M8 4.5V9h7V4.5" /><rect x="8" y="13.5" width="8" height="6" /></>);

/* file-type color chips */
export const FILE_ICON: Record<string, (p: P) => ReturnType<typeof IcDoc>> = {
  docx: IcDoc,
  xlsx: IcSheet,
  pdf: IcPdf,
  csv: IcCsv,
  pptx: IcSlide,
  img: IcImage,
};

export const FILE_TINT: Record<string, string> = {
  docx: "#58b7c6",
  xlsx: "#4cc38a",
  pdf: "#e0604a",
  csv: "#e2a33c",
  pptx: "#e2a33c",
  img: "#8da08f",
  folder: "#e2a33c",
};
