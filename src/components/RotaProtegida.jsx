import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RotaProtegida({ children, exigirAdmin = false }) {
  const { usuario, isAdmin } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  if (exigirAdmin && !isAdmin) return <Navigate to="/" replace />;
  return children;
}
