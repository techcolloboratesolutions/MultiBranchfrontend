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
import { getErrorMessage } from "../../services/api";
import { getMonthlyReport, MonthlyReport, ReportHead } from "../../services/reportService";
import { formatInr } from "../../utils/currency";
import { currentMonth, currentYear } from "../../utils/date";

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
  const year = yearProp ?? currentYear();
  const month = monthProp ?? currentMonth();
  const [report, setReport] = useState<MonthlyReport | null>(null);
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
  }, [open, institutionId, year, month]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      <DialogTitle>
        {branchName}
        <Typography variant="body2" color="text.secondary">
          Sales, purchase, and expense heads for {monthLabel}. Balance = sales − expenses.
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
                <TableCell sx={{ fontWeight: 700, backgroundColor: "#f5f3ff" }}>Balance</TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    backgroundColor: "#f5f3ff",
                    color: Number(report.total_balance) < 0 ? "#b91c1c" : "#6d28d9",
                  }}
                >
                  {formatInr(report.total_balance ?? "0")}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
