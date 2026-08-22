import { Avatar, Card, CardContent, Chip, Divider, Stack, Typography } from "@mui/material";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../hooks/useAuth";

export default function ProfilePage() {
  const { user } = useAuth();
  const initials = (user?.full_name || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const rows = [
    ["Name", user?.full_name],
    ["Username", user?.username],
    ["Email", user?.email],
    ["Role", user?.role],
    ["Institution", user?.institution.name],
    ["Main Institution", user?.main_institution.name],
  ];

  return (
    <>
      <PageHeader title="Profile" subtitle="Your account and branch assignment." />
      <Card sx={{ maxWidth: 640 }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2.5 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main", fontSize: 22 }}>{initials}</Avatar>
            <Stack spacing={0.5}>
              <Typography variant="h6">{user?.full_name}</Typography>
              <Chip size="small" label={user?.role} color="primary" sx={{ width: "fit-content", fontWeight: 700 }} />
            </Stack>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={1.75}>
            {rows.map(([label, value]) => (
              <Stack key={label} direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.25, sm: 2 }}>
                <Typography color="text.secondary" sx={{ width: { sm: 180 }, flexShrink: 0 }}>
                  {label}
                </Typography>
                <Typography fontWeight={600}>{value || "—"}</Typography>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}
