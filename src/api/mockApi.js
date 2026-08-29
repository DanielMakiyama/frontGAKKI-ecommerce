/**
 * Implementação "de mentirinha" da API — mesma assinatura de funções que
 * api/client.js (real), mas lendo/escrevendo em mockDb.js em vez de fazer
 * fetch() pro backend Java. Cada página do app chama sempre `api.algumaCoisa()`
 * sem saber (nem precisar saber) se está no modo mock ou real.
 */
import { db, gerarId } from "./mockDb.js";

const atraso = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

// --- Sessão fictícia: o "token" é só o e-mail em base64, decodificado a
// cada chamada "meu-alguma-coisa" pra saber quem está logado. Sobrevive a
// F5 porque lê direto do localStorage, sem depender de estado de módulo. ---

function clienteAtual() {
  const token = localStorage.getItem("gakki_token");
  if (!token) throw new Error("Não autenticado");
  const email = atob(token);
  const cliente = db.clientes.find((c) => c.email === email);
  if (!cliente) throw new Error("Cliente não encontrado");
  return cliente;
}

function paginar(lista, { page = 0, size = 20 } = {}) {
  const inicio = page * size;
  return {
    content: lista.slice(inicio, inicio + size),
    totalElements: lista.length,
    totalPages: Math.max(1, Math.ceil(lista.length / size)),
    number: page,
    size,
  };
}

function paraInstrumentoResponse(i) {
  return {
    id: i.id, codigo: i.codigo, nome: i.nome, descricao: i.descricao,
    fabricante: i.fabricante, anoFabricacao: i.anoFabricacao, valorVenda: i.valorVenda,
    quantidadeEstoque: i.quantidadeEstoque, ativo: i.ativo, categorias: i.categorias,
  };
}

function paraPedidoResponse(p) {
  const cliente = db.clientes.find((c) => c.id === p.clienteId);
  return {
    id: p.id, numero: p.numero, status: p.status,
    clienteNome: p.clienteNome || cliente?.nome,
    clienteEmail: p.clienteEmail || cliente?.email,
    enderecoResumo: p.enderecoResumo,
    valorFrete: p.valorFrete, valorTotal: p.valorTotal, criadoEm: p.criadoEm,
    itens: p.itens, pagamentosCartao: p.pagamentosCartao, cuponsUtilizados: p.cuponsUtilizados,
  };
}

function recalcularTotalCarrinho() {
  return db.carrinho.itens.reduce((acc, i) => acc + i.valorUnitario * i.quantidade, 0);
}

function montarCarrinhoResponse() {
  return {
    carrinhoId: 1,
    itens: db.carrinho.itens.map((i) => ({
      itemId: i.itemId, instrumentoId: i.instrumentoId, nomeInstrumento: i.nomeInstrumento,
      quantidade: i.quantidade, valorUnitario: i.valorUnitario,
      lockExpiraEm: new Date(Date.now() + 15 * 60000).toISOString(),
    })),
    valorTotal: recalcularTotalCarrinho(),
  };
}

export const apiMock = {
  // --- Autenticação: qualquer senha entra ---
  async login(email) {
    await atraso();
    let cliente = db.clientes.find((c) => c.email === email);
    if (!cliente) {
      cliente = {
        id: gerarId(), codigo: `CLI-${gerarId()}`, nome: email.split("@")[0],
        email, telefone: "", perfil: email.toLowerCase().includes("admin") ? "ADMINISTRADOR" : "CLIENTE",
        ativo: true,
      };
      db.clientes.push(cliente);
    }
    if (!cliente.ativo) throw new Error("Cadastro inativo");
    return { token: btoa(email), nome: cliente.nome, perfil: cliente.perfil };
  },

  async registrar(payload) {
    await atraso();
    if (payload.senha !== payload.confirmacaoSenha) throw new Error("Confirmação de senha não confere");
    if (db.clientes.some((c) => c.email === payload.email)) throw new Error("E-mail já cadastrado");
    db.clientes.push({
      id: gerarId(), codigo: `CLI-${gerarId()}`, nome: payload.nome, email: payload.email,
      telefone: payload.telefone || "", perfil: "CLIENTE", ativo: true,
    });
    return null;
  },

  // --- Catálogo (público) ---
  async listarInstrumentos(params = {}) {
    await atraso();
    let lista = db.instrumentos.filter((i) => (params.ativo === "false" ? true : i.ativo));
    if (params.nome) lista = lista.filter((i) => i.nome.toLowerCase().includes(params.nome.toLowerCase()));
    if (params.categoriaId) {
      const nomeCategoria = db.categorias.find((c) => c.id === Number(params.categoriaId))?.nome;
      lista = lista.filter((i) => i.categorias.includes(nomeCategoria));
    }
    return paginar(lista.map(paraInstrumentoResponse), { page: Number(params.page) || 0, size: Number(params.size) || 20 });
  },
  async buscarInstrumento(id) {
    await atraso();
    const inst = db.instrumentos.find((i) => i.id === Number(id));
    if (!inst) throw new Error("Instrumento não encontrado");
    return paraInstrumentoResponse(inst);
  },
  async listarCategorias() {
    await atraso(150);
    return db.categorias;
  },
  async listarFabricantes() {
    await atraso(150);
    return db.fabricantes;
  },

  // --- Cliente autenticado ---
  async meuPerfil() {
    await atraso(150);
    return clienteAtual();
  },
  async alterarCadastro(payload) {
    await atraso();
    const cliente = clienteAtual();
    Object.assign(cliente, { nome: payload.nome, email: payload.email, telefone: payload.telefone });
    return cliente;
  },
  async alterarSenha() {
    await atraso();
    return null; // no modo mock, qualquer senha é aceita — não há o que validar de verdade
  },
  async inativarPropriaConta() {
    await atraso();
    clienteAtual().ativo = false;
    return null;
  },
  async meusEnderecos() {
    await atraso(200);
    const cliente = clienteAtual();
    return db.enderecos.filter((e) => e.clienteId === cliente.id);
  },
  async adicionarEndereco(payload) {
    await atraso();
    const cliente = clienteAtual();
    const novo = { id: gerarId(), clienteId: cliente.id, principal: db.enderecos.every((e) => e.clienteId !== cliente.id), ...payload };
    db.enderecos.push(novo);
    return novo;
  },
  async meusCartoes() {
    await atraso(200);
    const cliente = clienteAtual();
    return db.cartoes.filter((c) => c.clienteId === cliente.id);
  },
  async adicionarCartao(payload) {
    await atraso();
    const cliente = clienteAtual();
    const novo = { id: gerarId(), clienteId: cliente.id, preferencial: db.cartoes.every((c) => c.clienteId !== cliente.id), ...payload };
    db.cartoes.push(novo);
    return novo;
  },
  async meusCupons() {
    await atraso(200);
    const cliente = clienteAtual();
    return db.cupons.filter((c) => c.clienteId === cliente.id)
      .map((c) => ({ id: c.id, codigo: c.codigo, tipo: c.tipo, valor: c.valor, utilizado: c.utilizado, validoAte: c.validoAte }));
  },

  // --- Carrinho ---
  async verCarrinho() {
    await atraso(200);
    return montarCarrinhoResponse();
  },
  async adicionarAoCarrinho(instrumentoId, quantidade) {
    await atraso();
    const inst = db.instrumentos.find((i) => i.id === Number(instrumentoId));
    if (!inst) throw new Error("Instrumento não encontrado");
    if (inst.quantidadeEstoque < quantidade) throw new Error("Estoque insuficiente");
    const existente = db.carrinho.itens.find((i) => i.instrumentoId === inst.id);
    if (existente) existente.quantidade += quantidade;
    else db.carrinho.itens.push({ itemId: gerarId(), instrumentoId: inst.id, nomeInstrumento: inst.nome, quantidade, valorUnitario: inst.valorVenda });
    return montarCarrinhoResponse();
  },
  async atualizarQuantidadeCarrinho(itemId, quantidade) {
    await atraso();
    if (quantidade <= 0) {
      db.carrinho.itens = db.carrinho.itens.filter((i) => i.itemId !== Number(itemId));
    } else {
      const item = db.carrinho.itens.find((i) => i.itemId === Number(itemId));
      if (item) item.quantidade = quantidade;
    }
    return montarCarrinhoResponse();
  },
  async removerDoCarrinho(itemId) {
    await atraso();
    db.carrinho.itens = db.carrinho.itens.filter((i) => i.itemId !== Number(itemId));
    return null;
  },
  async preverFrete() {
    await atraso();
    const pesoFicticio = db.carrinho.itens.reduce((acc, i) => acc + i.quantidade, 0) * 2.5;
    const valorFrete = Math.round((15 + pesoFicticio * 3.5) * 100) / 100;
    return { valorFrete, valorTotalComFrete: recalcularTotalCarrinho() + valorFrete };
  },

  // --- Pedidos (cliente) ---
  async finalizarCompra(payload) {
    await atraso(500);
    const cliente = clienteAtual();
    if (db.carrinho.itens.length === 0) throw new Error("Carrinho vazio");
    const endereco = db.enderecos.find((e) => e.id === payload.enderecoEntregaId);
    const totalItens = recalcularTotalCarrinho();
    const valorFrete = 25.00;
    const totalPagamentos = (payload.pagamentosCartao || []).reduce((acc, p) => acc + Number(p.valor), 0);
    const totalCupons = (payload.codigosCupom || []).reduce((acc, cod) => {
      const cupom = db.cupons.find((c) => c.codigo === cod && !c.utilizado);
      return acc + (cupom?.valor || 0);
    }, 0);
    if (totalPagamentos + totalCupons < totalItens + valorFrete) {
      throw new Error(`Pagamento insuficiente: cartões + cupons somam ${(totalPagamentos + totalCupons).toFixed(2)}, mas o total do pedido é ${(totalItens + valorFrete).toFixed(2)}`);
    }
    (payload.codigosCupom || []).forEach((cod) => {
      const cupom = db.cupons.find((c) => c.codigo === cod);
      if (cupom) cupom.utilizado = true;
    });
    const novoPedido = {
      id: gerarId(), numero: `PED-${gerarId()}`, clienteId: cliente.id, status: "EM_ABERTO",
      valorFrete, valorTotal: totalItens + valorFrete, criadoEm: new Date().toISOString(),
      enderecoResumo: endereco ? `${endereco.logradouro}, ${endereco.numero} — ${endereco.cidade}/${endereco.estado}` : "",
      itens: db.carrinho.itens.map((i) => ({ itemPedidoId: gerarId(), instrumentoId: i.instrumentoId, instrumento: i.nomeInstrumento, quantidade: i.quantidade, valorUnitario: i.valorUnitario, emTroca: false })),
      pagamentosCartao: (payload.pagamentosCartao || []).map((p) => {
        const cartao = db.cartoes.find((c) => c.id === p.cartaoCreditoId);
        return { cartaoApelido: cartao?.apelido, ultimosDigitos: cartao?.ultimosDigitos, valor: p.valor };
      }),
      cuponsUtilizados: payload.codigosCupom || [],
    };
    db.pedidos.push(novoPedido);
    db.carrinho.itens.forEach((i) => {
      const inst = db.instrumentos.find((x) => x.id === i.instrumentoId);
      if (inst) inst.quantidadeEstoque -= i.quantidade;
    });
    db.carrinho.itens = [];
    return paraPedidoResponse(novoPedido);
  },
  async meusPedidos() {
    await atraso();
    const cliente = clienteAtual();
    return db.pedidos.filter((p) => p.clienteId === cliente.id)
      .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
      .map(paraPedidoResponse);
  },
  async cancelarPedido(id) {
    await atraso();
    const pedido = db.pedidos.find((p) => p.id === Number(id));
    if (!pedido) throw new Error("Pedido não encontrado");
    if (!["EM_ABERTO", "EM_PROCESSAMENTO"].includes(pedido.status)) throw new Error("Só é possível cancelar pedidos EM_ABERTO ou EM_PROCESSAMENTO");
    pedido.itens.forEach((i) => {
      const inst = db.instrumentos.find((x) => x.id === i.instrumentoId);
      if (inst) inst.quantidadeEstoque += i.quantidade;
    });
    pedido.status = "CANCELADA";
    return paraPedidoResponse(pedido);
  },
  async confirmarRecebimentoPedido(id) {
    await atraso();
    const pedido = db.pedidos.find((p) => p.id === Number(id));
    if (!pedido) throw new Error("Pedido não encontrado");
    pedido.status = "ENTREGUE";
    return paraPedidoResponse(pedido);
  },

  // --- Trocas (cliente) ---
  async solicitarTroca({ itemPedidoId, justificativa }) {
    await atraso();
    const cliente = clienteAtual();
    let pedidoAlvo, itemAlvo;
    for (const p of db.pedidos) {
      const item = p.itens.find((i) => i.itemPedidoId === itemPedidoId);
      if (item) { pedidoAlvo = p; itemAlvo = item; break; }
    }
    if (!itemAlvo) throw new Error("Item de pedido não encontrado");
    itemAlvo.emTroca = true;
    const nova = {
      id: gerarId(), itemPedidoId, instrumento: itemAlvo.instrumento, pedidoNumero: pedidoAlvo.numero,
      clienteId: cliente.id, status: "TROCA_SOLICITADA", justificativaCliente: justificativa,
      motivoNegativa: null, cupomGeradoCodigo: null, criadoEm: new Date().toISOString(),
    };
    db.trocas.push(nova);
    return nova;
  },
  async minhasTrocas() {
    await atraso();
    const cliente = clienteAtual();
    return db.trocas.filter((t) => t.clienteId === cliente.id).sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
  },
  async informarEnvioTroca(id) {
    await atraso();
    const troca = db.trocas.find((t) => t.id === Number(id));
    if (!troca) throw new Error("Troca não encontrada");
    troca.status = "ITEM_ENVIADO";
    return troca;
  },

  // --- Admin: clientes ---
  async listarClientes(params = {}) {
    await atraso();
    let lista = db.clientes.filter((c) => c.perfil === "CLIENTE");
    if (params.nome) lista = lista.filter((c) => c.nome.toLowerCase().includes(params.nome.toLowerCase()));
    return paginar(lista, { page: Number(params.page) || 0, size: Number(params.size) || 20 });
  },
  async inativarCliente(id) {
    await atraso();
    const c = db.clientes.find((x) => x.id === Number(id));
    if (c) c.ativo = false;
    return null;
  },
  async ativarCliente(id) {
    await atraso();
    const c = db.clientes.find((x) => x.id === Number(id));
    if (c) c.ativo = true;
    return null;
  },

  // --- Admin: pedidos ---
  async listarPedidosAdmin(params = {}) {
    await atraso();
    let lista = db.pedidos;
    if (params.status) lista = lista.filter((p) => p.status === params.status);
    lista = [...lista].sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
    return paginar(lista.map(paraPedidoResponse), { page: Number(params.page) || 0, size: Number(params.size) || 200 });
  },
  async avancarProcessamento(id) {
    await atraso();
    const p = db.pedidos.find((x) => x.id === Number(id));
    p.status = "EM_PROCESSAMENTO";
    return paraPedidoResponse(p);
  },
  async confirmarPagamentoPedido(id) {
    await atraso();
    const p = db.pedidos.find((x) => x.id === Number(id));
    p.status = "PAGAMENTO_REALIZADO";
    return paraPedidoResponse(p);
  },
  async despacharPedido(id) {
    await atraso();
    const p = db.pedidos.find((x) => x.id === Number(id));
    p.status = "EM_TRANSITO";
    return paraPedidoResponse(p);
  },
  async confirmarEntregaAdmin(id) {
    await atraso();
    const p = db.pedidos.find((x) => x.id === Number(id));
    p.status = "ENTREGUE";
    return paraPedidoResponse(p);
  },

  // --- Admin: trocas ---
  async listarTrocasAdmin(status) {
    await atraso();
    return status ? db.trocas.filter((t) => t.status === status) : db.trocas;
  },
  async aceitarTroca(id) {
    await atraso();
    const t = db.trocas.find((x) => x.id === Number(id));
    t.status = "TROCA_ACEITA";
    return t;
  },
  async negarTroca(id, motivo) {
    await atraso();
    const t = db.trocas.find((x) => x.id === Number(id));
    t.status = "TROCA_NEGADA";
    t.motivoNegativa = motivo;
    return t;
  },
  async confirmarRecebimentoTroca(id) {
    await atraso();
    const t = db.trocas.find((x) => x.id === Number(id));
    t.status = "ITEM_RECEBIDO";
    return t;
  },
  async processarTroca(id) {
    await atraso();
    const t = db.trocas.find((x) => x.id === Number(id));
    const codigo = `CUP-${gerarId()}`;
    db.cupons.push({ id: gerarId(), codigo, tipo: "TROCA", valor: 300.00, clienteId: t.clienteId, utilizado: false, validoAte: new Date(Date.now() + 180 * 86400000).toISOString() });
    t.status = "TROCA_PROCESSADA";
    t.cupomGeradoCodigo = codigo;
    return t;
  },

  // --- Admin: catálogo e estoque ---
  async cadastrarInstrumento(payload) {
    await atraso();
    const novo = {
      id: gerarId(), codigo: `INST-${gerarId()}`, nome: payload.nome, descricao: payload.descricao,
      fabricante: db.fabricantes.find((f) => f.id === payload.fabricanteId)?.nome || "—",
      anoFabricacao: payload.anoFabricacao, valorVenda: 0, quantidadeEstoque: 0, ativo: true,
      categorias: db.categorias.filter((c) => payload.categoriaIds.includes(c.id)).map((c) => c.nome),
    };
    db.instrumentos.push(novo);
    return paraInstrumentoResponse(novo);
  },
  async registrarEntradaEstoque(payload) {
    await atraso();
    const inst = db.instrumentos.find((i) => i.id === payload.instrumentoId);
    if (!inst) throw new Error("Instrumento não encontrado");
    const margem = 0.4;
    inst.valorVenda = Math.round(payload.valorCusto * (1 + margem) * 100) / 100;
    inst.quantidadeEstoque += payload.quantidade;
    return null;
  },
  async historicoVendas(inicio, fim, categorias) {
    await atraso();
    return categorias.map((cat) => ({ categoria: cat, mesAno: new Date().toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" }), totalVendas: Math.round(Math.random() * 5000) }));
  },

  // --- IA (recomendação + chatbot), respostas fixas de demonstração ---
  async recomendacoes() {
    await atraso(300);
    return db.instrumentos.slice(0, 3).map((i) => ({ instrumentoId: i.id, nome: i.nome, score: 0.9 }));
  },
  async chat(mensagem) {
    await atraso(400);
    const msg = mensagem.toLowerCase();
    if (msg.includes("frete")) return { intencao: "duvida_frete", confianca: 0.9, resposta: "O frete é calculado com base no peso dos itens e no endereço de entrega." };
    if (msg.includes("troca")) return { intencao: "duvida_troca", confianca: 0.9, resposta: "Você pode solicitar troca de um item entregue na tela de Pedidos." };
    if (msg.includes("comprar") || msg.includes("guitarra") || msg.includes("violão") || msg.includes("instrumento")) {
      return { intencao: "buscar_produto", confianca: 0.85, resposta: "Dá uma olhada no nosso catálogo — temos guitarras, violões, teclados e mais!" };
    }
    return { intencao: "saudacao", confianca: 0.7, resposta: "Olá! Como posso te ajudar a encontrar o instrumento ideal hoje?" };
  },
};
