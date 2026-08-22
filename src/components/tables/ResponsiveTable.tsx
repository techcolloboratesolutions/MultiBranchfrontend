import { Box, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useMediaQuery, useTheme } from "@mui/material";
import { ReactNode } from "react";

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  align?: "left" | "right";
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
}

export default function ResponsiveTable<T>({ columns, rows, rowKey, onRowClick }: Props<T>) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));

  if (isPhone) {
    if (rows.length === 0) {
      return (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography color="text.secondary">No records found.</Typography>
        </Paper>
      );
    }
    return (
      <Stack spacing={1.5}>
        {rows.map((row) => (
          <Paper
            key={rowKey(row)}
            sx={{ p: 2, cursor: onRowClick ? "pointer" : "default" }}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            <Stack spacing={1.25}>
              {columns.map((column) => (
                <Stack key={column.key} direction="row" spacing={2} justifyContent="space-between" alignItems="flex-start">
                  <Typography variant="caption" color="text.secondary" sx={{ pt: 0.3, flexShrink: 0 }}>
                    {column.label}
                  </Typography>
                  <Box sx={{ textAlign: "right", minWidth: 0 }}>
                    {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? "")}
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Paper>
        ))}
      </Stack>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ overflowX: "auto", borderRadius: 3 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.key} align={column.align} sx={{ fontWeight: 700, whiteSpace: "nowrap", bgcolor: "rgba(15,76,92,0.04)" }}>
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length}>No records found.</TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={rowKey(row)}
                hover
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                sx={onRowClick ? { cursor: "pointer" } : undefined}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} align={column.align} sx={{ whiteSpace: "nowrap" }}>
                    {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
