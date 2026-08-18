import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupsIcon from "@mui/icons-material/Groups";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import PaymentsIcon from "@mui/icons-material/Payments";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { ReactNode, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const drawerWidth = 280;

interface NavItem {
  label: string;
  to: string;
  icon?: ReactNode;
  adminOnly?: boolean;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const items = useMemo<NavItem[]>(
    () => [
      { label: "Dashboard", to: "/", icon: <DashboardIcon /> },
      { label: "Daily Receipts", to: "/receipts", icon: <ReceiptLongIcon /> },
      { label: "Daily Payments", to: "/payments", icon: <PaymentsIcon /> },
      { label: "Monthly Receipts & Payments", to: "/reports/monthly" },
      { label: "Monthly Business", to: "/reports/business" },
      { label: "Partners", to: "/partners", adminOnly: true, icon: <GroupsIcon /> },
      { label: "Partner Groups", to: "/partners/groups", adminOnly: true },
      { label: "Partner Group Entries", to: "/partners/entries", adminOnly: true },
      { label: "Partner Wage Calculation", to: "/wages" },
      { label: "Main Institutions", to: "/admin/main-institutions", adminOnly: true, icon: <SettingsIcon /> },
      { label: "Institutions", to: "/admin/institutions", adminOnly: true },
      { label: "Users", to: "/admin/users", adminOnly: true },
      { label: "Roles", to: "/admin/roles", adminOnly: true },
      { label: "Receipt Heads", to: "/admin/receipt-heads", adminOnly: true },
      { label: "Payment Heads", to: "/admin/payment-heads", adminOnly: true },
      { label: "Profile", to: "/profile", icon: <AccountCircleIcon /> },
    ],
    [],
  );

  const visible = items.filter((item) => !item.adminOnly || isAdmin);

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6">MultiBranches</Typography>
      </Toolbar>
      <Divider />
      <List>
        {visible.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            sx={{
              "&.active": { bgcolor: "action.selected", fontWeight: 700 },
            }}
          >
            {item.icon ? <ListItemIcon>{item.icon}</ListItemIcon> : <ListItemIcon />}
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
        <ListItemButton
          onClick={async () => {
            await logout();
            navigate("/login");
          }}
        >
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          {!isDesktop ? (
            <IconButton color="inherit" onClick={() => setMobileOpen(true)} edge="start" sx={{ mr: 1 }} aria-label="Open menu">
              <MenuIcon />
            </IconButton>
          ) : null}
          <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
            {user?.institution.name}
          </Typography>
          <Typography variant="body2">
            {user?.full_name} · {user?.role}
          </Typography>
        </Toolbar>
      </AppBar>
      {isDesktop ? (
        <Drawer variant="permanent" sx={{ width: drawerWidth, "& .MuiDrawer-paper": { width: drawerWidth } }}>
          {drawer}
        </Drawer>
      ) : (
        <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} ModalProps={{ keepMounted: true }} sx={{ "& .MuiDrawer-paper": { width: drawerWidth } }}>
          {drawer}
        </Drawer>
      )}
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, width: { md: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
