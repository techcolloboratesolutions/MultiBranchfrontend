import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import LoginPage from "../pages/auth/LoginPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import DailyReceiptsPage from "../pages/receipts/DailyReceiptsPage";
import DailyPaymentsPage from "../pages/payments/DailyPaymentsPage";
import DailyExpensesPage from "../pages/expenses/DailyExpensesPage";
import MonthlyReportPage from "../pages/reports/MonthlyReportPage";
import MonthlyBusinessPage from "../pages/reports/MonthlyBusinessPage";
import PartnersPage from "../pages/partners/PartnersPage";
import PartnerGroupsPage from "../pages/partners/PartnerGroupsPage";
import PartnerGroupEntriesPage from "../pages/partners/PartnerGroupEntriesPage";
import PartnerWagePage from "../pages/wages/PartnerWagePage";
import MainInstitutionsPage from "../pages/institutions/MainInstitutionsPage";
import InstitutionsPage from "../pages/institutions/InstitutionsPage";
import UsersPage from "../pages/users/UsersPage";
import RolesPage from "../pages/roles/RolesPage";
import ReceiptHeadsPage from "../pages/receipts/ReceiptHeadsPage";
import PaymentHeadsPage from "../pages/payments/PaymentHeadsPage";
import ExpenseHeadsPage from "../pages/expenses/ExpenseHeadsPage";
import ProfilePage from "../pages/auth/ProfilePage";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/receipts" element={<DailyReceiptsPage />} />
                <Route path="/payments" element={<DailyPaymentsPage />} />
                <Route path="/expenses" element={<DailyExpensesPage />} />
                <Route path="/reports/monthly" element={<MonthlyReportPage />} />
                <Route path="/reports/business" element={<MonthlyBusinessPage />} />
                <Route path="/wages" element={<PartnerWagePage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route
                  path="/partners"
                  element={
                    <AdminRoute>
                      <PartnersPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/partners/groups"
                  element={
                    <AdminRoute>
                      <PartnerGroupsPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/partners/entries"
                  element={
                    <AdminRoute>
                      <PartnerGroupEntriesPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/main-institutions"
                  element={
                    <AdminRoute>
                      <MainInstitutionsPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/institutions"
                  element={
                    <AdminRoute>
                      <InstitutionsPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <AdminRoute>
                      <UsersPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/roles"
                  element={
                    <AdminRoute>
                      <RolesPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/receipt-heads"
                  element={
                    <AdminRoute>
                      <ReceiptHeadsPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/payment-heads"
                  element={
                    <AdminRoute>
                      <PaymentHeadsPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/expense-heads"
                  element={
                    <AdminRoute>
                      <ExpenseHeadsPage />
                    </AdminRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
