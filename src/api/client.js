import { apiMock } from "./mockApi.js";

/**
 * Integração progressiva com o backend.
 *
 * O `MODO_MOCK` booleano que existia aqui não servia mais: ele liga ou
 * desliga o mock do app INTEIRO, e hoje só o módulo de cliente tem
 * backend real. Virá-lo derrubaria catálogo, carrinho, pedidos e trocas.
 *
 * `PRONTOS` lista os métodos já implementados em Java. O objeto `api`
 * final é o mock com esses métodos substituídos pelos reais — nenhuma
 * tela sabe da diferença, porque todas continuam chamando
 * `api.algumaCoisa()`.
 *
 * Cada camada nova de backend acrescenta nomes a esta lista. Quando ela
 * cobrir todos os métodos do `apiReal`, este arquivo volta a ser só o
 * `apiReal` e os dois arquivos de mock podem ser apagados.
 */
const PRONTOS = [
  // Autenticação
  "login",
  "registrar",
  // Cadastro do cliente (RF0021, RF0022, RF0024, RF0028)
  "meuPerfil",
  "alterarCadastro",
  "alterarSenha",
  "inativarPropriaConta",
  // Endereços (RF0026)
  "meusEnderecos",
  "adicionarEndereco",
  "atualizarEndereco",
  "removerEndereco",
  "definirEnderecoPrincipal",
  // Cartões (RF0027)
  "meusCartoes",
  "adicionarCartao",
  "atualizarCartao",
  "removerCartao",
  "definirCartaoPreferencial",
  // Domínio (RN0025)
  "listarBandeiras",
  // Administração de clientes (RF0023, RF0024)
  "listarClientes",
  "inativarCliente",
  "ativarCliente",
];

// O padrão já aponta para o backend com o prefixo de versão, para o
// projeto rodar recém-clonado sem ninguém precisar criar um .env.
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";

function authHeaders() {
  const token = localStorage.getItem("gakki_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Extrai a mensagem de um erro no formato ProblemDetail (RFC 7807).
 *
 * Quando a falha é de validação de campo, o `detail` é genérico ("A
 * requisição contém campos inválidos") e o que interessa está em
 * `errors`. Juntar as mensagens de campo faz a tela mostrar "CPF
 * inválido" em vez da frase genérica.
 */
function mensagemDeErro(dados, status) {
  if (dados?.errors?.length) {
    return dados.errors.map((e) => e.mensagem).join(" ");
  }
  return dados?.detail || dados?.title || `Erro ${status}`;
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
      mensagem = mensagemDeErro(await res.json(), res.status);
    } catch {
      /* corpo vazio ou não-JSON */
    }
    throw new Error(mensagem);
  }

  if (res.status === 204) return null;
  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("json") ? res.json() : res.text();
}

const apiReal = {
  // Autenticação
  login: (email, senha) => request("/auth/login", { method: "POST", body: { email, senha } }),
  registrar: (payload) => request("/auth/registrar", { method: "POST", body: payload }),
  renovarSessao: (refreshToken) => request("/auth/refresh", { method: "POST", body: { refreshToken } }),

  // Catálogo (público)
  listarInstrumentos: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/instrumentos?${qs}`);
  },
  buscarInstrumento: (id) => request(`/instrumentos/${id}`),
  listarCategorias: () => request("/categorias"),
  listarFabricantes: () => request("/fabricantes"),

  // Domínio
  listarBandeiras: () => request("/bandeiras"),

  // Cliente autenticado
  meuPerfil: () => request("/clientes/me", { auth: true }),
  alterarCadastro: (payload) => request("/clientes/me", { method: "PUT", body: payload, auth: true }),
  alterarSenha: (payload) => request("/clientes/me/senha", { method: "PATCH", body: payload, auth: true }),
  inativarPropriaConta: () => request("/clientes/me/inativar", { method: "PATCH", auth: true }),
  meusEnderecos: () => request("/clientes/me/enderecos", { auth: true }),
  adicionarEndereco: (payload) => request("/clientes/me/enderecos", { method: "POST", body: payload, auth: true }),
  atualizarEndereco: (id, payload) => request(`/clientes/me/enderecos/${id}`, { method: "PUT", body: payload, auth: true }),
  removerEndereco: (id) => request(`/clientes/me/enderecos/${id}`, { method: "DELETE", auth: true }),
  definirEnderecoPrincipal: (id) => request(`/clientes/me/enderecos/${id}/principal`, { method: "PATCH", auth: true }),
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

  // Admin — pedidos
  listarPedidosAdmin: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/pedidos?${qs}`, { auth: true });
  },
  avancarProcessamento: (id) => request(`/pedidos/${id}/avancar-processamento`, { method: "POST", auth: true }),
  confirmarPagamentoPedido: (id) => request(`/pedidos/${id}/confirmar-pagamento`, { method: "POST", auth: true }),
  despacharPedido: (id) => request(`/pedidos/${id}/despachar`, { method: "POST", auth: true }),
  confirmarEntregaAdmin: (id) => request(`/pedidos/${id}/confirmar-entrega`, { method: "POST", auth: true }),

  // Admin — trocas
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

// Falha cedo se um nome da lista não existir no apiReal: um erro de
// digitação aqui deixaria a tela chamando o mock silenciosamente, e o
// bug apareceria só na apresentação.
const ausentes = PRONTOS.filter((m) => typeof apiReal[m] !== "function");
if (ausentes.length > 0) {
  throw new Error(`PRONTOS lista métodos inexistentes em apiReal: ${ausentes.join(", ")}`);
}

export const api = {
  ...apiMock,
  ...Object.fromEntries(PRONTOS.map((m) => [m, apiReal[m]])),
};
