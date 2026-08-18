import { Button, Card, CardContent, Grid, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import PageHeader from "../../components/common/PageHeader";
import ResponsiveTable from "../../components/tables/ResponsiveTable";
import { useToast } from "../../context/ToastContext";
import { createRole, listRoles, updateRole } from "../../services/userService";
import { getErrorMessage } from "../../services/api";
import { Role } from "../../types/institution";

export default function RolesPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<Role[]>([]);
  const [editing, setEditing] = useState<Role | null>(null);
  const { register, handleSubmit, reset } = useForm({ defaultValues: { role_code: "", role_description: "" } });
  const load = () => listRoles().then(setRows);
  useEffect(() => {
    load().catch((err) => notify(getErrorMessage(err), "error"));
  }, []);

  return (
    <>
      <PageHeader title="Roles" />
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <form
            onSubmit={handleSubmit(async (values) => {
              try {
                if (editing) await updateRole(editing.id, values);
                else await createRole(values);
                notify("Saved.");
                setEditing(null);
                reset({ role_code: "", role_description: "" });
                await load();
              } catch (err) {
                notify(getErrorMessage(err), "error");
              }
            })}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}><TextField label="Role code" {...register("role_code")} /></Grid>
              <Grid size={{ xs: 12, md: 5 }}><TextField label="Description" {...register("role_description")} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Stack direction="row" spacing={1}>
                  <Button type="submit" variant="contained">Save</Button>
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
          { key: "role_code", label: "Code" },
          { key: "role_description", label: "Description" },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <Button size="small" onClick={() => { setEditing(row); reset({ role_code: row.role_code, role_description: row.role_description }); }}>Edit</Button>
            ),
          },
        ]}
      />
    </>
  );
}
