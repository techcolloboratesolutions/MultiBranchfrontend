import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoadingState from "../components/common/LoadingState";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const hasToken = Boolean(localStorage.getItem("access"));
  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }
  if (!user) {
    return <LoadingState />;
  }
  return <>{children}</>;
}
