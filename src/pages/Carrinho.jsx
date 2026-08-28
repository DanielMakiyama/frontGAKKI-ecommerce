import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
        <div className="card card-pad">
          <p>Seu carrinho está vazio.</p>
          <Link to="/catalogo" className="btn btn-secundario" style={{ marginTop: "1rem" }}>Ver catálogo</Link>
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
                <button onClick={() => atualizarQuantidade(item.itemId, item.quantidade - 1)}>−</button>
                <span>{item.quantidade}</span>
                <button onClick={() => atualizarQuantidade(item.itemId, item.quantidade + 1)}>+</button>
              </div>
              <div style={{ width: 90, textAlign: "right", fontWeight: 700 }}>
                {(item.valorUnitario * item.quantidade).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
              <button className="btn btn-perigo btn-sm" onClick={() => remover(item.itemId)}>Remover</button>
            </div>
          ))}

          <div className="resumo-total">
            <span>Subtotal</span>
            <span>{carrinho.valorTotal?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
          </div>
          <button className="btn btn-primario btn-block" style={{ marginTop: "1rem" }} onClick={() => navigate("/checkout")}>
            Finalizar compra
          </button>
        </div>
      )}
    </div>
  );
}
