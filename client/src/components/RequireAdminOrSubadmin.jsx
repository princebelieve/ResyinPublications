import { Navigate } from "react-router-dom";
import useAuth from "../context/AuthContext";
import AuthLoadingScreen from "./AuthLoadingScreen";

export default function RequireAdminOrSubadmin({ children }) {
  const { isLoggedIn, isAdminOrSubadmin, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen message="Opening admin workspace…" />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdminOrSubadmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
