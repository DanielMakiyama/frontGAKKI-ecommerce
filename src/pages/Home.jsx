import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminDashboard from "../components/AdminDashboard";

export default function Home() {
  const { usuario, isAdmin } = useAuth();

  if (isAdmin) return <AdminDashboard />;

  return (
    <div className="hero-gakki container">
      <svg className="roseta-grande" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.6">
        <circle cx="100" cy="100" r="98" />
        <circle cx="100" cy="100" r="82" />
        <circle cx="100" cy="100" r="66" />
        <circle cx="100" cy="100" r="50" />
      </svg>

      <h1>GAKKI STORE</h1>
      <p className="subtitulo">
        Instrumentos musicais para todos os níveis — da primeira guitarra ao equipamento de estúdio profissional.
      </p>
      <div style={{ position: "relative", display: "flex", gap: "1rem", justifyContent: "center" }}>
        <Link to="/catalogo" className="btn btn-primario">Ver catálogo</Link>
        {!usuario && <Link to="/registrar" className="btn btn-secundario">Criar conta</Link>}
      </div>
    </div>
  );
}
