import { Typography } from "@mui/material";

export default function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <>
      <Typography variant="h5" component="h1" gutterBottom>
        {title}
      </Typography>
      {subtitle ? (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {subtitle}
        </Typography>
      ) : null}
    </>
  );
}
