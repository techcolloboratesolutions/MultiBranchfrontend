import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ApartmentIcon from "@mui/icons-material/Apartment";
import AssessmentIcon from "@mui/icons-material/Assessment";
import BadgeIcon from "@mui/icons-material/Badge";
import CalculateIcon from "@mui/icons-material/Calculate";
import CategoryIcon from "@mui/icons-material/Category";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupsIcon from "@mui/icons-material/Groups";
import HubIcon from "@mui/icons-material/Hub";
import InsightsIcon from "@mui/icons-material/Insights";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import PaymentsIcon from "@mui/icons-material/Payments";
import PeopleIcon from "@mui/icons-material/People";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { ReactNode, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const drawerWidth = 276;

interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
  adminOnly?: boolean;
  section?: string;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const items = useMemo<NavItem[]>(
    () => [
      { label: "Dashboard", to: "/", icon: <DashboardIcon />, section: "Overview" },
      { label: "Daily Sales", to: "/receipts", icon: <ReceiptLongIcon />, section: "Daily work" },
      { label: "Daily Purchases", to: "/payments", icon: <PaymentsIcon />, section: "Daily work" },
      { label: "Daily Expenses", to: "/expenses", icon: <RequestQuoteIcon />, section: "Daily work" },
      { label: "Monthly Sales & Purchases", to: "/reports/monthly", icon: <AssessmentIcon />, section: "Reports" },
      { label: "Monthly Business", to: "/reports/business", icon: <InsightsIcon />, section: "Reports" },
      { label: "Partner Wage", to: "/wages", icon: <CalculateIcon />, section: "Reports" },
      { label: "Partners", to: "/partners", adminOnly: true, icon: <PeopleIcon />, section: "Partners" },
      { label: "Partner Groups", to: "/partners/groups", adminOnly: true, icon: <GroupsIcon />, section: "Partners" },
      { label: "Group Entries", to: "/partners/entries", adminOnly: true, icon: <HubIcon />, section: "Partners" },
      { label: "Main Institutions", to: "/admin/main-institutions", adminOnly: true, icon: <AccountBalanceIcon />, section: "Admin" },
      { label: "Institutions", to: "/admin/institutions", adminOnly: true, icon: <ApartmentIcon />, section: "Admin" },
      { label: "Users", to: "/admin/users", adminOnly: true, icon: <BadgeIcon />, section: "Admin" },
      { label: "Roles", to: "/admin/roles", adminOnly: true, icon: <AdminPanelSettingsIcon />, section: "Admin" },
      { label: "Sales Heads", to: "/admin/receipt-heads", adminOnly: true, icon: <CategoryIcon />, section: "Admin" },
      { label: "Purchase Heads", to: "/admin/payment-heads", adminOnly: true, icon: <CategoryIcon />, section: "Admin" },
      { label: "Expense Heads", to: "/admin/expense-heads", adminOnly: true, icon: <CategoryIcon />, section: "Admin" },
      { label: "Profile", to: "/profile", icon: <AccountCircleIcon />, section: "Account" },
    ],
    [],
  );

  const visible = items.filter((item) => !item.adminOnly || isAdmin);
  const initials = (user?.full_name || user?.username || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "#0c3a46", color: "white" }}>
      <Toolbar sx={{ px: 2.5, minHeight: { xs: 64 } }}>
        <Box>
          <Typography sx={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 700, fontSize: "1.2rem" }}>
            BJF Bay
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            Branch operations
          </Typography>
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
      <List sx={{ px: 1.25, py: 1.5, flex: 1, overflowY: "auto" }}>
        {visible.map((item, index) => {
          const showSection = item.section && item.section !== visible[index - 1]?.section;
          return (
            <Box key={item.to}>
              {showSection ? (
                <Typography
                  variant="caption"
                  sx={{ display: "block", px: 1.5, pt: index === 0 ? 0.5 : 1.5, pb: 0.5, opacity: 0.55, letterSpacing: 0.6 }}
                >
                  {item.section?.toUpperCase()}
                </Typography>
              ) : null}
              <ListItemButton
                component={NavLink}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setMobileOpen(false)}
                sx={{
                  borderRadius: 2,
                  mb: 0.4,
                  color: "rgba(255,255,255,0.82)",
                  "& .MuiListItemIcon-root": { color: "inherit", minWidth: 40 },
                  "&.active": {
                    bgcolor: "rgba(212,160,23,0.22)",
                    color: "#fff",
                    fontWeight: 700,
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
              </ListItemButton>
            </Box>
          );
        })}
      </List>
      <Box sx={{ p: 1.5 }}>
        <ListItemButton
          onClick={async () => {
            await logout();
            navigate("/login");
          }}
          sx={{ borderRadius: 2, color: "rgba(255,255,255,0.85)" }}
        >
          <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        color="inherit"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          bgcolor: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(15,76,92,0.08)",
        }}
      >
        <Toolbar sx={{ gap: 1, minHeight: { xs: 64 }, px: { xs: 1.5, sm: 2 } }}>
          {!isDesktop ? (
            <IconButton color="primary" onClick={() => setMobileOpen(true)} edge="start" aria-label="Open menu">
              <MenuIcon />
            </IconButton>
          ) : null}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography noWrap sx={{ fontWeight: 700, fontSize: { xs: "0.95rem", sm: "1.05rem" } }}>
              {user?.institution.name}
            </Typography>
            <Typography noWrap variant="caption" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
              {user?.main_institution.name}
            </Typography>
          </Box>
          <Chip
            avatar={<Avatar sx={{ bgcolor: "primary.main", width: 28, height: 28, fontSize: 12 }}>{initials}</Avatar>}
            label={
              <>
                <Typography variant="body2" fontWeight={700} sx={{ display: { xs: "block", sm: "none" } }}>
                  {user?.role}
                </Typography>
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ display: { xs: "none", sm: "flex" } }}>
                  <Typography variant="body2" fontWeight={700}>
                    {user?.full_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.role}
                  </Typography>
                </Stack>
              </>
            }
            sx={{
              height: 40,
              "& .MuiChip-label": { px: { xs: 0.5, sm: 1 } },
            }}
          />
        </Toolbar>
      </AppBar>
      {isDesktop ? (
        <Drawer variant="permanent" sx={{ width: drawerWidth, "& .MuiDrawer-paper": { width: drawerWidth, border: 0 } }}>
          {drawer}
        </Drawer>
      ) : (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ "& .MuiDrawer-paper": { width: drawerWidth, border: 0 } }}
        >
          {drawer}
        </Drawer>
      )}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 2.5, md: 3.5 },
          pb: { xs: 4, md: 4 },
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          maxWidth: "100%",
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
