import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * permitirVisitante: não exige login (usado em páginas públicas como o
 * catálogo), mas exigirCliente ainda bloqueia administradores mesmo sem
 * estarem logados como tal — ou seja, um admin logado é sempre redirecionado
 * para fora de páginas de cliente, mesmo que a página seja pública para visitantes.
 */
export default function RotaProtegida({ children, exigirAdmin = false, exigirCliente = false, permitirVisitante = false }) {
  const { usuario, isAdmin } = useAuth();
  if (!usuario && !permitirVisitante) return <Navigate to="/login" replace />;
  if (exigirAdmin && !isAdmin) return <Navigate to="/" replace />;
  if (exigirCliente && isAdmin) return <Navigate to="/" replace />;
  return children;
}
