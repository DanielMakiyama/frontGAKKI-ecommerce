import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, RefreshCw, Users, Wallet, AlertCircle, ArrowRight } from "lucide-react";
import { api } from "../api/client";

const STATUS_ACAO_PENDENTE = ["EM_ABERTO", "EM_PROCESSAMENTO", "PAGAMENTO_REALIZADO"];
const STATUS_RECEITA = ["PAGAMENTO_REALIZADO", "EM_TRANSITO", "ENTREGUE"];
const TROCA_STATUS_PENDENTE = ["TROCA_SOLICITADA", "ITEM_ENVIADO", "ITEM_RECEBIDO"];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [dados, setDados] = useState(null);

  useEffect(() => {
    setCarregando(true);
    Promise.all([
      api.listarPedidosAdmin({ size: 200 }),
      api.listarClientes({ size: 1 }),
      api.listarTrocasAdmin(),
    ])
      .then(([pedidosPage, clientesPage, trocas]) => {
        const pedidos = pedidosPage.content || [];
        const contagemPorStatus = pedidos.reduce((acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        }, {});
        const receitaTotal = pedidos
          .filter((p) => STATUS_RECEITA.includes(p.status))
          .reduce((acc, p) => acc + p.valorTotal, 0);
        const pedidosAcaoPendente = pedidos.filter((p) => STATUS_ACAO_PENDENTE.includes(p.status)).length;
        const trocasPendentes = trocas.filter((t) => TROCA_STATUS_PENDENTE.includes(t.status)).length;

        setDados({
          totalPedidos: pedidosPage.totalElements ?? pedidos.length,
          receitaTotal,
          pedidosAcaoPendente,
          trocasPendentes,
          totalClientes: clientesPage.totalElements ?? 0,
          contagemPorStatus,
        });
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, []);

  if (carregando) return <div className="container"><p>Carregando painel…</p></div>;
  if (erro) return <div className="container"><div className="erro-form">{erro}</div></div>;

  return (
    <div className="container">
      <div className="pagina-titulo">
        <h1>Painel administrativo</h1>
        <p>Visão geral da loja em tempo real.</p>
      </div>

      <div className="grade-metricas">
        <div className="metrica-card">
          <Wallet size={20} strokeWidth={1.7} />
          <span className="metrica-valor">{dados.receitaTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
          <span className="metrica-label">Receita (pagamentos confirmados)</span>
        </div>
        <div className="metrica-card">
          <Package size={20} strokeWidth={1.7} />
          <span className="metrica-valor">{dados.totalPedidos}</span>
          <span className="metrica-label">Pedidos no total</span>
        </div>
        <div className="metrica-card metrica-destaque" onClick={() => navigate("/admin")}>
          <AlertCircle size={20} strokeWidth={1.7} />
          <span className="metrica-valor">{dados.pedidosAcaoPendente}</span>
          <span className="metrica-label">Pedidos aguardando sua ação</span>
        </div>
        <div className="metrica-card metrica-destaque" onClick={() => navigate("/admin")}>
          <RefreshCw size={20} strokeWidth={1.7} />
          <span className="metrica-valor">{dados.trocasPendentes}</span>
          <span className="metrica-label">Trocas pendentes</span>
        </div>
        <div className="metrica-card">
          <Users size={20} strokeWidth={1.7} />
          <span className="metrica-valor">{dados.totalClientes}</span>
          <span className="metrica-label">Clientes cadastrados</span>
        </div>
      </div>

      {Object.keys(dados.contagemPorStatus).length > 0 && (
        <div className="card card-pad" style={{ marginTop: "1.5rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>Pedidos por status</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".6rem" }}>
            {Object.entries(dados.contagemPorStatus).map(([status, qtd]) => (
              <span key={status} className={`status-tag status-${status}`}>
                {status.replaceAll("_", " ")} · {qtd}
              </span>
            ))}
          </div>
        </div>
      )}

      <button className="btn btn-primario" style={{ marginTop: "1.5rem" }} onClick={() => navigate("/admin")}>
        Ir para gestão completa <ArrowRight size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
