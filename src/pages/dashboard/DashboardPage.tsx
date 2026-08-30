import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import BusinessIcon from "@mui/icons-material/Business";
import PaymentsIcon from "@mui/icons-material/Payments";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import StorefrontIcon from "@mui/icons-material/Storefront";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import {
  Box,
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
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageHeader from "../../components/common/PageHeader";
import LoadingState from "../../components/common/LoadingState";
import ResponsiveTable from "../../components/tables/ResponsiveTable";
import BranchMonthDetailDialog from "../../components/reports/BranchMonthDetailDialog";
import { useAuth } from "../../hooks/useAuth";
import { getDashboard, DashboardData } from "../../services/reportService";
import { listInstitutions } from "../../services/institutionService";
import { Institution } from "../../types/institution";
import { formatInr } from "../../utils/currency";
import { currentMonth, currentYear } from "../../utils/date";
import { getErrorMessage } from "../../services/api";

const RECEIPT_COLOR = "#0f766e";
const PAYMENT_COLOR = "#c2410c";
const EXPENSE_COLOR = "#9d174d";
const BUSINESS_COLOR = "#1d4ed8";
const BALANCE_COLOR = "#6d28d9";

export default function DashboardPage() {
  const { user, isAdmin, operatingInstitutionId, setOperatingInstitutionId } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailMonth, setDetailMonth] = useState<{
    institutionId: number;
    branchName: string;
    year: number;
    month: number;
  } | null>(null);

  useEffect(() => {
    listInstitutions()
      .then(setInstitutions)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoading(true);
    getDashboard(isAdmin ? operatingInstitutionId : user?.institution.id)
      .then(setData)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [isAdmin, operatingInstitutionId, user?.institution.id]);

  if (loading) {
    return <LoadingState />;
  }

  const isAllBranches = isAdmin && operatingInstitutionId === "all";
  const todayByBranch = data?.institution_today ?? [];
  const monthlyByBranch = data?.institution_series ?? [];
  const chartData = isAllBranches ? todayByBranch : (data?.daily_series ?? []);
  const chartCategory = isAllBranches ? "name" : "label";
  const todayBusiness = Number(data?.today.business ?? 0);
  const monthBusiness = Number(data?.month.business ?? 0);
  const todayBalance = Number(data?.today.balance ?? 0);
  const monthBalance = Number(data?.month.balance ?? 0);
  const monthlySeries = [...buildMonthlySeries(data)].sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year;
    }
    return b.month - a.month;
  });

  return (
    <Box>
      <PageHeader
        title={isAdmin ? "Admin Dashboard" : "Manager Dashboard"}
        subtitle={isAllBranches ? "All branches — today and this month" : data?.institution.name}
      />
      {isAdmin ? (
        <TextField
          select
          label="Institution"
          sx={{ mb: 2, maxWidth: 360, bgcolor: "white" }}
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
      {error ? <Typography color="error">{error}</Typography> : null}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {isAdmin ? (
          <>
            <Kpi title="Total Institutions" value={String(data?.institutions_total ?? 0)} accent="#0f3d4c" icon={<BusinessIcon />} />
            <Kpi title="Active Institutions" value={String(data?.institutions_active ?? 0)} accent="#0f766e" icon={<StorefrontIcon />} />
          </>
        ) : (
          <Kpi title="My Institution" value={user?.institution.name ?? ""} accent="#0f3d4c" icon={<StorefrontIcon />} />
        )}
        <Kpi title="Today's Sales" value={formatInr(data?.today.receipt)} accent={RECEIPT_COLOR} icon={<AccountBalanceWalletIcon />} />
        <Kpi title="Today's Purchase" value={formatInr(data?.today.payment)} accent={PAYMENT_COLOR} icon={<PaymentsIcon />} />
        <Kpi title="Today's Expense" value={formatInr(data?.today.expense)} accent={EXPENSE_COLOR} icon={<RequestQuoteIcon />} />
        <Kpi
          title="Today's Business"
          value={formatInr(data?.today.business)}
          accent={todayBusiness < 0 ? "#b91c1c" : BUSINESS_COLOR}
          icon={<TrendingUpIcon />}
        />
        <Kpi
          title="Today's Balance"
          value={formatInr(data?.today.balance)}
          accent={todayBalance < 0 ? "#b91c1c" : BALANCE_COLOR}
          icon={<TrendingUpIcon />}
        />
        <Kpi title="Month Sales" value={formatInr(data?.month.receipt)} accent={RECEIPT_COLOR} icon={<AccountBalanceWalletIcon />} />
        <Kpi title="Month Purchase" value={formatInr(data?.month.payment)} accent={PAYMENT_COLOR} icon={<PaymentsIcon />} />
        <Kpi title="Month Expense" value={formatInr(data?.month.expense)} accent={EXPENSE_COLOR} icon={<RequestQuoteIcon />} />
        <Kpi
          title="Month Business"
          value={formatInr(data?.month.business)}
          accent={monthBusiness < 0 ? "#b91c1c" : BUSINESS_COLOR}
          icon={<TrendingUpIcon />}
        />
        <Kpi
          title="Month Balance"
          value={formatInr(data?.month.balance)}
          accent={monthBalance < 0 ? "#b91c1c" : BALANCE_COLOR}
          icon={<TrendingUpIcon />}
        />
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: isAdmin && !isAllBranches ? 7 : 12 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {isAllBranches ? "Today's Sales vs Purchase vs Expense by branch" : "Daily Sales vs Purchase vs Expense"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {isAllBranches
                  ? "Entries posted today across every branch"
                  : "This month — each day of the selected branch"}
              </Typography>
              <Box sx={{ width: "100%", height: { xs: 240, sm: 300, md: 360 } }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey={chartCategory} interval="preserveStartEnd" angle={-35} textAnchor="end" height={70} tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(value) => compactInr(Number(value))} width={48} />
                  <Tooltip formatter={(value) => formatInr(Number(value))} />
                  <Legend />
                  <Bar dataKey="receipt" fill={RECEIPT_COLOR} name="Sales" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="payment" fill={PAYMENT_COLOR} name="Purchase" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expense" fill={EXPENSE_COLOR} name="Expense" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        {isAdmin && !isAllBranches ? (
          <Grid size={{ xs: 12, lg: 5 }}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Institution-wise Business
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Current month business (sales + purchase) by branch
                </Typography>
                <Box sx={{ width: "100%", height: { xs: 280, md: 320 } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyByBranch}
                    layout="vertical"
                    margin={{ left: 8, right: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={(value) => compactInr(Number(value))} />
                    <YAxis type="category" dataKey="name" width={88} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => formatInr(Number(value))} />
                    <Bar dataKey="business" fill={BUSINESS_COLOR} name="Business" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ) : null}
        {isAllBranches ? (
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly summary by branch
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Sales, purchase, expense, business, and balance for the current month. Tap a branch row for day-by-day heads.
                </Typography>
                <ResponsiveTable
                  rows={[
                    ...monthlyByBranch,
                    {
                      id: "total",
                      name: "Total",
                      receipt: monthlyByBranch.reduce((sum, row) => sum + row.receipt, 0),
                      payment: monthlyByBranch.reduce((sum, row) => sum + row.payment, 0),
                      expense: monthlyByBranch.reduce((sum, row) => sum + (row.expense ?? 0), 0),
                      business: monthlyByBranch.reduce((sum, row) => sum + row.business, 0),
                      balance: monthlyByBranch.reduce((sum, row) => sum + (row.balance ?? 0), 0),
                    },
                  ]}
                  rowKey={(row) => row.id ?? row.name}
                  onRowClick={(row) => {
                    if (row.name === "Total" || typeof row.id !== "number") {
                      return;
                    }
                    setDetailMonth({
                      institutionId: row.id,
                      branchName: row.name,
                      year: currentYear(),
                      month: currentMonth(),
                    });
                  }}
                  columns={[
                    { key: "name", label: "Branch" },
                    {
                      key: "receipt",
                      label: "Sales",
                      align: "right",
                      render: (row) => (
                        <Typography component="span" sx={{ color: RECEIPT_COLOR, fontWeight: row.name === "Total" ? 700 : 500 }}>
                          {formatInr(row.receipt)}
                        </Typography>
                      ),
                    },
                    {
                      key: "payment",
                      label: "Purchase",
                      align: "right",
                      render: (row) => (
                        <Typography component="span" sx={{ color: PAYMENT_COLOR, fontWeight: row.name === "Total" ? 700 : 500 }}>
                          {formatInr(row.payment)}
                        </Typography>
                      ),
                    },
                    {
                      key: "expense",
                      label: "Expense",
                      align: "right",
                      render: (row) => (
                        <Typography component="span" sx={{ color: EXPENSE_COLOR, fontWeight: row.name === "Total" ? 700 : 500 }}>
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
                          sx={{ fontWeight: 700, color: (row.balance ?? 0) < 0 ? "#b91c1c" : BALANCE_COLOR }}
                        >
                          {formatInr(row.balance ?? 0)}
                        </Typography>
                      ),
                    },
                  ]}
                />
              </CardContent>
            </Card>
          </Grid>
        ) : null}
        {!isAdmin ? (
          <Grid size={{ xs: 12 }}>
            <Card sx={{ boxShadow: "0 10px 30px rgba(15,61,76,0.08)" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly Business detail
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Business = Sales + Purchase. Balance = Business − Expense. Tap a month for that month’s sales, purchase, and expense heads.
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ overflowX: "auto" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Month</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          Sales
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          Purchase
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          Expense
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          Business
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          Balance
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {monthlySeries.map((row) => (
                        <TableRow
                          key={`${row.year}-${row.month}`}
                          hover
                          onClick={() => {
                            const institutionId = user?.institution.id;
                            if (institutionId == null) {
                              return;
                            }
                            setDetailMonth({
                              institutionId,
                              branchName: user?.institution.name ?? "",
                              year: row.year,
                              month: row.month,
                            });
                          }}
                          sx={{ cursor: "pointer" }}
                        >
                          <TableCell sx={{ fontWeight: 600 }}>{row.label}</TableCell>
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
                            sx={{ fontWeight: 700, color: (row.balance ?? 0) < 0 ? "#b91c1c" : BALANCE_COLOR }}
                          >
                            {formatInr(row.balance ?? 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        ) : null}
      </Grid>
      <BranchMonthDetailDialog
        open={Boolean(detailMonth)}
        branchName={detailMonth?.branchName ?? ""}
        institutionId={detailMonth?.institutionId ?? null}
        year={detailMonth?.year}
        month={detailMonth?.month}
        onClose={() => setDetailMonth(null)}
      />
    </Box>
  );
}

function compactInr(value: number): string {
  if (Math.abs(value) >= 100000) {
    return `${(value / 100000).toFixed(1)}L`;
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(0)}k`;
  }
  return String(value);
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
      balance: isCurrent ? Number(data?.month.balance ?? 0) : 0,
    });
  }
  return rows;
}

function Kpi({
  title,
  value,
  accent,
  icon,
}: {
  title: string;
  value: string;
  accent: string;
  icon: ReactNode;
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
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
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
              }}
            >
              {icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography color="text.secondary" variant="body2">
                {title}
              </Typography>
              <Typography variant="h6" sx={{ wordBreak: "break-word" }}>
                {value}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );
}
