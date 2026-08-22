import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#0f4c5c", light: "#1a7a8c", dark: "#0a323c", contrastText: "#fff" },
    secondary: { main: "#d4a017", light: "#e8c547", dark: "#a67c0d" },
    success: { main: "#0f766e" },
    error: { main: "#b42318" },
    background: { default: "#eef4f6", paper: "#ffffff" },
    text: { primary: "#12262c", secondary: "#5b6d73" },
  },
  shape: { borderRadius: 14 },
  spacing: 8,
  typography: {
    fontFamily: '"Source Sans 3", "Segoe UI", sans-serif',
    h4: { fontFamily: "Fraunces, Georgia, serif", fontWeight: 700, letterSpacing: -0.4 },
    h5: { fontFamily: "Fraunces, Georgia, serif", fontWeight: 700, letterSpacing: -0.3 },
    h6: { fontFamily: "Fraunces, Georgia, serif", fontWeight: 700 },
    button: { fontWeight: 700 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: { WebkitTapHighlightColor: "transparent" },
        body: {
          background:
            "radial-gradient(1200px 500px at 10% -10%, rgba(26,122,140,0.12), transparent), #eef4f6",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          textTransform: "none",
          minHeight: 44,
          fontWeight: 700,
          borderRadius: 12,
          paddingLeft: 16,
          paddingRight: 16,
          [theme.breakpoints.down("sm")]: {
            width: "100%",
          },
        }),
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { minWidth: 44, minHeight: 44 },
      },
    },
    MuiTextField: {
      defaultProps: { size: "small", fullWidth: true },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(15, 76, 92, 0.08)",
          boxShadow: "0 10px 30px rgba(15, 76, 92, 0.06)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiDialog: {
      defaultProps: { fullWidth: true },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: "none" },
      },
    },
  },
});

export default theme;
