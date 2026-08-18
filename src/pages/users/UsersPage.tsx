import { Button, Card, CardContent, Grid, MenuItem, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import PageHeader from "../../components/common/PageHeader";
import ResponsiveTable from "../../components/tables/ResponsiveTable";
import { useToast } from "../../context/ToastContext";
import { listInstitutions } from "../../services/institutionService";
import { createUser, listRoles, listUsers, updateUser } from "../../services/userService";
import { getErrorMessage } from "../../services/api";
import { AppUser, Institution, Role } from "../../types/institution";

export default function UsersPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { username: "", full_name: "", email: "", institution: "", role: "", password: "" },
  });
  const load = () => listUsers().then(setRows);

  useEffect(() => {
    Promise.all([load(), listRoles(), listInstitutions()])
      .then(([, nextRoles, nextInstitutions]) => {
        setRoles(nextRoles);
        setInstitutions(nextInstitutions);
      })
      .catch((err) => notify(getErrorMessage(err), "error"));
  }, []);

  return (
    <>
      <PageHeader title="Users" />
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <form
            onSubmit={handleSubmit(async (values) => {
              try {
                const payload = {
                  username: values.username,
                  full_name: values.full_name,
                  email: values.email,
                  institution: Number(values.institution),
                  role: Number(values.role),
                  password: values.password || undefined,
                };
                if (editing) await updateUser(editing.id, payload);
                else await createUser(payload);
                notify("Saved.");
                setEditing(null);
                reset({ username: "", full_name: "", email: "", institution: "", role: "", password: "" });
                await load();
              } catch (err) {
                notify(getErrorMessage(err), "error");
              }
            })}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}><TextField label="Username" {...register("username")} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField label="Full name" {...register("full_name")} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField label="Email" {...register("email")} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField label="Password" type="password" {...register("password")} helperText={editing ? "Leave blank to keep" : ""} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField select label="Institution" defaultValue="" {...register("institution")}>
                  {institutions.map((institution) => <MenuItem key={institution.id} value={institution.id}>{institution.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField select label="Role" defaultValue="" {...register("role")}>
                  {roles.map((role) => <MenuItem key={role.id} value={role.id}>{role.role_code}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack direction="row" spacing={1}>
                  <Button type="submit" variant="contained">Save</Button>
                  <Button type="button" onClick={() => { setEditing(null); reset({ username: "", full_name: "", email: "", institution: "", role: "", password: "" }); }}>Clear</Button>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
      <ResponsiveTable
        rows={rows}
        rowKey={(row) => row.id}
        columns={[
          { key: "username", label: "Username" },
          { key: "full_name", label: "Name" },
          { key: "institution_name", label: "Institution" },
          { key: "role_code", label: "Role" },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <Button size="small" onClick={() => {
                setEditing(row);
                reset({ username: row.username, full_name: row.full_name, email: row.email, institution: String(row.institution), role: String(row.role), password: "" });
              }}>Edit</Button>
            ),
          },
        ]}
      />
    </>
  );
}
