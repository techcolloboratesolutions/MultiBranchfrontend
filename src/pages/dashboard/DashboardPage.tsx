import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import BusinessIcon from "@mui/icons-material/Business";
import PaymentsIcon from "@mui/icons-material/Payments";
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
import { getErrorMessage } from "../../services/api";

const RECEIPT_COLOR = "#0f766e";
const PAYMENT_COLOR = "#c2410c";
const BUSINESS_COLOR = "#1d4ed8";

export default function DashboardPage() {
  const { user, isAdmin, operatingInstitutionId, setOperatingInstitutionId } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailBranch, setDetailBranch] = useState<{ id: number; name: string } | null>(null);

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
        <Kpi title="Today's Receipt" value={formatInr(data?.today.receipt)} accent={RECEIPT_COLOR} icon={<AccountBalanceWalletIcon />} />
        <Kpi title="Today's Payment" value={formatInr(data?.today.payment)} accent={PAYMENT_COLOR} icon={<PaymentsIcon />} />
        <Kpi
          title="Today's Business"
          value={formatInr(data?.today.business)}
          accent={todayBusiness < 0 ? "#b91c1c" : BUSINESS_COLOR}
          icon={<TrendingUpIcon />}
        />
        <Kpi title="Month Receipt" value={formatInr(data?.month.receipt)} accent={RECEIPT_COLOR} icon={<AccountBalanceWalletIcon />} />
        <Kpi title="Month Payment" value={formatInr(data?.month.payment)} accent={PAYMENT_COLOR} icon={<PaymentsIcon />} />
        <Kpi
          title="Month Business"
          value={formatInr(data?.month.business)}
          accent={monthBusiness < 0 ? "#b91c1c" : BUSINESS_COLOR}
          icon={<TrendingUpIcon />}
        />
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: isAdmin && !isAllBranches ? 7 : 12 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {isAllBranches ? "Today's Receipt vs Payment by branch" : "Daily Receipt vs Payment"}
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
                  <Bar dataKey="receipt" fill={RECEIPT_COLOR} name="Receipt" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="payment" fill={PAYMENT_COLOR} name="Payment" radius={[6, 6, 0, 0]} />
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
                  Current month net business by branch
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
                  Receipt, payment, and business for the current month. Tap a branch row for day-by-day receipt and payment heads.
                </Typography>
                <ResponsiveTable
                  rows={[
                    ...monthlyByBranch,
                    {
                      id: "total",
                      name: "Total",
                      receipt: monthlyByBranch.reduce((sum, row) => sum + row.receipt, 0),
                      payment: monthlyByBranch.reduce((sum, row) => sum + row.payment, 0),
                      business: monthlyByBranch.reduce((sum, row) => sum + row.business, 0),
                    },
                  ]}
                  rowKey={(row) => row.id ?? row.name}
                  onRowClick={(row) => {
                    if (row.name === "Total" || typeof row.id !== "number") {
                      return;
                    }
                    setDetailBranch({ id: row.id, name: row.name });
                  }}
                  columns={[
                    { key: "name", label: "Branch" },
                    {
                      key: "receipt",
                      label: "Receipt",
                      align: "right",
                      render: (row) => (
                        <Typography component="span" sx={{ color: RECEIPT_COLOR, fontWeight: row.name === "Total" ? 700 : 500 }}>
                          {formatInr(row.receipt)}
                        </Typography>
                      ),
                    },
                    {
                      key: "payment",
                      label: "Payment",
                      align: "right",
                      render: (row) => (
                        <Typography component="span" sx={{ color: PAYMENT_COLOR, fontWeight: row.name === "Total" ? 700 : 500 }}>
                          {formatInr(row.payment)}
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
                  Business = Receipt − Payment for each month
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ overflowX: "auto" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Month</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          Receipt
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          Payment
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          Business
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {monthlySeries.map((row) => (
                        <TableRow key={`${row.year}-${row.month}`} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{row.label}</TableCell>
                          <TableCell align="right" sx={{ color: RECEIPT_COLOR }}>
                            {formatInr(row.receipt)}
                          </TableCell>
                          <TableCell align="right" sx={{ color: PAYMENT_COLOR }}>
                            {formatInr(row.payment)}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ fontWeight: 700, color: row.business < 0 ? "#b91c1c" : BUSINESS_COLOR }}
                          >
                            {formatInr(row.business)}
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
        open={Boolean(detailBranch)}
        branchName={detailBranch?.name ?? ""}
        institutionId={detailBranch?.id ?? null}
        onClose={() => setDetailBranch(null)}
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
      business: isCurrent ? Number(data?.month.business ?? 0) : 0,
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
