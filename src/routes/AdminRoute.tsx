import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export function OrgRoute({ children }: { children: React.ReactNode }) {
  const { canViewAllBranches } = useAuth();
  if (!canViewAllBranches) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
