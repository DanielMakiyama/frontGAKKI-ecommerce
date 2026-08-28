import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

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

  async function cancelar(id) {
    setErro(""); setMensagem("");
    try {
      await api.cancelarPedido(id);
      setMensagem("Pedido cancelado. O estoque foi devolvido.");
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function confirmarRecebimento(id) {
    setErro(""); setMensagem("");
    try {
      await api.confirmarRecebimentoPedido(id);
      setMensagem("Recebimento confirmado, obrigado!");
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function solicitarTroca(itemPedidoId) {
    const justificativa = window.prompt("Descreva o motivo da troca:");
    if (!justificativa) return;
    setErro(""); setMensagem("");
    try {
      await api.solicitarTroca({ itemPedidoId, justificativa });
      setMensagem("Troca solicitada! Acompanhe o andamento em 'Minhas trocas'.");
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  if (carregando) return <div className="container"><p>Carregando…</p></div>;

  return (
    <div className="container" style={{ maxWidth: 780 }}>
      <div className="pagina-titulo">
        <h1>Meus pedidos</h1>
        <p>Veja também seus <Link to="/cupons" style={{ color: "var(--cor-latao-escuro)", fontWeight: 600 }}>cupons</Link>.</p>
      </div>

      {erro && <div className="erro-form">{erro}</div>}
      {mensagem && <p style={{ color: "var(--cor-sucesso)", fontWeight: 600 }}>{mensagem}</p>}

      {pedidos.length === 0 ? (
        <p>Você ainda não fez nenhum pedido.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {pedidos.map((p) => (
            <div className="card card-pad" key={p.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".5rem" }}>
                <strong>Pedido {p.numero}</strong>
                <span className={`status-tag status-${p.status}`}>{p.status.replaceAll("_", " ")}</span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--cor-texto-suave)" }}>
                {new Date(p.criadoEm).toLocaleString("pt-BR")}
              </p>
              <ul style={{ margin: ".5rem 0", paddingLeft: "1.1rem" }}>
                {p.itens.map((item) => (
                  <li key={item.itemPedidoId}>
                    {item.quantidade}x {item.instrumento} — {item.valorUnitario?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    {item.emTroca ? (
                      <span style={{ marginLeft: ".4rem", fontSize: "0.75rem", color: "var(--cor-latao-escuro)" }}>(em troca)</span>
                    ) : p.status === "ENTREGUE" ? (
                      <button className="btn btn-secundario btn-sm" style={{ marginLeft: ".6rem", padding: "0.1rem 0.5rem", fontSize: "0.75rem" }}
                              onClick={() => solicitarTroca(item.itemPedidoId)}>
                        Solicitar troca
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>

              {p.pagamentosCartao?.length > 0 && (
                <p style={{ fontSize: "0.8rem", color: "var(--cor-texto-suave)" }}>
                  Pago com: {p.pagamentosCartao.map((pg) => `${pg.cartaoApelido} •••• ${pg.ultimosDigitos} (${pg.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})`).join(" + ")}
                </p>
              )}
              {p.cuponsUtilizados?.length > 0 && (
                <p style={{ fontSize: "0.8rem", color: "var(--cor-texto-suave)" }}>Cupons: {p.cuponsUtilizados.join(", ")}</p>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", fontWeight: 700, marginTop: ".5rem" }}>
                <span>Total: {p.valorTotal?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
              </div>

              <div style={{ display: "flex", gap: ".5rem", marginTop: "1rem", flexWrap: "wrap" }}>
                {(p.status === "EM_ABERTO" || p.status === "EM_PROCESSAMENTO") && (
                  <button className="btn btn-perigo btn-sm" onClick={() => cancelar(p.id)}>Cancelar pedido</button>
                )}
                {p.status === "EM_TRANSITO" && (
                  <button className="btn btn-primario btn-sm" onClick={() => confirmarRecebimento(p.id)}>Confirmar recebimento</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
