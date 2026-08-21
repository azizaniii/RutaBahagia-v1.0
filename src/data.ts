/* ------------------------------------------------------------------ */
/*  Meridian · shared types & seed data                                */
/* ------------------------------------------------------------------ */

export type ViewId = "dashboard" | "automations" | "merge" | "timeline" | "files" | "editor";

export type RunStatus = "idle" | "running" | "success" | "failed";

export interface AutomationJob {
  id: string;
  name: string;
  target: string;
  schedule: string;
  status: RunStatus;
  lastRun: string;
  rows: number;
  duration: string;
  datasetId: string;
  note?: string;
  script: string;
}

export interface Dataset {
  id: string;
  name: string;
  source: string;
  updatedAt: string;
  columns: string[];
  rows: Record<string, string>[];
}

export interface Template {
  id: string;
  name: string;
  kind: "docx" | "letter" | "memo";
  updatedAt: string;
  body: string;
}

export type TaskStatus = "done" | "active" | "todo" | "blocked";

export interface TimelineTask {
  id: string;
  title: string;
  track: "Automation" | "Documents" | "Infrastructure";
  owner: string;
  start: number; // day index, 0-based across 42 days
  end: number;
  status: TaskStatus;
  milestone?: boolean;
  note: string;
}

export type FileType = "folder" | "docx" | "xlsx" | "pdf" | "csv" | "pptx" | "img";

export interface CloudFile {
  id: string;
  name: string;
  type: FileType;
  folder: string; // "" = root
  size?: string;
  updated: string;
  sync: "synced" | "syncing";
  owner: string;
  content?: string; // injected for merged docs opened in ONLYOFFICE
}

export type EvType = "automation" | "merge" | "files" | "editor" | "system";

export interface OfficeEvent {
  id: number;
  type: EvType;
  text: string;
  at: string;
}

export const TODAY_DAY = 18; // marker inside the 42-day window

export const OWNERS: Record<string, { name: string; color: string }> = {
  LC: { name: "Lena Chen", color: "#4cc38a" },
  JW: { name: "Jonas Weiss", color: "#e2a33c" },
  RA: { name: "Rania Adeyemi", color: "#58b7c6" },
  MK: { name: "Mira Kovač", color: "#e0604a" },
};

/* ------------------------------- scripts ------------------------------- */

const SCRIPT_VENDORS = `# fetch_vendor_pricebook.py  ·  runs in the Meridian sandbox venv
import requests, json
from bs4 import BeautifulSoup

URL = "https://vendors.example.com/pricebook"
resp = requests.get(URL, timeout=20)
resp.raise_for_status()

rows = []
for tr in BeautifulSoup(resp.text, "html.parser").select("table#prices tr")[1:]:
    cols = [td.get_text(strip=True) for td in tr.select("td")]
    if len(cols) == 5:
        rows.append(dict(zip(["vendor", "item", "unit_price", "lead_time", "updated"], cols)))

meridian.upsert(dataset="vendors", rows=rows, key=["vendor", "item"])`;

const SCRIPT_HRIS = `# pull_hris_consultants.py
import os, requests

TOKEN = os.environ["HRIS_TOKEN"]
data = requests.get(
    "https://hris.internal/api/v2/consultants",
    headers={"Authorization": f"Bearer {TOKEN}"},
    params={"status": "active", "page_size": 100},
    timeout=30,
).json()

meridian.upsert(dataset="consultants", rows=data["results"],
                key=["name"])`;

const SCRIPT_BRANCHES = `# sync_branch_registry.py
import requests
from datetime import date

payload = requests.get("https://registry.example.org/branches.geojson", timeout=25).json()
rows = [{
    "branch": f["properties"]["name"],
    "city": f["properties"]["city"],
    "region": f["properties"]["region"],
    "head": f["properties"]["branch_head"],
    "headcount": str(f["properties"]["headcount"]),
} for f in payload["features"]]

meridian.upsert(dataset="branches", rows=rows, key=["branch"])`;

const SCRIPT_ATTENDANCE = `# sync_attendance_portal.py  ·  ⚠ token expired — see run log
import requests, os

sess = requests.Session()
sess.post("https://attendance.example.com/login",
          json={"user": "svc-meridian", "pass": os.environ["ATT_PW"]}, timeout=15)

export = sess.get("https://attendance.example.com/export?fmt=csv", timeout=60)
export.raise_for_status()
meridian.load_csv(dataset="attendance", text=export.text)`;

const SCRIPT_FX = `# fx_reference_rates.py  ·  ⏳ awaiting final script from ops team
# Paste the Python automation here — Meridian will execute it inside
# the sandboxed runner and route the result into a dataset.
#
# def main():
#     ...
#     meridian.upsert(dataset="fx_rates", rows=rows, key=["pair", "day"])`;

/* ------------------------------- jobs ------------------------------- */

export const SEED_JOBS: AutomationJob[] = [
  {
    id: "job-vendors",
    name: "Vendor price book scrape",
    target: "https://vendors.example.com/pricebook",
    schedule: "Every 6 hours",
    status: "success",
    lastRun: "42 min ago",
    rows: 6,
    duration: "4.8s",
    datasetId: "vendors",
    script: SCRIPT_VENDORS,
  },
  {
    id: "job-hris",
    name: "HRIS consultant registry pull",
    target: "https://hris.internal/api/v2/consultants",
    schedule: "Daily · 06:00",
    status: "success",
    lastRun: "7 h ago",
    rows: 8,
    duration: "6.2s",
    datasetId: "consultants",
    script: SCRIPT_HRIS,
  },
  {
    id: "job-branches",
    name: "Branch registry geo-sync",
    target: "https://registry.example.org/branches.geojson",
    schedule: "Mondays · 07:30",
    status: "success",
    lastRun: "2 d ago",
    rows: 6,
    duration: "3.1s",
    datasetId: "branches",
    script: SCRIPT_BRANCHES,
  },
  {
    id: "job-attendance",
    name: "Attendance portal sync",
    target: "https://attendance.example.com/export",
    schedule: "Hourly",
    status: "failed",
    lastRun: "1 h ago",
    rows: 0,
    duration: "1.9s",
    datasetId: "attendance",
    note: "401 — service token expired",
    script: SCRIPT_ATTENDANCE,
  },
  {
    id: "job-fx",
    name: "FX reference rate capture",
    target: "https://rates.example.bank/fx-daily",
    schedule: "Every 30 min",
    status: "idle",
    lastRun: "never",
    rows: 0,
    duration: "—",
    datasetId: "fx_rates",
    note: "Python script pending",
    script: SCRIPT_FX,
  },
];

/* ----------------------------- datasets ----------------------------- */

export const SEED_DATASETS: Dataset[] = [
  {
    id: "consultants",
    name: "Consultant intake — Q3",
    source: "HRIS consultant registry pull",
    updatedAt: "7 h ago",
    columns: ["name", "position", "salary", "start_date", "city", "manager"],
    rows: [
      { name: "Amara Osei", position: "Data Analyst", salary: "$4,800", start_date: "Sep 01, 2025", city: "Accra", manager: "J. Weiss" },
      { name: "Daniel Reyes", position: "Automation Engineer", salary: "$5,600", start_date: "Sep 15, 2025", city: "Mexico City", manager: "L. Chen" },
      { name: "Priya Nair", position: "Document Specialist", salary: "$4,200", start_date: "Sep 08, 2025", city: "Kochi", manager: "L. Chen" },
      { name: "Tomas Lindqvist", position: "QA Reviewer", salary: "$3,900", start_date: "Oct 01, 2025", city: "Malmö", manager: "J. Weiss" },
      { name: "Hana Sato", position: "Operations Analyst", salary: "$4,500", start_date: "Sep 22, 2025", city: "Osaka", manager: "R. Adeyemi" },
      { name: "Marcus Webb", position: "Integration Developer", salary: "$5,900", start_date: "Oct 06, 2025", city: "Toronto", manager: "R. Adeyemi" },
      { name: "Fatima El-Sayed", position: "Client Liaison", salary: "$3,700", start_date: "Sep 29, 2025", city: "Cairo", manager: "J. Weiss" },
      { name: "Owen Gallagher", position: "Reporting Lead", salary: "$5,100", start_date: "Oct 13, 2025", city: "Dublin", manager: "R. Adeyemi" },
    ],
  },
  {
    id: "vendors",
    name: "Vendor price list",
    source: "Vendor price book scrape",
    updatedAt: "42 min ago",
    columns: ["vendor", "item", "unit_price", "lead_time", "updated"],
    rows: [
      { vendor: "Northwind Supplies", item: "A4 paper, 80gsm (ream)", unit_price: "$4.10", lead_time: "3 days", updated: "Aug 28" },
      { vendor: "Northwind Supplies", item: "Toner cartridge TN-660", unit_price: "$62.00", lead_time: "5 days", updated: "Aug 28" },
      { vendor: "BluePeak Logistics", item: "Courier — intra-city", unit_price: "$8.50", lead_time: "same day", updated: "Aug 26" },
      { vendor: "BluePeak Logistics", item: "Freight crate, 120L", unit_price: "$34.75", lead_time: "2 days", updated: "Aug 26" },
      { vendor: "Helios Furniture", item: "Task chair, mesh back", unit_price: "$189.00", lead_time: "3 weeks", updated: "Aug 21" },
      { vendor: "Helios Furniture", item: "Sit-stand desk, 140cm", unit_price: "$412.00", lead_time: "4 weeks", updated: "Aug 21" },
    ],
  },
  {
    id: "branches",
    name: "Regional branch registry",
    source: "Branch registry geo-sync",
    updatedAt: "2 d ago",
    columns: ["branch", "city", "region", "head", "headcount"],
    rows: [
      { branch: "Meridian North", city: "Rotterdam", region: "EMEA", head: "S. van Dijk", headcount: "42" },
      { branch: "Meridian Gulf", city: "Dubai", region: "MEA", head: "K. Al-Farsi", headcount: "27" },
      { branch: "Meridian Pacific", city: "Singapore", region: "APAC", head: "M. Tan", headcount: "35" },
      { branch: "Meridian Andes", city: "Bogotá", region: "LATAM", head: "C. Rueda", headcount: "19" },
      { branch: "Meridian Lakes", city: "Chicago", region: "NA", head: "D. Okafor", headcount: "51" },
      { branch: "Meridian South", city: "Sydney", region: "APAC", head: "P. Nguyen", headcount: "23" },
    ],
  },
];

/* ----------------------------- templates ----------------------------- */

export const SEED_TEMPLATES: Template[] = [
  {
    id: "tpl-offer",
    name: "Consultant offer letter",
    kind: "letter",
    updatedAt: "Edited 3 d ago",
    body: `MERIDIAN GROUP · PEOPLE OPERATIONS
14 Harbour Quay, Rotterdam

{{start_date}}

To: {{name}}
{{city}}

Dear {{name}},

Following your interviews with the operations team, we are delighted to offer you the position of {{position}} at Meridian Group, effective {{start_date}}.

Your starting compensation will be {{salary}} per month, payable in arrears, and will be reviewed at the quarterly calibration cycle. Your reporting manager will be {{manager}}, based in {{city}}.

This offer remains valid for ten (10) business days. Please countersign and return the attached copy to people-ops@meridian.office.

We look forward to welcoming you aboard.

Sincerely,
Rania Adeyemi
Head of Operations, Meridian Group`,
  },
  {
    id: "tpl-vendor",
    name: "Vendor price-update notice",
    kind: "docx",
    updatedAt: "Edited 1 w ago",
    body: `MERIDIAN GROUP · PROCUREMENT DESK

Subject: Updated pricing — {{item}}

Dear {{vendor}} team,

Our procurement records, last refreshed on {{updated}}, now reflect a unit price of {{unit_price}} for {{item}} with a quoted lead time of {{lead_time}}.

If any of the above figures are incorrect, please reply to this notice within five (5) business days so the price book can be amended before the next purchase cycle.

Kind regards,
Procurement Desk
Meridian Group`,
  },
  {
    id: "tpl-memo",
    name: "Branch operations memo",
    kind: "memo",
    updatedAt: "Edited 2 w ago",
    body: `INTERNAL MEMO — {{region}} REGION

Branch: {{branch}} ({{city}})
Branch head: {{head}}
Active headcount: {{headcount}}

Effective next Monday, all {{region}} branches will move expense approvals into the Meridian console. {{head}} will receive delegation rights for claims up to $2,500.

Please confirm acknowledgement by replying to ops@meridian.office.

— Operations Desk`,
  },
];

/* ----------------------------- timeline ----------------------------- */

export const SEED_TASKS: TimelineTask[] = [
  { id: "t1", title: "Vendor scraper — pagination fix", track: "Automation", owner: "LC", start: 0, end: 6, status: "done", note: "Handles the 3-page price book and de-dupes rows on (vendor, item)." },
  { id: "t2", title: "HRIS connector v2", track: "Automation", owner: "LC", start: 4, end: 14, status: "done", note: "Token-based pull, 100-record paging, upsert into consultants dataset." },
  { id: "t3", title: "Attendance token rotation", track: "Automation", owner: "MK", start: 15, end: 20, status: "blocked", note: "Blocked by InfoSec review of the service account. Follow-up booked." },
  { id: "t4", title: "FX rate capture job (new)", track: "Automation", owner: "LC", start: 20, end: 28, status: "active", note: "Awaiting final Python script from the ops team; scheduler ready." },
  { id: "t5", title: "Data pipeline freeze", track: "Automation", owner: "LC", start: 28, end: 28, status: "todo", milestone: true, note: "No schema changes after this point until quarter close." },
  { id: "t6", title: "Offer letter template refresh", track: "Documents", owner: "JW", start: 2, end: 8, status: "done", note: "New compensation clauses reviewed by legal on Aug 20." },
  { id: "t7", title: "Mail merge — vendor notices", track: "Documents", owner: "JW", start: 10, end: 17, status: "active", note: "Batch of 6 notices generated from the vendor price list dataset." },
  { id: "t8", title: "Q3 certificates batch merge", track: "Documents", owner: "RA", start: 18, end: 24, status: "todo", note: "8 consultant certificates; waits on HRIS pull completion." },
  { id: "t9", title: "Merge audit sign-off", track: "Documents", owner: "RA", start: 24, end: 24, status: "todo", milestone: true, note: "Compliance spot-checks 10% of generated documents." },
  { id: "t10", title: "Nextcloud 29 upgrade", track: "Infrastructure", owner: "MK", start: 0, end: 5, status: "done", note: "Zero-downtime upgrade; DAV endpoints verified." },
  { id: "t11", title: "ONLYOFFICE 8.2 rollout", track: "Infrastructure", owner: "MK", start: 8, end: 16, status: "done", note: "Document Server connected; JWT secret rotated." },
  { id: "t12", title: "WebDAV sync hardening", track: "Infrastructure", owner: "MK", start: 15, end: 26, status: "active", note: "Retry backoff + conflict policy for the Meridian file bridge." },
  { id: "t13", title: "Quota policy & retention", track: "Infrastructure", owner: "RA", start: 26, end: 34, status: "todo", note: "100 GB workspace quota, 2-year retention on Archive." },
  { id: "t14", title: "Quarter close", track: "Infrastructure", owner: "RA", start: 38, end: 38, status: "todo", milestone: true, note: "All merges filed, datasets frozen, reports distributed." },
];

/* ------------------------------- files ------------------------------- */

export const SEED_FILES: CloudFile[] = [
  { id: "f-docs", name: "Documents", type: "folder", folder: "", updated: "2 h ago", sync: "synced", owner: "RA" },
  { id: "f-tpl", name: "Templates", type: "folder", folder: "", updated: "3 d ago", sync: "synced", owner: "JW" },
  { id: "f-arc", name: "Archive", type: "folder", folder: "", updated: "3 w ago", sync: "synced", owner: "MK" },
  { id: "f-shr", name: "Shared with me", type: "folder", folder: "", updated: "1 w ago", sync: "synced", owner: "LC" },
  { id: "f1", name: "offer-letter-osei.docx", type: "docx", folder: "Documents", size: "24 KB", updated: "2 h ago", sync: "synced", owner: "JW" },
  { id: "f2", name: "vendor-notice-batch.docx", type: "docx", folder: "Documents", size: "41 KB", updated: "5 h ago", sync: "synced", owner: "JW" },
  { id: "f3", name: "q3-payroll-projection.xlsx", type: "xlsx", folder: "Documents", size: "112 KB", updated: "1 d ago", sync: "synced", owner: "RA" },
  { id: "f4", name: "ops-handbook.pdf", type: "pdf", folder: "Documents", size: "3.4 MB", updated: "2 w ago", sync: "synced", owner: "RA" },
  { id: "f5", name: "branch-headcounts.csv", type: "csv", folder: "Documents", size: "6 KB", updated: "2 d ago", sync: "synced", owner: "MK" },
  { id: "f-c1", name: "Contracts", type: "folder", folder: "Documents", updated: "1 d ago", sync: "synced", owner: "JW" },
  { id: "f-c2", name: "2025 Reports", type: "folder", folder: "Documents", updated: "4 d ago", sync: "synced", owner: "RA" },
  { id: "f6", name: "nda-lindqvist.docx", type: "docx", folder: "Documents/Contracts", size: "18 KB", updated: "1 d ago", sync: "synced", owner: "JW" },
  { id: "f7", name: "msa-northwind-2025.docx", type: "docx", folder: "Documents/Contracts", size: "56 KB", updated: "6 d ago", sync: "synced", owner: "JW" },
  { id: "f8", name: "rate-card-2025.xlsx", type: "xlsx", folder: "Documents/Contracts", size: "88 KB", updated: "2 w ago", sync: "synced", owner: "RA" },
  { id: "f9", name: "offer-letter.docx", type: "docx", folder: "Templates", size: "22 KB", updated: "3 d ago", sync: "synced", owner: "JW" },
  { id: "f10", name: "vendor-notice.docx", type: "docx", folder: "Templates", size: "19 KB", updated: "1 w ago", sync: "synced", owner: "JW" },
  { id: "f11", name: "branch-memo.docx", type: "docx", folder: "Templates", size: "17 KB", updated: "2 w ago", sync: "synced", owner: "RA" },
  { id: "f12", name: "invoice-master.xlsx", type: "xlsx", folder: "Templates", size: "64 KB", updated: "1 mo ago", sync: "synced", owner: "RA" },
  { id: "f13", name: "2024-close-summary.pdf", type: "pdf", folder: "Archive", size: "1.1 MB", updated: "8 mo ago", sync: "synced", owner: "MK" },
  { id: "f14", name: "onboarding-deck.pptx", type: "pptx", folder: "Shared with me", size: "7.8 MB", updated: "1 w ago", sync: "synced", owner: "LC" },
  { id: "f15", name: "floorplan-hq.png", type: "img", folder: "Shared with me", size: "2.2 MB", updated: "3 w ago", sync: "synced", owner: "MK" },
];

/* ------------------------------- events ------------------------------- */

let evId = 100;
export const nextEvId = () => ++evId;

export const SEED_EVENTS: OfficeEvent[] = [
  { id: 1, type: "automation", text: "Vendor price book scrape finished — 6 rows upserted", at: "42 min ago" },
  { id: 2, type: "files", text: "vendor-notice-batch.docx synced to Nextcloud", at: "5 h ago" },
  { id: 3, type: "automation", text: "HRIS consultant registry pull — 8 rows in 6.2s", at: "7 h ago" },
  { id: 4, type: "automation", text: "Attendance portal sync failed · 401 token expired", at: "1 h ago" },
  { id: 5, type: "merge", text: "6 vendor notices merged into a single batch file", at: "5 h ago" },
  { id: 6, type: "editor", text: "msa-northwind-2025.docx edited by J. Weiss in ONLYOFFICE", at: "6 d ago" },
  { id: 7, type: "system", text: "ONLYOFFICE Document Server 8.2.1 health check · 24 ms", at: "12 min ago" },
  { id: 8, type: "system", text: "Nextcloud nightly snapshot completed · 34.2 GB", at: "9 h ago" },
];

/* --------------------------- merge helpers --------------------------- */

export const TOKEN_RE = /\{\{\s*([\w-]+)\s*\}\}/g;

export function tokensIn(body: string): string[] {
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(body)) !== null) out.add(m[1]);
  return [...out];
}

export function mergeRow(body: string, row: Record<string, string>): string {
  return body.replace(TOKEN_RE, (_all, key: string) => row[key] ?? `{{${key}}}`);
}
