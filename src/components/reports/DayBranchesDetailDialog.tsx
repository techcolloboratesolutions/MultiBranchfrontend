import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import HorizontalScrollTable from "../tables/HorizontalScrollTable";
import { getErrorMessage } from "../../services/api";
import { DayByInstitutionReport, getDayByInstitutionReport } from "../../services/reportService";
import { formatInr } from "../../utils/currency";
import { formatDisplayDate } from "../../utils/date";

const receiptHeaderSx = { fontWeight: 700, backgroundColor: "#e8f3f5", whiteSpace: "nowrap" };
const paymentHeaderSx = { fontWeight: 700, backgroundColor: "#f7f0e2", whiteSpace: "nowrap" };
const expenseHeaderSx = { fontWeight: 700, backgroundColor: "#f3e8ee", whiteSpace: "nowrap" };

interface Props {
  open: boolean;
  businessDate: string | null;
  onClose: () => void;
}

export default function DayBranchesDetailDialog({ open, businessDate, onClose }: Props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [report, setReport] = useState<DayByInstitutionReport | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !businessDate) {
      return;
    }
    setLoading(true);
    setError("");
    getDayByInstitutionReport(businessDate)
      .then(setReport)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [open, businessDate]);

  const receiptHeads = report?.receipt_heads ?? [];
  const paymentHeads = report?.payment_heads ?? [];
  const expenseHeads = report?.expense_heads ?? [];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl" fullScreen={fullScreen}>
      <DialogTitle>
        All branches
        <Typography variant="body2" color="text.secondary">
          Sales, purchases, and expenses on {businessDate ? formatDisplayDate(businessDate) : ""}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? <LoadingState /> : null}
        {error ? <Typography color="error">{error}</Typography> : null}
        {!loading && !error ? (
          <HorizontalScrollTable outlined label="Scroll heads left / right">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell rowSpan={2} sx={{ fontWeight: 700, verticalAlign: "bottom" }}>
                    Branch
                  </TableCell>
                  <TableCell align="center" colSpan={receiptHeads.length + 1} sx={receiptHeaderSx}>
                    Sales Heads
                  </TableCell>
                  <TableCell align="center" colSpan={paymentHeads.length + 1} sx={paymentHeaderSx}>
                    Purchase Heads
                  </TableCell>
                  <TableCell rowSpan={2} sx={{ fontWeight: 700, verticalAlign: "bottom" }} align="right">
                    Business
                  </TableCell>
                  <TableCell align="center" colSpan={expenseHeads.length + 1} sx={expenseHeaderSx}>
                    Expense Heads
                  </TableCell>
                  <TableCell rowSpan={2} sx={{ fontWeight: 700, verticalAlign: "bottom" }} align="right">
                    Balance
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
                {(report?.rows ?? []).map((row) => (
                  <TableRow key={row.institution_id} hover>
                    <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 600 }}>{row.institution_name}</TableCell>
                    {receiptHeads.map((head) => (
                      <TableCell key={`${row.institution_id}-r-${head.id}`} align="right">
                        {formatInr(row.receipts[String(head.id)] ?? "0")}
                      </TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#0f766e" }}>
                      {formatInr(row.receipt)}
                    </TableCell>
                    {paymentHeads.map((head) => (
                      <TableCell key={`${row.institution_id}-p-${head.id}`} align="right">
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
                      <TableCell key={`${row.institution_id}-e-${head.id}`} align="right">
                        {formatInr(row.expenses?.[String(head.id)] ?? "0")}
                      </TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#9d174d" }}>
                      {formatInr(row.expense)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {formatInr(row.balance)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: "rgba(15,76,92,0.06)" }}>
                  <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
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
                </TableRow>
              </TableBody>
            </Table>
          </HorizontalScrollTable>
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
