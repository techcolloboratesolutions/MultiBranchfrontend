import { Button, Card, CardContent, Grid, MenuItem, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import PageHeader from "../../components/common/PageHeader";
import ResponsiveTable from "../../components/tables/ResponsiveTable";
import { useToast } from "../../context/ToastContext";
import { createInstitution, listInstitutions, listMainInstitutions, updateInstitution } from "../../services/institutionService";
import { getErrorMessage } from "../../services/api";
import { Institution, MainInstitution } from "../../types/institution";

export default function InstitutionsPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<Institution[]>([]);
  const [mains, setMains] = useState<MainInstitution[]>([]);
  const [editing, setEditing] = useState<Institution | null>(null);
  const { register, handleSubmit, reset } = useForm({ defaultValues: { name: "", main_institution: "", city: "" } });
  const load = () => listInstitutions().then(setRows);

  useEffect(() => {
    Promise.all([load(), listMainInstitutions()])
      .then(([, next]) => setMains(next))
      .catch((err) => notify(getErrorMessage(err), "error"));
  }, []);

  return (
    <>
      <PageHeader title="Institutions" />
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <form
            onSubmit={handleSubmit(async (values) => {
              try {
                const payload = { name: values.name, main_institution: Number(values.main_institution), city: values.city };
                if (editing) await updateInstitution(editing.id, payload);
                else await createInstitution(payload);
                notify("Saved.");
                setEditing(null);
                reset({ name: "", main_institution: "", city: "" });
                await load();
              } catch (err) {
                notify(getErrorMessage(err), "error");
              }
            })}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}><TextField label="Name" {...register("name")} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField select label="Main institution" defaultValue="" {...register("main_institution")}>
                  {mains.map((main) => <MenuItem key={main.id} value={main.id}>{main.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}><TextField label="City" {...register("city")} /></Grid>
              <Grid size={{ xs: 12, md: 2 }}>
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
          { key: "name", label: "Institution" },
          { key: "main_institution_name", label: "Main" },
          { key: "city", label: "City" },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <Button size="small" onClick={() => {
                setEditing(row);
                reset({ name: row.name, main_institution: String(row.main_institution), city: row.city });
              }}>Edit</Button>
            ),
          },
        ]}
      />
    </>
  );
}
