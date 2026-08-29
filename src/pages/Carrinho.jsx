import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function Carrinho() {
  const { carrinho, recarregar, atualizarQuantidade, remover, carregando } = useCart();
  const navigate = useNavigate();

  useEffect(() => { recarregar(); }, [recarregar]);

  if (carregando && !carrinho) return <div className="container"><p>Carregando…</p></div>;

  const itens = carrinho?.itens || [];

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <div className="pagina-titulo">
        <h1>Seu carrinho</h1>
      </div>

      {itens.length === 0 ? (
        <div className="card card-pad estado-vazio">
          <ShoppingBag size={40} strokeWidth={1.3} />
          <p>Seu carrinho está vazio.</p>
          <Link to="/catalogo" className="btn btn-secundario">Ver catálogo</Link>
        </div>
      ) : (
        <div className="card card-pad">
          {itens.map((item) => (
            <div className="linha-carrinho" key={item.itemId}>
              <div className="info">
                <div className="nome">{item.nomeInstrumento}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--cor-texto-suave)" }}>
                  {item.valorUnitario?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} un.
                </div>
              </div>
              <div className="quantidade-controle">
                <button onClick={() => atualizarQuantidade(item.itemId, item.quantidade - 1)} aria-label="Diminuir quantidade">
                  <Minus size={14} strokeWidth={2} />
                </button>
                <span>{item.quantidade}</span>
                <button onClick={() => atualizarQuantidade(item.itemId, item.quantidade + 1)} aria-label="Aumentar quantidade">
                  <Plus size={14} strokeWidth={2} />
                </button>
              </div>
              <div style={{ width: 90, textAlign: "right", fontWeight: 700 }}>
                {(item.valorUnitario * item.quantidade).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
              <button className="btn-icone-perigo" onClick={() => remover(item.itemId)} aria-label="Remover item">
                <Trash2 size={17} strokeWidth={1.8} />
              </button>
            </div>
          ))}

          <div className="resumo-total">
            <span>Subtotal</span>
            <span>{carrinho.valorTotal?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--cor-texto-suave)", marginTop: ".3rem" }}>
            Frete calculado na próxima etapa.
          </p>
          <button className="btn btn-primario btn-block" style={{ marginTop: "1rem" }} onClick={() => navigate("/checkout")}>
            Finalizar compra
          </button>
        </div>
      )}
    </div>
  );
}
