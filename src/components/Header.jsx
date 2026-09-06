import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Package, Tag, RefreshCw, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import LogoGakki from "./LogoGakki";

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
    // Fechar com ESC além do clique fora: exigência básica de acessibilidade
    // para qualquer menu suspenso.
    function fecharComEsc(e) {
      if (e.key === "Escape") setMenuAberto(false);
    }
    document.addEventListener("mousedown", fecharAoClicarFora);
    document.addEventListener("keydown", fecharComEsc);
    return () => {
      document.removeEventListener("mousedown", fecharAoClicarFora);
      document.removeEventListener("keydown", fecharComEsc);
    };
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
        <Link to="/" className="gakki-logo" aria-label="GAKKI store — página inicial">
          <LogoGakki size={34} className="simbolo" />
          <span className="palavra-marca">
            GAKKI <span className="palavra-marca-sufixo">store</span>
          </span>
        </Link>

        <nav className="gakki-nav" aria-label="Navegação principal">
          {!isAdmin && (
            <NavLink to="/catalogo" className={({ isActive }) => (isActive ? "ativo" : undefined)}>
              Catálogo
            </NavLink>
          )}

          {usuario && !isAdmin && (
            <Link to="/carrinho" className="icone-acao" aria-label={`Carrinho (${totalItens} ${totalItens === 1 ? "item" : "itens"})`}>
              <ShoppingCart size={20} strokeWidth={1.8} />
              {totalItens > 0 && <span className="badge-carrinho" aria-hidden="true">{totalItens}</span>}
            </Link>
          )}

          {isAdmin && (
            <Link to="/admin" className="icone-acao" aria-label="Painel administrativo">
              <LayoutDashboard size={20} strokeWidth={1.8} />
            </Link>
          )}

          {usuario ? (
            <div className="menu-usuario" ref={menuRef}>
              <button
                className="icone-acao avatar-btn"
                onClick={() => setMenuAberto((a) => !a)}
                aria-label="Menu da conta"
                aria-expanded={menuAberto}
                aria-haspopup="menu"
              >
                <span className="avatar-iniciais" aria-hidden="true">{iniciais(usuario.nome)}</span>
                <ChevronDown size={15} strokeWidth={2} className={menuAberto ? "seta-menu aberta" : "seta-menu"} />
              </button>

              {menuAberto && (
                <div className="menu-dropdown" role="menu">
                  <div className="menu-dropdown-cabecalho">
                    <strong>{usuario.nome}</strong>
                    <span>{isAdmin ? "Administrador" : "Cliente"}</span>
                  </div>
                  {!isAdmin && (
                    <>
                      <Link to="/pedidos" role="menuitem" onClick={() => setMenuAberto(false)}><Package size={16} strokeWidth={1.8} /> Meus pedidos</Link>
                      <Link to="/trocas" role="menuitem" onClick={() => setMenuAberto(false)}><RefreshCw size={16} strokeWidth={1.8} /> Trocas</Link>
                      <Link to="/cupons" role="menuitem" onClick={() => setMenuAberto(false)}><Tag size={16} strokeWidth={1.8} /> Cupons</Link>
                      <Link to="/perfil" role="menuitem" onClick={() => setMenuAberto(false)}><User size={16} strokeWidth={1.8} /> Perfil</Link>
                    </>
                  )}
                  <button onClick={sair} role="menuitem"><LogOut size={16} strokeWidth={1.8} /> Sair</button>
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
