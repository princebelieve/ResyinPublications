import { Navigate } from "react-router-dom";
import useAuth from "../context/AuthContext";

export default function RequireDistributor({ children }) {
  const { isLoggedIn, user, loading } = useAuth();
  if (loading) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (user?.distributorStatus !== "approved") return <Navigate to="/dashboard" replace />;
  return children;
}
