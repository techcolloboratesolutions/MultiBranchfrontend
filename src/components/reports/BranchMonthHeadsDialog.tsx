import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import LoadingState from "../common/LoadingState";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import { getErrorMessage } from "../../services/api";
import { listInstitutions } from "../../services/institutionService";
import { getMonthlyReport, MonthlyReport, ReportHead } from "../../services/reportService";
import { Institution } from "../../types/institution";
import { formatInr, monthTotalProfit } from "../../utils/currency";
import { currentMonth, currentYear } from "../../utils/date";
import { safeFilePart } from "../../utils/download";
import { buildMonthlyBusinessReportPdf } from "../../utils/monthlyBusinessPdf";
import { collectHeads } from "../../utils/thermalPdf";
import { saveFilesToBranchFolder } from "../../utils/zipFolder";

const salesHeaderSx = { fontWeight: 700, backgroundColor: "#e8f3f5" };
const purchaseHeaderSx = { fontWeight: 700, backgroundColor: "#f7f0e2" };
const expenseHeaderSx = { fontWeight: 700, backgroundColor: "#f3e8ee" };

interface Props {
  open: boolean;
  branchName: string;
  institutionId: number | null;
  year?: number;
  month?: number;
  onClose: () => void;
}

function HeadSection({
  title,
  headerSx,
  heads,
  amounts,
  total,
  totalLabel,
}: {
  title: string;
  headerSx: object;
  heads: ReportHead[];
  amounts: Record<string, string> | undefined;
  total: string;
  totalLabel: string;
}) {
  return (
    <>
      <TableHead>
        <TableRow>
          <TableCell colSpan={2} sx={headerSx}>
            {title}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell sx={{ fontWeight: 700 }}>Head</TableCell>
          <TableCell align="right" sx={{ fontWeight: 700 }}>
            Amount
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {heads.map((head) => (
          <TableRow key={head.id}>
            <TableCell>
              {head.code} {head.description}
            </TableCell>
            <TableCell align="right">{formatInr(amounts?.[String(head.id)] ?? "0")}</TableCell>
          </TableRow>
        ))}
        <TableRow>
          <TableCell sx={{ fontWeight: 700 }}>{totalLabel}</TableCell>
          <TableCell align="right" sx={{ fontWeight: 700 }}>
            {formatInr(total)}
          </TableCell>
        </TableRow>
      </TableBody>
    </>
  );
}

export default function BranchMonthHeadsDialog({
  open,
  branchName,
  institutionId,
  year: yearProp,
  month: monthProp,
  onClose,
}: Props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const { user } = useAuth();
  const { notify } = useToast();
  const year = yearProp ?? currentYear();
  const month = monthProp ?? currentMonth();
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

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
    listInstitutions()
      .then((rows) => setInstitution(rows.find((row) => row.id === institutionId) ?? null))
      .catch(() => setInstitution(null));
  }, [open, institutionId, year, month]);

  const savePdf = async () => {
    if (!report) {
      return;
    }
    const printedBy = user?.full_name || user?.username || "Unknown";
    const printedAt = new Date().toLocaleString("en-IN");
    const institutionName = institution?.name || branchName || "Institution";
    const pdf = buildMonthlyBusinessReportPdf({
      institution,
      branchName: institutionName,
      periodLabel: monthLabel,
      sales: collectHeads(report.receipt_heads, report.receipt_head_totals),
      purchases: collectHeads(report.payment_heads, report.payment_head_totals),
      expenses: collectHeads(report.expense_heads, report.expense_head_totals),
      totalSales: report.total_receipt,
      totalPurchase: report.total_payment,
      totalExpense: report.total_expense ?? "0",
      business: report.total_business,
      balance: String(monthTotalProfit(report.total_business, report.total_payment, report.total_expense)),
      profit: String(monthTotalProfit(report.total_business, report.total_payment, report.total_expense)),
      printedBy,
      printedAt,
    });
    const folderName = safeFilePart(institutionName);
    const filename = `${folderName}_${safeFilePart(monthLabel)}.pdf`;
    try {
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
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      <DialogTitle>
        {branchName}
        <Typography variant="body2" color="text.secondary">
          Sales, purchase, and expense heads for {monthLabel}. Profit = total business − total purchase − total expense.
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? <LoadingState /> : null}
        {error ? <Typography color="error">{error}</Typography> : null}
        {!loading && !error && report ? (
          <Table size="small">
            <HeadSection
              title="Sales Heads"
              headerSx={salesHeaderSx}
              heads={report.receipt_heads}
              amounts={report.receipt_head_totals}
              total={report.total_receipt}
              totalLabel="Total Sales"
            />
            <HeadSection
              title="Purchase Heads"
              headerSx={purchaseHeaderSx}
              heads={report.payment_heads}
              amounts={report.payment_head_totals}
              total={report.total_payment}
              totalLabel="Total Purchase"
            />
            <HeadSection
              title="Expense Heads"
              headerSx={expenseHeaderSx}
              heads={report.expense_heads}
              amounts={report.expense_head_totals}
              total={report.total_expense ?? "0"}
              totalLabel="Total Expense"
            />
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Business</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: "#1d4ed8" }}>
                  {formatInr(report.total_business)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, backgroundColor: "#f5f3ff" }}>Profit</TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    backgroundColor: "#f5f3ff",
                    color:
                      monthTotalProfit(report.total_business, report.total_payment, report.total_expense) < 0
                        ? "#b91c1c"
                        : "#6d28d9",
                  }}
                >
                  {formatInr(monthTotalProfit(report.total_business, report.total_payment, report.total_expense))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={savePdf} variant="outlined" startIcon={<PictureAsPdfIcon />} disabled={!report || loading}>
          PDF
        </Button>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
