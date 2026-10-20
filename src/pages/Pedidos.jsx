import { Package } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

const formatarBRL = (valor) =>
  (valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/*
 * Seleção dos itens a trocar (RF0041, RN0041).
 *
 * A RN0041 fala em "selecionar os itens" da compra entregue, no plural, e
 * o pedido de troca nasce com todos eles de uma vez. O protótipo mandava
 * um item por vez, por um window.prompt, junto de uma justificativa que
 * o DRS não pede em lugar nenhum.
 *
 * Caixa de seleção e quantidade em campos de verdade, e não em prompt do
 * navegador: além de ser o que o cliente espera, é o que o Selenium
 * consegue dirigir — window.prompt bloqueia o driver.
 */
function PainelTroca({ pedido, aoSolicitar }) {
  const trocaveis = pedido.itens.filter((item) => !item.emTroca);
  const [selecao, setSelecao] = useState({});
  const [enviando, setEnviando] = useState(false);

  if (trocaveis.length === 0) return null;

  function alternar(item, marcado) {
    setSelecao((atual) => {
      const novo = { ...atual };
      if (marcado) novo[item.itemPedidoId] = item.quantidade;
      else delete novo[item.itemPedidoId];
      return novo;
    });
  }

  function mudarQuantidade(item, valor) {
    const limitada = Math.min(Math.max(1, Number(valor) || 1), item.quantidade);
    setSelecao((atual) => ({ ...atual, [item.itemPedidoId]: limitada }));
  }

  const itensSelecionados = Object.entries(selecao).map(([itemPedidoId, quantidade]) => ({
    itemPedidoId: Number(itemPedidoId),
    quantidade,
  }));

  async function enviar() {
    setEnviando(true);
    try {
      await aoSolicitar({ pedidoId: pedido.id, itens: itensSelecionados });
      setSelecao({});
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="painel-troca" data-testid="painel-troca" data-pedido-id={pedido.id}>
      <p>Selecione os itens que deseja trocar:</p>

      {trocaveis.map((item) => {
        const marcado = selecao[item.itemPedidoId] !== undefined;
        return (
          <div className="linha-item-troca" key={item.itemPedidoId} data-testid="linha-item-troca">
            <label>
              <input
                type="checkbox"
                data-testid="check-item-troca"
                data-item-pedido-id={item.itemPedidoId}
                checked={marcado}
                onChange={(e) => alternar(item, e.target.checked)}
              />
              {item.instrumento}
            </label>

            {/* A quantidade a trocar nunca passa da comprada; o backend
                recusa de todo jeito, mas o max evita o erro inútil. */}
            {marcado && item.quantidade > 1 && (
              <input
                type="number"
                min={1}
                max={item.quantidade}
                value={selecao[item.itemPedidoId]}
                data-testid="qtd-item-troca"
                aria-label={`Quantidade de ${item.instrumento} para troca`}
                onChange={(e) => mudarQuantidade(item, e.target.value)}
              />
            )}
            {marcado && item.quantidade > 1 && (
              <span style={{ color: "var(--cor-texto-suave)", fontSize: "0.8rem" }}>de {item.quantidade}</span>
            )}
          </div>
        );
      })}

      <button
        className="btn btn-secundario btn-sm"
        style={{ marginTop: ".6rem" }}
        data-testid="btn-solicitar-troca"
        disabled={itensSelecionados.length === 0 || enviando}
        onClick={enviar}
      >
        {enviando ? "Enviando…" : "Solicitar troca"}
      </button>
    </div>
  );
}

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  function carregar() {
    setCarregando(true);
    api.meusPedidos().then(setPedidos).finally(() => setCarregando(false));
  }

  useEffect(carregar, []);

  async function solicitarTroca(payload) {
    setErro(""); setMensagem("");
    try {
      const troca = await api.solicitarTroca(payload);
      setMensagem(`Troca ${troca.numero} solicitada! Acompanhe o andamento em "Minhas trocas".`);
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  if (carregando) return <div className="container"><p>Carregando…</p></div>;

  return (
    <div className="container" style={{ maxWidth: 780 }}>
      <div className="pagina-titulo">
        <h1 className="titulo-com-icone"><Package size={26} strokeWidth={1.6} /> Meus pedidos</h1>
        <p>
          Veja também suas <Link to="/trocas" style={{ color: "var(--cor-latao-escuro)", fontWeight: 600 }}>trocas</Link>
          {" "}e seus <Link to="/cupons" style={{ color: "var(--cor-latao-escuro)", fontWeight: 600 }}>cupons</Link>.
        </p>
      </div>

      {erro && <div className="erro-form">{erro}</div>}
      {mensagem && <p style={{ color: "var(--cor-sucesso)", fontWeight: 600 }} data-testid="mensagem-pedidos">{mensagem}</p>}

      {pedidos.length === 0 ? (
        <p data-testid="sem-pedidos">Você ainda não fez nenhum pedido.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {pedidos.map((p) => (
            <div className="card card-pad" key={p.id} data-testid="pedido"
                 data-numero={p.numero} data-status={p.status}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".5rem" }}>
                <strong data-testid="pedido-numero-lista">Pedido {p.numero}</strong>
                <span className={`status-tag status-${p.status}`} data-testid="pedido-status-lista">{p.status.replaceAll("_", " ")}</span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--cor-texto-suave)" }}>
                {new Date(p.criadoEm).toLocaleString("pt-BR")}
              </p>
              <ul style={{ margin: ".5rem 0", paddingLeft: "1.1rem" }}>
                {p.itens.map((item) => (
                  <li key={item.itemPedidoId}>
                    {item.quantidade}x {item.instrumento} — {formatarBRL(item.valorUnitario)}
                    {item.emTroca && (
                      <span style={{ marginLeft: ".4rem", fontSize: "0.75rem", color: "var(--cor-latao-escuro)" }}>(em troca)</span>
                    )}
                  </li>
                ))}
              </ul>

              {p.pagamentosCartao?.length > 0 && (
                <p style={{ fontSize: "0.8rem", color: "var(--cor-texto-suave)" }}>
                  Pago com: {p.pagamentosCartao.map((pg) => `${pg.cartaoApelido} •••• ${pg.ultimosDigitos} (${formatarBRL(pg.valor)})`).join(" + ")}
                </p>
              )}
              {p.cuponsUtilizados?.length > 0 && (
                <p style={{ fontSize: "0.8rem", color: "var(--cor-texto-suave)" }} data-testid="pedido-cupons-lista">Cupons: {p.cuponsUtilizados.join(", ")}</p>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: ".5rem" }}>
                <span data-testid="pedido-frete-lista">Frete: {formatarBRL(p.valorFrete)}</span>
                <span data-testid="pedido-total-lista">Total: {formatarBRL(p.valorTotal)}</span>
              </div>

              {/*
                RN0041 — a troca só existe para compra entregue, e quem move
                o pedido até ENTREGUE é o administrador (RF0039, RF0040).
                Os botões de cancelar e de confirmar recebimento que havia
                aqui saíram: o DRS não dá essas ações ao cliente, e os
                endpoints que eles chamavam nunca existiram no backend.
              */}
              {p.status === "ENTREGUE" && <PainelTroca pedido={p} aoSolicitar={solicitarTroca} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
