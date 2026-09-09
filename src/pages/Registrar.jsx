import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Registrar() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ nome: "", email: "", senha: "", confirmacaoSenha: "", telefone: "" });
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  function set(campo) {
    return (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      await api.registrar(form);
      // Entra direto com a conta recém-criada. A tela de login agora só
      // oferece os perfis de demonstração, então mandar o novo cadastro
      // para lá deixaria a pessoa sem porta de entrada.
      const sessao = await api.login(form.email, form.senha);
      login(sessao.nome, sessao.perfil, sessao.token);
      navigate("/catalogo");
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="container container-estreito">
      <div className="pagina-titulo">
        <h1>Criar conta</h1>
        <p>Cadastre-se para comprar na GAKKI STORE.</p>
      </div>
      <form className="card card-pad" onSubmit={handleSubmit}>
        {erro && <div className="erro-form">{erro}</div>}
        <div className="campo">
          <label>Nome completo</label>
          <input required value={form.nome} onChange={set("nome")} />
        </div>
        <div className="campo">
          <label>E-mail</label>
          <input type="email" required value={form.email} onChange={set("email")} />
        </div>
        <div className="campo">
          <label>Telefone</label>
          <input value={form.telefone} onChange={set("telefone")} />
        </div>
        <div className="campo">
          <label>Senha (mín. 8 caracteres, maiúscula, minúscula, número e símbolo)</label>
          <input type="password" required value={form.senha} onChange={set("senha")} />
        </div>
        <div className="campo">
          <label>Confirmar senha</label>
          <input type="password" required value={form.confirmacaoSenha} onChange={set("confirmacaoSenha")} />
        </div>
        <button type="submit" className="btn btn-primario btn-block" disabled={enviando}>
          {enviando ? "Criando…" : "Criar conta"}
        </button>
        <p className="rodape-login">
          Só quer dar uma olhada? <Link to="/login">Usar um perfil de demonstração</Link>
        </p>
      </form>
    </div>
  );
}
