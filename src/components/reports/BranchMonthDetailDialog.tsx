import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import LoadingState from "../common/LoadingState";
import { getErrorMessage } from "../../services/api";
import { getMonthlyReport, MonthlyReport, MonthlyReportRow } from "../../services/reportService";
import { formatInr } from "../../utils/currency";
import { currentMonth, currentYear, formatDisplayDate, monthDateIsos } from "../../utils/date";

const receiptHeaderSx = { fontWeight: 700, backgroundColor: "#e8f3f5", whiteSpace: "nowrap" };
const paymentHeaderSx = { fontWeight: 700, backgroundColor: "#f7f0e2", whiteSpace: "nowrap" };

interface Props {
  open: boolean;
  branchName: string;
  institutionId: number | null;
  onClose: () => void;
}

function emptyRow(date: string, receiptHeads: { id: number }[], paymentHeads: { id: number }[]): MonthlyReportRow {
  return {
    date,
    receipts: Object.fromEntries(receiptHeads.map((head) => [String(head.id), "0"])),
    payments: Object.fromEntries(paymentHeads.map((head) => [String(head.id), "0"])),
    receipt: "0",
    payment: "0",
    business: "0",
  };
}

export default function BranchMonthDetailDialog({ open, branchName, institutionId, onClose }: Props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const year = currentYear();
  const month = currentMonth();

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

  const receiptHeads = report?.receipt_heads ?? [];
  const paymentHeads = report?.payment_heads ?? [];
  const rows = useMemo(() => {
    const byDate = new Map((report?.rows ?? []).map((row) => [row.date, row]));
    return monthDateIsos(year, month).map((date) => byDate.get(date) ?? emptyRow(date, receiptHeads, paymentHeads));
  }, [report, year, month, receiptHeads, paymentHeads]);

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl" fullScreen={fullScreen}>
      <DialogTitle>
        {branchName}
        <Typography variant="body2" color="text.secondary">
          Detailed receipts and payments for {monthLabel} — every date
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? <LoadingState /> : null}
        {error ? <Typography color="error">{error}</Typography> : null}
        {!loading && !error ? (
          <TableContainer component={Paper} variant="outlined" sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell rowSpan={2} sx={{ fontWeight: 700, verticalAlign: "bottom" }}>
                    Date
                  </TableCell>
                  <TableCell align="center" colSpan={receiptHeads.length + 1} sx={receiptHeaderSx}>
                    Receipt
                  </TableCell>
                  <TableCell align="center" colSpan={paymentHeads.length + 1} sx={paymentHeaderSx}>
                    Payment
                  </TableCell>
                  <TableCell rowSpan={2} sx={{ fontWeight: 700, verticalAlign: "bottom" }} align="right">
                    Business
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
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
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
