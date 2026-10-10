import {
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import LoadingState from "../common/LoadingState";
import { getErrorMessage } from "../../services/api";
import { getDayByInstitutionReport } from "../../services/reportService";
import { formatDisplayDate } from "../../utils/date";
import BusinessChart from "../charts/BusinessChart";

interface Props {
  open: boolean;
  businessDate: string | null;
  onClose: () => void;
}

export default function BranchDayChartDialog({ open, businessDate, onClose }: Props) {
  const [rows, setRows] = useState<Array<Record<string, string | number>>>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !businessDate) {
      return;
    }
    setLoading(true);
    setError("");
    getDayByInstitutionReport(businessDate)
      .then((report) => {
        setRows(
          report.rows.map((row) => ({
            name: row.institution_name,
            receipt: Number(row.receipt),
            payment: Number(row.payment),
            expense: Number(row.expense),
          })),
        );
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [open, businessDate]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        All branches
        <Typography variant="body2" color="text.secondary">
          Sales, purchase, and expense on {businessDate ? formatDisplayDate(businessDate) : ""}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? <LoadingState /> : null}
        {error ? <Typography color="error">{error}</Typography> : null}
        {!loading && !error ? (
          <BusinessChart data={rows} categoryKey="name" horizontal />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
