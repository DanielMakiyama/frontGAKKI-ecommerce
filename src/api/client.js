import { apiMock } from "./mockApi.js";

/**
 * MODO_MOCK: enquanto true, o app inteiro roda com dados fictícios em
 * memória (mockApi.js), sem precisar do backend Java rodando — é o modo
 * usado nesta fase do projeto, focada só no protótipo de frontend.
 *
 * Quando o backend voltar a ser usado (retomando pedaço por pedaço),
 * troque esta única linha para `false` — nenhuma página precisa mudar,
 * porque `apiReal` já implementa exatamente as mesmas funções.
 */
const MODO_MOCK = true;

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

function authHeaders() {
  const token = localStorage.getItem("gakki_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) Object.assign(headers, authHeaders());

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let mensagem = `Erro ${res.status}`;
    try {
      const data = await res.json();
      mensagem = data.mensagem || data.erro || mensagem;
    } catch {
      /* corpo vazio ou não-JSON */
    }
    throw new Error(mensagem);
  }

  if (res.status === 204) return null;
  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json") ? res.json() : res.text();
}

const apiReal = {
  // Autenticação
  login: (email, senha) => request("/auth/login", { method: "POST", body: { email, senha } }),
  registrar: (payload) => request("/auth/registrar", { method: "POST", body: payload }),

  // Catálogo (público)
  listarInstrumentos: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/instrumentos?${qs}`);
  },
  buscarInstrumento: (id) => request(`/instrumentos/${id}`),
  listarCategorias: () => request("/categorias"),
  listarFabricantes: () => request("/fabricantes"),

  // Cliente autenticado
  meuPerfil: () => request("/clientes/me", { auth: true }),
  alterarCadastro: (payload) => request("/clientes/me", { method: "PUT", body: payload, auth: true }),
  alterarSenha: (payload) => request("/clientes/me/senha", { method: "PATCH", body: payload, auth: true }),
  inativarPropriaConta: () => request("/clientes/me/inativar", { method: "PATCH", auth: true }),
  meusEnderecos: () => request("/clientes/me/enderecos", { auth: true }),
  adicionarEndereco: (payload) => request("/clientes/me/enderecos", { method: "POST", body: payload, auth: true }),
  meusCartoes: () => request("/clientes/me/cartoes", { auth: true }),
  adicionarCartao: (payload) => request("/clientes/me/cartoes", { method: "POST", body: payload, auth: true }),
  atualizarCartao: (id, payload) => request(`/clientes/me/cartoes/${id}`, { method: "PUT", body: payload, auth: true }),
  removerCartao: (id) => request(`/clientes/me/cartoes/${id}`, { method: "DELETE", auth: true }),
  definirCartaoPreferencial: (id) => request(`/clientes/me/cartoes/${id}/preferencial`, { method: "PATCH", auth: true }),
  meusCupons: () => request("/clientes/me/cupons", { auth: true }),

  // Carrinho
  verCarrinho: () => request("/carrinho", { auth: true }),
  adicionarAoCarrinho: (instrumentoId, quantidade) =>
    request("/carrinho/itens", { method: "POST", body: { instrumentoId, quantidade }, auth: true }),
  atualizarQuantidadeCarrinho: (itemId, quantidade) =>
    request(`/carrinho/itens/${itemId}?quantidade=${quantidade}`, { method: "PATCH", auth: true }),
  removerDoCarrinho: (itemId) => request(`/carrinho/itens/${itemId}`, { method: "DELETE", auth: true }),

  // Pedidos (cliente)
  finalizarCompra: (payload) => request("/pedidos/finalizar", { method: "POST", body: payload, auth: true }),
  meusPedidos: () => request("/pedidos/meus", { auth: true }),
  cancelarPedido: (id) => request(`/pedidos/${id}/cancelar`, { method: "POST", auth: true }),
  confirmarRecebimentoPedido: (id) => request(`/pedidos/${id}/confirmar-recebimento`, { method: "POST", auth: true }),

  // Trocas (cliente)
  solicitarTroca: (payload) => request("/trocas", { method: "POST", body: payload, auth: true }),
  minhasTrocas: () => request("/trocas/minhas", { auth: true }),
  informarEnvioTroca: (id) => request(`/trocas/${id}/informar-envio`, { method: "POST", auth: true }),
  preverFrete: (enderecoId) => request(`/carrinho/frete?enderecoId=${enderecoId}`, { auth: true }),

  // Admin — clientes
  listarClientes: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/clientes?${qs}`, { auth: true });
  },
  inativarCliente: (id) => request(`/clientes/${id}/inativar`, { method: "PATCH", auth: true }),
  ativarCliente: (id) => request(`/clientes/${id}/ativar`, { method: "PATCH", auth: true }),

  // Admin — pedidos (novo fluxo)
  listarPedidosAdmin: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/pedidos?${qs}`, { auth: true });
  },
  avancarProcessamento: (id) => request(`/pedidos/${id}/avancar-processamento`, { method: "POST", auth: true }),
  confirmarPagamentoPedido: (id) => request(`/pedidos/${id}/confirmar-pagamento`, { method: "POST", auth: true }),
  despacharPedido: (id) => request(`/pedidos/${id}/despachar`, { method: "POST", auth: true }),
  confirmarEntregaAdmin: (id) => request(`/pedidos/${id}/confirmar-entrega`, { method: "POST", auth: true }),

  // Admin — trocas (novo fluxo)
  listarTrocasAdmin: (status) => request(`/trocas${status ? `?status=${status}` : ""}`, { auth: true }),
  aceitarTroca: (id) => request(`/trocas/${id}/aceitar`, { method: "POST", auth: true }),
  negarTroca: (id, motivo) => request(`/trocas/${id}/negar`, { method: "POST", body: { motivo }, auth: true }),
  confirmarRecebimentoTroca: (id, retornaEstoque) =>
    request(`/trocas/${id}/confirmar-recebimento`, { method: "POST", body: { retornaEstoque }, auth: true }),
  processarTroca: (id) => request(`/trocas/${id}/processar`, { method: "POST", auth: true }),

  // Admin — catálogo e estoque
  cadastrarInstrumento: (payload) => request("/instrumentos", { method: "POST", body: payload, auth: true }),
  registrarEntradaEstoque: (payload) => request("/estoque/entrada", { method: "POST", body: payload, auth: true }),
  historicoVendas: (inicio, fim, categorias) => {
    const qs = new URLSearchParams({ inicio, fim });
    categorias.forEach((c) => qs.append("categorias", c));
    return request(`/analise/vendas?${qs}`, { auth: true });
  },

  // IA
  recomendacoes: (topN = 5) => request(`/recomendacoes?topN=${topN}`, { auth: true }),
  chat: (mensagem) => request("/recomendacoes/chat", { method: "POST", body: mensagem, auth: true }),
};

export const api = MODO_MOCK ? apiMock : apiReal;
