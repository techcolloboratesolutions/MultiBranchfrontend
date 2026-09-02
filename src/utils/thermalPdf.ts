import { Institution } from "../types/institution";
import { ReportHead } from "../services/reportService";

const PAGE_WIDTH_PT = (80 * 72) / 25.4;
const MARGIN_PT = (4 * 72) / 25.4;
const FONT_SIZE = 8;
const LINE_HEIGHT = 11;

function pdfEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function toWinAnsi(text: string): string {
  return text
    .replace(/₹/g, "Rs.")
    .replace(/[–—]/g, "-")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "?");
}

function wrapLine(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [""];
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
      current = word;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

function amountText(value: string | number): string {
  const amount = Number(value ?? 0);
  if (Number.isNaN(amount)) {
    return "Rs. 0.00";
  }
  return `Rs. ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function isNonZero(value: string | number | undefined): boolean {
  return Number(value ?? 0) !== 0;
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

function sectionLines(title: string, rows: ThermalHeadLine[], totalLabel: string, total: string): string[] {
  if (rows.length === 0 && !isNonZero(total)) {
    return [];
  }
  const lines = ["", title, "-".repeat(36)];
  for (const row of rows) {
    const left = `${row.code} ${row.description}`.trim();
    const right = amountText(row.amount);
    const pad = Math.max(1, 36 - left.slice(0, 22).length - right.length);
    lines.push(`${left.slice(0, 22)}${" ".repeat(pad)}${right}`);
  }
  const totalRight = amountText(total);
  const totalPad = Math.max(1, 36 - totalLabel.length - totalRight.length);
  lines.push(`${totalLabel}${" ".repeat(totalPad)}${totalRight}`);
  return lines;
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

function headerLines(input: ThermalDayPdfInput): string[] {
  const inst = input.institution;
  const lines: string[] = [];
  lines.push(inst?.main_institution_name || "MultiBranches");
  lines.push(input.branchName);
  if (inst?.address) {
    lines.push(...wrapLine(inst.address, 36));
  }
  const place = [inst?.city, inst?.district, inst?.state].filter(Boolean).join(", ");
  if (place) {
    lines.push(place);
  }
  if (inst?.phone1 || inst?.mobile) {
    lines.push(`Phone: ${inst.phone1 || inst.mobile}`);
  }
  if (inst?.email) {
    lines.push(inst.email);
  }
  lines.push("=".repeat(36));
  lines.push(`Business Date: ${input.businessDateLabel}`);
  lines.push("=".repeat(36));
  return lines;
}

function monthHeaderLines(input: ThermalMonthSummaryInput): string[] {
  const inst = input.institution;
  const lines: string[] = [];
  lines.push(inst?.main_institution_name || "MultiBranches");
  lines.push(input.branchName);
  if (inst?.address) {
    lines.push(...wrapLine(inst.address, 36));
  }
  const place = [inst?.city, inst?.district, inst?.state].filter(Boolean).join(", ");
  if (place) {
    lines.push(place);
  }
  if (inst?.phone1 || inst?.mobile) {
    lines.push(`Phone: ${inst.phone1 || inst.mobile}`);
  }
  if (inst?.email) {
    lines.push(inst.email);
  }
  lines.push("=".repeat(36));
  lines.push(...wrapLine(`Monthly Summary for ${input.periodLabel}`, 36));
  lines.push("=".repeat(36));
  return lines;
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
  printedBy: string;
  printedAt: string;
}

function renderThermalPdf(body: string[]): Uint8Array {
  const pageHeight = MARGIN_PT * 2 + body.length * LINE_HEIGHT + 8;
  const content: string[] = ["BT", `/F1 ${FONT_SIZE} Tf`, `${LINE_HEIGHT} TL`];
  let y = pageHeight - MARGIN_PT - FONT_SIZE;
  for (const line of body) {
    content.push(`1 0 0 1 ${MARGIN_PT.toFixed(2)} ${y.toFixed(2)} Tm`);
    content.push(`(${pdfEscape(toWinAnsi(line))}) Tj`);
    y -= LINE_HEIGHT;
  }
  content.push("ET");
  const stream = content.join("\n");
  const streamBytes = new TextEncoder().encode(stream);

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH_PT.toFixed(2)} ${pageHeight.toFixed(2)}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>",
    `<< /Length ${streamBytes.length} >>\nstream\n${stream}\nendstream`,
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
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  parts.push(encoder.encode(xref));
  parts.push(encoder.encode(trailer));

  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function printFooter(printedBy: string, printedAt: string): string[] {
  return ["=".repeat(36), `Printed by: ${printedBy}`, `Printed date: ${printedAt}`];
}

function totalsBody(
  sales: ThermalHeadLine[],
  purchases: ThermalHeadLine[],
  expenses: ThermalHeadLine[],
  totalSales: string,
  totalPurchase: string,
  totalExpense: string,
  business: string,
  balance: string,
  printedBy: string,
  printedAt: string,
): string[] {
  const body = [
    ...sectionLines("SALES HEADS", sales, "Total Sales", totalSales),
    ...sectionLines("PURCHASE HEADS", purchases, "Total Purchase", totalPurchase),
    ...sectionLines("EXPENSE HEADS", expenses, "Total Expense", totalExpense),
    "",
    "-".repeat(36),
  ];
  const businessText = amountText(business);
  const balanceText = amountText(balance);
  body.push(`Business${" ".repeat(Math.max(1, 36 - 8 - businessText.length))}${businessText}`);
  body.push(`Balance${" ".repeat(Math.max(1, 36 - 7 - balanceText.length))}${balanceText}`);
  body.push(...printFooter(printedBy, printedAt));
  return body;
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
  return renderThermalPdf([
    ...headerLines(input),
    ...totalsBody(
      input.sales,
      input.purchases,
      input.expenses,
      input.totalSales,
      input.totalPurchase,
      input.totalExpense,
      input.business,
      input.balance,
      input.printedBy,
      input.printedAt,
    ),
  ]);
}

export function buildThermalMonthSummaryPdf(input: ThermalMonthSummaryInput): Uint8Array {
  return renderThermalPdf([
    ...monthHeaderLines(input),
    ...totalsBody(
      input.sales,
      input.purchases,
      input.expenses,
      input.totalSales,
      input.totalPurchase,
      input.totalExpense,
      input.business,
      input.balance,
      input.printedBy,
      input.printedAt,
    ),
  ]);
}

function companyPlHeader(institution: Institution | null, branchName: string, monthLabel: string): string[] {
  const lines: string[] = [];
  lines.push(institution?.main_institution_name || "MultiBranches");
  lines.push(branchName);
  if (institution?.address) {
    lines.push(...wrapLine(institution.address, 36));
  }
  const place = [institution?.city, institution?.district, institution?.state].filter(Boolean).join(", ");
  if (place) {
    lines.push(place);
  }
  lines.push("");
  lines.push(...wrapLine(`Profit and Loss for the month of ${monthLabel}`, 36));
  lines.push("-".repeat(36));
  return lines;
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

function moneyRow(label: string, value: string): string {
  const right = amountText(value);
  return `${label}${" ".repeat(Math.max(1, 36 - label.length - right.length))}${right}`;
}

function shareRow(sharePercent: string): string {
  const label = "Share %";
  const right = `${sharePercent}%`;
  return `${label}${" ".repeat(Math.max(1, 36 - label.length - right.length))}${right}`;
}

export function buildPartnerWagePdf(input: PartnerWagePdfInput): Uint8Array {
  const body = [
    ...companyPlHeader(input.institution, input.branchName, input.monthLabel),
    ...sectionLines("SALES HEADS", input.sales, "Total Sales", input.totalSales),
    ...sectionLines("PURCHASE HEADS", input.purchases, "Total Purchase", input.totalPurchase),
    ...sectionLines("EXPENSE HEADS", input.expenses, "Total Expense", input.totalExpense),
    "",
    "-".repeat(36),
    moneyRow("Business", input.business),
    moneyRow("Balance", input.balance),
    "",
    "-".repeat(36),
    ...wrapLine(`Partner: ${input.partnerName}`, 36),
    shareRow(input.sharePercent),
    moneyRow("Partner Wage", input.partnerWage),
    ...printFooter(input.printedBy, input.printedAt),
  ];
  return renderThermalPdf(body);
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
  const shareholderLines: string[] = ["", "-".repeat(36), "SHAREHOLDERS", "-".repeat(36)];
  for (const row of input.shareholders) {
    shareholderLines.push(...wrapLine(row.name, 36));
    shareholderLines.push(shareRow(row.sharePercent));
    shareholderLines.push(moneyRow("Partner Wage", row.wage));
    shareholderLines.push("-".repeat(36));
  }
  if (input.shareTotal) {
    const label = "Share total";
    const right = `${input.shareTotal}%`;
    shareholderLines.push(`${label}${" ".repeat(Math.max(1, 36 - label.length - right.length))}${right}`);
  }
  shareholderLines.push(moneyRow("Total Wages", String(wageTotal.toFixed(2))));
  const body = [
    ...companyPlHeader(input.institution, input.branchName, input.monthLabel),
    ...sectionLines("SALES HEADS", input.sales, "Total Sales", input.totalSales),
    ...sectionLines("PURCHASE HEADS", input.purchases, "Total Purchase", input.totalPurchase),
    ...sectionLines("EXPENSE HEADS", input.expenses, "Total Expense", input.totalExpense),
    "",
    "-".repeat(36),
    moneyRow("Business", input.business),
    moneyRow("Balance", input.balance),
    ...shareholderLines,
    ...printFooter(input.printedBy, input.printedAt),
  ];
  return renderThermalPdf(body);
}
