import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Trash2, ArrowLeft, ShieldCheck, Clock, RotateCcw, AlertTriangle } from "lucide-react";
import { useCart } from "../context/CartContext";
import IconeInstrumento from "../components/IconeInstrumento";
import SeletorQuantidade from "../components/SeletorQuantidade";
import { formatarBRL } from "../components/ProdutoCard";

/*
 * Carrinho, com o bloqueio temporário dos itens (RN0044, RN0045, RNF0042).
 *
 * A contagem que aparece aqui é só a leitura de `bloqueadoAte`, que vem
 * do servidor: quem decide se o prazo venceu é o backend, no próximo
 * acesso ao carrinho. Ao chegar a zero a tela não retira nada — ela
 * recarrega, e o servidor é que move os itens para a lista de retirados.
 * Qualquer outra divisão deixaria a regra na mão do relógio do cliente.
 */

function segundosRestantes(bloqueadoAte) {
  if (!bloqueadoAte) return null;
  return Math.max(0, Math.round((new Date(bloqueadoAte).getTime() - Date.now()) / 1000));
}

function mmss(segundos) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function minutosDoPrazo(prazoBloqueioSegundos) {
  if (!prazoBloqueioSegundos) return null;
  if (prazoBloqueioSegundos < 60) return `${prazoBloqueioSegundos} segundos`;
  const minutos = Math.round(prazoBloqueioSegundos / 60);
  return `${minutos} ${minutos === 1 ? "minuto" : "minutos"}`;
}

function Contagem({ bloqueadoAte, aoExpirar }) {
  const [restante, setRestante] = useState(() => segundosRestantes(bloqueadoAte));

  useEffect(() => {
    setRestante(segundosRestantes(bloqueadoAte));
    if (!bloqueadoAte) return;

    const id = setInterval(() => {
      const faltam = segundosRestantes(bloqueadoAte);
      setRestante(faltam);

      // Zerou: pede o carrinho de novo, e é o backend que aplica a RN0045.
      // O clearInterval antes do aoExpirar evita disparar duas vezes
      // enquanto a resposta não chega.
      if (faltam <= 0) {
        clearInterval(id);
        aoExpirar();
      }
    }, 1000);

    return () => clearInterval(id);
  }, [bloqueadoAte, aoExpirar]);

  if (restante === null) return null;

  return (
    <p className={`nota-bloqueio${restante <= 60 ? " nota-bloqueio-urgente" : ""}`} data-testid="contagem-bloqueio">
      <Clock size={15} strokeWidth={1.8} />
      {restante > 0 ? (
        <>
          Itens reservados por mais <strong data-testid="contagem-valor">{mmss(restante)}</strong>
        </>
      ) : (
        <>Prazo encerrado, atualizando o carrinho…</>
      )}
    </p>
  );
}

export default function Carrinho() {
  const {
    carrinho,
    recarregar,
    atualizarQuantidade,
    remover,
    restaurarRetirado,
    descartarRetirado,
    descartarRetirados,
    carregando,
  } = useCart();
  const navigate = useNavigate();
  const [erro, setErro] = useState("");

  useEffect(() => { recarregar(); }, [recarregar]);

  const aoExpirar = useCallback(() => { recarregar(); }, [recarregar]);

  async function executar(acao) {
    setErro("");
    try {
      await acao();
    } catch (e) {
      setErro(e.message);
    }
  }

  if (carregando && !carrinho) {
    return <div className="container container-medio"><p>Carregando…</p></div>;
  }

  const itens = carrinho?.itens || [];
  const retirados = carrinho?.itensRetirados || [];
  const totalPecas = itens.reduce((acc, i) => acc + i.quantidade, 0);
  const prazo = minutosDoPrazo(carrinho?.prazoBloqueioSegundos);

  // Carrinho sem itens mas com itens retirados NÃO é carrinho vazio: é
  // exatamente o estado que a RNF0042 manda apresentar ao cliente. Cair
  // na tela de vazio aqui esconderia os itens e tiraria dele a chance de
  // devolvê-los.
  if (itens.length === 0 && retirados.length === 0) {
    return (
      <div className="container container-medio">
        <div className="pagina-titulo"><h1>Seu carrinho</h1></div>
        <div className="card card-pad estado-vazio" data-testid="carrinho-vazio">
          <ShoppingBag size={40} strokeWidth={1.3} />
          <p>Seu carrinho está vazio.</p>
          <Link to="/catalogo" className="btn btn-primario">Ver catálogo</Link>
        </div>
      </div>
    );
  }

  const podeComprar = carrinho?.podeComprar === true;

  return (
    <div className="container container-medio">
      <div className="pagina-titulo">
        <h1>Seu carrinho</h1>
        <p>{totalPecas} {totalPecas === 1 ? "item" : "itens"}</p>
      </div>

      {erro && <div className="erro-form" data-testid="erro-carrinho">{erro}</div>}

      {/* RNF0042 — o que saiu do carrinho quando o prazo venceu. */}
      {retirados.length > 0 && (
        <section className="card card-pad aviso-retirados" data-testid="itens-retirados" aria-label="Itens retirados do carrinho">
          <div className="aviso-retirados-topo">
            <p className="aviso-retirados-titulo" data-testid="aviso-itens-retirados">
              <AlertTriangle size={17} strokeWidth={1.9} />
              O prazo de reserva venceu e {retirados.length === 1 ? "este item saiu" : "estes itens saíram"} do
              seu carrinho. Devolva ao carrinho o que ainda quiser comprar — a disponibilidade é conferida de novo,
              porque nesse tempo outra pessoa pode ter levado a última unidade.
            </p>
            {retirados.length > 1 && (
              <button
                className="btn btn-secundario btn-sm"
                data-testid="btn-descartar-todos"
                onClick={() => executar(descartarRetirados)}
              >
                Descartar todos
              </button>
            )}
          </div>

          <ul className="lista-retirados">
            {retirados.map((item) => (
              <li key={item.itemRetiradoId} data-testid="item-retirado" data-item-retirado-id={item.itemRetiradoId}>
                <span className="retirado-nome" data-testid="item-retirado-nome">
                  {item.quantidade}x {item.nomeInstrumento}
                </span>
                <span className="retirado-valor">{formatarBRL(item.valorUnitario)} cada</span>
                <span className="retirado-acoes">
                  <button
                    className="btn btn-primario btn-sm"
                    data-testid="btn-restaurar-item"
                    onClick={() => executar(() => restaurarRetirado(item.itemRetiradoId))}
                  >
                    <RotateCcw size={14} strokeWidth={2} /> Devolver ao carrinho
                  </button>
                  <button
                    className="btn-icone-perigo"
                    data-testid="btn-descartar-item"
                    onClick={() => executar(() => descartarRetirado(item.itemRetiradoId))}
                    aria-label={`Descartar ${item.nomeInstrumento}`}
                  >
                    <Trash2 size={17} strokeWidth={1.8} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="carrinho-layout">
        <section className="card lista-itens" aria-label="Itens do carrinho">
          {itens.length === 0 ? (
            <p className="card-pad" data-testid="carrinho-sem-itens-ativos">
              Não há itens ativos no carrinho.
            </p>
          ) : itens.map((item) => (
            <article className="item-carrinho" key={item.itemId} data-testid="item-carrinho" data-item-id={item.itemId}>
              <Link to={`/produtos/${item.instrumentoId}`} className="item-thumb" aria-hidden="true" tabIndex={-1}>
                <IconeInstrumento />
              </Link>

              <div className="item-info">
                <Link to={`/produtos/${item.instrumentoId}`} className="item-nome" data-testid="item-nome">
                  {item.nomeInstrumento}
                </Link>
                <span className="item-unitario">{formatarBRL(item.valorUnitario)} cada</span>
              </div>

              <SeletorQuantidade
                id={`qtd-${item.itemId}`}
                valor={item.quantidade}
                aoMudar={(n) => executar(() => atualizarQuantidade(item.itemId, n))}
              />

              <span className="item-subtotal" data-testid="item-subtotal">{formatarBRL(item.valorUnitario * item.quantidade)}</span>

              <button
                className="btn-icone-perigo"
                data-testid="btn-remover-item"
                onClick={() => executar(() => remover(item.itemId))}
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
            <span data-testid="carrinho-total">{formatarBRL(carrinho.valorTotal)}</span>
          </div>

          {/* RNF0042 — a compra fica desabilitada enquanto houver item
              retirado. O servidor recusa de todo jeito; o botão
              desabilitado só evita que o cliente chegue ao checkout para
              tomar um erro no fim. */}
          <button
            className="btn btn-primario btn-block"
            data-testid="btn-finalizar-compra"
            disabled={!podeComprar}
            title={podeComprar ? undefined : "Resolva os itens retirados do carrinho para continuar"}
            onClick={() => navigate("/checkout")}
          >
            Finalizar compra
          </button>

          {!podeComprar && retirados.length > 0 && (
            <p className="nota-bloqueio nota-bloqueio-urgente" data-testid="motivo-compra-bloqueada">
              <AlertTriangle size={15} strokeWidth={1.9} />
              Devolva ao carrinho ou descarte os itens retirados para continuar.
            </p>
          )}

          <Contagem bloqueadoAte={carrinho?.bloqueadoAte} aoExpirar={aoExpirar} />

          <p className="nota-seguranca">
            <ShieldCheck size={15} strokeWidth={1.8} />
            {prazo
              ? `Os itens ficam reservados por ${prazo} a contar da última inclusão.`
              : "Os itens são reservados por um prazo a contar da última inclusão."}
          </p>
        </aside>
      </div>
    </div>
  );
}
