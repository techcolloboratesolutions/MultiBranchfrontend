import {
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import LoadingState from "../common/LoadingState";
import ResponsiveTable from "../tables/ResponsiveTable";
import { getErrorMessage } from "../../services/api";
import { DashboardData, getDashboard } from "../../services/reportService";
import { formatInr, monthTotalProfit } from "../../utils/currency";

const RECEIPT_COLOR = "#0f766e";
const PAYMENT_COLOR = "#c2410c";
const EXPENSE_COLOR = "#9d174d";
const BUSINESS_COLOR = "#1d4ed8";
const BALANCE_COLOR = "#6d28d9";

type BranchRow = NonNullable<DashboardData["institution_series"]>[number];

interface Props {
  open: boolean;
  year: number;
  month: number;
  label: string;
  onClose: () => void;
  onBranchClick: (row: BranchRow) => void;
}

export default function InstitutionMonthBusinessDialog({
  open,
  year,
  month,
  label,
  onClose,
  onBranchClick,
}: Props) {
  const [rows, setRows] = useState<BranchRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    getDashboard("all", year, month)
      .then((data) => {
        if (!cancelled) {
          setRows(data.institution_series ?? []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setRows([]);
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
  }, [open, year, month]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        Institution-wise Business
        <Typography variant="body2" color="text.secondary">
          {label}. Business = Sales + Purchase. Balance = Business − Purchase − Expense. Click a branch for that month’s heads.
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? <LoadingState /> : null}
        {error ? <Typography color="error">{error}</Typography> : null}
        {!loading && !error ? (
          <ResponsiveTable
            rows={rows}
            rowKey={(row) => row.id ?? row.name}
            onRowClick={(row) => onBranchClick(row)}
            columns={[
              { key: "name", label: "Branch" },
              {
                key: "receipt",
                label: "Sales",
                align: "right",
                render: (row) => (
                  <Typography component="span" sx={{ color: RECEIPT_COLOR }}>
                    {formatInr(row.receipt)}
                  </Typography>
                ),
              },
              {
                key: "payment",
                label: "Purchase",
                align: "right",
                render: (row) => (
                  <Typography component="span" sx={{ color: PAYMENT_COLOR }}>
                    {formatInr(row.payment)}
                  </Typography>
                ),
              },
              {
                key: "expense",
                label: "Expense",
                align: "right",
                render: (row) => (
                  <Typography component="span" sx={{ color: EXPENSE_COLOR }}>
                    {formatInr(row.expense ?? 0)}
                  </Typography>
                ),
              },
              {
                key: "business",
                label: "Business",
                align: "right",
                render: (row) => (
                  <Typography component="span" sx={{ fontWeight: 700, color: row.business < 0 ? "#b91c1c" : BUSINESS_COLOR }}>
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
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
