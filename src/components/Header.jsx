import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Header() {
  const { usuario, logout, isAdmin } = useAuth();
  const { totalItens } = useCart();
  const navigate = useNavigate();

  function sair() {
    logout();
    navigate("/");
  }

  return (
    <header className="gakki-header">
      <div className="container">
        <Link to="/" className="gakki-logo">
          GAKKI <span>store</span>
        </Link>

        <nav className="gakki-nav">
          <Link to="/catalogo">Catálogo</Link>
          {usuario && !isAdmin && <Link to="/carrinho">Carrinho{totalItens > 0 && <span className="badge-carrinho">{totalItens}</span>}</Link>}
          {usuario && !isAdmin && <Link to="/pedidos">Meus pedidos</Link>}
          {usuario && !isAdmin && <Link to="/trocas">Trocas</Link>}
          {usuario && !isAdmin && <Link to="/cupons">Cupons</Link>}
          {usuario && !isAdmin && <Link to="/perfil">Perfil</Link>}
          {isAdmin && <Link to="/admin">Admin</Link>}
          {usuario ? (
            <>
              <span style={{ color: "#cbbb9d", fontSize: "0.85rem" }}>Olá, {usuario.nome.split(" ")[0]}</span>
              <button className="link" onClick={sair}>Sair</button>
            </>
          ) : (
            <>
              <Link to="/login">Entrar</Link>
              <Link to="/registrar">Criar conta</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
