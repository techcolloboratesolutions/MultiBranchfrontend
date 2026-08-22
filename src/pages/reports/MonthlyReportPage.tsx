import {
  Button,
  Card,
  CardContent,
  Grid2 as Grid,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import InstitutionSelect from "../../components/forms/InstitutionSelect";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import { listInstitutions } from "../../services/institutionService";
import { exportMonthlyReport, getMonthlyReport, MonthlyReport } from "../../services/reportService";
import DayBranchesDetailDialog from "../../components/reports/DayBranchesDetailDialog";
import { getErrorMessage } from "../../services/api";
import { Institution } from "../../types/institution";
import { formatInr } from "../../utils/currency";
import { currentMonth, currentYear, formatDisplayDate } from "../../utils/date";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const receiptHeaderSx = { fontWeight: 700, backgroundColor: "#e8f3f5", whiteSpace: "nowrap" };
const paymentHeaderSx = { fontWeight: 700, backgroundColor: "#f7f0e2", whiteSpace: "nowrap" };

export default function MonthlyReportPage() {
  const { isAdmin, user, operatingInstitutionId, setOperatingInstitutionId } = useAuth();
  const { notify } = useToast();
  const [year, setYear] = useState(currentYear());
  const [month, setMonth] = useState(currentMonth());
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [detailDate, setDetailDate] = useState<string | null>(null);
  const selectedInstitution = isAdmin ? operatingInstitutionId : user?.institution.id ?? "all";

  const params = () => {
    const query: Record<string, string | number | undefined> = { year, month };
    if (selectedInstitution !== "all") {
      query.institution_id = selectedInstitution;
    }
    return query;
  };

  useEffect(() => {
    listInstitutions().then(setInstitutions).catch(() => undefined);
  }, []);

  useEffect(() => {
    getMonthlyReport(params())
      .then(setReport)
      .catch((err) => notify(getErrorMessage(err), "error"));
  }, [year, month, selectedInstitution]);

  const receiptHeads = report?.receipt_heads ?? [];
  const paymentHeads = report?.payment_heads ?? [];

  return (
    <>
      <PageHeader
        title="Monthly Receipts & Payments"
        subtitle={
          isAdmin
            ? "Click a date row to see every branch’s receipts and payments for that day."
            : "All active receipt heads and payment heads are shown together. The last row is the month sum for each head."
        }
      />
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
              <TextField label="Year" type="number" value={year} onChange={(event) => setYear(Number(event.target.value))} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
              <TextField select label="Month" value={month} onChange={(event) => setMonth(Number(event.target.value))}>
                {Array.from({ length: 12 }, (_, index) => (
                  <MenuItem key={index + 1} value={index + 1}>
                    {index + 1}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 8, md: 4 }}>
              <InstitutionSelect
                institutions={institutions}
                value={selectedInstitution}
                allowAll={isAdmin}
                disabled={!isAdmin}
                onChange={setOperatingInstitutionId}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Button
                variant="outlined"
                onClick={async () => {
                  try {
                    const blob = await exportMonthlyReport(params());
                    downloadBlob(blob, `monthly-${year}-${String(month).padStart(2, "0")}.xlsx`);
                  } catch (err) {
                    notify(getErrorMessage(err), "error");
                  }
                }}
              >
                Export Excel
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell rowSpan={2} sx={{ fontWeight: 700, verticalAlign: "bottom" }}>
                Date
              </TableCell>
              <TableCell align="center" colSpan={receiptHeads.length + 1} sx={receiptHeaderSx}>
                Receipt Heads
              </TableCell>
              <TableCell align="center" colSpan={paymentHeads.length + 1} sx={paymentHeaderSx}>
                Payment Heads
              </TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 700, verticalAlign: "bottom" }} align="right">
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
                Total Receipt
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
                Total Payment
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(report?.rows ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={receiptHeads.length + paymentHeads.length + 4}>No transactions for this month.</TableCell>
              </TableRow>
            ) : (
              report?.rows.map((row) => (
                <TableRow
                  key={row.date}
                  hover
                  onClick={isAdmin ? () => setDetailDate(row.date) : undefined}
                  sx={isAdmin ? { cursor: "pointer" } : undefined}
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
              <TableCell sx={{ fontWeight: 700 }}>Sum</TableCell>
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
      {isAdmin ? (
        <DayBranchesDetailDialog
          open={Boolean(detailDate)}
          businessDate={detailDate}
          onClose={() => setDetailDate(null)}
        />
      ) : null}
    </>
  );
}
