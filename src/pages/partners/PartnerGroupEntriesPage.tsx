import {
  Alert,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Grid2 as Grid,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import InstitutionSelect from "../../components/forms/InstitutionSelect";
import ResponsiveTable from "../../components/tables/ResponsiveTable";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../hooks/useAuth";
import { listInstitutions } from "../../services/institutionService";
import {
  createPartnerGroupEntry,
  deletePartnerGroupEntry,
  listPartnerGroupEntries,
  listPartnerGroups,
  listPartners,
  updatePartnerGroupEntry,
} from "../../services/partnerService";
import { getErrorMessage } from "../../services/api";
import { Institution } from "../../types/institution";
import { Partner, PartnerGroup, PartnerGroupEntry } from "../../types/partner";

type EntryForm = {
  partner_group: string;
  institution: string;
  partner: string;
  share_percent: string;
  is_active: boolean;
};

const emptyForm: EntryForm = {
  partner_group: "",
  institution: "",
  partner: "",
  share_percent: "",
  is_active: true,
};

export default function PartnerGroupEntriesPage() {
  const { notify } = useToast();
  const { isAdmin, operatingInstitutionId, setOperatingInstitutionId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState<PartnerGroupEntry[]>([]);
  const [groups, setGroups] = useState<PartnerGroup[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [editing, setEditing] = useState<PartnerGroupEntry | null>(null);
  const [deleting, setDeleting] = useState<PartnerGroupEntry | null>(null);
  const { register, handleSubmit, reset, control, watch, setValue } = useForm<EntryForm>({
    defaultValues: emptyForm,
  });

  const selectedInstitution = operatingInstitutionId;
  const formInstitution = watch("institution");
  const formShare = watch("share_percent");
  const formActive = watch("is_active");

  useEffect(() => {
    const raw = searchParams.get("institution");
    if (!raw || raw === "all") {
      return;
    }
    const id = Number(raw);
    if (!Number.isNaN(id) && operatingInstitutionId !== id) {
      setOperatingInstitutionId(id);
    }
  }, [searchParams, operatingInstitutionId, setOperatingInstitutionId]);

  const loadEntries = async (institutionId: number | "all") => {
    const data = await listPartnerGroupEntries(institutionId === "all" ? undefined : Number(institutionId));
    setRows(data);
  };

  useEffect(() => {
    Promise.all([listPartnerGroups(), listPartners(), listInstitutions()])
      .then(([nextGroups, nextPartners, nextInstitutions]) => {
        setGroups(nextGroups);
        setPartners(nextPartners);
        setInstitutions(nextInstitutions);
      })
      .catch((err) => notify(getErrorMessage(err), "error"));
  }, [notify]);

  useEffect(() => {
    setEditing(null);
    reset({
      ...emptyForm,
      institution: selectedInstitution === "all" ? "" : String(selectedInstitution),
    });
    loadEntries(selectedInstitution).catch((err) => notify(getErrorMessage(err), "error"));
  }, [selectedInstitution, notify, reset]);

  const shareByGroupInstitution = useMemo(() => {
    const totals = new Map<string, { name: string; profitSharing: boolean; total: number; key: string }>();
    for (const row of rows) {
      if (!row.is_active) {
        continue;
      }
      const group = groups.find((item) => item.id === row.partner_group);
      const key = `${row.partner_group}:${row.institution}`;
      const current = totals.get(key) ?? {
        key,
        name:
          selectedInstitution === "all"
            ? `${row.group_name} — ${row.institution_name}`
            : row.group_name,
        profitSharing: Boolean(group?.is_profit_sharing),
        total: 0,
      };
      current.total += Number(row.share_percent);
      totals.set(key, current);
    }
    return [...totals.values()];
  }, [rows, groups, selectedInstitution]);

  const formInstitutionId =
    selectedInstitution === "all" ? Number(formInstitution) || 0 : Number(selectedInstitution) || 0;
  const lockedGroupId = useMemo(() => {
    const forInst = rows.find((row) => row.institution === formInstitutionId);
    return forInst?.partner_group ?? null;
  }, [rows, formInstitutionId]);

  useEffect(() => {
    if (lockedGroupId) {
      setValue("partner_group", String(lockedGroupId));
    }
  }, [lockedGroupId, setValue]);

  const otherShareTotal = rows
    .filter(
      (row) =>
        row.is_active &&
        row.institution === formInstitutionId &&
        row.id !== editing?.id,
    )
    .reduce((sum, row) => sum + Number(row.share_percent), 0);
  const nextShareTotal = otherShareTotal + (formActive ? Number(formShare) || 0 : 0);
  const partnersForSelect = partners.filter((partner) => {
    if (!formInstitutionId) {
      return true;
    }
    const alreadyAtInstitution = rows.some(
      (row) => row.institution === formInstitutionId && row.partner === partner.id && row.id !== editing?.id,
    );
    return !alreadyAtInstitution;
  });
  const groupsForSelect = lockedGroupId ? groups.filter((group) => group.id === lockedGroupId) : groups;
  const lockedGroupName = groups.find((group) => group.id === lockedGroupId)?.name || rows.find((row) => row.institution === formInstitutionId)?.group_name;

  const clearForm = () => {
    setEditing(null);
    reset({
      ...emptyForm,
      institution: selectedInstitution === "all" ? "" : String(selectedInstitution),
    });
  };

  const selectedName =
    selectedInstitution === "all"
      ? "all institutions"
      : institutions.find((item) => item.id === selectedInstitution)?.name ?? "the selected institution";

  return (
    <>
      <PageHeader
        title="Partner Group Entries"
        subtitle="Delete a partner to remove them from this institution’s group. Only active partners’ shares must total 100%."
      />
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <InstitutionSelect
                institutions={institutions}
                value={selectedInstitution}
                allowAll={isAdmin}
                disabled={!isAdmin}
                onChange={(value) => {
                  setOperatingInstitutionId(value);
                  if (value === "all") {
                    setSearchParams({}, { replace: true });
                  } else {
                    setSearchParams({ institution: String(value) }, { replace: true });
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Showing entries for {selectedName}
                {selectedInstitution !== "all" && lockedGroupName ? ` — group: ${lockedGroupName}` : ""}.
                Each institution has one group; a partner may still join other groups at other institutions.
              </Typography>
            </Grid>
          </Grid>
          {shareByGroupInstitution.length > 0 ? (
            <Stack spacing={1} sx={{ mt: 2 }}>
              {shareByGroupInstitution.map((group) => {
                const total = Math.round(group.total * 10000) / 10000;
                const over = total > 100;
                const off = total !== 100;
                return (
                  <Alert key={group.key} severity={over || off ? "warning" : "info"}>
                    {group.name}: {group.total}% active
                    {over ? " — cannot exceed 100%." : off ? " — active partners must total 100%." : ""}
                  </Alert>
                );
              })}
            </Stack>
          ) : null}
        </CardContent>
      </Card>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
            {editing ? "Edit entry" : "Add entry"}
            {selectedInstitution !== "all" ? ` for ${selectedName}` : ""}
          </Typography>
          <form
            onSubmit={handleSubmit(async (values) => {
              try {
                const institutionId =
                  selectedInstitution === "all" ? Number(values.institution) : Number(selectedInstitution);
                if (!institutionId) {
                  notify("Select an institution first.", "error");
                  return;
                }
                  const assignedGroup = rows.find((row) => row.institution === institutionId && row.id !== editing?.id);
                  if (assignedGroup && Number(values.partner_group) !== assignedGroup.partner_group) {
                    notify("Each institution can have only one partner group.", "error");
                    return;
                  }
                  if (values.is_active) {
                    const others = rows
                      .filter(
                        (row) =>
                          row.is_active &&
                          row.institution === institutionId &&
                          row.id !== editing?.id,
                      )
                      .reduce((sum, row) => sum + Number(row.share_percent), 0);
                  const nextTotal = others + Number(values.share_percent);
                  if (nextTotal > 100) {
                    notify(
                      `Active partners' share percent cannot exceed 100%. Other active shares total ${others}%.`,
                      "error",
                    );
                    return;
                  }
                }
                const payload = {
                  partner_group: Number(values.partner_group),
                  institution: institutionId,
                  partner: Number(values.partner),
                  share_percent: values.share_percent,
                  is_active: values.is_active,
                };
                if (editing) await updatePartnerGroupEntry(editing.id, payload);
                else await createPartnerGroupEntry(payload);
                notify("Saved.");
                clearForm();
                await loadEntries(selectedInstitution);
              } catch (err) {
                notify(getErrorMessage(err), "error");
              }
            })}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 3 }}>
                <Controller
                  name="partner_group"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      select
                      label="Group"
                      value={field.value}
                      onChange={field.onChange}
                      disabled={Boolean(lockedGroupId)}
                      helperText={
                        lockedGroupId
                          ? "This institution already has a group."
                          : "Choose the one group for this institution."
                      }
                    >
                      <MenuItem value="">Select group</MenuItem>
                      {groupsForSelect.map((group) => (
                        <MenuItem key={group.id} value={String(group.id)}>
                          {group.name}
                          {group.is_profit_sharing ? " (profit sharing)" : ""}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              {selectedInstitution === "all" ? (
                <Grid size={{ xs: 12, md: 3 }}>
                  <Controller
                    name="institution"
                    control={control}
                    render={({ field }) => (
                      <TextField select label="Institution" value={field.value} onChange={field.onChange}>
                        <MenuItem value="">Select institution</MenuItem>
                        {institutions.map((institution) => (
                          <MenuItem key={institution.id} value={String(institution.id)}>
                            {institution.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>
              ) : null}
              <Grid size={{ xs: 12, md: 3 }}>
                <Controller
                  name="partner"
                  control={control}
                  render={({ field }) => (
                    <TextField select label="Partner" value={field.value} onChange={field.onChange}>
                      <MenuItem value="">Select partner</MenuItem>
                      {partnersForSelect.map((partner) => (
                        <MenuItem key={partner.id} value={String(partner.id)}>
                          {partner.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  label="Share %"
                  helperText={
                    formInstitutionId
                      ? `Remaining ${Math.max(0, 100 - otherShareTotal)}% of 100%. Next total ${nextShareTotal || 0}%.`
                      : "Only active partners count toward 100%."
                  }
                  error={Boolean(formActive && formInstitutionId && nextShareTotal > 100)}
                  {...register("share_percent")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch checked={field.value} onChange={field.onChange} />}
                      label="Active"
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack direction="row" spacing={1}>
                  <Button type="submit" variant="contained">
                    {editing ? "Update" : "Add"}
                  </Button>
                  <Button type="button" onClick={clearForm}>
                    Cancel
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
          { key: "group_name", label: "Group" },
          ...(selectedInstitution === "all"
            ? [{ key: "institution_name" as const, label: "Institution" }]
            : []),
          { key: "partner_name", label: "Partner" },
          { key: "share_percent", label: "Share %", align: "right" as const },
          {
            key: "is_active",
            label: "Active",
            render: (row: PartnerGroupEntry) => (row.is_active ? "Yes" : "No"),
          },
          {
            key: "actions",
            label: "Actions",
            render: (row: PartnerGroupEntry) => (
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  size="small"
                  onClick={() => {
                    setEditing(row);
                    reset({
                      partner_group: String(row.partner_group),
                      institution: String(row.institution),
                      partner: String(row.partner),
                      share_percent: row.share_percent,
                      is_active: row.is_active,
                    });
                  }}
                >
                  Edit
                </Button>
                <Button size="small" color="error" onClick={() => setDeleting(row)}>
                  Delete
                </Button>
              </Stack>
            ),
          },
        ]}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Remove partner from group"
        message={
          deleting
            ? `Remove ${deleting.partner_name} from ${deleting.group_name} for ${deleting.institution_name}? Only remaining active partners should total 100%.`
            : ""
        }
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) {
            return;
          }
          try {
            await deletePartnerGroupEntry(deleting.id);
            if (editing?.id === deleting.id) {
              clearForm();
            }
            setDeleting(null);
            notify("Partner removed from the group.");
            await loadEntries(selectedInstitution);
          } catch (err) {
            notify(getErrorMessage(err), "error");
          }
        }}
      />
    </>
  );
}
