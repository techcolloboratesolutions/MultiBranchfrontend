import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#0f3d4c", light: "#1b6b7a", dark: "#0a2a33" },
    secondary: { main: "#c4a35a" },
    background: { default: "#f4f7f8", paper: "#ffffff" },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Source Sans 3", "Segoe UI", sans-serif',
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", minHeight: 42, fontWeight: 600 },
      },
    },
    MuiTextField: {
      defaultProps: { size: "small", fullWidth: true },
    },
  },
});

export default theme;
