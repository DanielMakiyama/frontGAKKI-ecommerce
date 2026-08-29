import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client";

const ROTULOS_STATUS = {
  TROCA_SOLICITADA: "Solicitada, aguardando análise",
  TROCA_ACEITA: "Aceita — envie o item de volta",
  TROCA_NEGADA: "Negada",
  ITEM_ENVIADO: "Você informou o envio, aguardando recebimento",
  ITEM_RECEBIDO: "Item recebido, aguardando processamento",
  TROCA_PROCESSADA: "Concluída — cupom gerado",
};

export default function Trocas() {
  const [trocas, setTrocas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  function carregar() {
    setCarregando(true);
    api.minhasTrocas().then(setTrocas).finally(() => setCarregando(false));
  }

  useEffect(carregar, []);

  async function informarEnvio(id) {
    setErro(""); setMensagem("");
    try {
      await api.informarEnvioTroca(id);
      setMensagem("Envio informado! Assim que recebermos o item, o cupom será gerado.");
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  if (carregando) return <div className="container"><p>Carregando…</p></div>;

  return (
    <div className="container" style={{ maxWidth: 700 }}>
      <div className="pagina-titulo">
        <h1 className="titulo-com-icone"><RefreshCw size={26} strokeWidth={1.6} /> Minhas trocas</h1>
        <p>Acompanhe o andamento das trocas solicitadas nos seus pedidos.</p>
      </div>

      {erro && <div className="erro-form">{erro}</div>}
      {mensagem && <p style={{ color: "var(--cor-sucesso)", fontWeight: 600 }}>{mensagem}</p>}

      {trocas.length === 0 ? (
        <p>Você ainda não solicitou nenhuma troca. Isso é feito a partir de um pedido já entregue.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {trocas.map((t) => (
            <div className="card card-pad" key={t.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>{t.instrumento}</strong>
                <span className="status-tag status-EM_TROCA">{t.status.replaceAll("_", " ")}</span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--cor-texto-suave)" }}>Pedido {t.pedidoNumero}</p>
              <p style={{ fontSize: "0.88rem", marginTop: ".4rem" }}>{ROTULOS_STATUS[t.status]}</p>
              {t.justificativaCliente && <p style={{ fontSize: "0.82rem", fontStyle: "italic" }}>"{t.justificativaCliente}"</p>}
              {t.motivoNegativa && <p style={{ fontSize: "0.82rem", color: "var(--cor-perigo)" }}>Motivo: {t.motivoNegativa}</p>}
              {t.cupomGeradoCodigo && <p style={{ fontSize: "0.85rem", fontWeight: 700 }}>Cupom gerado: {t.cupomGeradoCodigo}</p>}

              {t.status === "TROCA_ACEITA" && (
                <button className="btn btn-primario btn-sm" style={{ marginTop: ".75rem" }} onClick={() => informarEnvio(t.id)}>
                  Informar que enviei o item
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
