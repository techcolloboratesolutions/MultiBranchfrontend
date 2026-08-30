import {
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Grid2 as Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import InstitutionSelect from "../../components/forms/InstitutionSelect";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import { listInstitutions } from "../../services/institutionService";
import {
  bulkSavePayments,
  deactivatePayment,
  getPaymentEntrySheet,
  PaymentEntryRow,
} from "../../services/paymentService";
import { getErrorMessage } from "../../services/api";
import { Institution } from "../../types/institution";
import { formatInr } from "../../utils/currency";
import { todayIso } from "../../utils/date";

function splitLegacyRows(rows: PaymentEntryRow[]) {
  const dailyRows: PaymentEntryRow[] = [];
  const monthlyRows: PaymentEntryRow[] = [];
  for (const row of rows) {
    if (row.recurring_type === "Monthly") {
      monthlyRows.push(row);
    } else {
      dailyRows.push(row);
    }
  }
  return { dailyRows, monthlyRows };
}

function HeadColumn({
  title,
  emptyMessage,
  rows,
  amounts,
  setAmounts,
  onDeactivate,
}: {
  title: string;
  emptyMessage: string;
  rows: PaymentEntryRow[];
  amounts: Record<number, string>;
  setAmounts: Dispatch<SetStateAction<Record<number, string>>>;
  onDeactivate: (row: PaymentEntryRow) => void;
}) {
  const columnTotal = rows.reduce((sum, row) => sum + (Number(amounts[row.payment_head]) || 0), 0);

  return (
    <>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
        {title}
      </Typography>
      <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Purchase Head</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Amount
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Entered By</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>{emptyMessage}</TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.payment_head} hover>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{row.code}</TableCell>
                  <TableCell>{row.description}</TableCell>
                  <TableCell align="right" sx={{ minWidth: 140 }}>
                    <TextField
                      type="number"
                      size="small"
                      inputProps={{ step: "0.01", min: "0", inputMode: "decimal" }}
                      value={amounts[row.payment_head] ?? ""}
                      onChange={(event) =>
                        setAmounts((current) => ({
                          ...current,
                          [row.payment_head]: event.target.value,
                        }))
                      }
                    />
                  </TableCell>
                  <TableCell>{row.entered_by_name ?? ""}</TableCell>
                  <TableCell>
                    {row.payment_id ? (
                      <Button size="small" color="error" onClick={() => onDeactivate(row)}>
                        Deactivate
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
            <TableRow>
              <TableCell colSpan={2} sx={{ fontWeight: 700 }}>
                Total
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                {formatInr(columnTotal)}
              </TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

export default function DailyPaymentsPage() {
  const { isAdmin, user, operatingInstitutionId, setOperatingInstitutionId } = useAuth();
  const { notify } = useToast();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [dailyRows, setDailyRows] = useState<PaymentEntryRow[]>([]);
  const [monthlyRows, setMonthlyRows] = useState<PaymentEntryRow[]>([]);
  const [amounts, setAmounts] = useState<Record<number, string>>({});
  const [businessDate, setBusinessDate] = useState(todayIso());
  const [dailySelected, setDailySelected] = useState(true);
  const [monthlySelected, setMonthlySelected] = useState(false);
  const [toDeactivate, setToDeactivate] = useState<PaymentEntryRow | null>(null);
  const [saving, setSaving] = useState(false);
  const selectedInstitution = isAdmin ? operatingInstitutionId : user?.institution.id ?? "all";

  const visibleRows = useMemo(
    () => [...(dailySelected ? dailyRows : []), ...(monthlySelected ? monthlyRows : [])],
    [dailySelected, monthlySelected, dailyRows, monthlyRows],
  );

  const loadSheet = async () => {
    const params: {
      business_date: string;
      institution_id?: number;
      daily: boolean;
      monthly: boolean;
    } = {
      business_date: businessDate,
      daily: dailySelected,
      monthly: monthlySelected,
    };
    if (selectedInstitution !== "all") {
      params.institution_id = Number(selectedInstitution);
    }
    const sheet = await getPaymentEntrySheet(params);
    const hasSplit = Array.isArray(sheet.daily_rows) || Array.isArray(sheet.monthly_rows);
    const nextDaily = hasSplit ? (sheet.daily_rows ?? []) : splitLegacyRows(sheet.rows).dailyRows;
    const nextMonthly = hasSplit ? (sheet.monthly_rows ?? []) : splitLegacyRows(sheet.rows).monthlyRows;
    setDailyRows(nextDaily);
    setMonthlyRows(nextMonthly);
    const nextAmounts: Record<number, string> = {};
    for (const row of [...nextDaily, ...nextMonthly]) {
      nextAmounts[row.payment_head] = row.amount ?? "";
    }
    setAmounts(nextAmounts);
  };

  useEffect(() => {
    listInstitutions().then(setInstitutions).catch(() => undefined);
  }, []);

  useEffect(() => {
    loadSheet().catch((err) => notify(getErrorMessage(err), "error"));
  }, [businessDate, selectedInstitution, dailySelected, monthlySelected]);

  const entryTotal = useMemo(() => {
    return visibleRows.reduce((sum, row) => sum + (Number(amounts[row.payment_head]) || 0), 0);
  }, [visibleRows, amounts]);

  const onSave = async () => {
    if (selectedInstitution === "all") {
      notify("Select a specific institution to save purchases.", "error");
      return;
    }
    const lines = visibleRows
      .map((row) => ({
        payment_head: row.payment_head,
        amount: (amounts[row.payment_head] ?? "").trim(),
      }))
      .filter((line) => line.amount !== "");
    if (lines.length === 0) {
      notify("Enter at least one amount.", "error");
      return;
    }
    setSaving(true);
    try {
      await bulkSavePayments({
        institution: Number(selectedInstitution),
        business_date: businessDate,
        lines,
      });
      notify("Purchases saved.");
      await loadSheet();
    } catch (err) {
      notify(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Daily Purchase Entry"
        subtitle="Daily heads are shown by default. Check Monthly to include monthly heads on the same two-column screen."
      />
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <InstitutionSelect
                institutions={institutions}
                value={selectedInstitution}
                allowAll={isAdmin}
                disabled={!isAdmin}
                onChange={setOperatingInstitutionId}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                type="date"
                label="Business Date"
                InputLabelProps={{ shrink: true }}
                value={businessDate}
                onChange={(event) => setBusinessDate(event.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={dailySelected}
                      onChange={(event) => setDailySelected(event.target.checked)}
                    />
                  }
                  label="Daily"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={monthlySelected}
                      onChange={(event) => setMonthlySelected(event.target.checked)}
                    />
                  }
                  label="Monthly"
                />
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }} alignItems={{ sm: "center" }}>
            <Button variant="contained" onClick={onSave} disabled={saving}>
              Save
            </Button>
            <Button type="button" onClick={() => setAmounts({})}>
              Clear
            </Button>
            <Typography sx={{ fontWeight: 700, ml: { sm: "auto" } }}>
              Combined total {formatInr(entryTotal)}
            </Typography>
          </Stack>
          <Grid container spacing={2}>
            {dailySelected ? (
              <Grid size={{ xs: 12, md: monthlySelected ? 6 : 12 }}>
                <HeadColumn
                  title="Daily heads"
                  emptyMessage="No active daily purchase heads (ACTIVE = Y). Add them under Administration → Purchase Heads."
                  rows={dailyRows}
                  amounts={amounts}
                  setAmounts={setAmounts}
                  onDeactivate={setToDeactivate}
                />
              </Grid>
            ) : null}
            {monthlySelected ? (
              <Grid size={{ xs: 12, md: dailySelected ? 6 : 12 }}>
                <HeadColumn
                  title="Monthly heads"
                  emptyMessage="No active monthly purchase heads. Check Monthly only shows heads marked Monthly."
                  rows={monthlyRows}
                  amounts={amounts}
                  setAmounts={setAmounts}
                  onDeactivate={setToDeactivate}
                />
              </Grid>
            ) : null}
            {!dailySelected && !monthlySelected ? (
              <Grid size={{ xs: 12 }}>
                <Typography color="text.secondary">Select Daily and/or Monthly to show purchase heads.</Typography>
              </Grid>
            ) : null}
          </Grid>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={Boolean(toDeactivate)}
        title="Deactivate purchase"
        message="This transaction will be marked inactive. It will not be deleted."
        onClose={() => setToDeactivate(null)}
        onConfirm={async () => {
          if (!toDeactivate?.payment_id) return;
          try {
            await deactivatePayment(toDeactivate.payment_id);
            notify("Purchase deactivated.");
            setToDeactivate(null);
            await loadSheet();
          } catch (err) {
            notify(getErrorMessage(err), "error");
          }
        }}
      />
    </>
  );
}
