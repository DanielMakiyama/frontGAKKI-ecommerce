import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Trash2, ArrowLeft, ShieldCheck } from "lucide-react";
import { useCart } from "../context/CartContext";
import IconeInstrumento from "../components/IconeInstrumento";
import SeletorQuantidade from "../components/SeletorQuantidade";
import { formatarBRL } from "../components/ProdutoCard";

export default function Carrinho() {
  const { carrinho, recarregar, atualizarQuantidade, remover, carregando } = useCart();
  const navigate = useNavigate();

  useEffect(() => { recarregar(); }, [recarregar]);

  if (carregando && !carrinho) {
    return <div className="container container-medio"><p>Carregando…</p></div>;
  }

  const itens = carrinho?.itens || [];
  const totalPecas = itens.reduce((acc, i) => acc + i.quantidade, 0);

  if (itens.length === 0) {
    return (
      <div className="container container-medio">
        <div className="pagina-titulo"><h1>Seu carrinho</h1></div>
        <div className="card card-pad estado-vazio">
          <ShoppingBag size={40} strokeWidth={1.3} />
          <p>Seu carrinho está vazio.</p>
          <Link to="/catalogo" className="btn btn-primario">Ver catálogo</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container container-medio">
      <div className="pagina-titulo">
        <h1>Seu carrinho</h1>
        <p>{totalPecas} {totalPecas === 1 ? "item" : "itens"}</p>
      </div>

      <div className="carrinho-layout">
        <section className="card lista-itens" aria-label="Itens do carrinho">
          {itens.map((item) => (
            <article className="item-carrinho" key={item.itemId}>
              <Link to={`/produtos/${item.instrumentoId}`} className="item-thumb" aria-hidden="true" tabIndex={-1}>
                <IconeInstrumento />
              </Link>

              <div className="item-info">
                <Link to={`/produtos/${item.instrumentoId}`} className="item-nome">
                  {item.nomeInstrumento}
                </Link>
                <span className="item-unitario">{formatarBRL(item.valorUnitario)} cada</span>
              </div>

              <SeletorQuantidade
                id={`qtd-${item.itemId}`}
                valor={item.quantidade}
                aoMudar={(n) => atualizarQuantidade(item.itemId, n)}
              />

              <span className="item-subtotal">{formatarBRL(item.valorUnitario * item.quantidade)}</span>

              <button
                className="btn-icone-perigo"
                onClick={() => remover(item.itemId)}
                aria-label={`Remover ${item.nomeInstrumento} do carrinho`}
              >
                <Trash2 size={17} strokeWidth={1.8} />
              </button>
            </article>
          ))}

          <div className="rodape-lista">
            <Link to="/catalogo" className="link-voltar">
              <ArrowLeft size={16} strokeWidth={2} /> Continuar comprando
            </Link>
          </div>
        </section>

        <aside className="resumo-lateral card card-pad" aria-label="Resumo do pedido">
          <h2>Resumo</h2>

          <div className="linha-resumo">
            <span>Subtotal ({totalPecas} {totalPecas === 1 ? "item" : "itens"})</span>
            <span>{formatarBRL(carrinho.valorTotal)}</span>
          </div>
          <div className="linha-resumo">
            <span>Frete</span>
            <span className="valor-pendente">calculado na próxima etapa</span>
          </div>

          <div className="resumo-total">
            <span>Total parcial</span>
            <span>{formatarBRL(carrinho.valorTotal)}</span>
          </div>

          <button className="btn btn-primario btn-block" onClick={() => navigate("/checkout")}>
            Finalizar compra
          </button>

          <p className="nota-seguranca">
            <ShieldCheck size={15} strokeWidth={1.8} />
            Os itens ficam reservados por 15 minutos.
          </p>
        </aside>
      </div>
    </div>
  );
}
