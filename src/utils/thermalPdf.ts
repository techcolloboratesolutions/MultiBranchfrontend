import { Institution } from "../types/institution";
import { ReportHead } from "../services/reportService";

type RGB = [number, number, number];

const PAGE_W = (80 * 72) / 25.4;
const MARGIN = 8;
const CONTENT_W = PAGE_W - MARGIN * 2;

const RED: RGB = [183, 28, 38];
const WHITE: RGB = [255, 255, 255];
const INK: RGB = [28, 28, 28];
const LINE: RGB = [226, 196, 198];

const ROW_H = 14;
const BAR_H = 16;
const FOOTER_H = 50;

function pdfEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function plain(text: string): string {
  return text
    .replace(/₹/g, "")
    .replace(/[–—]/g, "-")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "");
}

function textWidth(text: string, size: number): number {
  return plain(text).length * size * 0.5;
}

function wrap(text: string, size: number, maxWidth: number): string[] {
  const maxChars = Math.max(8, Math.floor(maxWidth / (size * 0.5)));
  const words = plain(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [];
  }
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
    } else {
      if (current) {
        lines.push(current);
      }
      current = word.length > maxChars ? word.slice(0, maxChars) : word;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

function fitLabel(text: string, size: number, maxWidth: number): string {
  const clean = plain(text);
  if (textWidth(clean, size) <= maxWidth) {
    return clean;
  }
  let cut = clean;
  while (cut.length > 1 && textWidth(`${cut}...`, size) > maxWidth) {
    cut = cut.slice(0, -1);
  }
  return `${cut}...`;
}

function amountText(value: string | number): string {
  const amount = Number(value ?? 0);
  const safe = Number.isNaN(amount) ? 0 : amount;
  return safe.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function isNonZero(value: string | number | undefined): boolean {
  return Number(value ?? 0) !== 0;
}

class Page {
  ops: string[] = [];

  fill(x: number, y: number, w: number, h: number, color: RGB) {
    const [r, g, b] = color;
    this.ops.push(`${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} rg`);
    this.ops.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
  }

  stroke(x: number, y: number, w: number, h: number, color: RGB) {
    const [r, g, b] = color;
    this.ops.push(`${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} RG`);
    this.ops.push("0.7 w");
    this.ops.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`);
  }

  circle(cx: number, cy: number, radius: number, color: RGB) {
    const [r, g, b] = color;
    const k = radius * 0.5522847498;
    this.ops.push(`${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} rg`);
    this.ops.push(`${(cx + radius).toFixed(2)} ${cy.toFixed(2)} m`);
    this.ops.push(
      `${(cx + radius).toFixed(2)} ${(cy + k).toFixed(2)} ${(cx + k).toFixed(2)} ${(cy + radius).toFixed(2)} ${cx.toFixed(2)} ${(cy + radius).toFixed(2)} c`,
    );
    this.ops.push(
      `${(cx - k).toFixed(2)} ${(cy + radius).toFixed(2)} ${(cx - radius).toFixed(2)} ${(cy + k).toFixed(2)} ${(cx - radius).toFixed(2)} ${cy.toFixed(2)} c`,
    );
    this.ops.push(
      `${(cx - radius).toFixed(2)} ${(cy - k).toFixed(2)} ${(cx - k).toFixed(2)} ${(cy - radius).toFixed(2)} ${cx.toFixed(2)} ${(cy - radius).toFixed(2)} c`,
    );
    this.ops.push(
      `${(cx + k).toFixed(2)} ${(cy - radius).toFixed(2)} ${(cx + radius).toFixed(2)} ${(cy - k).toFixed(2)} ${(cx + radius).toFixed(2)} ${cy.toFixed(2)} c`,
    );
    this.ops.push("f");
  }

  text(x: number, y: number, size: number, font: "F1" | "F2", color: RGB, value: string) {
    const [r, g, b] = color;
    const safe = pdfEscape(plain(value));
    this.ops.push(`${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} rg`);
    this.ops.push("BT");
    this.ops.push(`/${font} ${size} Tf`);
    this.ops.push(`1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm`);
    this.ops.push(`(${safe}) Tj`);
    this.ops.push("ET");
  }
}

function assemble(stream: string, pageH: number): Uint8Array {
  const bytes = new TextEncoder().encode(stream);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [5 0 R] /Count 1 >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W.toFixed(2)} ${pageH.toFixed(2)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents 6 0 R >>`,
    `<< /Length ${bytes.length} >>\nstream\n${stream}\nendstream`,
  ];
  const encoder = new TextEncoder();
  const header = encoder.encode("%PDF-1.4\n");
  const parts: Uint8Array[] = [header];
  const offsets = [0];
  let position = header.length;
  objects.forEach((object, index) => {
    const chunk = encoder.encode(`${index + 1} 0 obj\n${object}\nendobj\n`);
    offsets.push(position);
    parts.push(chunk);
    position += chunk.length;
  });
  const xrefStart = position;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  parts.push(encoder.encode(xref));
  parts.push(encoder.encode(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`));
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let cursor = 0;
  for (const part of parts) {
    out.set(part, cursor);
    cursor += part.length;
  }
  return out;
}

export interface ThermalHeadLine {
  code: string;
  description: string;
  amount: string;
}

export interface ThermalDayPdfInput {
  institution: Institution | null;
  branchName: string;
  businessDate: string;
  businessDateLabel: string;
  sales: ThermalHeadLine[];
  purchases: ThermalHeadLine[];
  expenses: ThermalHeadLine[];
  totalSales: string;
  totalPurchase: string;
  totalExpense: string;
  business: string;
  balance: string;
  printedBy: string;
  printedAt: string;
}

export function collectNonZeroHeads(
  heads: ReportHead[],
  amounts: Record<string, string> | undefined,
): ThermalHeadLine[] {
  return heads
    .map((head) => ({
      code: head.code,
      description: head.description,
      amount: amounts?.[String(head.id)] ?? "0",
    }))
    .filter((row) => isNonZero(row.amount));
}

export function hasNonZeroDay(row: {
  receipt?: string;
  payment?: string;
  expense?: string;
  receipts?: Record<string, string>;
  payments?: Record<string, string>;
  expenses?: Record<string, string>;
}): boolean {
  if (isNonZero(row.receipt) || isNonZero(row.payment) || isNonZero(row.expense)) {
    return true;
  }
  const maps = [row.receipts, row.payments, row.expenses];
  return maps.some((map) => map && Object.values(map).some((value) => isNonZero(value)));
}

export interface ThermalMonthSummaryInput {
  institution: Institution | null;
  branchName: string;
  periodLabel: string;
  sales: ThermalHeadLine[];
  purchases: ThermalHeadLine[];
  expenses: ThermalHeadLine[];
  totalSales: string;
  totalPurchase: string;
  totalExpense: string;
  business: string;
  balance: string;
  profit?: string;
  printedBy: string;
  printedAt: string;
}

interface SummaryLine {
  label: string;
  value: string;
  emphasis?: boolean;
}

interface ReportSection {
  title: string;
  rows: ThermalHeadLine[];
  totalLabel: string;
  total: string;
}

interface NoteLine {
  label?: string;
  value?: string;
  text?: string;
  emphasis?: boolean;
  divider?: boolean;
}

interface ReportCard {
  title: string;
  lines: NoteLine[];
}

interface ThermalReport {
  institution: Institution | null;
  branchName: string;
  reportTitle: string;
  sections: ReportSection[];
  summary: SummaryLine[];
  cards: ReportCard[];
  printedBy: string;
  printedAt: string;
}

function contactLines(institution: Institution | null, maxWidth: number): string[] {
  const lines: string[] = [];
  if (institution?.address) {
    lines.push(...wrap(institution.address, 7, maxWidth));
  }
  const place = [institution?.city, institution?.district, institution?.state].filter(Boolean).join(", ");
  if (place) {
    lines.push(...wrap(place, 7, maxWidth));
  }
  const phone = institution?.phone1 || institution?.mobile;
  if (phone) {
    lines.push(fitLabel(`Phone: ${phone}`, 7, maxWidth));
  }
  if (institution?.email) {
    lines.push(fitLabel(institution.email, 7, maxWidth));
  }
  return lines.slice(0, 3);
}

function headerHeight(report: ThermalReport): number {
  const maxW = PAGE_W - 48;
  let lines = 1;
  const instName = report.institution?.main_institution_name;
  if (instName && instName !== report.branchName) {
    lines += 1;
  }
  lines += contactLines(report.institution, maxW).length;
  return Math.max(72, 22 + lines * 11);
}

function titleLines(title: string): string[] {
  const lines = wrap(title, 9, CONTENT_W - 16);
  return lines.length > 0 ? lines : [""];
}

function reportHeaderHeight(title: string): number {
  return 5 + 12 + titleLines(title).length * 12 + 22;
}

function sectionHeight(section: ReportSection): number {
  return BAR_H + Math.max(section.rows.length, 1) * ROW_H + BAR_H;
}

function rowLabel(row: ThermalHeadLine): string {
  return row.description.trim() || row.code;
}

function noteBlockHeight(line: NoteLine): number {
  if (line.divider) {
    return 8;
  }
  if (line.text && !line.label) {
    return Math.max(1, wrap(line.text, 8, CONTENT_W - 16).length) * 12 + 2;
  }
  return 15;
}

function cardHeight(card: ReportCard): number {
  const body = card.lines.reduce((sum, line) => sum + noteBlockHeight(line), 0);
  return BAR_H + body + 6;
}

function summaryHeight(lines: SummaryLine[]): number {
  return lines.length * 16 + 8;
}

function drawHeader(page: Page, pageH: number, headerH: number, report: ThermalReport) {
  const bottom = pageH - headerH;
  page.fill(0, bottom, PAGE_W, headerH, RED);
  page.fill(0, bottom, PAGE_W, 4, WHITE);

  const cx = 22;
  const cy = bottom + headerH / 2 + 1;
  page.circle(cx, cy, 12, WHITE);
  const mark = "BJF";
  page.text(cx - textWidth(mark, 7) / 2, cy - 2.4, 7, "F2", RED, mark);

  const textX = 40;
  const maxW = PAGE_W - textX - 8;
  const lines: Array<{ text: string; size: number }> = [
    { text: fitLabel(report.branchName || report.institution?.name || "Institution", 10, maxW), size: 10 },
  ];
  const instName = report.institution?.main_institution_name;
  if (instName && instName !== report.branchName) {
    lines.push({ text: fitLabel(instName, 8, maxW), size: 8 });
  }
  for (const line of contactLines(report.institution, maxW)) {
    lines.push({ text: line, size: 7 });
  }

  let y = pageH - 16;
  for (const line of lines) {
    if (y < bottom + 10) {
      break;
    }
    page.text(textX, y, line.size, "F2", WHITE, line.text);
    y -= line.size + 3;
  }
}

function drawReportHeader(page: Page, bottom: number, height: number, title: string) {
  page.fill(MARGIN, bottom, CONTENT_W, height, WHITE);
  page.fill(MARGIN, bottom + height - 5, CONTENT_W, 5, RED);
  page.stroke(MARGIN, bottom, CONTENT_W, height, RED);
  let y = bottom + height - 18;
  for (const line of titleLines(title)) {
    page.text(MARGIN + 8, y, 9, "F2", RED, line);
    y -= 12;
  }
  page.fill(MARGIN + 8, y + 6, CONTENT_W - 16, 1.1, RED);
  const details = "Details";
  page.text(MARGIN + 8, bottom + 8, 9, "F2", RED, details);
  page.fill(MARGIN + 8, bottom + 6, textWidth(details, 9), 0.9, RED);
}

function drawSection(page: Page, bottom: number, section: ReportSection) {
  const height = sectionHeight(section);
  page.fill(MARGIN, bottom, CONTENT_W, height, WHITE);
  page.stroke(MARGIN, bottom, CONTENT_W, height, LINE);
  page.fill(MARGIN, bottom + height - BAR_H, CONTENT_W, BAR_H, RED);
  page.text(MARGIN + 6, bottom + height - BAR_H + 4, 8, "F2", WHITE, section.title);
  const amountHead = "Amount";
  page.text(MARGIN + CONTENT_W - 6 - textWidth(amountHead, 7), bottom + height - BAR_H + 5, 7, "F2", WHITE, amountHead);

  const rows = section.rows.length > 0 ? section.rows : [{ code: "-", description: "No entries", amount: "0" }];
  rows.forEach((row, index) => {
    const rowBottom = bottom + height - BAR_H - (index + 1) * ROW_H;
    const label = fitLabel(rowLabel(row), 8, CONTENT_W * 0.56);
    const amount = fitLabel(amountText(row.amount), 8, CONTENT_W * 0.38);
    page.text(MARGIN + 6, rowBottom + 3.5, 8, "F1", INK, label);
    page.text(MARGIN + CONTENT_W - 6 - textWidth(amount, 8), rowBottom + 3.5, 8, "F2", INK, amount);
  });

  page.fill(MARGIN, bottom, CONTENT_W, BAR_H, WHITE);
  page.fill(MARGIN, bottom + BAR_H - 0.8, CONTENT_W, 0.8, LINE);
  page.text(MARGIN + 6, bottom + 4, 8, "F2", RED, fitLabel(section.totalLabel, 8, CONTENT_W * 0.52));
  const total = fitLabel(amountText(section.total), 8, CONTENT_W * 0.42);
  page.text(MARGIN + CONTENT_W - 6 - textWidth(total, 8), bottom + 4, 8, "F2", RED, total);
}

function drawSummary(page: Page, bottom: number, lines: SummaryLine[]) {
  const height = summaryHeight(lines);
  page.fill(MARGIN, bottom, CONTENT_W, height, WHITE);
  page.stroke(MARGIN, bottom, CONTENT_W, height, RED);
  lines.forEach((line, index) => {
    const rowBottom = bottom + height - 4 - (index + 1) * 16;
    if (line.emphasis) {
      page.fill(MARGIN + 1, rowBottom, 3, 16, RED);
    }
    const color = line.emphasis ? RED : INK;
    page.text(MARGIN + 8, rowBottom + 4, 8, "F2", color, fitLabel(line.label, 8, CONTENT_W * 0.52));
    const value = fitLabel(line.value, 8, CONTENT_W * 0.42);
    page.text(MARGIN + CONTENT_W - 8 - textWidth(value, 8), rowBottom + 4, 8, "F2", color, value);
  });
}

function drawNoteLine(page: Page, bottom: number, line: NoteLine) {
  const height = noteBlockHeight(line);
  if (line.divider) {
    page.fill(MARGIN + 8, bottom + 3, CONTENT_W - 16, 0.8, LINE);
    return;
  }
  if (line.text && !line.label) {
    const lines = wrap(line.text, 8, CONTENT_W - 16);
    let y = bottom + height - 11;
    for (const text of lines) {
      page.text(MARGIN + 8, y, 8, line.emphasis ? "F2" : "F1", line.emphasis ? RED : INK, text);
      y -= 12;
    }
    return;
  }
  const color = line.emphasis ? RED : INK;
  page.text(MARGIN + 8, bottom + 3, 8, "F2", color, fitLabel(line.label || "", 8, CONTENT_W * 0.5));
  const value = fitLabel(line.value || "", 8, CONTENT_W * 0.42);
  page.text(MARGIN + CONTENT_W - 8 - textWidth(value, 8), bottom + 3, 8, "F2", color, value);
}

function drawCard(page: Page, bottom: number, card: ReportCard) {
  const height = cardHeight(card);
  page.fill(MARGIN, bottom, CONTENT_W, height, WHITE);
  page.stroke(MARGIN, bottom, CONTENT_W, height, LINE);
  page.fill(MARGIN, bottom + height - BAR_H, CONTENT_W, BAR_H, RED);
  page.text(MARGIN + 6, bottom + height - BAR_H + 4, 8, "F2", WHITE, card.title);
  let cursor = bottom + height - BAR_H;
  for (const line of card.lines) {
    const block = noteBlockHeight(line);
    cursor -= block;
    drawNoteLine(page, cursor, line);
  }
}

const FOOTER_BOTTOM = 6;

function drawFooter(page: Page, report: ThermalReport) {
  const bottom = FOOTER_BOTTOM;
  page.fill(MARGIN, bottom, CONTENT_W, FOOTER_H, WHITE);
  page.fill(MARGIN, bottom + FOOTER_H - 5, CONTENT_W, 5, RED);
  page.stroke(MARGIN, bottom, CONTENT_W, FOOTER_H, RED);
  const thanks = "Thank you";
  page.text((PAGE_W - textWidth(thanks, 10)) / 2, bottom + 30, 10, "F2", RED, thanks);
  page.fill(MARGIN + 8, bottom + 26, CONTENT_W - 16, 1.1, RED);
  page.text(MARGIN + 8, bottom + 14, 7, "F2", RED, fitLabel(`Printed by: ${report.printedBy}`, 7, CONTENT_W - 16));
  page.text(MARGIN + 8, bottom + 4, 7, "F2", RED, fitLabel(`Printed date: ${report.printedAt}`, 7, CONTENT_W - 16));
}

function renderReport(report: ThermalReport): Uint8Array {
  const headerH = headerHeight(report);
  const reportH = reportHeaderHeight(report.reportTitle);
  const sectionHs = report.sections.map(sectionHeight);
  const summaryH = summaryHeight(report.summary);
  const cardHs = report.cards.map(cardHeight);
  const sectionGaps = Math.max(0, report.sections.length - 1) * 5;
  const cardGaps = cardHs.length * 5;
  const pageH =
    headerH +
    6 +
    reportH +
    6 +
    sectionHs.reduce((sum, height) => sum + height, 0) +
    sectionGaps +
    6 +
    summaryH +
    cardGaps +
    cardHs.reduce((sum, height) => sum + height, 0) +
    6 +
    FOOTER_H +
    FOOTER_BOTTOM;

  const page = new Page();
  page.fill(0, 0, PAGE_W, pageH, WHITE);
  drawHeader(page, pageH, headerH, report);

  const reportBottom = pageH - headerH - 6 - reportH;
  drawReportHeader(page, reportBottom, reportH, report.reportTitle);

  let cursor = reportBottom - 6;
  report.sections.forEach((section, index) => {
    const height = sectionHs[index];
    cursor -= height;
    drawSection(page, cursor, section);
    cursor -= 5;
  });
  if (report.sections.length > 0) {
    cursor += 5;
  }
  cursor -= 6;
  cursor -= summaryH;
  drawSummary(page, cursor, report.summary);
  for (let index = 0; index < report.cards.length; index += 1) {
    cursor -= 5;
    cursor -= cardHs[index];
    drawCard(page, cursor, report.cards[index]);
  }
  drawFooter(page, report);
  return assemble(page.ops.join("\n"), pageH);
}

function moneySections(
  sales: ThermalHeadLine[],
  purchases: ThermalHeadLine[],
  expenses: ThermalHeadLine[],
  totalSales: string,
  totalPurchase: string,
  totalExpense: string,
): ReportSection[] {
  const sections: ReportSection[] = [
    { title: "Sales", rows: sales, totalLabel: "Total Sales", total: totalSales },
    { title: "Purchase", rows: purchases, totalLabel: "Total Purchase", total: totalPurchase },
    { title: "Expense", rows: expenses, totalLabel: "Total Expense", total: totalExpense },
  ];
  return sections.filter((section) => section.rows.length > 0 || isNonZero(section.total));
}

function summaryLines(business: string, closingLabel: string, closingValue: string): SummaryLine[] {
  return [
    { label: "Business", value: amountText(business) },
    { label: closingLabel, value: amountText(closingValue), emphasis: true },
  ];
}

export function collectHeads(
  heads: ReportHead[],
  amounts: Record<string, string> | undefined,
): ThermalHeadLine[] {
  return heads.map((head) => ({
    code: head.code,
    description: head.description,
    amount: amounts?.[String(head.id)] ?? "0",
  }));
}

export function buildThermalDayPdf(input: ThermalDayPdfInput): Uint8Array {
  return renderReport({
    institution: input.institution,
    branchName: input.branchName,
    reportTitle: `Business Date: ${input.businessDateLabel}`,
    sections: moneySections(
      input.sales,
      input.purchases,
      input.expenses,
      input.totalSales,
      input.totalPurchase,
      input.totalExpense,
    ),
    summary: summaryLines(input.business, "Balance", input.balance),
    cards: [],
    printedBy: input.printedBy,
    printedAt: input.printedAt,
  });
}

export function buildThermalMonthSummaryPdf(input: ThermalMonthSummaryInput): Uint8Array {
  return renderReport({
    institution: input.institution,
    branchName: input.branchName,
    reportTitle: `Monthly Summary for ${input.periodLabel}`,
    sections: moneySections(
      input.sales,
      input.purchases,
      input.expenses,
      input.totalSales,
      input.totalPurchase,
      input.totalExpense,
    ),
    summary: summaryLines(input.business, "Profit for the month", input.profit ?? input.balance),
    cards: [],
    printedBy: input.printedBy,
    printedAt: input.printedAt,
  });
}

export interface PartnerWagePdfInput {
  institution: Institution | null;
  branchName: string;
  monthLabel: string;
  partnerName: string;
  sharePercent: string;
  partnerWage: string;
  sales: ThermalHeadLine[];
  purchases: ThermalHeadLine[];
  expenses: ThermalHeadLine[];
  totalSales: string;
  totalPurchase: string;
  totalExpense: string;
  business: string;
  balance: string;
  printedBy: string;
  printedAt: string;
}

export function buildPartnerWagePdf(input: PartnerWagePdfInput): Uint8Array {
  return renderReport({
    institution: input.institution,
    branchName: input.branchName,
    reportTitle: `Profit and Loss for the month of ${input.monthLabel}`,
    sections: moneySections(
      input.sales,
      input.purchases,
      input.expenses,
      input.totalSales,
      input.totalPurchase,
      input.totalExpense,
    ),
    summary: summaryLines(input.business, "Balance", input.balance),
    cards: [
      {
        title: "Partner",
        lines: [
          { text: input.partnerName, emphasis: true },
          { label: "Share %", value: `${input.sharePercent}%` },
          { label: "Partner Wage", value: amountText(input.partnerWage), emphasis: true },
        ],
      },
    ],
    printedBy: input.printedBy,
    printedAt: input.printedAt,
  });
}

export interface MonthWagesShareholder {
  name: string;
  sharePercent: string;
  wage: string;
}

export interface MonthWagesSummaryPdfInput {
  institution: Institution | null;
  branchName: string;
  monthLabel: string;
  sales: ThermalHeadLine[];
  purchases: ThermalHeadLine[];
  expenses: ThermalHeadLine[];
  totalSales: string;
  totalPurchase: string;
  totalExpense: string;
  business: string;
  balance: string;
  shareholders: MonthWagesShareholder[];
  shareTotal?: string;
  printedBy: string;
  printedAt: string;
}

export function buildMonthWagesSummaryPdf(input: MonthWagesSummaryPdfInput): Uint8Array {
  const wageTotal = input.shareholders.reduce((sum, row) => sum + Number(row.wage || 0), 0);
  const lines: NoteLine[] = [];
  input.shareholders.forEach((row, index) => {
    if (index > 0) {
      lines.push({ divider: true });
    }
    lines.push({ text: row.name, emphasis: true });
    lines.push({ label: "Share %", value: `${row.sharePercent}%` });
    lines.push({ label: "Partner Wage", value: amountText(row.wage) });
  });
  if (input.shareTotal) {
    lines.push({ divider: true });
    lines.push({ label: "Share total", value: `${input.shareTotal}%` });
  }
  lines.push({ label: "Total Wages", value: amountText(wageTotal.toFixed(2)), emphasis: true });

  return renderReport({
    institution: input.institution,
    branchName: input.branchName,
    reportTitle: `Profit and Loss for the month of ${input.monthLabel}`,
    sections: moneySections(
      input.sales,
      input.purchases,
      input.expenses,
      input.totalSales,
      input.totalPurchase,
      input.totalExpense,
    ),
    summary: summaryLines(input.business, "Balance", input.balance),
    cards: [{ title: "Shareholders", lines }],
    printedBy: input.printedBy,
    printedAt: input.printedAt,
  });
}
