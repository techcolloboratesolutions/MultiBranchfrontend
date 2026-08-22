import { Button, Dialog, DialogActions, DialogContent, DialogTitle, useMediaQuery, useTheme } from "@mui/material";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({ open, title, message, onClose, onConfirm }: ConfirmDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" fullScreen={fullScreen}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{message}</DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexDirection: { xs: "column-reverse", sm: "row" } }}>
        <Button onClick={onClose} fullWidth={fullScreen}>
          Cancel
        </Button>
        <Button variant="contained" color="error" onClick={onConfirm} fullWidth={fullScreen}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
