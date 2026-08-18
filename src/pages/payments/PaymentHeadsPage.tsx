import { Button, Card, CardContent, Grid, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import PageHeader from "../../components/common/PageHeader";
import ResponsiveTable from "../../components/tables/ResponsiveTable";
import { useToast } from "../../context/ToastContext";
import { createPaymentHead, listPaymentHeads, updatePaymentHead } from "../../services/paymentService";
import { getErrorMessage } from "../../services/api";
import { PaymentHead } from "../../types/payment";

export default function PaymentHeadsPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<PaymentHead[]>([]);
  const [editing, setEditing] = useState<PaymentHead | null>(null);
  const { register, handleSubmit, reset } = useForm({ defaultValues: { code: "", description: "" } });

  const load = () => listPaymentHeads().then(setRows);

  useEffect(() => {
    load().catch((err) => notify(getErrorMessage(err), "error"));
  }, []);

  return (
    <>
      <PageHeader title="Payment Heads" />
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
                reset({ code: "", description: "" });
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
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Description" {...register("description")} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Stack direction="row" spacing={1}>
                  <Button type="submit" variant="contained">
                    Save
                  </Button>
                  <Button type="button" onClick={() => { setEditing(null); reset({ code: "", description: "" }); }}>
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
          { key: "is_active", label: "Active", render: (row) => (row.is_active ? "Yes" : "No") },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <Button size="small" onClick={() => { setEditing(row); reset({ code: row.code, description: row.description }); }}>
                Edit
              </Button>
            ),
          },
        ]}
      />
    </>
  );
}
