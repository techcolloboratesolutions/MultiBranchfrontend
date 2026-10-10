import { ThermalHeadLine, ThermalMonthSummaryInput } from "./thermalPdf";

type RGB = [number, number, number];

const PAGE_W = 595.28;
const MARGIN = 28;

const RED: RGB = [183, 28, 38];
const INK: RGB = [28, 28, 28];
const WHITE: RGB = [255, 255, 255];
const PAGE: RGB = [246, 250, 251];
const SALES: RGB = [14, 122, 110];
const SALES_BG: RGB = [232, 246, 243];
const PURCHASE: RGB = [180, 83, 9];
const PURCHASE_BG: RGB = [255, 243, 230];
const EXPENSE: RGB = [157, 48, 90];
const EXPENSE_BG: RGB = [252, 236, 242];
const BUSINESS: RGB = [37, 99, 168];
const BUSINESS_BG: RGB = [232, 241, 250];
const PROFIT: RGB = [91, 63, 168];
const PROFIT_BG: RGB = [241, 236, 250];
const LINE: RGB = [214, 228, 232];

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

function money(value: string | number): string {
  const amount = Number(value ?? 0);
  const safe = Number.isNaN(amount) ? 0 : amount;
  return safe.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function wrap(text: string, size: number, maxWidth: number): string[] {
  const maxChars = Math.max(12, Math.floor(maxWidth / (size * 0.48)));
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
      current = word;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

function textWidth(text: string, size: number): number {
  return plain(text).length * size * 0.5;
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
    this.ops.push("0.6 w");
    this.ops.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`);
  }

  circle(cx: number, cy: number, radius: number, color: RGB) {
    const [r, g, b] = color;
    this.ops.push(`${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} rg`);
    this.ops.push(`${cx.toFixed(2)} ${cy.toFixed(2)} ${radius.toFixed(2)} 0 360 arc f`);
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
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${pageH.toFixed(2)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents 6 0 R >>`,
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

export function buildMonthlyBusinessReportPdf(input: ThermalMonthSummaryInput): Uint8Array {
  const columns: Array<{ title: string; ink: RGB; bg: RGB; lines: ThermalHeadLine[]; total: string }> = [
    { title: "Sales", ink: SALES, bg: SALES_BG, lines: input.sales, total: input.totalSales },
    { title: "Purchase", ink: PURCHASE, bg: PURCHASE_BG, lines: input.purchases, total: input.totalPurchase },
    { title: "Expense", ink: EXPENSE, bg: EXPENSE_BG, lines: input.expenses, total: input.totalExpense },
  ];
  const maxRows = Math.max(1, ...columns.map((column) => Math.max(column.lines.length, 1)));
  const rowH = 18;
  const headH = 22;
  const totalH = 22;
  const colH = headH + maxRows * rowH + totalH;
  const pageHeaderH = 78;
  const reportHeaderH = 62;
  const blockH = 50;
  const footerH = 44;
  const pageH = pageHeaderH + 12 + reportHeaderH + 12 + colH + 14 + blockH + 12 + footerH;

  const page = new Page();
  page.fill(0, 0, PAGE_W, pageH, PAGE);

  const pageHeaderY = pageH - pageHeaderH;
  page.fill(0, pageHeaderY, PAGE_W, pageHeaderH, RED);
  page.fill(0, pageHeaderY, PAGE_W, 4, WHITE);
  page.circle(MARGIN + 26, pageHeaderY + 40, 18, WHITE);
  const mark = "BJF";
  page.text(MARGIN + 26 - textWidth(mark, 9) / 2, pageHeaderY + 37, 9, "F2", RED, mark);
  const name = input.branchName || input.institution?.name || "Institution";
  page.text(MARGIN + 56, pageHeaderY + 50, 16, "F2", WHITE, fitLabel(name, 16, PAGE_W - MARGIN - 80));
  const address = [
    input.institution?.address,
    [input.institution?.city, input.institution?.district, input.institution?.state].filter(Boolean).join(", "),
    input.institution?.phone1 || input.institution?.mobile ? `Phone: ${input.institution.phone1 || input.institution.mobile}` : "",
  ]
    .filter(Boolean)
    .join("  |  ");
  wrap(address, 10, PAGE_W - MARGIN - 80)
    .slice(0, 2)
    .forEach((line, index) => {
      page.text(MARGIN + 56, pageHeaderY + 32 - index * 13, 10, "F2", WHITE, line);
    });

  const reportY = pageHeaderY - 12 - reportHeaderH;
  page.fill(MARGIN, reportY, PAGE_W - MARGIN * 2, reportHeaderH, WHITE);
  page.fill(MARGIN, reportY + reportHeaderH - 6, PAGE_W - MARGIN * 2, 6, RED);
  page.stroke(MARGIN, reportY, PAGE_W - MARGIN * 2, reportHeaderH, RED);
  page.text(MARGIN + 12, reportY + 34, 13, "F2", RED, `Monthly Summary for the month of : ${input.periodLabel}`);
  page.fill(MARGIN + 12, reportY + 26, PAGE_W - MARGIN * 2 - 24, 1.4, RED);
  const details = "Details";
  page.text(MARGIN + 12, reportY + 10, 12, "F2", RED, details);
  page.fill(MARGIN + 12, reportY + 7, textWidth(details, 12), 1.1, RED);

  const colGap = 8;
  const colW = (PAGE_W - MARGIN * 2 - colGap * 2) / 3;
  const colTop = reportY - 12;
  const colBottom = colTop - colH;
  const fontSize = 10;
  columns.forEach((column, index) => {
    const x = MARGIN + index * (colW + colGap);
    page.fill(x, colBottom, colW, colH, WHITE);
    page.stroke(x, colBottom, colW, colH, LINE);
    page.fill(x, colTop - headH, colW, headH, column.bg);
    page.text(x + 8, colTop - 15, 11, "F2", column.ink, column.title);
    page.text(x + colW - 8 - textWidth("Amount", 10), colTop - 15, 10, "F2", column.ink, "Amount");

    const rows = column.lines.length > 0 ? column.lines : [{ code: "-", description: "No entries", amount: "0" }];
    rows.forEach((line, rowIndex) => {
      const rowTop = colTop - headH - rowIndex * rowH;
      if (rowIndex % 2 === 1) {
        page.fill(x, rowTop - rowH, colW, rowH, PAGE);
      }
      const label = fitLabel(line.description.trim(), fontSize, colW * 0.56);
      const amount = fitLabel(money(line.amount), fontSize, colW * 0.4);
      page.text(x + 6, rowTop - rowH + 5, fontSize, "F2", INK, label);
      page.text(x + colW - 6 - textWidth(amount, fontSize), rowTop - rowH + 5, fontSize, "F2", INK, amount);
    });

    page.fill(x, colBottom, colW, totalH, column.bg);
    page.text(x + 8, colBottom + 6, 10, "F2", column.ink, "Total");
    const totalText = fitLabel(money(column.total), 10, colW - 58);
    page.text(x + colW - 6 - textWidth(totalText, 10), colBottom + 6, 10, "F2", column.ink, totalText);
  });

  const blocks: Array<{ label: string; value: string; ink: RGB; bg: RGB }> = [
    { label: "Sales", value: money(input.totalSales), ink: SALES, bg: SALES_BG },
    { label: "Purchase", value: money(input.totalPurchase), ink: PURCHASE, bg: PURCHASE_BG },
    { label: "Expense", value: money(input.totalExpense), ink: EXPENSE, bg: EXPENSE_BG },
    { label: "Business", value: money(input.business), ink: BUSINESS, bg: BUSINESS_BG },
    { label: "Profit", value: money(input.profit ?? input.balance), ink: PROFIT, bg: PROFIT_BG },
  ];
  const blockGap = 6;
  const blockW = (PAGE_W - MARGIN * 2 - blockGap * (blocks.length - 1)) / blocks.length;
  const blockY = colBottom - 14 - blockH;
  blocks.forEach((block, index) => {
    const x = MARGIN + index * (blockW + blockGap);
    page.fill(x, blockY, blockW, blockH, block.bg);
    page.fill(x, blockY, blockW, 3, block.ink);
    page.text(x + 8, blockY + 28, 9, "F2", block.ink, block.label.toUpperCase());
    page.text(x + 8, blockY + 10, 11, "F2", INK, fitLabel(block.value, 11, blockW - 14));
  });

  page.fill(0, 0, PAGE_W, footerH, WHITE);
  page.fill(0, footerH - 4, PAGE_W, 4, RED);
  page.text(MARGIN, 16, 10, "F2", INK, `Printed by: ${input.printedBy}`);
  const thanks = "Thank you";
  page.text((PAGE_W - textWidth(thanks, 12)) / 2, 15, 12, "F2", RED, thanks);
  const dateLine = `Printed date: ${input.printedAt}`;
  page.text(PAGE_W - MARGIN - textWidth(dateLine, 10), 16, 10, "F2", INK, dateLine);

  return assemble(page.ops.join("\n"), pageH);
}
