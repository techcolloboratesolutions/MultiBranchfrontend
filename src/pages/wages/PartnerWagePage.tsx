import { Button, Card, CardContent, Grid2 as Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import InstitutionSelect from "../../components/forms/InstitutionSelect";
import ResponsiveTable from "../../components/tables/ResponsiveTable";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import { listInstitutions } from "../../services/institutionService";
import { calculateWages, exportWages, saveWages } from "../../services/wageService";
import { getErrorMessage } from "../../services/api";
import { Institution } from "../../types/institution";
import { WagePreview } from "../../types/wage";
import { formatInr } from "../../utils/currency";
import { currentMonth, currentYear } from "../../utils/date";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function PartnerWagePage() {
  const { isAdmin, user, operatingInstitutionId, setOperatingInstitutionId } = useAuth();
  const { notify } = useToast();
  const [year, setYear] = useState(currentYear());
  const [month, setMonth] = useState(currentMonth());
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [preview, setPreview] = useState<WagePreview | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const selectedInstitution = isAdmin ? operatingInstitutionId : user?.institution.id ?? "all";

  useEffect(() => {
    listInstitutions().then(setInstitutions).catch(() => undefined);
  }, []);

  const params = () => {
    const query: Record<string, string | number | undefined> = { year, month };
    if (selectedInstitution !== "all") {
      query.institution_id = selectedInstitution;
    }
    return query;
  };

  const onCalculate = async () => {
    try {
      if (selectedInstitution === "all") {
        notify("Select a specific institution to calculate wages.", "error");
        return;
      }
      setPreview(await calculateWages(params()));
      notify("Calculated on the server. Confirm before saving.");
    } catch (err) {
      notify(getErrorMessage(err), "error");
    }
  };

  return (
    <>
      <PageHeader title="Monthly Business & Partner Wage" subtitle="Totals are calculated by Django using Decimal arithmetic." />
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
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
            <Grid size={{ xs: 12, md: 4 }}>
              <InstitutionSelect
                institutions={institutions}
                value={selectedInstitution === "all" ? institutions[0]?.id ?? "all" : selectedInstitution}
                allowAll={false}
                disabled={!isAdmin}
                onChange={setOperatingInstitutionId}
              />
            </Grid>
          </Grid>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
            <Button variant="contained" onClick={onCalculate}>
              Calculate
            </Button>
            <Button variant="outlined" disabled={!preview} onClick={() => setConfirmOpen(true)}>
              Confirm
            </Button>
            <Button
              variant="outlined"
              onClick={async () => {
                try {
                  const blob = await exportWages(params());
                  downloadBlob(blob, `wages-${year}-${String(month).padStart(2, "0")}.xlsx`);
                } catch (err) {
                  notify(getErrorMessage(err), "error");
                }
              }}
            >
              Export Excel
            </Button>
          </Stack>
        </CardContent>
      </Card>
      {preview ? (
        <>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
            <Typography>Total Sales: {formatInr(preview.total_receipt)}</Typography>
            <Typography>Total Purchase: {formatInr(preview.total_payment)}</Typography>
            <Typography>Total Expense: {formatInr(preview.total_expense)}</Typography>
            <Typography>Total Business: {formatInr(preview.total_business)}</Typography>
            <Typography>Balance: {formatInr(preview.total_balance)}</Typography>
            <Typography>Share total: {preview.share_total}%</Typography>
          </Stack>
          <ResponsiveTable
            rows={preview.partners}
            rowKey={(row) => row.partner_id}
            columns={[
              { key: "partner_name", label: "Partner" },
              { key: "share_percent", label: "Share %", render: (row) => `${row.share_percent}%` },
              { key: "partner_wage_amount", label: "Partner Wage", align: "right", render: (row) => formatInr(row.partner_wage_amount) },
            ]}
          />
        </>
      ) : null}
      <ConfirmDialog
        open={confirmOpen}
        title="Save partner wages"
        message="The server will recalculate sales, purchases, and shares, then save. Continue?"
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          try {
            const institutionId = selectedInstitution === "all" ? institutions[0]?.id : selectedInstitution;
            if (institutionId == null) {
              notify("Select a specific institution.", "error");
              return;
            }
            const saved = await saveWages({ year, month, institution_id: Number(institutionId) });
            setPreview(saved);
            setConfirmOpen(false);
            notify("Wages saved.");
          } catch (err) {
            notify(getErrorMessage(err), "error");
          }
        }}
      />
    </>
  );
}
