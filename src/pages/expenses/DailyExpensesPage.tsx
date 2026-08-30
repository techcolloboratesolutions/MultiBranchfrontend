import {
  Button,
  Card,
  CardContent,
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
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import InstitutionSelect from "../../components/forms/InstitutionSelect";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import { listInstitutions } from "../../services/institutionService";
import {
  bulkSaveExpenses,
  deactivateExpense,
  getExpenseEntrySheet,
  ExpenseEntryRow,
} from "../../services/expenseService";
import { getErrorMessage } from "../../services/api";
import { Institution } from "../../types/institution";
import { formatInr } from "../../utils/currency";
import { todayIso } from "../../utils/date";

export default function DailyExpensesPage() {
  const { isAdmin, user, operatingInstitutionId, setOperatingInstitutionId } = useAuth();
  const { notify } = useToast();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [rows, setRows] = useState<ExpenseEntryRow[]>([]);
  const [amounts, setAmounts] = useState<Record<number, string>>({});
  const [businessDate, setBusinessDate] = useState(todayIso());
  const [toDeactivate, setToDeactivate] = useState<ExpenseEntryRow | null>(null);
  const [saving, setSaving] = useState(false);
  const selectedInstitution = isAdmin ? operatingInstitutionId : user?.institution.id ?? "all";

  const loadSheet = async () => {
    const params: { business_date: string; institution_id?: number } = { business_date: businessDate };
    if (selectedInstitution !== "all") {
      params.institution_id = Number(selectedInstitution);
    }
    const sheet = await getExpenseEntrySheet(params);
    setRows(sheet.rows);
    const nextAmounts: Record<number, string> = {};
    for (const row of sheet.rows) {
      nextAmounts[row.expense_head] = row.amount ?? "";
    }
    setAmounts(nextAmounts);
  };

  useEffect(() => {
    listInstitutions().then(setInstitutions).catch(() => undefined);
  }, []);

  useEffect(() => {
    loadSheet().catch((err) => notify(getErrorMessage(err), "error"));
  }, [businessDate, selectedInstitution]);

  const entryTotal = useMemo(() => {
    return rows.reduce((sum, row) => sum + (Number(amounts[row.expense_head]) || 0), 0);
  }, [rows, amounts]);

  const onSave = async () => {
    if (selectedInstitution === "all") {
      notify("Select a specific institution to save expenses.", "error");
      return;
    }
    const lines = rows
      .map((row) => ({
        expense_head: row.expense_head,
        amount: (amounts[row.expense_head] ?? "").trim(),
      }))
      .filter((line) => line.amount !== "");
    if (lines.length === 0) {
      notify("Enter at least one amount.", "error");
      return;
    }
    setSaving(true);
    try {
      await bulkSaveExpenses({
        institution: Number(selectedInstitution),
        business_date: businessDate,
        lines,
      });
      notify("Expenses saved.");
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
        title="Daily Expense Entry"
        subtitle="Every active expense head is shown in this table for amount entry."
      />
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
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
          </Grid>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
            <Button variant="contained" onClick={onSave} disabled={saving}>
              Save
            </Button>
            <Button type="button" onClick={() => setAmounts({})}>
              Clear
            </Button>
          </Stack>
          <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Expense Head</TableCell>
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
                    <TableCell colSpan={5}>
                      No active expense heads. Add them under Administration → Expense Heads, or run seed_data.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.expense_head} hover>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{row.code}</TableCell>
                      <TableCell>{row.description}</TableCell>
                      <TableCell align="right" sx={{ minWidth: 160 }}>
                        <TextField
                          type="number"
                          size="small"
                          inputProps={{ step: "0.01", min: "0", inputMode: "decimal" }}
                          value={amounts[row.expense_head] ?? ""}
                          onChange={(event) =>
                            setAmounts((current) => ({
                              ...current,
                              [row.expense_head]: event.target.value,
                            }))
                          }
                        />
                      </TableCell>
                      <TableCell>{row.entered_by_name ?? ""}</TableCell>
                      <TableCell>
                        {row.expense_id ? (
                          <Button size="small" color="error" onClick={() => setToDeactivate(row)}>
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
                    {formatInr(entryTotal)}
                  </TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={Boolean(toDeactivate)}
        title="Deactivate expense"
        message="This transaction will be marked inactive. It will not be deleted."
        onClose={() => setToDeactivate(null)}
        onConfirm={async () => {
          if (!toDeactivate?.expense_id) return;
          try {
            await deactivateExpense(toDeactivate.expense_id);
            notify("Expense deactivated.");
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
