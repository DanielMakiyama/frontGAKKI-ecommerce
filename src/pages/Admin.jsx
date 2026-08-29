import { useEffect, useState } from "react";
import { api } from "../api/client";

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

const PROXIMA_ACAO = {
  EM_ABERTO: { label: "Avançar para processamento", fn: "avancarProcessamento" },
  EM_PROCESSAMENTO: { label: "Confirmar pagamento", fn: "confirmarPagamentoPedido" },
  PAGAMENTO_REALIZADO: { label: "Despachar", fn: "despacharPedido" },
  EM_TRANSITO: { label: "Confirmar entrega", fn: "confirmarEntregaAdmin" },
};

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
          {pedidos.map((p) => {
            const aberto = expandidoId === p.id;
            return (
              <div className="card" key={p.id}>
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
                      <button className="btn btn-primario btn-sm" onClick={(e) => executarAcao(e, p)}>
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

function AnaliseVendas() {
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => { api.listarCategorias().then(setCategorias); }, []);

  function toggle(nome) {
    setCategoriasSelecionadas((s) => s.includes(nome) ? s.filter((c) => c !== nome) : [...s, nome]);
  }

  async function consultar() {
    setErro(""); setResultado(null);
    try {
      const dados = await api.historicoVendas(inicio, fim, categoriasSelecionadas);
      setResultado(dados);
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <div className="card card-pad">
      <h3>Histórico de vendas por categoria</h3>
      {erro && <div className="erro-form">{erro}</div>}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div className="campo"><label>Início</label><input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} /></div>
        <div className="campo"><label>Fim</label><input type="date" value={fim} onChange={(e) => setFim(e.target.value)} /></div>
        <div className="campo" style={{ flex: 1, minWidth: 220 }}>
          <label>Categorias</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem" }}>
            {categorias.map((c) => (
              <label key={c.id} style={{ display: "flex", gap: ".3rem", fontWeight: 400 }}>
                <input type="checkbox" checked={categoriasSelecionadas.includes(c.nome)} onChange={() => toggle(c.nome)} />
                {c.nome}
              </label>
            ))}
          </div>
        </div>
        <button className="btn btn-primario" onClick={consultar}>Consultar</button>
      </div>

      {resultado && (
        <table className="tabela-simples" style={{ marginTop: "1.5rem" }}>
          <thead><tr><th>Categoria</th><th>Mês/Ano</th><th>Total vendido</th></tr></thead>
          <tbody>
            {resultado.map((r, i) => (
              <tr key={i}>
                <td>{r.categoria}</td>
                <td>{r.mesAno}</td>
                <td>{r.totalVendas?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
