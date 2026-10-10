import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PaymentsIcon from "@mui/icons-material/Payments";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import StorefrontIcon from "@mui/icons-material/Storefront";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid2 as Grid,
  MenuItem,
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
import { ReactNode, useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import LoadingState from "../../components/common/LoadingState";
import BusinessChart from "../../components/charts/BusinessChart";
import ResponsiveTable from "../../components/tables/ResponsiveTable";
import BranchDayChartDialog from "../../components/reports/BranchDayChartDialog";
import BranchMonthDetailDialog from "../../components/reports/BranchMonthDetailDialog";
import BranchMonthHeadsDialog from "../../components/reports/BranchMonthHeadsDialog";
import InstitutionMonthBusinessDialog from "../../components/reports/InstitutionMonthBusinessDialog";
import { useAuth } from "../../hooks/useAuth";
import { getBranchWindow, getDashboard, BranchWindowDay, DashboardData } from "../../services/reportService";
import { listInstitutions } from "../../services/institutionService";
import { Institution } from "../../types/institution";
import { formatInr, monthTotalProfit } from "../../utils/currency";
import { currentMonth, currentYear, formatDisplayDate, monthDayWindow } from "../../utils/date";
import { getErrorMessage } from "../../services/api";

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const RECEIPT_COLOR = "#0f766e";
const PAYMENT_COLOR = "#c2410c";
const EXPENSE_COLOR = "#9d174d";
const BUSINESS_COLOR = "#1d4ed8";
const BALANCE_COLOR = "#6d28d9";
const YEAR_OPTIONS = [0, 1, 2, 3, 4, 5].map((offset) => currentYear() - offset);
const FORMULA_NOTE = "Business = Sales + Purchase. Balance = Business − Purchase − Expense.";

export default function DashboardPage() {
  const { user, isAdmin, isChiefManager, canViewAllBranches, operatingInstitutionId, setOperatingInstitutionId } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(currentYear());
  const [month, setMonth] = useState(currentMonth());
  const [dayPage, setDayPage] = useState(0);
  const [headsMonth, setHeadsMonth] = useState<{
    institutionId: number;
    branchName: string;
    year: number;
    month: number;
  } | null>(null);
  const [detailMonth, setDetailMonth] = useState<{
    institutionId: number;
    branchName: string;
    year: number;
    month: number;
  } | null>(null);
  const [windowDays, setWindowDays] = useState<BranchWindowDay[]>([]);
  const [windowError, setWindowError] = useState("");
  const [branchDay, setBranchDay] = useState<string | null>(null);
  const [institutionMonth, setInstitutionMonth] = useState<{ year: number; month: number; label: string } | null>(null);

  useEffect(() => {
    listInstitutions()
      .then(setInstitutions)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!data) {
      setLoading(true);
    }
    getDashboard(canViewAllBranches ? operatingInstitutionId : user?.institution.id, year, month)
      .then((next) => {
        if (!cancelled) {
          setData(next);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [canViewAllBranches, operatingInstitutionId, user?.institution.id, year, month]);

  useEffect(() => {
    setDayPage(0);
  }, [year, month]);

  const chartWindow = monthDayWindow(year, month, dayPage);

  useEffect(() => {
    if (!canViewAllBranches) {
      return;
    }
    let cancelled = false;
    getBranchWindow(chartWindow.start, chartWindow.end)
      .then((window) => {
        if (!cancelled) {
          setWindowDays(window.days);
          setWindowError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setWindowError(getErrorMessage(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [canViewAllBranches, chartWindow.start, chartWindow.end]);

  if (loading && !data) {
    return <LoadingState />;
  }

  const isAllBranches = canViewAllBranches && operatingInstitutionId === "all";
  const monthLabel = `${MONTH_LABELS[month - 1]} ${year}`;
  const monthlyByBranch = data?.institution_series ?? [];
  const chartData = data?.daily_series ?? [];
  const chartCategory = "label";
  const weekBusiness = Number(data?.week?.business ?? 0);
  const monthBusiness = Number(data?.month.business ?? 0);
  const monthBalance = monthTotalProfit(data?.month.business, data?.month.payment, data?.month.expense);
  const monthlySeries = [...buildMonthlySeries(data)].sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year;
    }
    return b.month - a.month;
  });

  return (
    <Box>
      <PageHeader
        title={isAdmin ? "Admin Dashboard" : isChiefManager ? "Chief Manager Dashboard" : "Manager Dashboard"}
        subtitle={
          isAllBranches
            ? `All branches — ${monthLabel}`
            : `${data?.institution.name ?? ""} — ${monthLabel}`
        }
      />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2, maxWidth: 720 }}>
        {canViewAllBranches ? (
          <TextField
            select
            label="Institution"
            sx={{ bgcolor: "white", minWidth: 220 }}
            value={String(operatingInstitutionId)}
            onChange={(event) => setOperatingInstitutionId(event.target.value === "all" ? "all" : Number(event.target.value))}
          >
            <MenuItem value="all">ALL</MenuItem>
            {institutions.map((institution) => (
              <MenuItem key={institution.id} value={institution.id}>
                {institution.name}
              </MenuItem>
            ))}
          </TextField>
        ) : null}
        <TextField
          select
          label="Month"
          sx={{ bgcolor: "white", minWidth: 160 }}
          value={month}
          onChange={(event) => setMonth(Number(event.target.value))}
        >
          {MONTH_LABELS.map((label, index) => (
            <MenuItem key={label} value={index + 1}>
              {label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Year"
          sx={{ bgcolor: "white", minWidth: 120 }}
          value={year}
          onChange={(event) => setYear(Number(event.target.value))}
        >
          {YEAR_OPTIONS.map((value) => (
            <MenuItem key={value} value={value}>
              {value}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      {error ? <Typography color="error">{error}</Typography> : null}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {canViewAllBranches ? (
          <Kpi title="Active Institutions" value={String(data?.institutions_active ?? 0)} accent="#0f766e" icon={<StorefrontIcon />} />
        ) : (
          <Kpi title="My Institution" value={user?.institution.name ?? ""} accent="#0f3d4c" icon={<StorefrontIcon />} />
        )}
        <Kpi amount title="Weekly Sales" value={formatInr(data?.week?.receipt)} accent={RECEIPT_COLOR} icon={<AccountBalanceWalletIcon />} />
        <Kpi amount title="Weekly Purchase" value={formatInr(data?.week?.payment)} accent={PAYMENT_COLOR} icon={<PaymentsIcon />} />
        <Kpi
          amount
          title="Weekly Business"
          value={formatInr(data?.week?.business)}
          accent={weekBusiness < 0 ? "#b91c1c" : BUSINESS_COLOR}
          icon={<TrendingUpIcon />}
        />
        <Kpi amount title="Weekly Expense" value={formatInr(data?.week?.expense)} accent={EXPENSE_COLOR} icon={<RequestQuoteIcon />} />
        <Kpi amount title={`${monthLabel} Sales`} value={formatInr(data?.month.receipt)} accent={RECEIPT_COLOR} icon={<AccountBalanceWalletIcon />} />
        <Kpi amount title={`${monthLabel} Purchase`} value={formatInr(data?.month.payment)} accent={PAYMENT_COLOR} icon={<PaymentsIcon />} />
        <Kpi amount title={`${monthLabel} Expense`} value={formatInr(data?.month.expense)} accent={EXPENSE_COLOR} icon={<RequestQuoteIcon />} />
        <Kpi
          amount
          title={`${monthLabel} Business`}
          value={formatInr(data?.month.business)}
          accent={monthBusiness < 0 ? "#b91c1c" : BUSINESS_COLOR}
          icon={<TrendingUpIcon />}
        />
        <Kpi
          amount
          title={`${monthLabel} Balance`}
          value={formatInr(monthBalance)}
          accent={monthBalance < 0 ? "#b91c1c" : BALANCE_COLOR}
          icon={<TrendingUpIcon />}
        />
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} justifyContent="space-between" sx={{ mb: 1 }}>
                <Box>
                  <Typography variant="h6">
                    {canViewAllBranches
                      ? "Sales vs Purchase vs Expense — all branches"
                      : `Daily Sales vs Purchase vs Expense — ${monthLabel}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {canViewAllBranches
                      ? `${formatDisplayDate(chartWindow.start)} – ${formatDisplayDate(chartWindow.end)} of ${monthLabel}. Combined totals. Click a day for every branch.`
                      : `Each day of ${monthLabel} for the selected branch`}
                  </Typography>
                </Box>
                {canViewAllBranches ? (
                  <Stack direction="row" spacing={1}>
                    <Button variant="outlined" disabled={dayPage === 0} onClick={() => setDayPage((current) => Math.max(0, current - 1))}>
                      Previous 15 days
                    </Button>
                    <Button variant="contained" disabled={!chartWindow.hasNext} onClick={() => setDayPage((current) => current + 1)}>
                      Next 15 days
                    </Button>
                  </Stack>
                ) : null}
              </Stack>
              {canViewAllBranches && windowError ? <Typography color="error" sx={{ mb: 1 }}>{windowError}</Typography> : null}
              <BusinessChart
                data={canViewAllBranches ? windowDays : chartData}
                categoryKey={canViewAllBranches ? "label" : chartCategory}
                horizontal={false}
                onPointClick={
                  canViewAllBranches
                    ? (point) => {
                        if (typeof point.date === "string") {
                          setBranchDay(point.date);
                        }
                      }
                    : undefined
                }
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Card sx={{ boxShadow: "0 10px 30px rgba(15,61,76,0.08)" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Business detail
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {FORMULA_NOTE}
                {canViewAllBranches
                  ? " Click a month to see institution-wise business for that month."
                  : " Tap a month for that month’s sales, purchase, and expense heads."}
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f4f8f9" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Month</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: RECEIPT_COLOR }}>
                        Sales
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: PAYMENT_COLOR }}>
                        Purchase
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: EXPENSE_COLOR }}>
                        Expense
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: BUSINESS_COLOR }}>
                        Business
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: BALANCE_COLOR }}>
                        Balance
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {monthlySeries.map((row) => {
                      const balance = monthTotalProfit(row.business, row.payment, row.expense);
                      const selected = row.year === year && row.month === month;
                      const detailInstitutionId = isAllBranches
                        ? null
                        : canViewAllBranches
                          ? operatingInstitutionId
                          : user?.institution.id;
                      return (
                        <TableRow
                          key={`${row.year}-${row.month}`}
                          hover
                          onClick={() => {
                            if (canViewAllBranches) {
                              setInstitutionMonth({ year: row.year, month: row.month, label: row.label });
                              return;
                            }
                            if (typeof detailInstitutionId !== "number") {
                              return;
                            }
                            setDetailMonth({
                              institutionId: detailInstitutionId,
                              branchName: data?.institution.name ?? user?.institution.name ?? "",
                              year: row.year,
                              month: row.month,
                            });
                          }}
                          sx={{
                            cursor: canViewAllBranches || typeof detailInstitutionId === "number" ? "pointer" : "default",
                            bgcolor: selected ? "rgba(15,76,92,0.08)" : undefined,
                          }}
                        >
                          <TableCell sx={{ fontWeight: selected ? 800 : 600 }}>{row.label}</TableCell>
                          <TableCell align="right" sx={{ color: RECEIPT_COLOR }}>
                            {formatInr(row.receipt)}
                          </TableCell>
                          <TableCell align="right" sx={{ color: PAYMENT_COLOR }}>
                            {formatInr(row.payment)}
                          </TableCell>
                          <TableCell align="right" sx={{ color: EXPENSE_COLOR }}>
                            {formatInr(row.expense ?? 0)}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ fontWeight: 700, color: row.business < 0 ? "#b91c1c" : BUSINESS_COLOR }}
                          >
                            {formatInr(row.business)}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ fontWeight: 700, color: balance < 0 ? "#b91c1c" : BALANCE_COLOR }}
                          >
                            {formatInr(balance)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        {isAllBranches ? (
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly summary by branch
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {FORMULA_NOTE} Figures for {monthLabel}. Tap a branch row for day-by-day heads.
                </Typography>
                <ResponsiveTable
                  rows={[
                    ...monthlyByBranch,
                    {
                      id: "total",
                      name: "Monthly sum",
                      receipt: monthlyByBranch.reduce((sum, row) => sum + row.receipt, 0),
                      payment: monthlyByBranch.reduce((sum, row) => sum + row.payment, 0),
                      expense: monthlyByBranch.reduce((sum, row) => sum + (row.expense ?? 0), 0),
                      business: monthlyByBranch.reduce((sum, row) => sum + row.business, 0),
                      balance: monthTotalProfit(
                        monthlyByBranch.reduce((sum, row) => sum + row.business, 0),
                        monthlyByBranch.reduce((sum, row) => sum + row.payment, 0),
                        monthlyByBranch.reduce((sum, row) => sum + (row.expense ?? 0), 0),
                      ),
                    },
                  ]}
                  rowKey={(row) => row.id ?? row.name}
                  onRowClick={(row) => {
                    if (row.name === "Monthly sum" || typeof row.id !== "number") {
                      return;
                    }
                    setDetailMonth({
                      institutionId: row.id,
                      branchName: row.name,
                      year,
                      month,
                    });
                  }}
                  columns={[
                    { key: "name", label: "Branch" },
                    {
                      key: "receipt",
                      label: "Sales",
                      align: "right",
                      render: (row) => (
                        <Typography component="span" sx={{ color: RECEIPT_COLOR, fontWeight: row.name === "Monthly sum" ? 700 : 500 }}>
                          {formatInr(row.receipt)}
                        </Typography>
                      ),
                    },
                    {
                      key: "payment",
                      label: "Purchase",
                      align: "right",
                      render: (row) => (
                        <Typography component="span" sx={{ color: PAYMENT_COLOR, fontWeight: row.name === "Monthly sum" ? 700 : 500 }}>
                          {formatInr(row.payment)}
                        </Typography>
                      ),
                    },
                    {
                      key: "expense",
                      label: "Expense",
                      align: "right",
                      render: (row) => (
                        <Typography component="span" sx={{ color: EXPENSE_COLOR, fontWeight: row.name === "Monthly sum" ? 700 : 500 }}>
                          {formatInr(row.expense ?? 0)}
                        </Typography>
                      ),
                    },
                    {
                      key: "business",
                      label: "Business",
                      align: "right",
                      render: (row) => (
                        <Typography
                          component="span"
                          sx={{ fontWeight: 700, color: row.business < 0 ? "#b91c1c" : BUSINESS_COLOR }}
                        >
                          {formatInr(row.business)}
                        </Typography>
                      ),
                    },
                    {
                      key: "balance",
                      label: "Balance",
                      align: "right",
                      render: (row) => (
                        <Typography
                          component="span"
                          sx={{ fontWeight: 700, color: monthTotalProfit(row.business, row.payment, row.expense) < 0 ? "#b91c1c" : BALANCE_COLOR }}
                        >
                          {formatInr(monthTotalProfit(row.business, row.payment, row.expense))}
                        </Typography>
                      ),
                    },
                  ]}
                />
              </CardContent>
            </Card>
          </Grid>
        ) : null}
      </Grid>
      <BranchMonthHeadsDialog
        open={Boolean(headsMonth)}
        branchName={headsMonth?.branchName ?? ""}
        institutionId={headsMonth?.institutionId ?? null}
        year={headsMonth?.year}
        month={headsMonth?.month}
        onClose={() => setHeadsMonth(null)}
      />
      <BranchMonthDetailDialog
        open={Boolean(detailMonth)}
        branchName={detailMonth?.branchName ?? ""}
        institutionId={detailMonth?.institutionId ?? null}
        year={detailMonth?.year}
        month={detailMonth?.month}
        onClose={() => setDetailMonth(null)}
      />
      <BranchDayChartDialog open={Boolean(branchDay)} businessDate={branchDay} onClose={() => setBranchDay(null)} />
      <InstitutionMonthBusinessDialog
        open={Boolean(institutionMonth)}
        year={institutionMonth?.year ?? year}
        month={institutionMonth?.month ?? month}
        label={institutionMonth?.label ?? monthLabel}
        onClose={() => setInstitutionMonth(null)}
        onBranchClick={(row) => {
          if (typeof row.id !== "number" || !institutionMonth) {
            return;
          }
          setHeadsMonth({
            institutionId: row.id,
            branchName: row.name,
            year: institutionMonth.year,
            month: institutionMonth.month,
          });
        }}
      />
    </Box>
  );
}

function buildMonthlySeries(data: DashboardData | null) {
  if (data?.monthly_series && data.monthly_series.length > 0) {
    return data.monthly_series;
  }
  const now = new Date();
  const rows = [];
  for (let offset = 11; offset >= 0; offset -= 1) {
    const point = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const isCurrent = offset === 0;
    rows.push({
      label: point.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
      year: point.getFullYear(),
      month: point.getMonth() + 1,
      receipt: isCurrent ? Number(data?.month.receipt ?? 0) : 0,
      payment: isCurrent ? Number(data?.month.payment ?? 0) : 0,
      expense: isCurrent ? Number(data?.month.expense ?? 0) : 0,
      business: isCurrent ? Number(data?.month.business ?? 0) : 0,
      balance: isCurrent
        ? monthTotalProfit(data?.month.business, data?.month.payment, data?.month.expense)
        : 0,
    });
  }
  return rows;
}

function Kpi({
  title,
  value,
  accent,
  icon,
  amount = false,
}: {
  title: string;
  value: string;
  accent: string;
  icon: ReactNode;
  amount?: boolean;
}) {
  return (
    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
      <Card
        sx={{
          overflow: "hidden",
          borderTop: `4px solid ${accent}`,
          height: "100%",
        }}
      >
        <CardContent>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: `${accent}18`,
                color: accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                {title}
              </Typography>
              <Typography
                sx={
                  amount
                    ? {
                        mt: 0.35,
                        fontWeight: 800,
                        fontSize: { xs: "1.2rem", sm: "1.35rem" },
                        lineHeight: 1.2,
                        letterSpacing: "-0.02em",
                        fontVariantNumeric: "tabular-nums",
                        color: "#12262c",
                        whiteSpace: "nowrap",
                      }
                    : { wordBreak: "break-word" }
                }
                variant={amount ? undefined : "h6"}
              >
                {value}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );
}
