import { useEffect, useState } from "react";
import { api } from "../api/client";
import GraficoVendas from "../components/GraficoVendas";

export default function Admin() {
  const [aba, setAba] = useState("pedidos");

  const abas = [
    ["pedidos", "Pedidos"],
    ["trocas", "Trocas"],
    ["clientes", "Clientes"],
    ["analise", "Análise de vendas"],
  ];

  return (
    <div className="container">
      <div className="pagina-titulo"><h1>Painel administrativo</h1></div>

      <div className="gakki-nav" style={{ marginBottom: "1.5rem", background: "#fff", padding: ".6rem 1rem", borderRadius: 4, border: "1px solid var(--cor-borda)", flexWrap: "wrap" }}>
        {abas.map(([chave, rotulo]) => (
          <button
            key={chave}
            className="link"
            style={{ color: aba === chave ? "var(--cor-latao)" : "#4a3221", borderBottom: aba === chave ? "2px solid var(--cor-latao)" : "none" }}
            onClick={() => setAba(chave)}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {aba === "pedidos" && <GerenciarPedidos />}
      {aba === "trocas" && <GerenciarTrocas />}
      {aba === "clientes" && <GerenciarClientes />}
      {aba === "analise" && <AnaliseVendas />}
    </div>
  );
}

// --------------------------- PEDIDOS ---------------------------

const PROXIMA_ACAO = {
  EM_ABERTO: { label: "Avançar para processamento", fn: "avancarProcessamento" },
  EM_PROCESSAMENTO: { label: "Confirmar pagamento", fn: "confirmarPagamentoPedido" },
  PAGAMENTO_REALIZADO: { label: "Despachar", fn: "despacharPedido" },
  EM_TRANSITO: { label: "Confirmar entrega", fn: "confirmarEntregaAdmin" },
};

function GerenciarPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  function carregar() {
    const params = filtroStatus ? { status: filtroStatus, size: 50 } : { size: 50 };
    api.listarPedidosAdmin(params).then((page) => setPedidos(page.content || []));
  }

  useEffect(carregar, [filtroStatus]);

  async function executarAcao(pedido) {
    const acao = PROXIMA_ACAO[pedido.status];
    if (!acao) return;
    setErro(""); setMensagem("");
    try {
      await api[acao.fn](pedido.id);
      setMensagem(`Pedido ${pedido.numero}: ${acao.label.toLowerCase()} feito.`);
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <div>
      {erro && <div className="erro-form">{erro}</div>}
      {mensagem && <p style={{ color: "var(--cor-sucesso)" }}>{mensagem}</p>}

      <div className="campo" style={{ maxWidth: 260, marginBottom: "1rem" }}>
        <label>Filtrar por status</label>
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
          <option value="">Todos</option>
          {Object.keys(PROXIMA_ACAO).concat(["ENTREGUE", "CANCELADA"]).map((s) => (
            <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
          ))}
        </select>
      </div>

      {pedidos.length === 0 ? (
        <p>Nenhum pedido encontrado.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
          {pedidos.map((p) => (
            <div className="card card-pad" key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: ".75rem" }}>
              <div>
                <strong>{p.numero}</strong> — <span className={`status-tag status-${p.status}`}>{p.status.replaceAll("_", " ")}</span>
                <div style={{ fontSize: "0.82rem", color: "var(--cor-texto-suave)" }}>
                  {p.itens.length} item(ns) · {p.valorTotal?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </div>
              </div>
              {PROXIMA_ACAO[p.status] && (
                <button className="btn btn-primario btn-sm" onClick={() => executarAcao(p)}>
                  {PROXIMA_ACAO[p.status].label}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --------------------------- TROCAS ---------------------------

function GerenciarTrocas() {
  const [trocas, setTrocas] = useState([]);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  function carregar() {
    api.listarTrocasAdmin().then(setTrocas);
  }
  useEffect(carregar, []);

  async function aceitar(id) {
    setErro(""); setMensagem("");
    try { await api.aceitarTroca(id); setMensagem("Troca aceita."); carregar(); } catch (e) { setErro(e.message); }
  }
  async function negar(id) {
    const motivo = window.prompt("Motivo da negativa:");
    if (!motivo) return;
    setErro(""); setMensagem("");
    try { await api.negarTroca(id, motivo); setMensagem("Troca negada."); carregar(); } catch (e) { setErro(e.message); }
  }
  async function confirmarRecebimento(id) {
    const retorna = window.confirm("O item deve retornar ao estoque? OK = sim, Cancelar = não");
    setErro(""); setMensagem("");
    try { await api.confirmarRecebimentoTroca(id, retorna); setMensagem("Recebimento confirmado."); carregar(); } catch (e) { setErro(e.message); }
  }
  async function processar(id) {
    setErro(""); setMensagem("");
    try { await api.processarTroca(id); setMensagem("Troca processada — cupom gerado."); carregar(); } catch (e) { setErro(e.message); }
  }

  return (
    <div>
      {erro && <div className="erro-form">{erro}</div>}
      {mensagem && <p style={{ color: "var(--cor-sucesso)" }}>{mensagem}</p>}

      {trocas.length === 0 ? (
        <p>Nenhuma solicitação de troca.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
          {trocas.map((t) => (
            <div className="card card-pad" key={t.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{t.instrumento}</strong> — pedido {t.pedidoNumero}
                  <div style={{ fontSize: "0.82rem", color: "var(--cor-texto-suave)" }}>"{t.justificativaCliente}"</div>
                </div>
                <span className="status-tag status-EM_TROCA">{t.status.replaceAll("_", " ")}</span>
              </div>
              <div style={{ display: "flex", gap: ".5rem", marginTop: ".75rem", flexWrap: "wrap" }}>
                {t.status === "TROCA_SOLICITADA" && (
                  <>
                    <button className="btn btn-primario btn-sm" onClick={() => aceitar(t.id)}>Aceitar</button>
                    <button className="btn btn-perigo btn-sm" onClick={() => negar(t.id)}>Negar</button>
                  </>
                )}
                {t.status === "ITEM_ENVIADO" && (
                  <button className="btn btn-primario btn-sm" onClick={() => confirmarRecebimento(t.id)}>Confirmar recebimento do item</button>
                )}
                {t.status === "ITEM_RECEBIDO" && (
                  <button className="btn btn-primario btn-sm" onClick={() => processar(t.id)}>Processar troca (gerar cupom)</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --------------------------- CLIENTES ---------------------------

function GerenciarClientes() {
  const [clientes, setClientes] = useState([]);
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  function carregar() {
    api.listarClientes(nome ? { nome, size: 50 } : { size: 50 }).then((page) => setClientes(page.content || []));
  }
  useEffect(carregar, [nome]);

  async function alternarStatus(cliente) {
    setErro(""); setMensagem("");
    try {
      if (cliente.ativo) await api.inativarCliente(cliente.id);
      else await api.ativarCliente(cliente.id);
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <div>
      {erro && <div className="erro-form">{erro}</div>}
      {mensagem && <p style={{ color: "var(--cor-sucesso)" }}>{mensagem}</p>}

      <div className="campo" style={{ maxWidth: 320, marginBottom: "1rem" }}>
        <label>Buscar por nome</label>
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="nome do cliente…" />
      </div>

      <table className="tabela-simples card card-pad">
        <thead><tr><th>Código</th><th>Nome</th><th>E-mail</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {clientes.map((c) => (
            <tr key={c.id}>
              <td>{c.codigo}</td>
              <td>{c.nome}</td>
              <td>{c.email}</td>
              <td><span className={`status-tag ${c.ativo ? "status-ENTREGUE" : "status-CANCELADA"}`}>{c.ativo ? "Ativo" : "Inativo"}</span></td>
              <td>
                <button className={`btn btn-sm ${c.ativo ? "btn-perigo" : "btn-primario"}`} onClick={() => alternarStatus(c)}>
                  {c.ativo ? "Inativar" : "Ativar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --------------------------- ANÁLISE DE VENDAS ---------------------------

function AnaliseVendas() {
  const [categorias, setCategorias] = useState([]);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.listarCategorias().then(setCategorias);
  }, []);

  useEffect(() => {
    api.historicoVendas(null, null, categoriasSelecionadas).then(setResultado).catch((e) => setErro(e.message));
  }, [categoriasSelecionadas]);

  function toggle(nome) {
    setCategoriasSelecionadas((s) => (s.includes(nome) ? s.filter((c) => c !== nome) : [...s, nome]));
  }

  return (
    <div className="card card-pad">
      <h3>Histórico de vendas por categoria</h3>
      <p style={{ fontSize: "0.85rem", color: "var(--cor-texto-suave)" }}>
        Deixe sem nenhuma categoria marcada para ver todas. Passe o mouse sobre o gráfico para ver os valores de cada mês.
      </p>
      {erro && <div className="erro-form">{erro}</div>}

      <div className="campo" style={{ marginTop: "1rem" }}>
        <label>Filtrar categorias</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem" }}>
          {categorias.map((c) => (
            <label key={c.id} style={{ display: "flex", gap: ".3rem", fontWeight: 400 }}>
              <input type="checkbox" checked={categoriasSelecionadas.includes(c.nome)} onChange={() => toggle(c.nome)} />
              {c.nome}
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "1.25rem" }}>
        {resultado && <GraficoVendas dados={resultado} categoriasTodas={categorias} />}
      </div>
    </div>
  );
}
