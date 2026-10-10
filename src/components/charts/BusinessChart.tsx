import { Box, Paper, Stack, Typography } from "@mui/material";
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
import { formatInr } from "../../utils/currency";

const RECEIPT_COLOR = "#0f766e";
const PAYMENT_COLOR = "#c2410c";
const EXPENSE_COLOR = "#9d174d";

export type ChartPoint = {
  [key: string]: string | number | undefined;
  date?: string;
  label?: string;
  name?: string;
};

interface Props {
  data: object[];
  categoryKey: string;
  horizontal?: boolean;
  onPointClick?: (point: ChartPoint) => void;
}

export default function BusinessChart({ data, categoryKey, horizontal = false, onPointClick }: Props) {
  const height = horizontal ? Math.max(340, data.length * 56) : 400;
  const handleClick = onPointClick
    ? (entry: ChartPoint & { payload?: ChartPoint }) => {
        onPointClick(entry.payload ?? entry);
      }
    : undefined;
  const barRadius: [number, number, number, number] = horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0];
  const barSize = horizontal ? 14 : 22;
  const bars = [
    <Bar
      key="receipt"
      dataKey="receipt"
      fill={RECEIPT_COLOR}
      name="Sales"
      radius={barRadius}
      maxBarSize={barSize}
      cursor={onPointClick ? "pointer" : undefined}
      onClick={handleClick}
    />,
    <Bar
      key="payment"
      dataKey="payment"
      fill={PAYMENT_COLOR}
      name="Purchase"
      radius={barRadius}
      maxBarSize={barSize}
      cursor={onPointClick ? "pointer" : undefined}
      onClick={handleClick}
    />,
    <Bar
      key="expense"
      dataKey="expense"
      fill={EXPENSE_COLOR}
      name="Expense"
      radius={barRadius}
      maxBarSize={barSize}
      cursor={onPointClick ? "pointer" : undefined}
      onClick={handleClick}
    />,
  ];
  return (
    <Box
      sx={{
        width: "100%",
        height,
        bgcolor: "#f7fbfc",
        border: "1px solid #e2eef1",
        borderRadius: 2,
        px: { xs: 0.5, sm: 1.5 },
        py: 1.5,
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        {horizontal ? (
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 28, left: 8, bottom: 8 }} barGap={3} barCategoryGap="32%">
            <CartesianGrid stroke="#d5e3e8" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickFormatter={(value) => compactInr(Number(value))} tick={{ fill: "#5b6d73", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey={categoryKey} width={132} tick={{ fill: "#12262c", fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <Tooltip content={<MoneyTooltip />} cursor={{ fill: "rgba(15,76,92,0.06)" }} />
            <Legend wrapperStyle={{ paddingTop: 12 }} />
            {bars}
          </BarChart>
        ) : (
          <BarChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 4 }} barGap={2} barCategoryGap="20%">
            <CartesianGrid stroke="#d5e3e8" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey={categoryKey}
              interval={0}
              angle={data.length > 10 ? -40 : 0}
              textAnchor={data.length > 10 ? "end" : "middle"}
              height={data.length > 10 ? 74 : 36}
              tick={{ fill: "#12262c", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tickFormatter={(value) => compactInr(Number(value))} width={56} tick={{ fill: "#5b6d73", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<MoneyTooltip />} cursor={{ fill: "rgba(15,76,92,0.06)" }} />
            <Legend wrapperStyle={{ paddingTop: 8 }} />
            {bars}
          </BarChart>
        )}
      </ResponsiveContainer>
    </Box>
  );
}

function MoneyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }
  return (
    <Paper elevation={4} sx={{ px: 1.5, py: 1.25, minWidth: 190 }}>
      <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
        {label}
      </Typography>
      <Stack spacing={0.35}>
        {payload.map((item) => (
          <Stack key={item.name} direction="row" justifyContent="space-between" spacing={2}>
            <Typography variant="body2" sx={{ color: item.color, fontWeight: 700 }}>
              {item.name}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatInr(item.value)}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
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
