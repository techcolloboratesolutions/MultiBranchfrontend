import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { Partner, PartnerGroup } from "../../types/partner";
import { partnerLabel, sendPdfViaWhatsApp } from "../../utils/whatsappShare";

interface Props {
  open: boolean;
  filename: string;
  caption: string;
  pdf: Uint8Array | null;
  partners: Partner[];
  groups: PartnerGroup[];
  onClose: () => void;
  onSent: (message: string) => void;
  onError: (message: string) => void;
}

export default function WhatsAppSendDialog({
  open,
  filename,
  caption,
  pdf,
  partners,
  groups,
  onClose,
  onSent,
  onError,
}: Props) {
  const [mode, setMode] = useState<"individual" | "group">("individual");
  const [partnerId, setPartnerId] = useState("");
  const [phone, setPhone] = useState("");
  const [groupId, setGroupId] = useState("");
  const [sending, setSending] = useState(false);

  const withMobile = useMemo(() => partners.filter((row) => row.is_active && row.mobile), [partners]);
  const activeGroups = useMemo(() => groups.filter((row) => row.is_active), [groups]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setMode("individual");
    setPartnerId("");
    setPhone("");
    setGroupId(activeGroups[0] ? String(activeGroups[0].id) : "");
    setSending(false);
  }, [open, activeGroups]);

  const onPartnerChange = (id: string) => {
    setPartnerId(id);
    const partner = withMobile.find((row) => String(row.id) === id);
    setPhone(partner?.mobile ?? "");
  };

  const onSend = async () => {
    if (!pdf) {
      onError("PDF is not ready.");
      return;
    }
    const group = activeGroups.find((row) => String(row.id) === groupId) ?? null;
    if (mode === "individual" && !phone.trim()) {
      onError("Enter a WhatsApp number or choose a partner.");
      return;
    }
    if (mode === "group" && !group) {
      onError("Choose a WhatsApp group.");
      return;
    }
    setSending(true);
    try {
      const result = await sendPdfViaWhatsApp({
        pdf,
        filename,
        caption,
        phone: mode === "individual" ? phone : undefined,
        group: mode === "group" ? group : null,
      });
      onSent(
        result === "shared"
          ? "WhatsApp share opened. Choose the person or group."
          : "PDF downloaded. Attach it in the WhatsApp chat that opened.",
      );
      onClose();
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        onClose();
        return;
      }
      onError(err instanceof Error ? err.message : "Could not open WhatsApp.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Send PDF on WhatsApp</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {filename}
        </Typography>
        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          value={mode}
          onChange={(_event, value) => {
            if (value) {
              setMode(value);
            }
          }}
          sx={{ mb: 2 }}
        >
          <ToggleButton value="individual">Individual</ToggleButton>
          <ToggleButton value="group">Group</ToggleButton>
        </ToggleButtonGroup>
        {mode === "individual" ? (
          <Stack spacing={2}>
            <TextField
              select
              label="Partner"
              value={partnerId}
              onChange={(event) => onPartnerChange(event.target.value)}
            >
              <MenuItem value="">Enter number below</MenuItem>
              {withMobile.map((partner) => (
                <MenuItem key={partner.id} value={String(partner.id)}>
                  {partnerLabel(partner)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="WhatsApp number"
              placeholder="9876543210 or 919876543210"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </Stack>
        ) : (
          <TextField
            select
            fullWidth
            label="WhatsApp group"
            value={groupId}
            onChange={(event) => setGroupId(event.target.value)}
          >
            {activeGroups.length === 0 ? (
              <MenuItem value="">No groups found</MenuItem>
            ) : (
              activeGroups.map((group) => (
                <MenuItem key={group.id} value={String(group.id)}>
                  {group.name}
                  {group.whatsapp_group ? ` — ${group.whatsapp_group}` : ""}
                </MenuItem>
              ))
            )}
          </TextField>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<WhatsAppIcon />}
          onClick={onSend}
          disabled={sending}
          sx={{ bgcolor: "#25D366", "&:hover": { bgcolor: "#1ebe57" } }}
        >
          {sending ? "Opening..." : "Send"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
