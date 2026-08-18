import { Button, Card, CardContent, Grid, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import PageHeader from "../../components/common/PageHeader";
import ResponsiveTable from "../../components/tables/ResponsiveTable";
import { useToast } from "../../context/ToastContext";
import { createMainInstitution, listMainInstitutions, updateMainInstitution } from "../../services/institutionService";
import { getErrorMessage } from "../../services/api";
import { MainInstitution } from "../../types/institution";

export default function MainInstitutionsPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<MainInstitution[]>([]);
  const [editing, setEditing] = useState<MainInstitution | null>(null);
  const { register, handleSubmit, reset } = useForm({ defaultValues: { name: "", city: "", email: "", phone: "" } });
  const load = () => listMainInstitutions().then(setRows);
  useEffect(() => {
    load().catch((err) => notify(getErrorMessage(err), "error"));
  }, []);

  return (
    <>
      <PageHeader title="Main Institutions" />
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <form
            onSubmit={handleSubmit(async (values) => {
              try {
                if (editing) await updateMainInstitution(editing.id, values);
                else await createMainInstitution(values);
                notify("Saved.");
                setEditing(null);
                reset({ name: "", city: "", email: "", phone: "" });
                await load();
              } catch (err) {
                notify(getErrorMessage(err), "error");
              }
            })}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}><TextField label="Name" {...register("name")} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField label="City" {...register("city")} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField label="Email" {...register("email")} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Stack direction="row" spacing={1}>
                  <Button type="submit" variant="contained">Save</Button>
                  <Button type="button" onClick={() => { setEditing(null); reset({ name: "", city: "", email: "", phone: "" }); }}>Clear</Button>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField label="Phone" {...register("phone")} /></Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
      <ResponsiveTable
        rows={rows}
        rowKey={(row) => row.id}
        columns={[
          { key: "name", label: "Name" },
          { key: "city", label: "City" },
          { key: "email", label: "Email" },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <Button size="small" onClick={() => { setEditing(row); reset({ name: row.name, city: row.city, email: row.email, phone: row.phone }); }}>Edit</Button>
            ),
          },
        ]}
      />
    </>
  );
}
