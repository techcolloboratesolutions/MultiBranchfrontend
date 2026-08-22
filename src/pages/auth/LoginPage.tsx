import { Box, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from "@mui/material";
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
      px={2}
      sx={{ background: "linear-gradient(160deg, #0f3d4c 0%, #1b6b7a 55%, #f4f7f8 55%)" }}
    >
      <Card sx={{ width: "100%", maxWidth: 460, boxShadow: 6 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography variant="h5" gutterBottom>
            MultiBranches
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Sign in to manage branch receipts, payments, and partner wages.
          </Typography>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={2}>
              <TextField label="Username" autoComplete="username" {...register("username")} />
              <TextField label="Password" type="password" autoComplete="current-password" {...register("password")} />
              <TextField label="Institution" value={institution} InputProps={{ readOnly: locked }} disabled={!institution} />
              <TextField label="Main Institution" value={mainInstitution} InputProps={{ readOnly: locked }} disabled={!mainInstitution} />
              {role ? (
                <TextField select label="Role" value={role} disabled>
                  <MenuItem value={role}>{role}</MenuItem>
                </TextField>
              ) : null}
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
