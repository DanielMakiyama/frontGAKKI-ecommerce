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
  // Catálogo (RF0011) — rotas públicas
  "listarInstrumentos",
  "buscarInstrumento",
  // Carrinho (RF0031, RF0032, RF0034)
  "verCarrinho",
  "adicionarAoCarrinho",
  "atualizarQuantidadeCarrinho",
  "removerDoCarrinho",
  "preverFrete",
  // Carrinho — bloqueio e expiração (RN0044, RN0045, RNF0042)
  "restaurarItemRetirado",
  "descartarItemRetirado",
  "descartarItensRetirados",
  // Cupons (RF0037)
  "meusCupons",
  // Pedidos (RF0033, RF0038)
  "finalizarCompra",
  "meusPedidos",
  // Administração de pedidos (RF0039, RF0040, RN0037, RN0038)
  "listarPedidosAdmin",
  "confirmarPagamentoPedido",
  "despacharPedido",
  "confirmarEntregaAdmin",
  // Trocas (RF0041 a RF0045)
  "solicitarTroca",
  "minhasTrocas",
  "listarTrocasAdmin",
  "autorizarTroca",
  "confirmarRecebimentoTroca",
  // Notificações (RN0046)
  "minhasNotificacoes",
];

// Ainda no mock, de propósito:
//
// listarCategorias / listarFabricantes — não há endpoint nesta fatia. O
//   catálogo usa os dois só para montar os filtros, e já trata a falha com
//   catch silencioso. Consequência: filtrar por categoria não tem efeito
//   contra o backend real, porque o id vem do mock. Fora do roteiro da
//   apresentação.
// estoque, análise de vendas e IA — fases futuras.
//
// Fora daqui porque o DRS não os prevê, e não por falta de tempo:
// cancelarPedido e confirmarRecebimentoPedido (quem move o pedido é o
// administrador, RF0039 e RF0040), negarTroca (a RF0042 só descreve o
// caminho da autorização) e informarEnvioTroca / processarTroca (etapas
// que o protótipo inventou e que o ciclo de três estados do DRS não
// tem). As telas que os chamavam foram ajustadas; os nomes continuam no
// mock para não quebrar nada que tenha ficado para trás.

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
  // Cupons do cliente: a rota é /cupons, não /clientes/me/cupons — cupom
  // pertence ao cliente mas não é sub-recurso do cadastro dele.
  meusCupons: () => request("/cupons", { auth: true }),

  // Carrinho
  verCarrinho: () => request("/carrinho", { auth: true }),
  adicionarAoCarrinho: (instrumentoId, quantidade) =>
    request("/carrinho/itens", { method: "POST", body: { instrumentoId, quantidade }, auth: true }),
  // PUT com corpo, não PATCH com query string: a quantidade é o estado
  // novo do item, não um parâmetro de busca.
  atualizarQuantidadeCarrinho: (itemId, quantidade) =>
    request(`/carrinho/itens/${itemId}`, { method: "PUT", body: { quantidade }, auth: true }),
  removerDoCarrinho: (itemId) => request(`/carrinho/itens/${itemId}`, { method: "DELETE", auth: true }),

  // RNF0042 — itens que saíram do carrinho quando o prazo venceu. As três
  // rotas devolvem o carrinho inteiro, já com `podeComprar` recalculado,
  // então a tela não precisa de um GET depois de cada ação.
  restaurarItemRetirado: (id) =>
    request(`/carrinho/retirados/${id}/restaurar`, { method: "POST", auth: true }),
  descartarItemRetirado: (id) =>
    request(`/carrinho/retirados/${id}`, { method: "DELETE", auth: true }),
  descartarItensRetirados: () =>
    request("/carrinho/retirados", { method: "DELETE", auth: true }),

  // Pedidos (cliente)
  finalizarCompra: (payload) => request("/pedidos", { method: "POST", body: payload, auth: true }),
  // A API devolve página; a tela espera lista. Desembrulhar aqui mantém o
  // Pedidos.jsx intacto — é exatamente o papel desta camada, adaptar dois
  // contratos sem contaminar nenhum dos dois.
  //
  // `sort=id,desc` porque o endpoint não ordena por conta própria: sem
  // isso a primeira página traz os pedidos mais ANTIGOS, e a compra que
  // o cliente acabou de fazer não aparece depois do vigésimo pedido.
  meusPedidos: () => request("/pedidos?sort=id,desc", { auth: true }).then((pagina) => pagina.content ?? []),

  /*
   * Trocas do cliente (RF0041, RN0041).
   *
   * O corpo é { pedidoId, itens: [{ itemPedidoId, quantidade }] }: a
   * RN0041 fala em "selecionar os itens" de uma compra entregue, no
   * plural, e o pedido de troca nasce com todos eles de uma vez. O
   * protótipo mandava um item por vez e uma justificativa — campo que o
   * DRS não pede em lugar nenhum.
   */
  solicitarTroca: (payload) => request("/trocas", { method: "POST", body: payload, auth: true }),
  minhasTrocas: () =>
    request("/trocas?sort=id,desc", { auth: true }).then((pagina) => pagina.content ?? []),

  // RN0046 — notificações do cliente; nesta fase, a autorização da troca.
  minhasNotificacoes: () =>
    request("/notificacoes?sort=id,desc", { auth: true }).then((pagina) => pagina.content ?? []),

  // RF0034 — o parâmetro chama enderecoEntregaId no backend; o nome
  // completo evita confundir com o endereço de cobrança.
  preverFrete: (enderecoId) =>
    request(`/carrinho/frete?enderecoEntregaId=${enderecoId}`, { auth: true }),

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
    return request(`/pedidos/administracao${qs ? `?${qs}` : ""}`, { auth: true });
  },
  confirmarPagamentoPedido: (id) => request(`/pedidos/${id}/confirmar-pagamento`, { method: "POST", auth: true }),
  despacharPedido: (id) => request(`/pedidos/${id}/despachar`, { method: "POST", auth: true }),
  confirmarEntregaAdmin: (id) => request(`/pedidos/${id}/confirmar-entrega`, { method: "POST", auth: true }),

  // Admin — trocas (RF0042 a RF0045)
  //
  // Rota própria /trocas/administracao, pelo mesmo critério de
  // /pedidos/administracao: o escopo está na rota, não no token. Aqui o
  // `.content` é desembrulhado porque a tela não tem paginação — já em
  // listarPedidosAdmin a própria tela trata a página, porque ela manda
  // `size` e filtro.
  listarTrocasAdmin: (status) =>
    request(`/trocas/administracao${status ? `?status=${status}` : ""}`, { auth: true })
      .then((pagina) => pagina.content ?? []),
  autorizarTroca: (id) => request(`/trocas/${id}/autorizar`, { method: "POST", auth: true }),
  // RF0044 e RF0045 — o recebimento carrega a decisão sobre o estoque, e
  // é nele que o cupom de troca é emitido.
  confirmarRecebimentoTroca: (id, retornaEstoque) =>
    request(`/trocas/${id}/confirmar-recebimento`, { method: "POST", body: { retornaEstoque }, auth: true }),

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
