import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { usuario } = useAuth();
  return (
    <div className="container" style={{ textAlign: "center", padding: "3rem 0" }}>
      <h1 style={{ fontSize: "2.4rem" }}>GAKKI STORE</h1>
      <p style={{ fontSize: "1.1rem", color: "var(--cor-texto-suave)", maxWidth: 520, margin: "0 auto 2rem" }}>
        Instrumentos musicais para todos os níveis — da primeira guitarra ao equipamento de estúdio profissional.
      </p>
      <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
        <Link to="/catalogo" className="btn btn-primario">Ver catálogo</Link>
        {!usuario && <Link to="/registrar" className="btn btn-secundario">Criar conta</Link>}
      </div>
    </div>
  );
}
