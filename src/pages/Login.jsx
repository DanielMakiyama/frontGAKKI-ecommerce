import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, User } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

/**
 * Contas de demonstração.
 *
 * O formulário de e-mail e senha foi removido de propósito: em
 * apresentação, digitar credencial só gera erro de digitação e tempo
 * perdido. Aqui o acesso é um clique por perfil.
 *
 * A senha viaja junto porque o backend real a verifica (BCrypt, RNF0033)
 * — o mock aceitava qualquer coisa. Para quem assiste, nada muda: segue
 * um clique. Credencial em código só é aceitável porque estas são contas
 * de demonstração do seed (V999), sem dado real de ninguém.
 *
 * Os e-mails existem no `V999__seed_dev.sql`.
 */
const CONTAS_DEMO = [
  {
    id: "cliente",
    email: "cliente@gakkistore.com",
    senha: "Cliente@2026",
    rotulo: "Entrar como cliente",
    descricao: "Navega no catálogo, compra, acompanha pedidos e trocas.",
    Icone: User,
    destino: "/catalogo",
  },
  {
    id: "admin",
    email: "admin@gakkistore.com",
    senha: "Admin@2026",
    rotulo: "Entrar como administrador",
    descricao: "Painel de vendas, estoque, trocas e cadastro de produtos.",
    Icone: LayoutDashboard,
    destino: "/admin",
  },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Guarda QUAL conta está entrando, não um booleano: assim só o botão
  // clicado mostra "Entrando…" — com um booleano os dois piscariam.
  const [entrando, setEntrando] = useState(null);
  const [erro, setErro] = useState("");

  async function acessar(conta) {
    setErro("");
    setEntrando(conta.id);
    try {
      const resp = await api.login(conta.email, conta.senha);
      login(resp.nome, resp.perfil, resp.token);
      // `state.from` tem prioridade: quem foi barrado tentando abrir uma
      // página específica volta para ela, não para o destino padrão.
      navigate(location.state?.from || conta.destino);
    } catch (e) {
      setErro(e.message);
      setEntrando(null);
    }
  }

  return (
    <div className="container container-estreito">
      <div className="pagina-titulo">
        <h1>Entrar</h1>
        <p>Escolha um perfil para acessar a GAKKI STORE.</p>
      </div>

      {erro && <div className="erro-form" role="alert">{erro}</div>}

      <div className="grade-perfis">
        {CONTAS_DEMO.map((conta) => (
          <button
            key={conta.id}
            type="button"
            // Seletor estável para os testes automatizados: não depende
            // do texto do botão, que muda para "Entrando…" durante a
            // requisição e quebraria a busca por texto.
            data-perfil={conta.id}
            className="card cartao-perfil"
            onClick={() => acessar(conta)}
            disabled={entrando !== null}
          >
            <conta.Icone size={30} strokeWidth={1.6} />
            <strong>{conta.rotulo}</strong>
            <span className="perfil-descricao">{conta.descricao}</span>
            <span className="email-demo">{conta.email}</span>
            <span className="btn btn-primario btn-sm btn-block" aria-hidden="true">
              {entrando === conta.id ? "Entrando…" : "Acessar"}
            </span>
          </button>
        ))}
      </div>

      <p className="rodape-login">
        Quer usar uma conta própria? <Link to="/registrar">Criar conta</Link>
      </p>
    </div>
  );
}
