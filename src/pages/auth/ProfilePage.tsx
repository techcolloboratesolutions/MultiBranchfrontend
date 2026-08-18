import { Card, CardContent, Stack, Typography } from "@mui/material";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../hooks/useAuth";

export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <>
      <PageHeader title="Profile" />
      <Card>
        <CardContent>
          <Stack spacing={1}>
            <Typography>
              <strong>Name:</strong> {user?.full_name}
            </Typography>
            <Typography>
              <strong>Username:</strong> {user?.username}
            </Typography>
            <Typography>
              <strong>Role:</strong> {user?.role}
            </Typography>
            <Typography>
              <strong>Institution:</strong> {user?.institution.name}
            </Typography>
            <Typography>
              <strong>Main Institution:</strong> {user?.main_institution.name}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}
