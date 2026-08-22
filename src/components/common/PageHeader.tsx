import { Box, Stack, Typography } from "@mui/material";

export default function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Box sx={{ mb: { xs: 2, md: 3 } }}>
      <Typography
        variant="h5"
        component="h1"
        sx={{ fontSize: { xs: "1.35rem", sm: "1.6rem", md: "1.85rem" }, lineHeight: 1.2 }}
      >
        {title}
      </Typography>
      {subtitle ? (
        <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 720 }}>
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}
