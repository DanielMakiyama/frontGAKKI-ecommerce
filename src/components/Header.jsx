import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Package, Tag, RefreshCw, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Header() {
  const { usuario, logout, isAdmin } = useAuth();
  const { totalItens } = useCart();
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function fecharAoClicarFora(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAberto(false);
    }
    document.addEventListener("mousedown", fecharAoClicarFora);
    return () => document.removeEventListener("mousedown", fecharAoClicarFora);
  }, []);

  function sair() {
    logout();
    setMenuAberto(false);
    navigate("/");
  }

  function iniciais(nome) {
    const partes = nome.trim().split(" ");
    return ((partes[0]?.[0] || "") + (partes[1]?.[0] || "")).toUpperCase();
  }

  return (
    <header className="gakki-header">
      <div className="container">
        <Link to="/" className="gakki-logo">
          <span className="marca" aria-hidden="true"></span>
          GAKKI <span>store</span>
        </Link>

        <nav className="gakki-nav">
          {!isAdmin && <Link to="/catalogo">Catálogo</Link>}

          {usuario && !isAdmin && (
            <Link to="/carrinho" className="icone-acao" aria-label="Carrinho">
              <ShoppingCart size={20} strokeWidth={1.8} />
              {totalItens > 0 && <span className="badge-carrinho">{totalItens}</span>}
            </Link>
          )}

          {isAdmin && (
            <Link to="/admin" className="icone-acao" aria-label="Painel administrativo">
              <LayoutDashboard size={20} strokeWidth={1.8} />
            </Link>
          )}

          {usuario ? (
            <div className="menu-usuario" ref={menuRef}>
              <button className="icone-acao avatar-btn" onClick={() => setMenuAberto((a) => !a)} aria-label="Menu da conta">
                <span className="avatar-iniciais">{iniciais(usuario.nome)}</span>
                <ChevronDown size={15} strokeWidth={2} />
              </button>

              {menuAberto && (
                <div className="menu-dropdown">
                  <div className="menu-dropdown-cabecalho">
                    <strong>{usuario.nome}</strong>
                    <span>{isAdmin ? "Administrador" : "Cliente"}</span>
                  </div>
                  {!isAdmin && (
                    <>
                      <Link to="/pedidos" onClick={() => setMenuAberto(false)}><Package size={16} strokeWidth={1.8} /> Meus pedidos</Link>
                      <Link to="/trocas" onClick={() => setMenuAberto(false)}><RefreshCw size={16} strokeWidth={1.8} /> Trocas</Link>
                      <Link to="/cupons" onClick={() => setMenuAberto(false)}><Tag size={16} strokeWidth={1.8} /> Cupons</Link>
                      <Link to="/perfil" onClick={() => setMenuAberto(false)}><User size={16} strokeWidth={1.8} /> Perfil</Link>
                    </>
                  )}
                  <button onClick={sair}><LogOut size={16} strokeWidth={1.8} /> Sair</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="icone-acao" aria-label="Entrar">
                <User size={20} strokeWidth={1.8} />
                <span className="rotulo-icone">Entrar</span>
              </Link>
              <Link to="/registrar" className="btn btn-primario btn-sm">Criar conta</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
