import { Alert, Snackbar } from "@mui/material";
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

interface ToastContextValue {
  notify: (message: string, severity?: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<"success" | "error" | "info">("success");

  const notify = useCallback((nextMessage: string, nextSeverity: "success" | "error" | "info" = "success") => {
    setMessage(nextMessage);
    setSeverity(nextSeverity);
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar open={open} autoHideDuration={4000} onClose={() => setOpen(false)} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity={severity} onClose={() => setOpen(false)} variant="filled">
          {message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
