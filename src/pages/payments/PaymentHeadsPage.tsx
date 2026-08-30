import { Button, Card, CardContent, Grid2 as Grid, MenuItem, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import PageHeader from "../../components/common/PageHeader";
import ResponsiveTable from "../../components/tables/ResponsiveTable";
import { useToast } from "../../context/ToastContext";
import { createPaymentHead, listPaymentHeads, updatePaymentHead } from "../../services/paymentService";
import { getErrorMessage } from "../../services/api";
import { PaymentHead, RecurringType } from "../../types/payment";

const emptyForm = { code: "", description: "", recurring_type: "Daily" as RecurringType };

export default function PaymentHeadsPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<PaymentHead[]>([]);
  const [editing, setEditing] = useState<PaymentHead | null>(null);
  const { register, handleSubmit, reset, watch } = useForm({ defaultValues: emptyForm });

  const load = () => listPaymentHeads().then(setRows);

  useEffect(() => {
    load().catch((err) => notify(getErrorMessage(err), "error"));
  }, []);

  return (
    <>
      <PageHeader title="Purchase Heads" />
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <form
            onSubmit={handleSubmit(async (values) => {
              try {
                if (editing) {
                  await updatePaymentHead(editing.id, values);
                } else {
                  await createPaymentHead(values);
                }
                notify("Saved.");
                setEditing(null);
                reset(emptyForm);
                await load();
              } catch (err) {
                notify(getErrorMessage(err), "error");
              }
            })}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField label="Code" {...register("code")} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="Description" {...register("description")} />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField select label="Type" value={watch("recurring_type")} {...register("recurring_type")}>
                  <MenuItem value="Daily">Daily</MenuItem>
                  <MenuItem value="Monthly">Monthly</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Stack direction="row" spacing={1}>
                  <Button type="submit" variant="contained">
                    Save
                  </Button>
                  <Button type="button" onClick={() => { setEditing(null); reset(emptyForm); }}>
                    Clear
                  </Button>
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
          { key: "code", label: "Code" },
          { key: "description", label: "Description" },
          { key: "recurring_type", label: "Type", render: (row) => row.recurring_type ?? "Daily" },
          { key: "is_active", label: "Active", render: (row) => (row.is_active ? "Yes" : "No") },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <Button
                size="small"
                onClick={() => {
                  setEditing(row);
                  reset({
                    code: row.code,
                    description: row.description,
                    recurring_type: row.recurring_type ?? "Daily",
                  });
                }}
              >
                Edit
              </Button>
            ),
          },
        ]}
      />
    </>
  );
}
