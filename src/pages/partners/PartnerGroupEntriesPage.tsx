import { Button, Card, CardContent, Grid2 as Grid, MenuItem, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import PageHeader from "../../components/common/PageHeader";
import ResponsiveTable from "../../components/tables/ResponsiveTable";
import { useToast } from "../../context/ToastContext";
import { listInstitutions } from "../../services/institutionService";
import {
  createPartnerGroupEntry,
  listPartnerGroupEntries,
  listPartnerGroups,
  listPartners,
  updatePartnerGroupEntry,
} from "../../services/partnerService";
import { getErrorMessage } from "../../services/api";
import { Institution } from "../../types/institution";
import { Partner, PartnerGroup, PartnerGroupEntry } from "../../types/partner";

export default function PartnerGroupEntriesPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<PartnerGroupEntry[]>([]);
  const [groups, setGroups] = useState<PartnerGroup[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [editing, setEditing] = useState<PartnerGroupEntry | null>(null);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { partner_group: "", institution: "", partner: "", share_percent: "" },
  });

  const load = async () => {
    setRows(await listPartnerGroupEntries());
  };

  useEffect(() => {
    Promise.all([load(), listPartnerGroups(), listPartners(), listInstitutions()])
      .then(([, nextGroups, nextPartners, nextInstitutions]) => {
        setGroups(nextGroups);
        setPartners(nextPartners);
        setInstitutions(nextInstitutions);
      })
      .catch((err) => notify(getErrorMessage(err), "error"));
  }, []);

  return (
    <>
      <PageHeader title="Partner Group Entries" subtitle="Share percent must be between 0 and 100. Profit-sharing totals must equal 100% before wage save." />
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <form
            onSubmit={handleSubmit(async (values) => {
              try {
                const payload = {
                  partner_group: Number(values.partner_group),
                  institution: Number(values.institution),
                  partner: Number(values.partner),
                  share_percent: values.share_percent,
                };
                if (editing) await updatePartnerGroupEntry(editing.id, payload);
                else await createPartnerGroupEntry(payload);
                notify("Saved.");
                setEditing(null);
                reset({ partner_group: "", institution: "", partner: "", share_percent: "" });
                await load();
              } catch (err) {
                notify(getErrorMessage(err), "error");
              }
            })}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField select label="Group" defaultValue="" {...register("partner_group")}>
                  {groups.map((group) => <MenuItem key={group.id} value={group.id}>{group.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField select label="Institution" defaultValue="" {...register("institution")}>
                  {institutions.map((institution) => <MenuItem key={institution.id} value={institution.id}>{institution.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField select label="Partner" defaultValue="" {...register("partner")}>
                  {partners.map((partner) => <MenuItem key={partner.id} value={partner.id}>{partner.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField label="Share %" {...register("share_percent")} />
              </Grid>
              <Grid size={{ xs: 12, md: 1 }}>
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
          { key: "group_name", label: "Group" },
          { key: "institution_name", label: "Institution" },
          { key: "partner_name", label: "Partner" },
          { key: "share_percent", label: "Share %" },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <Button size="small" onClick={() => {
                setEditing(row);
                reset({
                  partner_group: String(row.partner_group),
                  institution: String(row.institution),
                  partner: String(row.partner),
                  share_percent: row.share_percent,
                });
              }}>Edit</Button>
            ),
          },
        ]}
      />
    </>
  );
}
