//client/src/components/RequireAdmin.jsx
import { Navigate } from "react-router-dom";
import useAuth from "../context/AuthContext";
import AuthLoadingScreen from "./AuthLoadingScreen";

export default function RequireAdmin({ children }) {
  const { isLoggedIn, isAdmin, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen message="Opening admin dashboard…" />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
