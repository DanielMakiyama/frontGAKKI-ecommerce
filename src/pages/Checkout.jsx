import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, CreditCard, MapPin, Plus, Tag, Trash2, X } from "lucide-react";
import { api } from "../api/client";
import { useCart } from "../context/CartContext";
import { formatarBRL } from "../components/ProdutoCard";

/** "PAGAMENTO_REALIZADO" → "Pagamento realizado" */
function rotularStatus(status) {
  const texto = String(status || "").replace(/_/g, " ").toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

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
  const [cupomAtual, setCupomAtual] = useState("");
  const [codigosCupom, setCodigosCupom] = useState([]);

  // Prévia de frete (calculada de verdade no backend, com peso dos itens +
  // estado do endereço escolhido) — evita mostrar um total sem frete.
  const [previsaoFrete, setPrevisaoFrete] = useState(null);
  const [carregandoFrete, setCarregandoFrete] = useState(false);

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
  }, [recarregar]);

  // Sempre que o endereço muda, busca o frete real pra esse destino.
  useEffect(() => {
    if (!enderecoId) return;
    setCarregandoFrete(true);
    api.preverFrete(enderecoId)
      .then(setPrevisaoFrete)
      .catch(() => setPrevisaoFrete(null))
      .finally(() => setCarregandoFrete(false));
  }, [enderecoId]);

  const totalPedido = previsaoFrete?.valorTotalComFrete ?? (carrinho?.valorTotal || 0);
  const totalPagamentos = pagamentos.reduce((acc, p) => acc + Number(p.valor || 0), 0);
  // Nota: o valor exato dos cupons só é confirmado no backend; aqui mostramos
  // quantos foram adicionados, a validação de cobertura total acontece na confirmação.
  const faltaAlocar = Math.max(0, totalPedido - totalPagamentos);
  const podeConfirmar = enderecoId && !carregandoFrete && (pagamentos.length > 0 || codigosCupom.length > 0);

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

  /** Joga o que falta para fechar o total nesta linha — evita o cliente
   *  calcular a diferença na mão quando divide entre dois cartões. */
  function alocarRestante(index) {
    const valorLinha = Number(pagamentos[index]?.valor || 0);
    const restanteSemEsta = Math.max(0, totalPedido - (totalPagamentos - valorLinha));
    atualizarPagamento(index, "valor", restanteSemEsta.toFixed(2));
  }

  function adicionarCupom() {
    const codigo = cupomAtual.trim().toUpperCase();
    if (!codigo || codigosCupom.includes(codigo)) return;
    setCodigosCupom((c) => [...c, codigo]);
    setCupomAtual("");
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
      <div className="container container-estreito">
        <div className="card card-pad confirmacao-pedido">
          <CheckCircle2 size={52} strokeWidth={1.4} />
          <h1>Pedido realizado</h1>
          <p>Enviamos a confirmação para o seu e-mail.</p>

          <dl className="ficha-tecnica">
            <div><dt>Número do pedido</dt><dd>{pedidoCriado.numero}</dd></div>
            <div><dt>Status</dt><dd><span className={`status-tag status-${pedidoCriado.status}`}>{rotularStatus(pedidoCriado.status)}</span></dd></div>
            <div><dt>Total</dt><dd>{formatarBRL(pedidoCriado.valorTotal)}</dd></div>
          </dl>

          <div className="acoes-confirmacao">
            <button className="btn btn-primario" onClick={() => navigate("/pedidos")}>Ver meus pedidos</button>
            <Link to="/catalogo" className="btn btn-secundario">Continuar comprando</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!carrinho || carrinho.itens.length === 0) {
    return (
      <div className="container container-medio">
        <div className="card card-pad estado-vazio">
          <p>Seu carrinho está vazio.</p>
          <Link to="/catalogo" className="btn btn-primario">Ver catálogo</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container container-medio">
      <div className="pagina-titulo"><h1>Finalizar compra</h1></div>

      {erro && <div className="erro-form">{erro}</div>}

      <div className="checkout-layout">
        {/* A numeração 1-2-3 vem de um contador CSS (ver .passo no index.css),
            não de números escritos aqui: reordenar as etapas não exige
            renumerar nada no JSX. */}
        <div className="checkout-passos">

          <section className="card card-pad passo">
            <h2 className="passo-titulo"><MapPin size={18} strokeWidth={1.9} /> Endereço de entrega</h2>

            {enderecos.length > 0 && !novoEndereco && (
              <div className="lista-opcoes" role="radiogroup" aria-label="Endereço de entrega">
                {enderecos.map((e) => (
                  <label key={e.id} className={`opcao-selecionavel${enderecoId === String(e.id) ? " ativa" : ""}`}>
                    <input
                      type="radio"
                      name="endereco"
                      value={e.id}
                      checked={enderecoId === String(e.id)}
                      onChange={(ev) => setEnderecoId(ev.target.value)}
                    />
                    <span className="opcao-conteudo">
                      <strong>{e.apelido}{e.principal && <span className="marcador-padrao">principal</span>}</strong>
                      <span>{e.logradouro}, {e.numero}{e.complemento ? ` — ${e.complemento}` : ""}</span>
                      <span>{e.cidade}/{e.estado} · CEP {e.cep}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}

            {!novoEndereco ? (
              <button className="btn btn-secundario btn-sm" onClick={() => setNovoEndereco(true)}>
                <Plus size={15} strokeWidth={2.2} /> Novo endereço
              </button>
            ) : (
              <form onSubmit={salvarNovoEndereco} className="form-embutido">
                <div className="campo"><label>Apelido</label><input required value={formEndereco.apelido} onChange={(e) => setFormEndereco({ ...formEndereco, apelido: e.target.value })} /></div>
                <div className="campo"><label>Logradouro</label><input required value={formEndereco.logradouro} onChange={(e) => setFormEndereco({ ...formEndereco, logradouro: e.target.value })} /></div>
                <div className="linha-campos">
                  <div className="campo" style={{ flex: 1 }}><label>Número</label><input value={formEndereco.numero} onChange={(e) => setFormEndereco({ ...formEndereco, numero: e.target.value })} /></div>
                  <div className="campo" style={{ flex: 2 }}><label>Complemento</label><input value={formEndereco.complemento} onChange={(e) => setFormEndereco({ ...formEndereco, complemento: e.target.value })} /></div>
                </div>
                <div className="linha-campos">
                  <div className="campo" style={{ flex: 2 }}><label>Cidade</label><input required value={formEndereco.cidade} onChange={(e) => setFormEndereco({ ...formEndereco, cidade: e.target.value })} /></div>
                  <div className="campo" style={{ flex: 1 }}><label>UF</label><input required maxLength={2} value={formEndereco.estado} onChange={(e) => setFormEndereco({ ...formEndereco, estado: e.target.value.toUpperCase() })} /></div>
                  <div className="campo" style={{ flex: 1 }}><label>CEP</label><input required value={formEndereco.cep} onChange={(e) => setFormEndereco({ ...formEndereco, cep: e.target.value })} /></div>
                </div>
                <div className="acoes-form">
                  <button className="btn btn-primario btn-sm">Salvar endereço</button>
                  <button type="button" className="btn btn-secundario btn-sm" onClick={() => setNovoEndereco(false)}>Cancelar</button>
                </div>
              </form>
            )}
          </section>

          <section className="card card-pad passo">
            <h2 className="passo-titulo"><CreditCard size={18} strokeWidth={1.9} /> Pagamento</h2>
            <p className="passo-ajuda">
              Combine um ou mais cartões e/ou cupons — a soma precisa cobrir o total do pedido.
            </p>

            {pagamentos.map((linha, i) => (
              <div key={i} className="linha-pagamento">
                <select
                  className="select-filtro"
                  value={linha.cartaoCreditoId}
                  onChange={(e) => atualizarPagamento(i, "cartaoCreditoId", e.target.value)}
                  aria-label={`Cartão da linha ${i + 1}`}
                >
                  {cartoes.map((c) => <option key={c.id} value={c.id}>{c.apelido} •••• {c.ultimosDigitos}</option>)}
                </select>

                <div className="campo-moeda">
                  <span aria-hidden="true">R$</span>
                  <input
                    type="number" step="0.01" min="0" placeholder="0,00"
                    value={linha.valor}
                    onChange={(e) => atualizarPagamento(i, "valor", e.target.value)}
                    aria-label={`Valor da linha ${i + 1}`}
                  />
                </div>

                <button type="button" className="btn btn-secundario btn-sm" onClick={() => alocarRestante(i)}>
                  Restante
                </button>
                <button type="button" className="btn-icone-perigo" onClick={() => removerPagamento(i)} aria-label={`Remover linha ${i + 1}`}>
                  <Trash2 size={16} strokeWidth={1.8} />
                </button>
              </div>
            ))}

            <div className="acoes-form">
              <button className="btn btn-secundario btn-sm" disabled={cartoes.length === 0} onClick={adicionarLinhaPagamento}>
                <Plus size={15} strokeWidth={2.2} /> Usar um cartão
              </button>
              <button className="btn btn-secundario btn-sm" onClick={() => setNovoCartao(true)}>
                <Plus size={15} strokeWidth={2.2} /> Cadastrar cartão
              </button>
            </div>

            {novoCartao && (
              <form onSubmit={salvarNovoCartao} className="form-embutido">
                <div className="campo"><label>Apelido</label><input required value={formCartao.apelido} onChange={(e) => setFormCartao({ ...formCartao, apelido: e.target.value })} /></div>
                <div className="linha-campos">
                  <div className="campo" style={{ flex: 1 }}><label>Últimos 4 dígitos</label><input required maxLength={4} value={formCartao.ultimosDigitos} onChange={(e) => setFormCartao({ ...formCartao, ultimosDigitos: e.target.value })} /></div>
                  <div className="campo" style={{ flex: 1 }}><label>Bandeira</label><input required placeholder="Visa, Master…" value={formCartao.bandeira} onChange={(e) => setFormCartao({ ...formCartao, bandeira: e.target.value })} /></div>
                  <div className="campo" style={{ flex: 1 }}><label>Validade</label><input required placeholder="MM/AAAA" value={formCartao.validade} onChange={(e) => setFormCartao({ ...formCartao, validade: e.target.value })} /></div>
                </div>
                <div className="campo"><label>Nome do titular</label><input required value={formCartao.nomeTitular} onChange={(e) => setFormCartao({ ...formCartao, nomeTitular: e.target.value })} /></div>
                <div className="acoes-form">
                  <button className="btn btn-primario btn-sm">Salvar cartão</button>
                  <button type="button" className="btn btn-secundario btn-sm" onClick={() => setNovoCartao(false)}>Cancelar</button>
                </div>
              </form>
            )}
          </section>

          <section className="card card-pad passo">
            <h2 className="passo-titulo"><Tag size={18} strokeWidth={1.9} /> Cupons</h2>

            <div className="linha-cupom">
              <div className="campo-com-icone">
                <Tag size={16} strokeWidth={1.8} />
                <input
                  placeholder="ex.: CUP-ABC123"
                  value={cupomAtual}
                  onChange={(e) => setCupomAtual(e.target.value)}
                  // Enter dentro do campo adiciona; sem isso o cliente
                  // precisa tirar a mão do teclado para clicar.
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); adicionarCupom(); } }}
                  aria-label="Código do cupom"
                />
              </div>
              <button className="btn btn-secundario btn-sm" onClick={adicionarCupom}>Adicionar</button>
            </div>

            {codigosCupom.length > 0 && (
              <div className="filtros-ativos" style={{ marginTop: ".8rem", marginBottom: 0 }}>
                {codigosCupom.map((c) => (
                  <button key={c} className="tag-filtro" onClick={() => removerCupom(c)} aria-label={`Remover cupom ${c}`}>
                    {c} <X size={13} strokeWidth={2.5} />
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="resumo-lateral card card-pad" aria-label="Resumo do pedido">
          <h2>Resumo</h2>

          <div className="linha-resumo">
            <span>Subtotal dos itens</span>
            <span>{formatarBRL(carrinho?.valorTotal || 0)}</span>
          </div>
          <div className="linha-resumo">
            <span>Frete</span>
            <span className={previsaoFrete ? undefined : "valor-pendente"}>
              {carregandoFrete ? "calculando…" : previsaoFrete ? formatarBRL(previsaoFrete.valorFrete) : "—"}
            </span>
          </div>

          <div className="resumo-total">
            <span>Total</span>
            <span>{formatarBRL(totalPedido)}</span>
          </div>

          <div className="alocacao">
            <div className="linha-resumo">
              <span>Alocado em cartões</span>
              <span>{formatarBRL(totalPagamentos)}</span>
            </div>
            {codigosCupom.length > 0 && (
              <div className="linha-resumo">
                <span>Cupons aplicados</span>
                <span>{codigosCupom.length}</span>
              </div>
            )}
            {faltaAlocar > 0 && (
              <p className="falta-alocar" role="status">
                Falta alocar {formatarBRL(faltaAlocar)}
              </p>
            )}
          </div>

          <button className="btn btn-primario btn-block" disabled={enviando || !podeConfirmar} onClick={finalizar}>
            {enviando ? "Processando…" : "Confirmar pedido"}
          </button>

          <p className="nota-seguranca">
            O valor dos cupons é validado na confirmação.
          </p>
        </aside>
      </div>
    </div>
  );
}
