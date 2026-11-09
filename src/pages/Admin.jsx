import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { somenteDigitos } from "../utils/formatos";

// Carregado só na primeira consulta da análise: o Recharts pesa mais de
// 300 kB, e quem visita a loja nunca vê este gráfico. Assim ele fica num
// arquivo à parte e não atrasa a vitrine.
const GraficoHistoricoVendas = lazy(() => import("../components/GraficoHistoricoVendas"));

export default function Admin() {
  const [aba, setAba] = useState("pedidos");

  const abas = [
    ["pedidos", "Pedidos"],
    ["trocas", "Trocas"],
    ["clientes", "Clientes"],
    ["produto", "Cadastrar instrumento"],
    ["estoque", "Entrada de estoque"],
    ["analise", "Análise de vendas"],
  ];

  return (
    <div className="container">
      <div className="pagina-titulo"><h1>Painel administrativo</h1></div>

      <div className="gakki-nav" style={{ marginBottom: "1.5rem", background: "#fff", padding: ".6rem 1rem", borderRadius: 4, border: "1px solid var(--cor-borda)", flexWrap: "wrap" }}>
        {abas.map(([chave, rotulo]) => (
          <button
            key={chave}
            // Seletor estavel para os testes: o rotulo e texto de
            // interface e pode mudar a chave da aba, nao.
            data-aba={chave}
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
      {aba === "produto" && <FormularioProduto />}
      {aba === "estoque" && <FormularioEstoque />}
      {aba === "analise" && <AnaliseVendas />}
    </div>
  );
}

// --------------------------- PEDIDOS ---------------------------

/*
 * A próxima ação de cada status (RF0039, RF0040).
 *
 * As chaves são os valores do enum StatusPedido do backend, que são os do
 * DRS. O protótipo usava EM_ABERTO, PAGAMENTO_REALIZADO e EM_TRANSITO —
 * nomes que não existem no sistema: com eles, o pedido parava de oferecer
 * ação logo depois da confirmação do pagamento, justamente no meio do
 * fluxo. "Avançar para processamento" também saiu: a compra já nasce
 * EM_PROCESSAMENTO na finalização (RF0038), não há etapa anterior.
 *
 * REPROVADA, ENTREGUE e os três estados de troca não aparecem aqui
 * porque não têm próxima ação do lado do pedido — a troca é conduzida na
 * aba de trocas.
 */
const PROXIMA_ACAO = {
  EM_PROCESSAMENTO: { label: "Confirmar pagamento", fn: "confirmarPagamentoPedido" },
  APROVADA: { label: "Despachar", fn: "despacharPedido" },
  EM_TRANSPORTE: { label: "Confirmar entrega", fn: "confirmarEntregaAdmin" },
};

// Todos os valores de StatusPedido, para o filtro da tela.
const STATUS_PEDIDO = [
  "EM_PROCESSAMENTO",
  "APROVADA",
  "REPROVADA",
  "EM_TRANSPORTE",
  "ENTREGUE",
  "EM_TROCA",
  "TROCA_AUTORIZADA",
  "TROCADO",
];

function GerenciarPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [expandidoId, setExpandidoId] = useState(null);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  function carregar() {
    const params = filtroStatus ? { status: filtroStatus, size: 50 } : { size: 50 };
    api.listarPedidosAdmin(params).then((page) => setPedidos(page.content || []));
  }

  useEffect(carregar, [filtroStatus]);

  async function executarAcao(e, pedido) {
    e.stopPropagation(); // não deixa o clique no botão também expandir/colapsar o card
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

  function resumoProdutos(itens) {
    const nomes = itens.map((i) => `${i.quantidade}x ${i.instrumento}`);
    if (nomes.length <= 2) return nomes.join(", ");
    return `${nomes.slice(0, 2).join(", ")} e mais ${nomes.length - 2}`;
  }

  return (
    <div>
      {erro && <div className="erro-form">{erro}</div>}
      {mensagem && <p style={{ color: "var(--cor-sucesso)" }}>{mensagem}</p>}

      <div className="campo" style={{ maxWidth: 260, marginBottom: "1rem" }}>
        <label>Filtrar por status</label>
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} data-testid="filtro-status-pedido">
          <option value="">Todos</option>
          {STATUS_PEDIDO.map((s) => (
            <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
          ))}
        </select>
      </div>

      {pedidos.length === 0 ? (
        <p>Nenhum pedido encontrado.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
          {pedidos.map((p) => {
            const aberto = expandidoId === p.id;
            return (
              <div className="card" key={p.id} data-testid="pedido-admin" data-numero={p.numero} data-status={p.status}>
                <div
                  className="card-pad"
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: ".75rem", cursor: "pointer" }}
                  onClick={() => setExpandidoId(aberto ? null : p.id)}
                >
                  <div>
                    <strong>{p.numero}</strong> — <span className={`status-tag status-${p.status}`}>{p.status.replaceAll("_", " ")}</span>
                    <div style={{ fontSize: "0.85rem", marginTop: ".2rem" }}>{resumoProdutos(p.itens)}</div>
                    <div style={{ fontSize: "0.82rem", color: "var(--cor-texto-suave)" }}>
                      {p.clienteNome} · {p.valorTotal?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
                    {PROXIMA_ACAO[p.status] && (
                      <button className="btn btn-primario btn-sm" data-testid="btn-acao-pedido" onClick={(e) => executarAcao(e, p)}>
                        {PROXIMA_ACAO[p.status].label}
                      </button>
                    )}
                    <span style={{ color: "var(--cor-texto-suave)", fontSize: "0.8rem" }}>{aberto ? "▲ ocultar" : "▼ detalhes"}</span>
                  </div>
                </div>

                {aberto && (
                  <div style={{ borderTop: "1px solid var(--cor-borda)", padding: "1rem 1.25rem", background: "var(--cor-fundo)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem", fontSize: "0.88rem" }}>
                      <div>
                        <strong>Cliente</strong>
                        <div>{p.clienteNome}</div>
                        <div style={{ color: "var(--cor-texto-suave)" }}>{p.clienteEmail}</div>
                      </div>
                      <div>
                        <strong>Data do pedido</strong>
                        <div>{new Date(p.criadoEm).toLocaleString("pt-BR")}</div>
                      </div>
                      <div>
                        <strong>Endereço de entrega</strong>
                        <div>{p.enderecoResumo}</div>
                      </div>
                      <div>
                        <strong>Status atual</strong>
                        <div><span className={`status-tag status-${p.status}`}>{p.status.replaceAll("_", " ")}</span></div>
                      </div>
                    </div>

                    <strong style={{ fontSize: "0.88rem" }}>Produtos</strong>
                    <table className="tabela-simples" style={{ marginTop: ".4rem" }}>
                      <thead><tr><th>Instrumento</th><th>Qtd.</th><th>Valor unit.</th><th>Subtotal</th></tr></thead>
                      <tbody>
                        {p.itens.map((i) => (
                          <tr key={i.itemPedidoId}>
                            <td>{i.instrumento}{i.emTroca && <span style={{ marginLeft: ".4rem", fontSize: "0.75rem", color: "var(--cor-latao-escuro)" }}>(em troca)</span>}</td>
                            <td>{i.quantidade}</td>
                            <td>{i.valorUnitario?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                            <td>{(i.valorUnitario * i.quantidade).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {p.pagamentosCartao?.length > 0 && (
                      <p style={{ fontSize: "0.82rem", marginTop: ".6rem" }}>
                        <strong>Pago com:</strong> {p.pagamentosCartao.map((pg) => `${pg.cartaoApelido} •••• ${pg.ultimosDigitos} (${pg.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})`).join(" + ")}
                      </p>
                    )}
                    {p.cuponsUtilizados?.length > 0 && (
                      <p style={{ fontSize: "0.82rem" }}><strong>Cupons:</strong> {p.cuponsUtilizados.join(", ")}</p>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: ".6rem", paddingTop: ".6rem", borderTop: "1px solid var(--cor-borda)" }}>
                      <span>Frete: {p.valorFrete?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                      <span>Total: {p.valorTotal?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --------------------------- TROCAS ---------------------------

/*
 * Fila de trocas do administrador (RF0043, RF0042, RF0044, RF0045).
 *
 * Duas ações, não quatro: o ciclo do DRS é EM_TROCA → TROCA_AUTORIZADA →
 * TROCADO. O protótipo tinha "aceitar/negar", "confirmar recebimento" e
 * "processar troca" sobre seis estados inventados — a RF0042 só descreve
 * o caminho da autorização, e a emissão do cupom (RF0045) acontece dentro
 * da confirmação de recebimento, não num passo à parte.
 *
 * A decisão sobre o estoque (RF0044) vira dois botões em vez de um
 * window.confirm: o diálogo do navegador bloqueia o driver do Selenium, e
 * duas ações nomeadas deixam a escolha explícita em vez de esconder o
 * "sim/não" num OK/Cancelar.
 */

const ROTULOS_STATUS_TROCA = {
  EM_TROCA: "Aguardando autorização",
  TROCA_AUTORIZADA: "Autorizada — aguardando chegada dos itens",
  TROCADO: "Concluída",
};

function GerenciarTrocas() {
  const [trocas, setTrocas] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  function carregar() {
    api.listarTrocasAdmin(filtroStatus || undefined)
      .then(setTrocas)
      .catch((e) => setErro(e.message));
  }

  useEffect(carregar, [filtroStatus]);

  async function executar(acao, textoDeSucesso) {
    setErro(""); setMensagem("");
    try {
      await acao();
      setMensagem(textoDeSucesso);
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <div>
      {erro && <div className="erro-form">{erro}</div>}
      {mensagem && <p style={{ color: "var(--cor-sucesso)" }} data-testid="mensagem-troca">{mensagem}</p>}

      <div className="campo" style={{ maxWidth: 260, marginBottom: "1rem" }}>
        <label>Filtrar por status</label>
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} data-testid="filtro-status-troca">
          <option value="">Todos</option>
          {Object.keys(ROTULOS_STATUS_TROCA).map((s) => (
            <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
          ))}
        </select>
      </div>

      {trocas.length === 0 ? (
        <p data-testid="sem-trocas-admin">Nenhuma solicitação de troca.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
          {trocas.map((t) => (
            <div className="card card-pad" key={t.id} data-testid="troca-admin" data-numero={t.numero} data-status={t.status}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: ".75rem", flexWrap: "wrap" }}>
                <div>
                  <strong data-testid="troca-admin-numero">{t.numero}</strong> — pedido {t.pedidoNumero}
                  <div style={{ fontSize: "0.82rem", color: "var(--cor-texto-suave)" }}>
                    {t.clienteNome} · {new Date(t.criadoEm).toLocaleString("pt-BR")}
                  </div>
                </div>
                <span className={`status-tag status-${t.status}`} data-testid="troca-admin-status">
                  {t.status.replaceAll("_", " ")}
                </span>
              </div>

              <p style={{ fontSize: "0.84rem", margin: ".5rem 0 0", color: "var(--cor-texto-suave)" }}>
                {ROTULOS_STATUS_TROCA[t.status] ?? t.status.replaceAll("_", " ")}
              </p>

              <ul style={{ margin: ".5rem 0", paddingLeft: "1.1rem", fontSize: "0.88rem" }}>
                {t.itens?.map((item) => (
                  <li key={item.itemTrocaId}>
                    {item.quantidade}x {item.instrumento} — {item.valorUnitario?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </li>
                ))}
              </ul>

              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                <span>Valor da troca</span>
                <span data-testid="troca-admin-valor">
                  {t.valor?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>

              {/* RF0044 e RF0045 — concluída, mostra o que foi decidido e o cupom emitido. */}
              {t.status === "TROCADO" && (
                <p style={{ fontSize: "0.84rem", marginTop: ".5rem" }} data-testid="troca-admin-desfecho">
                  {t.retornaEstoque ? "Itens devolvidos ao estoque." : "Itens descartados, sem retorno ao estoque."}
                  {t.cupomGerado && (
                    <>
                      {" "}Cupom <strong>{t.cupomGerado.codigo}</strong> de{" "}
                      {t.cupomGerado.valor?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} emitido ao cliente.
                    </>
                  )}
                </p>
              )}

              <div style={{ display: "flex", gap: ".5rem", marginTop: ".75rem", flexWrap: "wrap" }}>
                {/* RF0042 — autorizar gera a notificação da RN0046. */}
                {t.status === "EM_TROCA" && (
                  <button
                    className="btn btn-primario btn-sm"
                    data-testid="btn-autorizar-troca"
                    onClick={() => executar(() => api.autorizarTroca(t.id), `Troca ${t.numero} autorizada. O cliente foi notificado.`)}
                  >
                    Autorizar troca
                  </button>
                )}

                {/* RF0044 — recebimento dos itens, com a decisão sobre o estoque. */}
                {t.status === "TROCA_AUTORIZADA" && (
                  <>
                    <button
                      className="btn btn-primario btn-sm"
                      data-testid="btn-receber-troca-com-estoque"
                      onClick={() => executar(
                        () => api.confirmarRecebimentoTroca(t.id, true),
                        `Troca ${t.numero} concluída: itens de volta ao estoque e cupom emitido.`,
                      )}
                    >
                      Recebido — devolver ao estoque
                    </button>
                    <button
                      className="btn btn-secundario btn-sm"
                      data-testid="btn-receber-troca-sem-estoque"
                      onClick={() => executar(
                        () => api.confirmarRecebimentoTroca(t.id, false),
                        `Troca ${t.numero} concluída: itens descartados e cupom emitido.`,
                      )}
                    >
                      Recebido — descartar itens
                    </button>
                  </>
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

const FILTROS_VAZIOS = { nome: "", email: "", cpf: "", codigo: "", ativo: "" };

/**
 * RF0024 — consulta de clientes por filtro.
 *
 * O requisito é explícito: "todos os campos utilizados para identificação
 * do cliente podem ser utilizados como filtro, tanto de forma combinada
 * como de forma isolada". Por isso são cinco campos, e não uma busca só.
 *
 * Os filtros são aplicados por um botão, e não a cada tecla digitada.
 * Com cinco campos, a busca ao vivo dispararia uma requisição por
 * caractere em cada um deles — e deixaria o resultado na tela dependente
 * de quando a última resposta chegou, que é como se produz um teste
 * intermitente.
 */
function GerenciarClientes() {
  const [clientes, setClientes] = useState([]);

  // `form` é o que está digitado; `aplicados` é o que foi de fato
  // consultado. Separar os dois é o que faz o botão ter efeito.
  const [form, setForm] = useState(FILTROS_VAZIOS);
  const [aplicados, setAplicados] = useState(FILTROS_VAZIOS);

  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  /**
   * Número da última consulta disparada.
   *
   * Sem ele, a tela sofre de respostas fora de ordem: a consulta sem
   * filtro devolve 50 registros e demora; a filtrada devolve um e volta
   * rápido. Se a filtrada chega primeiro, a lenta ainda está a caminho —
   * e, quando chega, sobrescreve a lista já filtrada pela completa. A
   * tela fica mostrando todo mundo, sem erro nenhum, e não se recupera.
   *
   * `useRef` e não `useState` de propósito: é preciso comparar com o
   * valor do momento em que a resposta chega, não com o da renderização
   * que disparou a requisição.
   */
  const ultimaConsulta = useRef(0);

  function carregar() {
    const params = { size: 50 };
    if (aplicados.nome) params.nome = aplicados.nome;
    if (aplicados.email) params.email = aplicados.email;
    if (aplicados.cpf) params.cpf = somenteDigitos(aplicados.cpf);
    if (aplicados.codigo) params.codigo = aplicados.codigo;
    if (aplicados.ativo) params.ativo = aplicados.ativo === "ativos";

    const minhaVez = ++ultimaConsulta.current;
    const aindaVale = () => minhaVez === ultimaConsulta.current;

    api.listarClientes(params)
      .then((page) => { if (aindaVale()) setClientes(page.content || []); })
      .catch((e) => { if (aindaVale()) setErro(e.message); });
  }
  useEffect(carregar, [aplicados]);

  function setCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function filtrar(e) {
    e.preventDefault();
    setErro(""); setMensagem("");
    setAplicados(form);
  }

  function limpar() {
    setForm(FILTROS_VAZIOS);
    setAplicados(FILTROS_VAZIOS);
  }

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
      {erro && <div className="erro-form" data-testid="erro-clientes">{erro}</div>}
      {mensagem && <p style={{ color: "var(--cor-sucesso)" }}>{mensagem}</p>}

      <form onSubmit={filtrar} className="card card-pad" style={{ marginBottom: "1rem" }}>
        <h4 style={{ marginBottom: ".8rem" }}>Filtrar clientes</h4>

        <div className="linha-campos">
          <div className="campo" style={{ flex: 2 }}>
            <label htmlFor="filtro-nome">Nome</label>
            <input
              id="filtro-nome" data-testid="busca-cliente" placeholder="parte do nome…"
              value={form.nome}
              onChange={(e) => setCampo("nome", e.target.value)}
            />
          </div>
          <div className="campo" style={{ flex: 2 }}>
            <label htmlFor="filtro-email">E-mail</label>
            <input
              id="filtro-email" placeholder="parte do e-mail…"
              value={form.email}
              onChange={(e) => setCampo("email", e.target.value)}
            />
          </div>
        </div>

        <div className="linha-campos">
          <div className="campo" style={{ flex: 1 }}>
            <label htmlFor="filtro-cpf">CPF</label>
            <input
              id="filtro-cpf" placeholder="somente números" inputMode="numeric"
              value={form.cpf}
              onChange={(e) => setCampo("cpf", e.target.value)}
            />
          </div>
          <div className="campo" style={{ flex: 1 }}>
            <label htmlFor="filtro-codigo">Código</label>
            <input
              id="filtro-codigo" placeholder="CLI-0001"
              value={form.codigo}
              onChange={(e) => setCampo("codigo", e.target.value)}
            />
          </div>
          <div className="campo" style={{ flex: 1 }}>
            <label htmlFor="filtro-status">Status</label>
            <select
              id="filtro-status"
              value={form.ativo}
              onChange={(e) => setCampo("ativo", e.target.value)}
            >
              <option value="">Todos</option>
              <option value="ativos">Somente ativos</option>
              <option value="inativos">Somente inativos</option>
            </select>
          </div>
        </div>

        <div className="acoes-form">
          <button className="btn btn-primario btn-sm" data-testid="btn-filtrar">Filtrar</button>
          <button
            type="button" className="btn btn-secundario btn-sm"
            onClick={limpar} data-testid="btn-limpar-filtros"
          >
            Limpar
          </button>
        </div>
      </form>

      <p className="contagem-resultados">
        <strong data-testid="total-clientes">{clientes.length}</strong>{" "}
        {clientes.length === 1 ? "cliente encontrado" : "clientes encontrados"}
      </p>

      <table className="tabela-simples card card-pad">
        <thead><tr><th>Código</th><th>Nome</th><th>E-mail</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {clientes.map((c) => (
            // data-codigo além do id: o teste da RF0024 conhece os
            // clientes do seed pelo código (CLI-0002), não pelo id, que
            // depende da ordem em que o banco foi populado.
            <tr key={c.id} data-cliente={c.id} data-codigo={c.codigo}>
              <td>{c.codigo}</td>
              <td>{c.nome}</td>
              <td>{c.email}</td>
              <td>
                <span
                  data-status={c.ativo ? "ativo" : "inativo"}
                  className={`status-tag ${c.ativo ? "status-ENTREGUE" : "status-CANCELADA"}`}
                >
                  {c.ativo ? "Ativo" : "Inativo"}
                </span>
              </td>
              <td>
                <button
                  data-testid="btn-alternar-status"
                  className={`btn btn-sm ${c.ativo ? "btn-perigo" : "btn-primario"}`}
                  onClick={() => alternarStatus(c)}
                >
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

// --------------------------- PRODUTO / ESTOQUE / ANÁLISE ---------------------------

function FormularioProduto() {
  const [categorias, setCategorias] = useState([]);
  const [fabricantes, setFabricantes] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [form, setForm] = useState({
    nome: "", descricao: "", fabricanteId: "", grupoPrecificacaoId: "", categoriaIds: [],
    anoFabricacao: "", isbnOuCodigoBarras: "", pesoKg: "",
  });
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.listarCategorias().then(setCategorias);
    api.listarFabricantes().then(setFabricantes);
  }, []);

  function toggleCategoria(id) {
    setForm((f) => ({
      ...f,
      categoriaIds: f.categoriaIds.includes(id) ? f.categoriaIds.filter((c) => c !== id) : [...f.categoriaIds, id],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(""); setMensagem("");
    try {
      await api.cadastrarInstrumento({
        ...form,
        fabricanteId: Number(form.fabricanteId),
        grupoPrecificacaoId: Number(form.grupoPrecificacaoId),
        anoFabricacao: form.anoFabricacao ? Number(form.anoFabricacao) : null,
        pesoKg: form.pesoKg ? Number(form.pesoKg) : null,
      });
      setMensagem("Instrumento cadastrado! Registre uma entrada de estoque para definir o preço de venda.");
      setForm({ nome: "", descricao: "", fabricanteId: "", grupoPrecificacaoId: "", categoriaIds: [], anoFabricacao: "", isbnOuCodigoBarras: "", pesoKg: "" });
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <form className="card card-pad" onSubmit={handleSubmit} style={{ maxWidth: 620 }}>
      <h3>Novo instrumento</h3>
      {erro && <div className="erro-form">{erro}</div>}
      {mensagem && <p style={{ color: "var(--cor-sucesso)" }}>{mensagem}</p>}

      <div className="campo"><label>Nome</label><input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
      <div className="campo"><label>Descrição</label><textarea rows={3} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <div className="campo" style={{ flex: 1 }}>
          <label>Fabricante</label>
          <select required value={form.fabricanteId} onChange={(e) => setForm({ ...form, fabricanteId: e.target.value })}>
            <option value="">Selecione…</option>
            {fabricantes.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </div>
        <div className="campo" style={{ flex: 1 }}>
          <label>Grupo de precificação</label>
          <select required value={form.grupoPrecificacaoId} onChange={(e) => setForm({ ...form, grupoPrecificacaoId: e.target.value })}>
            <option value="">Selecione…</option>
            {grupos.map((g) => <option key={g.id} value={g.id}>{g.nome}</option>)}
          </select>
        </div>
      </div>

      <div className="campo">
        <label>Categorias</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem" }}>
          {categorias.map((c) => (
            <label key={c.id} style={{ display: "flex", alignItems: "center", gap: ".3rem", fontWeight: 400 }}>
              <input type="checkbox" checked={form.categoriaIds.includes(c.id)} onChange={() => toggleCategoria(c.id)} />
              {c.nome}
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <div className="campo" style={{ flex: 1 }}><label>Ano</label><input type="number" value={form.anoFabricacao} onChange={(e) => setForm({ ...form, anoFabricacao: e.target.value })} /></div>
        <div className="campo" style={{ flex: 1 }}><label>Peso (kg)</label><input type="number" step="0.1" value={form.pesoKg} onChange={(e) => setForm({ ...form, pesoKg: e.target.value })} /></div>
        <div className="campo" style={{ flex: 2 }}><label>Código de barras</label><input value={form.isbnOuCodigoBarras} onChange={(e) => setForm({ ...form, isbnOuCodigoBarras: e.target.value })} /></div>
      </div>

      <button className="btn btn-primario">Cadastrar</button>
    </form>
  );
}

function FormularioEstoque() {
  const [form, setForm] = useState({ instrumentoId: "", quantidade: "", valorCusto: "", fornecedor: "", dataEntrada: "" });
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(""); setMensagem("");
    try {
      await api.registrarEntradaEstoque({
        ...form,
        instrumentoId: Number(form.instrumentoId),
        quantidade: Number(form.quantidade),
        valorCusto: Number(form.valorCusto),
      });
      setMensagem("Entrada registrada! Preço de venda recalculado automaticamente.");
      setForm({ instrumentoId: "", quantidade: "", valorCusto: "", fornecedor: "", dataEntrada: "" });
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <form className="card card-pad" onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
      <h3>Entrada de estoque</h3>
      {erro && <div className="erro-form">{erro}</div>}
      {mensagem && <p style={{ color: "var(--cor-sucesso)" }}>{mensagem}</p>}
      <div className="campo"><label>ID do instrumento</label><input required type="number" value={form.instrumentoId} onChange={(e) => setForm({ ...form, instrumentoId: e.target.value })} /></div>
      <div className="campo"><label>Quantidade</label><input required type="number" min={1} value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: e.target.value })} /></div>
      <div className="campo"><label>Valor de custo (unitário)</label><input required type="number" step="0.01" value={form.valorCusto} onChange={(e) => setForm({ ...form, valorCusto: e.target.value })} /></div>
      <div className="campo"><label>Fornecedor</label><input required value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} /></div>
      <div className="campo"><label>Data de entrada</label><input required type="date" value={form.dataEntrada} onChange={(e) => setForm({ ...form, dataEntrada: e.target.value })} /></div>
      <button className="btn btn-primario">Registrar entrada</button>
    </form>
  );
}

/*
 * RF0055 — histórico de vendas por categoria, em gráfico de linhas
 * (RNF0043). O gráfico e a tabela de valores ficam no
 * GraficoHistoricoVendas; aqui ficam só os filtros: período e
 * categorias.
 *
 * As categorias vão para a API pelo NOME, como o mock já fazia. Quem
 * valida (período, ao menos uma categoria, nome existente) é o backend,
 * e a mensagem dele aparece no quadro de erro — validar de novo aqui só
 * criaria duas versões da mesma regra.
 */
function AnaliseVendas() {
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [consultando, setConsultando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.listarCategorias()
      .then(setCategorias)
      .catch((e) => setErro(`Não foi possível carregar as categorias: ${e.message}`));
  }, []);

  function toggle(nome) {
    setCategoriasSelecionadas((s) => s.includes(nome) ? s.filter((c) => c !== nome) : [...s, nome]);
  }

  // Cada consulta vai ao backend de novo, sem guardar resultado: uma
  // compra que acabou de passar a ENTREGUE precisa aparecer na consulta
  // seguinte (cenário 6 do roteiro).
  async function consultar() {
    setErro(""); setResultado(null); setConsultando(true);
    try {
      const dados = await api.historicoVendas(inicio, fim, categoriasSelecionadas);
      setResultado(dados);
    } catch (e) {
      setErro(e.message);
    } finally {
      setConsultando(false);
    }
  }

  return (
    <div className="card card-pad">
      <h3>Histórico de vendas por categoria</h3>
      <p style={{ color: "var(--cor-texto-suave)", fontSize: ".88rem", margin: ".25rem 0 1rem" }}>
        Total vendido por mês, em reais, considerando apenas as compras com status ENTREGUE.
        O mês é o da data da compra.
      </p>
      {erro && <div className="erro-form" data-testid="erro-analise">{erro}</div>}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div className="campo">
          <label htmlFor="analise-inicio">Início</label>
          <input id="analise-inicio" type="date" data-testid="analise-inicio" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="analise-fim">Fim</label>
          <input id="analise-fim" type="date" data-testid="analise-fim" value={fim} onChange={(e) => setFim(e.target.value)} />
        </div>
        <div className="campo" style={{ flex: 1, minWidth: 220 }}>
          <label>Categorias</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem" }}>
            {categorias.map((c) => (
              <label key={c.id} style={{ display: "flex", gap: ".3rem", fontWeight: 400 }}>
                <input
                  type="checkbox"
                  data-testid="analise-categoria"
                  data-categoria={c.nome}
                  checked={categoriasSelecionadas.includes(c.nome)}
                  onChange={() => toggle(c.nome)}
                />
                {c.nome}
              </label>
            ))}
          </div>
        </div>
        <button className="btn btn-primario" data-testid="btn-consultar-analise" onClick={consultar} disabled={consultando}>
          {consultando ? "Consultando…" : "Consultar"}
        </button>
      </div>

      {resultado && (
        <Suspense fallback={<p style={{ marginTop: "1.5rem", color: "var(--cor-texto-suave)" }}>Carregando gráfico…</p>}>
          <GraficoHistoricoVendas dados={resultado} categorias={categorias} />
        </Suspense>
      )}
    </div>
  );
}
