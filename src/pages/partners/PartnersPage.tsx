import { Button, Card, CardContent, Grid2 as Grid, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import PageHeader from "../../components/common/PageHeader";
import ResponsiveTable from "../../components/tables/ResponsiveTable";
import { useToast } from "../../context/ToastContext";
import { createPartner, listPartners, updatePartner } from "../../services/partnerService";
import { getErrorMessage } from "../../services/api";
import { Partner } from "../../types/partner";

export default function PartnersPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<Partner[]>([]);
  const [editing, setEditing] = useState<Partner | null>(null);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { name: "", mobile: "", email: "", address: "" },
  });

  const load = () => listPartners().then(setRows);
  useEffect(() => {
    load().catch((err) => notify(getErrorMessage(err), "error"));
  }, []);

  return (
    <>
      <PageHeader title="Partners" />
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <form
            onSubmit={handleSubmit(async (values) => {
              try {
                if (editing) await updatePartner(editing.id, values);
                else await createPartner(values);
                notify("Saved.");
                setEditing(null);
                reset({ name: "", mobile: "", email: "", address: "" });
                await load();
              } catch (err) {
                notify(getErrorMessage(err), "error");
              }
            })}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}><TextField label="Name" {...register("name")} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField label="Mobile" {...register("mobile")} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField label="Email" {...register("email")} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Stack direction="row" spacing={1}>
                  <Button type="submit" variant="contained">Save</Button>
                  <Button type="button" onClick={() => { setEditing(null); reset({ name: "", mobile: "", email: "", address: "" }); }}>Clear</Button>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12 }}><TextField label="Address" {...register("address")} /></Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
      <ResponsiveTable
        rows={rows}
        rowKey={(row) => row.id}
        columns={[
          { key: "name", label: "Partner" },
          { key: "mobile", label: "Mobile" },
          { key: "email", label: "Email" },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <Button size="small" onClick={() => { setEditing(row); reset(row); }}>Edit</Button>
            ),
          },
        ]}
      />
    </>
  );
}
