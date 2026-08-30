import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import { Box, Button, Card, CardContent, Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { lookupUser } from "../../services/authService";
import { getErrorMessage } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { LoginRequest } from "../../types/auth";

export default function LoginPage() {
  const { register, handleSubmit, watch } = useForm<LoginRequest>({
    defaultValues: { username: "", password: "" },
  });
  const [institution, setInstitution] = useState("");
  const [mainInstitution, setMainInstitution] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const username = watch("username");

  const clearLookup = () => {
    setInstitution("");
    setMainInstitution("");
    setRole("");
  };

  const runLookup = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      clearLookup();
      setError("");
      return;
    }
    try {
      const user = await lookupUser(trimmed);
      setInstitution(user.institution?.name ?? "");
      setMainInstitution(user.main_institution?.name ?? "");
      setRole(user.role ?? "");
      setError("");
    } catch (err) {
      clearLookup();
      setError(getErrorMessage(err, "User not found."));
    }
  };

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void runLookup(username);
    }, 400);
    return () => window.clearTimeout(handle);
  }, [username]);

  const onSubmit = async (values: LoginRequest) => {
    setLoading(true);
    setError("");
    try {
      await login(values);
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err, "Invalid username or password."));
    } finally {
      setLoading(false);
    }
  };

  const locked = role === "MANAGER";

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={{ xs: 2, sm: 3 }}
      py={4}
      sx={{
        background:
          "radial-gradient(900px 420px at 15% 10%, rgba(212,160,23,0.22), transparent), linear-gradient(165deg, #0c3a46 0%, #156575 48%, #eef4f6 48%)",
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 480, borderRadius: 4, overflow: "hidden" }}>
        <Box sx={{ height: 8, bgcolor: "secondary.main" }} />
        <CardContent sx={{ p: { xs: 3, sm: 4.5 } }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.5,
                bgcolor: "primary.main",
                color: "white",
                display: "grid",
                placeItems: "center",
              }}
            >
              <AccountBalanceIcon />
            </Box>
            <Box>
              <Typography variant="h5">BJF Bay</Typography>
              <Typography color="text.secondary" variant="body2">
                Sign in to your branch workspace
              </Typography>
            </Box>
          </Stack>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={2}>
              <TextField label="Username" autoComplete="username" {...register("username")} />
              <TextField label="Password" type="password" autoComplete="current-password" {...register("password")} />
              <TextField label="Institution" value={institution} InputProps={{ readOnly: locked }} disabled={!institution} />
              <TextField label="Main Institution" value={mainInstitution} InputProps={{ readOnly: locked }} disabled={!mainInstitution} />
              {role ? <Chip label={role} color="primary" sx={{ alignSelf: "flex-start", fontWeight: 700 }} /> : null}
              {error ? (
                <Typography color="error" variant="body2">
                  {error}
                </Typography>
              ) : null}
              <Button type="submit" variant="contained" disabled={loading} size="large">
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
