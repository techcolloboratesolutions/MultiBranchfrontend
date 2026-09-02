import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import LoadingState from "../common/LoadingState";
import HorizontalScrollTable from "../tables/HorizontalScrollTable";
import WhatsAppSendDialog from "./WhatsAppSendDialog";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import { getErrorMessage } from "../../services/api";
import { listInstitutions } from "../../services/institutionService";
import { listPartnerGroups, listPartnerGroupEntries, listPartners } from "../../services/partnerService";
import { getMonthlyReport, MonthlyReport, MonthlyReportRow } from "../../services/reportService";
import { Institution } from "../../types/institution";
import { Partner, PartnerGroup } from "../../types/partner";
import { formatInr } from "../../utils/currency";
import { currentMonth, currentYear, formatDisplayDate, monthDateIsos } from "../../utils/date";
import { safeFilePart } from "../../utils/download";
import { buildThermalDayPdf, buildThermalMonthSummaryPdf, collectHeads, collectNonZeroHeads, hasNonZeroDay } from "../../utils/thermalPdf";
import { saveFilesToBranchFolder } from "../../utils/zipFolder";

const denseCell = { py: 0.2, px: 0.6, fontSize: "0.75rem", lineHeight: 1.2 };
const receiptHeaderSx = { ...denseCell, fontWeight: 700, backgroundColor: "#e8f3f5", whiteSpace: "nowrap" };
const paymentHeaderSx = { ...denseCell, fontWeight: 700, backgroundColor: "#f7f0e2", whiteSpace: "nowrap" };
const expenseHeaderSx = { ...denseCell, fontWeight: 700, backgroundColor: "#f3e8ee", whiteSpace: "nowrap" };
const headerCellSx = { ...denseCell, fontWeight: 700, verticalAlign: "bottom" };

interface Props {
  open: boolean;
  branchName: string;
  institutionId: number | null;
  year?: number;
  month?: number;
  onClose: () => void;
}

function emptyRow(
  date: string,
  receiptHeads: { id: number }[],
  paymentHeads: { id: number }[],
  expenseHeads: { id: number }[],
): MonthlyReportRow {
  return {
    date,
    receipts: Object.fromEntries(receiptHeads.map((head) => [String(head.id), "0"])),
    payments: Object.fromEntries(paymentHeads.map((head) => [String(head.id), "0"])),
    expenses: Object.fromEntries(expenseHeads.map((head) => [String(head.id), "0"])),
    receipt: "0",
    payment: "0",
    expense: "0",
    business: "0",
    balance: "0",
  };
}

export default function BranchMonthDetailDialog({
  open,
  branchName,
  institutionId,
  year: yearProp,
  month: monthProp,
  onClose,
}: Props) {
  const { user } = useAuth();
  const { notify } = useToast();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [exportingDate, setExportingDate] = useState<string | null>(null);
  const [exportingMonthly, setExportingMonthly] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [groups, setGroups] = useState<PartnerGroup[]>([]);
  const [whatsAppTarget, setWhatsAppTarget] = useState<{
    filename: string;
    caption: string;
    pdf: Uint8Array;
  } | null>(null);
  const year = yearProp ?? currentYear();
  const month = monthProp ?? currentMonth();

  useEffect(() => {
    if (!open || !institutionId) {
      return;
    }
    setLoading(true);
    setError("");
    getMonthlyReport({ year, month, institution_id: institutionId })
      .then(setReport)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
    listInstitutions(institutionId)
      .then((rows) => setInstitution(rows.find((row) => row.id === institutionId) ?? rows[0] ?? null))
      .catch(() => setInstitution(null));
    Promise.all([
      listPartners({ institution_id: institutionId, in_group: true }),
      listPartnerGroups(),
      listPartnerGroupEntries(institutionId),
    ])
      .then(([nextPartners, nextGroups, entries]) => {
        setPartners(nextPartners);
        const groupIds = new Set(entries.filter((row) => row.is_active).map((row) => row.partner_group));
        setGroups(nextGroups.filter((group) => groupIds.has(group.id)));
      })
      .catch(() => {
        setPartners([]);
        setGroups([]);
      });
  }, [open, institutionId, year, month]);

  const receiptHeads = report?.receipt_heads ?? [];
  const paymentHeads = report?.payment_heads ?? [];
  const expenseHeads = report?.expense_heads ?? [];
  const rows = useMemo(() => {
    const byDate = new Map((report?.rows ?? []).map((row) => [row.date, row]));
    return monthDateIsos(year, month).map(
      (date) => byDate.get(date) ?? emptyRow(date, receiptHeads, paymentHeads, expenseHeads),
    );
  }, [report, year, month, receiptHeads, paymentHeads, expenseHeads]);

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const pdfForRow = (row: MonthlyReportRow) => {
    const printedBy = user?.full_name || user?.username || "Unknown";
    const printedAt = new Date().toLocaleString("en-IN");
    const folderName = safeFilePart(branchName);
    const datePart = safeFilePart(formatDisplayDate(row.date).replace(/,/g, ""));
    const filename = `${datePart}_${folderName}.pdf`;
    const pdf = buildThermalDayPdf({
      institution,
      branchName,
      businessDate: row.date,
      businessDateLabel: formatDisplayDate(row.date),
      sales: collectNonZeroHeads(receiptHeads, row.receipts),
      purchases: collectNonZeroHeads(paymentHeads, row.payments),
      expenses: collectNonZeroHeads(expenseHeads, row.expenses),
      totalSales: row.receipt,
      totalPurchase: row.payment,
      totalExpense: row.expense,
      business: row.business,
      balance: row.balance,
      printedBy,
      printedAt,
    });
    return { folderName, filename, pdf };
  };

  const exportRowPdf = async (row: MonthlyReportRow) => {
    if (!hasNonZeroDay(row)) {
      notify("This date has no non-zero entries to export.", "info");
      return;
    }
    setExportingDate(row.date);
    try {
      const { folderName, filename, pdf } = pdfForRow(row);
      const mode = await saveFilesToBranchFolder(folderName, [{ filename, content: pdf }]);
      notify(
        mode === "folder"
          ? `Saved ${filename} in folder ${folderName}.`
          : `Downloaded ${folderName}.zip with ${filename}.`,
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      notify(getErrorMessage(err), "error");
    } finally {
      setExportingDate(null);
    }
  };

  const exportMonthlySummary = async () => {
    if (!report) {
      notify("Monthly totals are not loaded yet.", "info");
      return;
    }
    setExportingMonthly(true);
    try {
      const printedBy = user?.full_name || user?.username || "Unknown";
      const printedAt = new Date().toLocaleString("en-IN");
      const folderName = safeFilePart(branchName);
      const monthName = new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "long" });
      const filename = `${safeFilePart(monthName)}_${year}_${folderName}.pdf`;
      const pdf = buildThermalMonthSummaryPdf({
        institution,
        branchName,
        periodLabel: monthLabel,
        sales: collectHeads(receiptHeads, report.receipt_head_totals),
        purchases: collectHeads(paymentHeads, report.payment_head_totals),
        expenses: collectHeads(expenseHeads, report.expense_head_totals),
        totalSales: report.total_receipt,
        totalPurchase: report.total_payment,
        totalExpense: report.total_expense ?? "0",
        business: report.total_business,
        balance: report.total_balance ?? "0",
        printedBy,
        printedAt,
      });
      const mode = await saveFilesToBranchFolder(folderName, [{ filename, content: pdf }]);
      notify(
        mode === "folder"
          ? `Saved ${filename} in folder ${folderName}.`
          : `Downloaded ${folderName}.zip with ${filename}.`,
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      notify(getErrorMessage(err), "error");
    } finally {
      setExportingMonthly(false);
    }
  };

  const openWhatsApp = (row: MonthlyReportRow) => {
    if (!hasNonZeroDay(row)) {
      notify("This date has no non-zero entries to send.", "info");
      return;
    }
    const { filename, pdf } = pdfForRow(row);
    setWhatsAppTarget({
      filename,
      caption: `${branchName} — ${formatDisplayDate(row.date)}`,
      pdf,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl" fullScreen={fullScreen}>
      <DialogTitle>
        {branchName}
        <Typography variant="body2" color="text.secondary">
          Sales, purchases, and expenses for {monthLabel} — Balance = sales − expenses
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? <LoadingState /> : null}
        {error ? <Typography color="error">{error}</Typography> : null}
        {!loading && !error ? (
          <HorizontalScrollTable outlined label="Scroll heads left / right">
            <Table size="small" sx={{ "& .MuiTableCell-root": denseCell }}>
              <TableHead>
                <TableRow>
                  <TableCell rowSpan={2} sx={headerCellSx}>
                    Date
                  </TableCell>
                  <TableCell align="center" colSpan={receiptHeads.length + 1} sx={receiptHeaderSx}>
                    Sales Heads
                  </TableCell>
                  <TableCell align="center" colSpan={paymentHeads.length + 1} sx={paymentHeaderSx}>
                    Purchase Heads
                  </TableCell>
                  <TableCell rowSpan={2} sx={{ ...headerCellSx }} align="right">
                    Business
                  </TableCell>
                  <TableCell align="center" colSpan={expenseHeads.length + 1} sx={expenseHeaderSx}>
                    Expense Heads
                  </TableCell>
                  <TableCell rowSpan={2} sx={headerCellSx} align="right">
                    Balance
                  </TableCell>
                  <TableCell rowSpan={2} sx={headerCellSx} align="center">
                    PDF
                  </TableCell>
                  <TableCell rowSpan={2} sx={headerCellSx} align="center">
                    WA
                  </TableCell>
                </TableRow>
                <TableRow>
                  {receiptHeads.map((head) => (
                    <TableCell key={`rh-${head.id}`} align="right" sx={receiptHeaderSx}>
                      {head.code}
                    </TableCell>
                  ))}
                  <TableCell align="right" sx={receiptHeaderSx}>
                    Total
                  </TableCell>
                  {paymentHeads.map((head) => (
                    <TableCell key={`ph-${head.id}`} align="right" sx={paymentHeaderSx}>
                      {head.code}
                    </TableCell>
                  ))}
                  <TableCell align="right" sx={paymentHeaderSx}>
                    Total
                  </TableCell>
                  {expenseHeads.map((head) => (
                    <TableCell key={`eh-${head.id}`} align="right" sx={expenseHeaderSx}>
                      {head.code}
                    </TableCell>
                  ))}
                  <TableCell align="right" sx={expenseHeaderSx}>
                    Total
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.date} hover>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDisplayDate(row.date)}</TableCell>
                    {receiptHeads.map((head) => (
                      <TableCell key={`${row.date}-r-${head.id}`} align="right">
                        {formatInr(row.receipts[String(head.id)] ?? "0")}
                      </TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#0f766e" }}>
                      {formatInr(row.receipt)}
                    </TableCell>
                    {paymentHeads.map((head) => (
                      <TableCell key={`${row.date}-p-${head.id}`} align="right">
                        {formatInr(row.payments[String(head.id)] ?? "0")}
                      </TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#c2410c" }}>
                      {formatInr(row.payment)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {formatInr(row.business)}
                    </TableCell>
                    {expenseHeads.map((head) => (
                      <TableCell key={`${row.date}-e-${head.id}`} align="right">
                        {formatInr(row.expenses?.[String(head.id)] ?? "0")}
                      </TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#9d174d" }}>
                      {formatInr(row.expense)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {formatInr(row.balance)}
                    </TableCell>
                    <TableCell align="center" sx={{ px: 0.25 }}>
                      <IconButton
                        size="small"
                        color="error"
                        aria-label={`Export PDF for ${formatDisplayDate(row.date)}`}
                        disabled={exportingDate === row.date || !hasNonZeroDay(row)}
                        onClick={() => exportRowPdf(row)}
                        sx={{ p: 0.25 }}
                      >
                        <PictureAsPdfIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </TableCell>
                    <TableCell align="center" sx={{ px: 0.25 }}>
                      <IconButton
                        size="small"
                        aria-label={`Send WhatsApp PDF for ${formatDisplayDate(row.date)}`}
                        disabled={!hasNonZeroDay(row)}
                        onClick={() => openWhatsApp(row)}
                        sx={{ p: 0.25, color: "#25D366" }}
                      >
                        <WhatsAppIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: "rgba(15,76,92,0.06)" }}>
                  <TableCell sx={{ fontWeight: 700 }}>Month total</TableCell>
                  {receiptHeads.map((head) => (
                    <TableCell key={`sum-r-${head.id}`} align="right" sx={{ fontWeight: 700 }}>
                      {formatInr(report?.receipt_head_totals[String(head.id)] ?? "0")}
                    </TableCell>
                  ))}
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {formatInr(report?.total_receipt)}
                  </TableCell>
                  {paymentHeads.map((head) => (
                    <TableCell key={`sum-p-${head.id}`} align="right" sx={{ fontWeight: 700 }}>
                      {formatInr(report?.payment_head_totals[String(head.id)] ?? "0")}
                    </TableCell>
                  ))}
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {formatInr(report?.total_payment)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {formatInr(report?.total_business)}
                  </TableCell>
                  {expenseHeads.map((head) => (
                    <TableCell key={`sum-e-${head.id}`} align="right" sx={{ fontWeight: 700 }}>
                      {formatInr(report?.expense_head_totals[String(head.id)] ?? "0")}
                    </TableCell>
                  ))}
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {formatInr(report?.total_expense)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {formatInr(report?.total_balance)}
                  </TableCell>
                  <TableCell />
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </HorizontalScrollTable>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          variant="outlined"
          onClick={exportMonthlySummary}
          disabled={loading || exportingMonthly || Boolean(error) || !report}
        >
          {exportingMonthly ? "Saving..." : "Monthly summary"}
        </Button>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
      <WhatsAppSendDialog
        open={Boolean(whatsAppTarget)}
        filename={whatsAppTarget?.filename ?? ""}
        caption={whatsAppTarget?.caption ?? ""}
        pdf={whatsAppTarget?.pdf ?? null}
        partners={partners}
        groups={groups}
        onClose={() => setWhatsAppTarget(null)}
        onSent={(message) => notify(message)}
        onError={(message) => notify(message, "error")}
      />
    </Dialog>
  );
}
