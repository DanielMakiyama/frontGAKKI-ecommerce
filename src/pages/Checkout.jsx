import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useCart } from "../context/CartContext";

export default function Checkout() {
  const { carrinho, recarregar } = useCart();
  const navigate = useNavigate();

  const [enderecos, setEnderecos] = useState([]);
  const [cartoes, setCartoes] = useState([]);
  const [enderecoId, setEnderecoId] = useState("");
  const [novoEndereco, setNovoEndereco] = useState(false);
  const [formEndereco, setFormEndereco] = useState({
    apelido: "", logradouro: "", numero: "", complemento: "", cidade: "", estado: "", cep: "",
  });

  // Pagamento combinado: várias linhas {cartaoCreditoId, valor}
  const [pagamentos, setPagamentos] = useState([]);
  const [novoCartao, setNovoCartao] = useState(false);
  const [formCartao, setFormCartao] = useState({
    apelido: "", ultimosDigitos: "", bandeira: "", nomeTitular: "", validade: "",
  });

  // Vários cupons
  const [cuponsDisponiveis, setCuponsDisponiveis] = useState([]);
  const [cupomAtual, setCupomAtual] = useState("");
  const [codigosCupom, setCodigosCupom] = useState([]);

  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [pedidoCriado, setPedidoCriado] = useState(null);

  useEffect(() => {
    recarregar();
    api.meusEnderecos().then((lista) => {
      setEnderecos(lista);
      const principal = lista.find((e) => e.principal) || lista[0];
      if (principal) setEnderecoId(String(principal.id));
    });
    api.meusCartoes().then(setCartoes);
    api.meusCupons().then((lista) => setCuponsDisponiveis(lista.filter((c) => !c.utilizado)));
  }, [recarregar]);

  const totalPedido = carrinho?.valorTotal || 0;
  const totalPagamentos = pagamentos.reduce((acc, p) => acc + Number(p.valor || 0), 0);
  // Nota: o valor exato dos cupons só é confirmado no backend; aqui mostramos
  // quantos foram adicionados, a validação de cobertura total acontece na confirmação.
  const faltaAlocar = Math.max(0, totalPedido - totalPagamentos);

  async function salvarNovoEndereco(e) {
    e.preventDefault();
    try {
      const criado = await api.adicionarEndereco(formEndereco);
      setEnderecos((lista) => [...lista, criado]);
      setEnderecoId(String(criado.id));
      setNovoEndereco(false);
    } catch (e) {
      setErro(e.message);
    }
  }

  async function salvarNovoCartao(e) {
    e.preventDefault();
    try {
      const criado = await api.adicionarCartao(formCartao);
      setCartoes((lista) => [...lista, criado]);
      setNovoCartao(false);
      setFormCartao({ apelido: "", ultimosDigitos: "", bandeira: "", nomeTitular: "", validade: "" });
    } catch (e) {
      setErro(e.message);
    }
  }

  function adicionarLinhaPagamento() {
    if (cartoes.length === 0) return;
    setPagamentos((p) => [...p, { cartaoCreditoId: cartoes[0].id, valor: faltaAlocar > 0 ? faltaAlocar.toFixed(2) : "" }]);
  }

  function atualizarPagamento(index, campo, valor) {
    setPagamentos((p) => p.map((linha, i) => (i === index ? { ...linha, [campo]: valor } : linha)));
  }

  function removerPagamento(index) {
    setPagamentos((p) => p.filter((_, i) => i !== index));
  }

  function adicionarCupom() {
    const codigo = cupomAtual.trim();
    if (!codigo || codigosCupom.includes(codigo)) return;
    setCodigosCupom((c) => [...c, codigo]);
    setCupomAtual("");
  }

  function alternarCupomSelecionado(codigo) {
    setCodigosCupom((c) => (c.includes(codigo) ? c.filter((x) => x !== codigo) : [...c, codigo]));
  }

  function removerCupom(codigo) {
    setCodigosCupom((c) => c.filter((x) => x !== codigo));
  }

  async function finalizar() {
    setErro("");
    setEnviando(true);
    try {
      const payload = {
        enderecoEntregaId: Number(enderecoId),
        pagamentosCartao: pagamentos
          .filter((p) => p.cartaoCreditoId && Number(p.valor) > 0)
          .map((p) => ({ cartaoCreditoId: Number(p.cartaoCreditoId), valor: Number(p.valor) })),
        codigosCupom: codigosCupom,
      };
      const pedido = await api.finalizarCompra(payload);
      setPedidoCriado(pedido);
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  if (pedidoCriado) {
    return (
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="card card-pad" style={{ textAlign: "center" }}>
          <h1>Pedido realizado! 🎉</h1>
          <p>Número do pedido: <strong>{pedidoCriado.numero}</strong></p>
          <p>Status: <span className={`status-tag status-${pedidoCriado.status}`}>{pedidoCriado.status}</span></p>
          <p style={{ marginTop: "1rem" }}>
            Total: <strong>{pedidoCriado.valorTotal?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
          </p>
          <button className="btn btn-primario" style={{ marginTop: "1.5rem" }} onClick={() => navigate("/pedidos")}>
            Ver meus pedidos
          </button>
        </div>
      </div>
    );
  }

  if (!carrinho || carrinho.itens.length === 0) {
    return <div className="container"><p>Seu carrinho está vazio.</p></div>;
  }

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <div className="pagina-titulo"><h1>Finalizar compra</h1></div>

      {erro && <div className="erro-form">{erro}</div>}

      <div className="card card-pad" style={{ marginBottom: "1.25rem" }}>
        <h3>Endereço de entrega</h3>
        {enderecos.length > 0 && !novoEndereco && (
          <div className="campo">
            <select value={enderecoId} onChange={(e) => setEnderecoId(e.target.value)}>
              {enderecos.map((e) => (
                <option key={e.id} value={e.id}>{e.apelido} — {e.logradouro}, {e.numero} ({e.cidade}/{e.estado})</option>
              ))}
            </select>
          </div>
        )}
        {!novoEndereco ? (
          <button className="btn btn-secundario btn-sm" onClick={() => setNovoEndereco(true)}>+ Novo endereço</button>
        ) : (
          <form onSubmit={salvarNovoEndereco}>
            <div className="campo"><label>Apelido</label><input required value={formEndereco.apelido} onChange={(e) => setFormEndereco({ ...formEndereco, apelido: e.target.value })} /></div>
            <div className="campo"><label>Logradouro</label><input required value={formEndereco.logradouro} onChange={(e) => setFormEndereco({ ...formEndereco, logradouro: e.target.value })} /></div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <div className="campo" style={{ flex: 1 }}><label>Número</label><input value={formEndereco.numero} onChange={(e) => setFormEndereco({ ...formEndereco, numero: e.target.value })} /></div>
              <div className="campo" style={{ flex: 2 }}><label>Complemento</label><input value={formEndereco.complemento} onChange={(e) => setFormEndereco({ ...formEndereco, complemento: e.target.value })} /></div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <div className="campo" style={{ flex: 2 }}><label>Cidade</label><input required value={formEndereco.cidade} onChange={(e) => setFormEndereco({ ...formEndereco, cidade: e.target.value })} /></div>
              <div className="campo" style={{ flex: 1 }}><label>UF</label><input required maxLength={2} value={formEndereco.estado} onChange={(e) => setFormEndereco({ ...formEndereco, estado: e.target.value.toUpperCase() })} /></div>
              <div className="campo" style={{ flex: 1 }}><label>CEP</label><input required value={formEndereco.cep} onChange={(e) => setFormEndereco({ ...formEndereco, cep: e.target.value })} /></div>
            </div>
            <button className="btn btn-primario btn-sm">Salvar endereço</button>
          </form>
        )}
      </div>

      <div className="card card-pad" style={{ marginBottom: "1.25rem" }}>
        <h3>Forma de pagamento</h3>
        <p style={{ fontSize: "0.82rem", color: "var(--cor-texto-suave)" }}>
          Combine um ou mais cartões e/ou cupons — a soma precisa cobrir o total do pedido.
        </p>

        {/* Linhas de pagamento por cartão */}
        {pagamentos.map((linha, i) => (
          <div key={i} style={{ display: "flex", gap: ".5rem", alignItems: "center", marginBottom: ".5rem" }}>
            <select style={{ flex: 2 }} value={linha.cartaoCreditoId} onChange={(e) => atualizarPagamento(i, "cartaoCreditoId", e.target.value)}>
              {cartoes.map((c) => <option key={c.id} value={c.id}>{c.apelido} •••• {c.ultimosDigitos}</option>)}
            </select>
            <input
              type="number" step="0.01" min="0" placeholder="Valor (R$)"
              style={{ flex: 1, padding: ".5rem", border: "1px solid var(--cor-borda)", borderRadius: 4 }}
              value={linha.valor}
              onChange={(e) => atualizarPagamento(i, "valor", e.target.value)}
            />
            <button className="btn btn-perigo btn-sm" onClick={() => removerPagamento(i)}>Remover</button>
          </div>
        ))}

        <div style={{ display: "flex", gap: ".5rem", marginBottom: "1rem" }}>
          <button className="btn btn-secundario btn-sm" disabled={cartoes.length === 0} onClick={adicionarLinhaPagamento}>
            + Usar um cartão
          </button>
          <button className="btn btn-secundario btn-sm" onClick={() => setNovoCartao(true)}>+ Cadastrar novo cartão</button>
        </div>

        {novoCartao && (
          <form onSubmit={salvarNovoCartao} style={{ marginBottom: "1rem", paddingTop: ".5rem", borderTop: "1px solid var(--cor-borda)" }}>
            <div className="campo"><label>Apelido</label><input required value={formCartao.apelido} onChange={(e) => setFormCartao({ ...formCartao, apelido: e.target.value })} /></div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <div className="campo" style={{ flex: 1 }}><label>Últimos 4 dígitos</label><input required maxLength={4} value={formCartao.ultimosDigitos} onChange={(e) => setFormCartao({ ...formCartao, ultimosDigitos: e.target.value })} /></div>
              <div className="campo" style={{ flex: 1 }}><label>Bandeira</label><input required placeholder="Visa, Master…" value={formCartao.bandeira} onChange={(e) => setFormCartao({ ...formCartao, bandeira: e.target.value })} /></div>
              <div className="campo" style={{ flex: 1 }}><label>Validade</label><input required placeholder="MM/AAAA" value={formCartao.validade} onChange={(e) => setFormCartao({ ...formCartao, validade: e.target.value })} /></div>
            </div>
            <div className="campo"><label>Nome do titular</label><input required value={formCartao.nomeTitular} onChange={(e) => setFormCartao({ ...formCartao, nomeTitular: e.target.value })} /></div>
            <button className="btn btn-primario btn-sm">Salvar cartão</button>
          </form>
        )}

        {/* Cupons */}
        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--cor-borda)" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--cor-madeira)" }}>Cupons (promocional ou de troca)</label>

          {cuponsDisponiveis.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: ".4rem", marginTop: ".5rem" }}>
              {cuponsDisponiveis.map((c) => (
                <label
                  key={c.id}
                  style={{
                    display: "flex", alignItems: "center", gap: ".5rem", fontWeight: 400,
                    padding: ".5rem .65rem", border: "1px solid var(--cor-borda)", borderRadius: 4,
                    background: codigosCupom.includes(c.codigo) ? "var(--cor-fundo-alt)" : "#fff",
                  }}
                >
                  <input type="checkbox" checked={codigosCupom.includes(c.codigo)} onChange={() => alternarCupomSelecionado(c.codigo)} />
                  <span style={{ flex: 1 }}>
                    <strong>{c.codigo}</strong>{" "}
                    <span style={{ fontSize: "0.78rem", color: "var(--cor-texto-suave)" }}>
                      ({c.tipo === "TROCA" ? "gerado por troca" : "promocional"})
                    </span>
                  </span>
                  <span style={{ fontWeight: 700 }}>
                    − {c.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: "0.82rem", color: "var(--cor-texto-suave)", marginTop: ".35rem" }}>
              Você não tem cupons disponíveis no momento — veja em "Cupons" no menu.
            </p>
          )}

          <details style={{ marginTop: ".6rem" }}>
            <summary style={{ fontSize: "0.8rem", color: "var(--cor-texto-suave)", cursor: "pointer" }}>Ou informar um código manualmente</summary>
            <div style={{ display: "flex", gap: ".5rem", marginTop: ".4rem" }}>
              <input placeholder="ex.: CUP-ABC123" value={cupomAtual} onChange={(e) => setCupomAtual(e.target.value)}
                     style={{ flex: 1, padding: ".55rem", border: "1px solid var(--cor-borda)", borderRadius: 4 }} />
              <button className="btn btn-secundario btn-sm" onClick={adicionarCupom}>Adicionar</button>
            </div>
          </details>

          {codigosCupom.filter((c) => !cuponsDisponiveis.some((cd) => cd.codigo === c)).length > 0 && (
            <ul style={{ marginTop: ".5rem", paddingLeft: "1.1rem" }}>
              {codigosCupom
                .filter((c) => !cuponsDisponiveis.some((cd) => cd.codigo === c))
                .map((c) => (
                  <li key={c}>{c} <button className="link" style={{ color: "var(--cor-perigo)" }} onClick={() => removerCupom(c)}>remover</button></li>
                ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card card-pad">
        <div className="resumo-total">
          <span>Total do pedido</span>
          <span>{totalPedido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
        </div>
        <p style={{ fontSize: "0.8rem", color: "var(--cor-texto-suave)" }}>
          alocado em cartões: {totalPagamentos.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          {codigosCupom.length > 0 && ` + ${codigosCupom.length} cupom(ns)`}
        </p>
        <button
          className="btn btn-primario btn-block"
          disabled={enviando || !enderecoId || (pagamentos.length === 0 && codigosCupom.length === 0)}
          onClick={finalizar}
        >
          {enviando ? "Processando…" : "Confirmar pedido"}
        </button>
      </div>
    </div>
  );
}
