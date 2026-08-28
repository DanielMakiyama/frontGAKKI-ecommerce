import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      const resp = await api.login(email, senha);
      login(resp.nome, resp.perfil, resp.token);
      navigate(location.state?.from || "/catalogo");
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <div className="pagina-titulo">
        <h1>Entrar</h1>
        <p>Acesse sua conta GAKKI STORE.</p>
      </div>
      <form className="card card-pad" onSubmit={handleSubmit}>
        {erro && <div className="erro-form">{erro}</div>}
        <div className="campo">
          <label>E-mail</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="campo">
          <label>Senha</label>
          <input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primario btn-block" disabled={enviando}>
          {enviando ? "Entrando…" : "Entrar"}
        </button>
        <p style={{ marginTop: "1rem", fontSize: "0.88rem", textAlign: "center" }}>
          Não tem conta? <Link to="/registrar" style={{ color: "var(--cor-latao-escuro)", fontWeight: 600 }}>Criar conta</Link>
        </p>
        <p style={{ marginTop: ".5rem", fontSize: "0.78rem", color: "var(--cor-texto-suave)", textAlign: "center" }}>
          Demo: cliente@gakkistore.com / Cliente@123 · admin@gakkistore.com / Admin@123
        </p>
      </form>
    </div>
  );
}
