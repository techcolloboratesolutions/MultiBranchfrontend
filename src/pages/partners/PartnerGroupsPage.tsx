import { Button, Card, CardContent, FormControlLabel, Grid2 as Grid, Stack, Switch, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import PageHeader from "../../components/common/PageHeader";
import ResponsiveTable from "../../components/tables/ResponsiveTable";
import { useToast } from "../../context/ToastContext";
import { createPartnerGroup, listPartnerGroups, updatePartnerGroup } from "../../services/partnerService";
import { getErrorMessage } from "../../services/api";
import { PartnerGroup } from "../../types/partner";

export default function PartnerGroupsPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<PartnerGroup[]>([]);
  const [editing, setEditing] = useState<PartnerGroup | null>(null);
  const { register, handleSubmit, reset, control } = useForm({
    defaultValues: { name: "", whatsapp_group: "", is_profit_sharing: false },
  });
  const load = () => listPartnerGroups().then(setRows);
  useEffect(() => {
    load().catch((err) => notify(getErrorMessage(err), "error"));
  }, []);

  return (
    <>
      <PageHeader title="Partner Groups" />
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <form
            onSubmit={handleSubmit(async (values) => {
              try {
                if (editing) await updatePartnerGroup(editing.id, values);
                else await createPartnerGroup(values);
                notify("Saved.");
                setEditing(null);
                reset({ name: "", whatsapp_group: "", is_profit_sharing: false });
                await load();
              } catch (err) {
                notify(getErrorMessage(err), "error");
              }
            })}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 4 }}><TextField label="Group name" {...register("name")} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><TextField label="WhatsApp group" {...register("whatsapp_group")} /></Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Controller
                  name="is_profit_sharing"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel control={<Switch checked={field.value} onChange={field.onChange} />} label="Profit sharing" />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Stack direction="row" spacing={1}>
                  <Button type="submit" variant="contained">Save</Button>
                  <Button type="button" onClick={() => { setEditing(null); reset({ name: "", whatsapp_group: "", is_profit_sharing: false }); }}>Clear</Button>
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
          { key: "name", label: "Group" },
          { key: "whatsapp_group", label: "WhatsApp" },
          { key: "is_profit_sharing", label: "Profit sharing", render: (row) => (row.is_profit_sharing ? "Yes" : "No") },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <Button size="small" onClick={() => { setEditing(row); reset({ name: row.name, whatsapp_group: row.whatsapp_group, is_profit_sharing: row.is_profit_sharing }); }}>
                Edit
              </Button>
            ),
          },
        ]}
      />
    </>
  );
}
