import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { Button, Card, CardContent, Grid2 as Grid, IconButton, MenuItem, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import InstitutionSelect from "../../components/forms/InstitutionSelect";
import ResponsiveTable from "../../components/tables/ResponsiveTable";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import { listInstitutions } from "../../services/institutionService";
import { listPartnerGroupEntries, listPartnerGroups } from "../../services/partnerService";
import { getMonthlyReport, MonthlyReport } from "../../services/reportService";
import { calculateWages, exportWages, saveWages } from "../../services/wageService";
import { getErrorMessage } from "../../services/api";
import { Institution } from "../../types/institution";
import { WagePartnerRow, WagePreview } from "../../types/wage";
import { formatInr } from "../../utils/currency";
import { currentMonth, currentYear } from "../../utils/date";
import { downloadBlob, safeFilePart } from "../../utils/download";
import { buildMonthWagesSummaryPdf, buildPartnerWagePdf, collectHeads } from "../../utils/thermalPdf";
import { sendPdfViaWhatsApp } from "../../utils/whatsappShare";

export default function PartnerWagePage() {
  const { isAdmin, user, operatingInstitutionId, setOperatingInstitutionId } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [year, setYear] = useState(currentYear());
  const [month, setMonth] = useState(currentMonth());
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [groupName, setGroupName] = useState("");
  const [preview, setPreview] = useState<WagePreview | null>(null);
  const [monthReport, setMonthReport] = useState<MonthlyReport | null>(null);
  const [busyPartnerId, setBusyPartnerId] = useState<number | null>(null);
  const [exportingSummary, setExportingSummary] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const selectedInstitution = isAdmin ? operatingInstitutionId : user?.institution.id ?? "all";

  const institutionId =
    selectedInstitution === "all" ? institutions[0]?.id : selectedInstitution;

  useEffect(() => {
    listInstitutions().then(setInstitutions).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (institutionId == null) {
      setGroupName("");
      setPreview(null);
      setMonthReport(null);
      return;
    }
    setPreview(null);
    setMonthReport(null);
    let cancelled = false;
    Promise.all([listPartnerGroupEntries(Number(institutionId)), listPartnerGroups()])
      .then(([entries, groups]) => {
        if (cancelled) {
          return;
        }
        const active = entries.filter((row) => row.is_active);
        const profitGroup = groups.find(
          (group) =>
            group.is_active &&
            group.is_profit_sharing &&
            active.some((row) => row.partner_group === group.id),
        );
        setGroupName(profitGroup?.name || active[0]?.group_name || "");
      })
      .catch(() => {
        if (!cancelled) {
          setGroupName("");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [institutionId]);

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
      const [data, report] = await Promise.all([
        calculateWages(params()),
        getMonthlyReport(params()),
      ]);
      setPreview(data);
      setMonthReport(report);
      if (data.group_name) {
        setGroupName(data.group_name);
      }
      notify("Calculated on the server. Confirm before saving.");
    } catch (err) {
      notify(getErrorMessage(err), "error");
    }
  };

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const loadMonthReport = async (branchId: number) => {
    const report =
      monthReport ??
      (await getMonthlyReport({ year, month, institution_id: Number(branchId) }));
    if (!monthReport) {
      setMonthReport(report);
    }
    return report;
  };

  const buildPartnerPdf = async (row: WagePartnerRow) => {
    const branchId = institutionId ?? (selectedInstitution === "all" ? undefined : selectedInstitution);
    if (branchId == null) {
      throw new Error("Select a specific institution.");
    }
    const report = await loadMonthReport(Number(branchId));
    const institution = institutions.find((item) => item.id === Number(branchId)) ?? null;
    const printedBy = user?.full_name || user?.username || "Unknown";
    const printedAt = new Date().toLocaleString("en-IN");
    const pdf = buildPartnerWagePdf({
      institution,
      branchName: institution?.name || "Branch",
      monthLabel,
      partnerName: row.partner_name,
      sharePercent: row.share_percent,
      partnerWage: row.partner_wage_amount,
      sales: collectHeads(report.receipt_heads, report.receipt_head_totals),
      purchases: collectHeads(report.payment_heads, report.payment_head_totals),
      expenses: collectHeads(report.expense_heads, report.expense_head_totals),
      totalSales: report.total_receipt,
      totalPurchase: report.total_payment,
      totalExpense: report.total_expense ?? "0",
      business: report.total_business,
      balance: report.total_balance ?? preview?.total_balance ?? "0",
      printedBy,
      printedAt,
    });
    const filename = `PnL_${safeFilePart(row.partner_name)}_${safeFilePart(monthLabel)}.pdf`;
    const caption = `${institution?.name || "Branch"} — Profit and Loss for ${monthLabel} — ${row.partner_name}`;
    return { pdf, filename, caption };
  };

  const exportPartnerPdf = async (row: WagePartnerRow) => {
    setBusyPartnerId(row.partner_id);
    try {
      const { pdf, filename } = await buildPartnerPdf(row);
      downloadBlob(new Blob([pdf], { type: "application/pdf" }), filename);
    } catch (err) {
      notify(err instanceof Error ? err.message : getErrorMessage(err), "error");
    } finally {
      setBusyPartnerId(null);
    }
  };

  const sendPartnerWhatsApp = async (row: WagePartnerRow) => {
    if (!row.partner_mobile?.trim()) {
      notify("This partner has no WhatsApp number. Add a mobile number on the Partners page.", "error");
      return;
    }
    setBusyPartnerId(row.partner_id);
    try {
      const { pdf, filename, caption } = await buildPartnerPdf(row);
      const result = await sendPdfViaWhatsApp({
        pdf,
        filename,
        caption,
        phone: row.partner_mobile,
      });
      notify(
        result === "shared"
          ? `WhatsApp share opened for ${row.partner_name}.`
          : `PDF downloaded. WhatsApp opened for ${row.partner_name}. Attach the PDF in the chat.`,
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      notify(err instanceof Error ? err.message : getErrorMessage(err), "error");
    } finally {
      setBusyPartnerId(null);
    }
  };

  const exportMonthWagesSummary = async () => {
    if (!preview) {
      notify("Calculate wages first.", "error");
      return;
    }
    const branchId = institutionId ?? (selectedInstitution === "all" ? undefined : selectedInstitution);
    if (branchId == null) {
      notify("Select a specific institution.", "error");
      return;
    }
    setExportingSummary(true);
    try {
      const report = await loadMonthReport(Number(branchId));
      const institution = institutions.find((item) => item.id === Number(branchId)) ?? null;
      const pdf = buildMonthWagesSummaryPdf({
        institution,
        branchName: institution?.name || "Branch",
        monthLabel,
        sales: collectHeads(report.receipt_heads, report.receipt_head_totals),
        purchases: collectHeads(report.payment_heads, report.payment_head_totals),
        expenses: collectHeads(report.expense_heads, report.expense_head_totals),
        totalSales: report.total_receipt,
        totalPurchase: report.total_payment,
        totalExpense: report.total_expense ?? "0",
        business: report.total_business,
        balance: report.total_balance ?? preview.total_balance,
        shareholders: preview.partners.map((row) => ({
          name: row.partner_name,
          sharePercent: row.share_percent,
          wage: row.partner_wage_amount,
        })),
        shareTotal: preview.share_total,
        printedBy: user?.full_name || user?.username || "Unknown",
        printedAt: new Date().toLocaleString("en-IN"),
      });
      const filename = `MonthWages_${safeFilePart(institution?.name || "Branch")}_${safeFilePart(monthLabel)}.pdf`;
      downloadBlob(new Blob([pdf], { type: "application/pdf" }), filename);
    } catch (err) {
      notify(err instanceof Error ? err.message : getErrorMessage(err), "error");
    } finally {
      setExportingSummary(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Monthly Business & Partner Wage"
        subtitle="Shows only partners in this institution’s profit-sharing group. Partner wage is each partner’s share of Balance (sales − expense)."
      />
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
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Group"
                value={groupName || "No group for this institution"}
                InputProps={{ readOnly: true }}
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
            {isAdmin ? (
              <Button
                variant="outlined"
                onClick={() => {
                  const institutionId = selectedInstitution === "all" ? institutions[0]?.id : selectedInstitution;
                  if (institutionId == null) {
                    notify("Select a specific institution to edit group entries.", "error");
                    return;
                  }
                  setOperatingInstitutionId(Number(institutionId));
                  navigate(`/partners/entries?institution=${institutionId}`);
                }}
              >
                Edit group entries
              </Button>
            ) : null}
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
            <Typography>Group: {preview.group_name || groupName || "—"}</Typography>
            <Typography>Total Sales: {formatInr(preview.total_sales)}</Typography>
            <Typography>Total Purchase: {formatInr(preview.total_purchase)}</Typography>
            <Typography>Total Expense: {formatInr(preview.total_expense)}</Typography>
            <Typography>Total Business: {formatInr(preview.total_business)}</Typography>
            <Typography>Balance: {formatInr(preview.total_balance)}</Typography>
            <Typography>Share total: {preview.share_total}%</Typography>
          </Stack>
          <ResponsiveTable
            rows={preview.partners}
            rowKey={(row) => row.partner_id}
            columns={[
              { key: "group_name", label: "Group", render: (row) => row.group_name || "—" },
              { key: "partner_name", label: "Partner" },
              { key: "share_percent", label: "Share %", render: (row) => `${row.share_percent}%` },
              { key: "partner_wage_amount", label: "Partner Wage", align: "right", render: (row) => formatInr(row.partner_wage_amount) },
              {
                key: "pdf",
                label: "PDF",
                render: (row) => (
                  <Tooltip title="Profit and loss PDF">
                    <span>
                      <IconButton
                        size="small"
                        color="primary"
                        disabled={busyPartnerId === row.partner_id}
                        onClick={() => exportPartnerPdf(row)}
                      >
                        <PictureAsPdfIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                ),
              },
              {
                key: "whatsapp",
                label: "WhatsApp",
                render: (row) => (
                  <Tooltip
                    title={
                      row.partner_mobile
                        ? `Send PDF to ${row.partner_mobile}`
                        : "No WhatsApp number for this partner"
                    }
                  >
                    <span>
                      <IconButton
                        size="small"
                        disabled={busyPartnerId === row.partner_id || !row.partner_mobile}
                        onClick={() => sendPartnerWhatsApp(row)}
                        sx={{ color: row.partner_mobile ? "#25D366" : undefined }}
                      >
                        <WhatsAppIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                ),
              },
            ]}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<PictureAsPdfIcon />}
              disabled={exportingSummary}
              onClick={exportMonthWagesSummary}
            >
              {exportingSummary ? "Preparing PDF..." : "Month wages summary"}
            </Button>
          </Stack>
        </>
      ) : null}
      <ConfirmDialog
        open={confirmOpen}
        title="Save partner wages"
        message="The server will recalculate Balance and partner shares, then save. Continue?"
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
            if (saved.group_name) {
              setGroupName(saved.group_name);
            }
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
