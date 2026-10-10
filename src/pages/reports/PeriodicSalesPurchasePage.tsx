import {
  Card,
  CardContent,
  Grid2 as Grid,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import DayBranchesDetailDialog from "../../components/reports/DayBranchesDetailDialog";
import HorizontalScrollTable from "../../components/tables/HorizontalScrollTable";
import { useAuth } from "../../hooks/useAuth";
import { listInstitutions } from "../../services/institutionService";
import { getPeriodicSalesPurchase, PeriodicSalesPurchaseReport } from "../../services/reportService";
import { getErrorMessage } from "../../services/api";
import { Institution } from "../../types/institution";
import { formatInr } from "../../utils/currency";
import { currentMonth, currentYear, formatDisplayDate, monthBounds } from "../../utils/date";

const currentPeriod = monthBounds(currentYear(), currentMonth());

const receiptHeaderSx = { fontWeight: 700, backgroundColor: "#e8f3f5", whiteSpace: "nowrap" };
const paymentHeaderSx = { fontWeight: 700, backgroundColor: "#f7f0e2", whiteSpace: "nowrap" };

export default function PeriodicSalesPurchasePage() {
  const { canViewAllBranches, user } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [institutionId, setInstitutionId] = useState<number | "all">(canViewAllBranches ? "all" : user?.institution.id ?? "all");
  const [fromDate, setFromDate] = useState(currentPeriod.start);
  const [toDate, setToDate] = useState(currentPeriod.end);
  const [report, setReport] = useState<PeriodicSalesPurchaseReport | null>(null);
  const [error, setError] = useState("");
  const [detailDate, setDetailDate] = useState<string | null>(null);

  useEffect(() => {
    listInstitutions().then(setInstitutions).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!fromDate || !toDate || fromDate > toDate) {
      setReport(null);
      return;
    }
    let cancelled = false;
    getPeriodicSalesPurchase({
      institution_id: institutionId,
      from_date: fromDate,
      to_date: toDate,
    })
      .then((next) => {
        if (!cancelled) {
          setReport(next);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setReport(null);
          setError(getErrorMessage(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [institutionId, fromDate, toDate]);

  const receiptHeads = report?.receipt_heads ?? [];
  const paymentHeads = report?.payment_heads ?? [];
  const colCount = receiptHeads.length + paymentHeads.length + 4;

  return (
    <>
      <PageHeader
        title="Periodic Sales & Purchase"
        subtitle={
          canViewAllBranches
            ? "From date and to date start as the current month. Click a day to see every branch for that date. Business = Sales + Purchase."
            : "From date and to date start as the current month. Business = Sales + Purchase."
        }
      />
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                select
                required
                fullWidth
                label="Institution"
                value={String(institutionId)}
                disabled={!canViewAllBranches}
                onChange={(event) => setInstitutionId(event.target.value === "all" ? "all" : Number(event.target.value))}
              >
                {canViewAllBranches ? <MenuItem value="all">ALL</MenuItem> : null}
                {institutions.map((institution) => (
                  <MenuItem key={institution.id} value={institution.id}>
                    {institution.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                required
                fullWidth
                label="From date"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                required
                fullWidth
                label="To date"
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      {fromDate > toDate ? <Typography color="error">From date must be on or before to date.</Typography> : null}
      {error ? <Typography color="error">{error}</Typography> : null}
      {report ? (
        <HorizontalScrollTable label="Scroll heads left / right">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell rowSpan={2} sx={{ fontWeight: 700, verticalAlign: "bottom" }}>
                  Date
                </TableCell>
                <TableCell align="center" colSpan={receiptHeads.length + 1} sx={receiptHeaderSx}>
                  Sales Heads
                </TableCell>
                <TableCell align="center" colSpan={paymentHeads.length + 1} sx={paymentHeaderSx}>
                  Purchase Heads
                </TableCell>
                <TableCell rowSpan={2} align="right" sx={{ fontWeight: 700, verticalAlign: "bottom" }}>
                  Business
                </TableCell>
              </TableRow>
              <TableRow>
                {receiptHeads.map((head) => (
                  <TableCell key={`rh-${head.id}`} align="right" sx={receiptHeaderSx}>
                    {head.code}
                    <Typography variant="caption" display="block" color="text.secondary">
                      {head.description}
                    </Typography>
                  </TableCell>
                ))}
                <TableCell align="right" sx={receiptHeaderSx}>
                  Total Sales
                </TableCell>
                {paymentHeads.map((head) => (
                  <TableCell key={`ph-${head.id}`} align="right" sx={paymentHeaderSx}>
                    {head.code}
                    <Typography variant="caption" display="block" color="text.secondary">
                      {head.description}
                    </Typography>
                  </TableCell>
                ))}
                <TableCell align="right" sx={paymentHeaderSx}>
                  Total Purchase
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {report.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colCount}>No days in this period.</TableCell>
                </TableRow>
              ) : (
                report.rows.map((row) => (
                  <TableRow
                    key={row.date}
                    hover
                    onClick={canViewAllBranches ? () => setDetailDate(row.date) : undefined}
                    sx={canViewAllBranches ? { cursor: "pointer" } : undefined}
                  >
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDisplayDate(row.date)}</TableCell>
                    {receiptHeads.map((head) => (
                      <TableCell key={`${row.date}-r-${head.id}`} align="right">
                        {formatInr(row.receipts[String(head.id)] ?? "0")}
                      </TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {formatInr(row.receipt)}
                    </TableCell>
                    {paymentHeads.map((head) => (
                      <TableCell key={`${row.date}-p-${head.id}`} align="right">
                        {formatInr(row.payments[String(head.id)] ?? "0")}
                      </TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {formatInr(row.payment)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {formatInr(row.business)}
                    </TableCell>
                  </TableRow>
                ))
              )}
              <TableRow sx={{ backgroundColor: "#f4f7f8" }}>
                <TableCell sx={{ fontWeight: 700 }}>Period sum</TableCell>
                {receiptHeads.map((head) => (
                  <TableCell key={`sum-r-${head.id}`} align="right" sx={{ fontWeight: 700 }}>
                    {formatInr(report.receipt_head_totals[String(head.id)] ?? "0")}
                  </TableCell>
                ))}
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {formatInr(report.total_receipt)}
                </TableCell>
                {paymentHeads.map((head) => (
                  <TableCell key={`sum-p-${head.id}`} align="right" sx={{ fontWeight: 700 }}>
                    {formatInr(report.payment_head_totals[String(head.id)] ?? "0")}
                  </TableCell>
                ))}
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {formatInr(report.total_payment)}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {formatInr(report.total_business)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </HorizontalScrollTable>
      ) : null}
      {canViewAllBranches ? (
        <DayBranchesDetailDialog open={Boolean(detailDate)} businessDate={detailDate} onClose={() => setDetailDate(null)} />
      ) : null}
    </>
  );
}
