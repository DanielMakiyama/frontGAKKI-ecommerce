import { Bell, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client";

/*
 * Minhas trocas (RF0041 a RF0045, RN0046).
 *
 * Os três estados são os do DRS. O protótipo trabalhava com seis
 * (TROCA_SOLICITADA, TROCA_ACEITA, TROCA_NEGADA, ITEM_ENVIADO,
 * ITEM_RECEBIDO, TROCA_PROCESSADA) e com um botão de "informar envio" —
 * etapas que o DRS não descreve. Vale a mesma decisão tomada no status
 * do pedido: a especificação é a fonte, e a tela se ajusta a ela.
 *
 * Não há estado de recusa: a RF0042 só descreve o caminho da
 * autorização. A lacuna está registrada na seção 16.2 da Especificação
 * de Caso de Uso — inventar aqui uma tela de "troca negada" seria criar
 * requisito.
 */

const ROTULOS_STATUS = {
  EM_TROCA: "Solicitada — aguardando autorização da loja",
  TROCA_AUTORIZADA: "Autorizada — envie os itens de volta para a loja",
  TROCADO: "Concluída — cupom de troca disponível",
};

const formatarBRL = (valor) =>
  (valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Trocas() {
  const [trocas, setTrocas] = useState([]);
  const [notificacoes, setNotificacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  function carregar() {
    setCarregando(true);
    setErro("");

    // As duas listas em paralelo, e a falha de uma não apaga a outra: a
    // notificação é complemento, não pode derrubar a tela de trocas.
    Promise.allSettled([api.minhasTrocas(), api.minhasNotificacoes()])
      .then(([resultadoTrocas, resultadoNotificacoes]) => {
        if (resultadoTrocas.status === "fulfilled") setTrocas(resultadoTrocas.value);
        else setErro(resultadoTrocas.reason?.message || "Não foi possível carregar suas trocas.");

        if (resultadoNotificacoes.status === "fulfilled") setNotificacoes(resultadoNotificacoes.value);
      })
      .finally(() => setCarregando(false));
  }

  useEffect(carregar, []);

  if (carregando) return <div className="container"><p>Carregando…</p></div>;

  return (
    <div className="container" style={{ maxWidth: 700 }}>
      <div className="pagina-titulo">
        <h1 className="titulo-com-icone"><RefreshCw size={26} strokeWidth={1.6} /> Minhas trocas</h1>
        <p>Acompanhe o andamento das trocas solicitadas nos seus pedidos.</p>
      </div>

      {erro && <div className="erro-form">{erro}</div>}

      {/* RN0046 — a notificação gerada quando a loja autoriza a troca. */}
      {notificacoes.length > 0 && (
        <section className="card card-pad" style={{ marginBottom: "1.25rem" }} data-testid="notificacoes" aria-label="Notificações">
          <h2 className="titulo-com-icone" style={{ fontSize: "1rem", margin: "0 0 .6rem" }}>
            <Bell size={18} strokeWidth={1.8} /> Notificações
          </h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: ".5rem" }}>
            {notificacoes.map((n) => (
              <li key={n.id} data-testid="notificacao" style={{ fontSize: "0.88rem" }}>
                {n.mensagem}
                <span style={{ marginLeft: ".5rem", fontSize: "0.78rem", color: "var(--cor-texto-suave)" }}>
                  {new Date(n.criadoEm).toLocaleString("pt-BR")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {trocas.length === 0 ? (
        <p data-testid="sem-trocas">
          Você ainda não solicitou nenhuma troca. Isso é feito a partir de um pedido já entregue.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {trocas.map((t) => (
            <div className="card card-pad" key={t.id} data-testid="troca" data-numero={t.numero} data-status={t.status}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong data-testid="troca-numero">Troca {t.numero}</strong>
                <span className={`status-tag status-${t.status}`} data-testid="troca-status">
                  {t.status.replaceAll("_", " ")}
                </span>
              </div>

              <p style={{ fontSize: "0.85rem", color: "var(--cor-texto-suave)" }}>
                Pedido {t.pedidoNumero} · solicitada em {new Date(t.criadoEm).toLocaleString("pt-BR")}
              </p>

              <p style={{ fontSize: "0.88rem", marginTop: ".4rem" }} data-testid="troca-rotulo">
                {ROTULOS_STATUS[t.status] ?? t.status.replaceAll("_", " ")}
              </p>

              <ul style={{ margin: ".5rem 0", paddingLeft: "1.1rem" }}>
                {t.itens?.map((item) => (
                  <li key={item.itemTrocaId} data-testid="item-troca">
                    {item.quantidade}x {item.instrumento} — {formatarBRL(item.valorUnitario)}
                  </li>
                ))}
              </ul>

              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: ".5rem" }}>
                <span>Valor da troca</span>
                <span data-testid="troca-valor">{formatarBRL(t.valor)}</span>
              </div>

              {/* RF0045 — o cupom existe só depois do recebimento confirmado. */}
              {t.cupomGerado && (
                <p style={{ fontSize: "0.88rem", fontWeight: 700, marginTop: ".6rem" }} data-testid="troca-cupom">
                  Cupom de troca: {t.cupomGerado.codigo} ({formatarBRL(t.cupomGerado.valor)})
                  {t.cupomGerado.utilizado && (
                    <span style={{ fontWeight: 400, color: "var(--cor-texto-suave)" }}> — já utilizado</span>
                  )}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
