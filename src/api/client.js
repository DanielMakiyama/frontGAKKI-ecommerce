/**
 * Camada de dados mockada da GAKKI STORE.
 *
 * Este arquivo mantém exatamente as mesmas funções e assinaturas que as
 * páginas do front-end já usam (api.login, api.listarInstrumentos, etc.),
 * mas em vez de chamar um backend real (Java + PostgreSQL), ele lê e
 * escreve num "banco" mockado em memória/localStorage (src/data/mockDb.js).
 *
 * Isso permite apresentar o protótipo de telas dinâmicas sem depender de
 * nenhum serviço externo — é só rodar `npm run dev`.
 */
import { getDb, proximoId, salvar, formatarMes } from "../data/mockDb";

const ATRASO_MS = 260;

function atraso(fn) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(fn());
      } catch (e) {
        reject(e);
      }
    }, ATRASO_MS);
  });
}

function paginar(lista, params = {}) {
  const tamanho = params.size ? Number(params.size) : lista.length;
  return { content: lista.slice(0, tamanho), totalElements: lista.length };
}

function normalizar(texto) {
  return (texto || "")
    .toString()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

// --------------------------- sessão ---------------------------

function tokenAtual() {
  return localStorage.getItem("gakki_token");
}

function clienteAtual() {
  const token = tokenAtual();
  if (!token) return null;
  const partes = token.split(".");
  const id = Number(partes[1]);
  return getDb().clientes.find((c) => c.id === id) || null;
}

function exigirCliente() {
  const cliente = clienteAtual();
  if (!cliente) throw new Error("Sessão expirada. Faça login novamente.");
  return cliente;
}

function gerarToken(cliente) {
  return `mock.${cliente.id}.${cliente.perfil}.${Date.now()}`;
}

function proximoCodigoCliente() {
  const db = getDb();
  const n = db.clientes.length + 1;
  return `CLI-${String(n).padStart(4, "0")}`;
}

function proximoNumeroPedido() {
  const db = getDb();
  const n = (db.contadores.pedido || db.pedidos.length) + 1;
  return `PED-${String(100 + n).padStart(6, "0")}`;
}

// --------------------------- carrinho ---------------------------

function carrinhoBruto(clienteId) {
  const db = getDb();
  if (!db.carrinhos[clienteId]) db.carrinhos[clienteId] = [];
  return db.carrinhos[clienteId];
}

function montarCarrinho(clienteId) {
  const db = getDb();
  const linhas = carrinhoBruto(clienteId);
  const itens = linhas.map((linha) => {
    const instrumento = db.instrumentos.find((i) => i.id === linha.instrumentoId);
    return {
      itemId: linha.itemId,
      instrumentoId: linha.instrumentoId,
      nomeInstrumento: instrumento?.nome || "(instrumento removido)",
      valorUnitario: instrumento?.valorVenda || 0,
      quantidade: linha.quantidade,
    };
  });
  const valorTotal = itens.reduce((acc, i) => acc + i.valorUnitario * i.quantidade, 0);
  return { itens, valorTotal };
}

// --------------------------- estoque ---------------------------

function ajustarEstoque(instrumentoId, delta) {
  const db = getDb();
  const instrumento = db.instrumentos.find((i) => i.id === instrumentoId);
  if (instrumento) instrumento.quantidadeEstoque = Math.max(0, instrumento.quantidadeEstoque + delta);
}

// --------------------------- mapeadores de saída ---------------------------

function mapPedidoCliente(pedido) {
  return {
    id: pedido.id,
    numero: pedido.numero,
    status: pedido.status,
    criadoEm: pedido.criadoEm,
    itens: pedido.itens,
    pagamentosCartao: pedido.pagamentosCartao,
    cuponsUtilizados: pedido.cuponsUtilizados,
    valorTotal: pedido.valorTotal,
  };
}

function mapPedidoAdmin(pedido) {
  return {
    id: pedido.id,
    numero: pedido.numero,
    status: pedido.status,
    itens: pedido.itens,
    valorTotal: pedido.valorTotal,
  };
}

function mapTroca(troca) {
  return {
    id: troca.id,
    instrumento: troca.instrumento,
    pedidoNumero: troca.pedidoNumero,
    status: troca.status,
    justificativaCliente: troca.justificativaCliente,
    motivoNegativa: troca.motivoNegativa,
    cupomGeradoCodigo: troca.cupomGeradoCodigo,
  };
}

export const api = {
  // ------------------------- Autenticação -------------------------
  login: (email, senha) =>
    atraso(() => {
      const db = getDb();
      const cliente = db.clientes.find((c) => normalizar(c.email) === normalizar(email));
      if (!cliente || cliente.senha !== senha) throw new Error("E-mail ou senha inválidos.");
      if (!cliente.ativo) throw new Error("Esta conta está inativa. Fale com o suporte.");
      return { nome: cliente.nome, perfil: cliente.perfil, token: gerarToken(cliente) };
    }),

  registrar: (payload) =>
    atraso(() => {
      const db = getDb();
      if (!payload.nome || !payload.email || !payload.senha) throw new Error("Preencha todos os campos obrigatórios.");
      if (payload.senha !== payload.confirmacaoSenha) throw new Error("As senhas não coincidem.");
      if (db.clientes.some((c) => normalizar(c.email) === normalizar(payload.email))) {
        throw new Error("Já existe uma conta cadastrada com este e-mail.");
      }
      const novo = {
        id: proximoId("cliente"),
        codigo: proximoCodigoCliente(),
        nome: payload.nome,
        email: payload.email,
        senha: payload.senha,
        telefone: payload.telefone || "",
        perfil: "CLIENTE",
        ativo: true,
        enderecos: [],
        cartoes: [],
        cupons: [],
      };
      db.clientes.push(novo);
      salvar();
      return { id: novo.id, nome: novo.nome, email: novo.email };
    }),

  // ------------------------- Catálogo (público) -------------------------
  listarInstrumentos: (params = {}) =>
    atraso(() => {
      const db = getDb();
      let lista = db.instrumentos;
      if (params.nome) {
        const alvo = normalizar(params.nome);
        lista = lista.filter((i) => normalizar(i.nome).includes(alvo));
      }
      if (params.categoriaId) {
        const catId = Number(params.categoriaId);
        lista = lista.filter((i) => i.categoriaIds.includes(catId));
      }
      return paginar(lista, params);
    }),

  buscarInstrumento: (id) =>
    atraso(() => {
      const instrumento = getDb().instrumentos.find((i) => i.id === Number(id));
      if (!instrumento) throw new Error("Instrumento não encontrado.");
      return instrumento;
    }),

  listarCategorias: () => atraso(() => getDb().categorias),
  listarFabricantes: () => atraso(() => getDb().fabricantes),

  // ------------------------- Cliente autenticado -------------------------
  meuPerfil: () =>
    atraso(() => {
      const c = exigirCliente();
      return { nome: c.nome, email: c.email, telefone: c.telefone };
    }),

  alterarCadastro: (payload) =>
    atraso(() => {
      const c = exigirCliente();
      if (payload.nome) c.nome = payload.nome;
      if (payload.email) c.email = payload.email;
      c.telefone = payload.telefone ?? c.telefone;
      salvar();
      return { nome: c.nome, email: c.email, telefone: c.telefone };
    }),

  alterarSenha: (payload) =>
    atraso(() => {
      const c = exigirCliente();
      if (payload.senhaAtual !== c.senha) throw new Error("Senha atual incorreta.");
      if (!payload.novaSenha || payload.novaSenha !== payload.confirmacaoNovaSenha) {
        throw new Error("A nova senha e a confirmação não coincidem.");
      }
      c.senha = payload.novaSenha;
      salvar();
      return null;
    }),

  inativarPropriaConta: () =>
    atraso(() => {
      const c = exigirCliente();
      c.ativo = false;
      salvar();
      return null;
    }),

  meusEnderecos: () => atraso(() => exigirCliente().enderecos),

  adicionarEndereco: (payload) =>
    atraso(() => {
      const c = exigirCliente();
      const endereco = { id: proximoId("endereco"), principal: c.enderecos.length === 0, ...payload };
      c.enderecos.push(endereco);
      salvar();
      return endereco;
    }),

  meusCartoes: () => atraso(() => exigirCliente().cartoes),

  adicionarCartao: (payload) =>
    atraso(() => {
      const c = exigirCliente();
      const cartao = { id: proximoId("cartao"), ...payload };
      c.cartoes.push(cartao);
      salvar();
      return cartao;
    }),

  meusCupons: () => atraso(() => exigirCliente().cupons),

  // ------------------------- Carrinho -------------------------
  verCarrinho: () =>
    atraso(() => {
      const c = exigirCliente();
      return montarCarrinho(c.id);
    }),

  adicionarAoCarrinho: (instrumentoId, quantidade) =>
    atraso(() => {
      const c = exigirCliente();
      const db = getDb();
      const instrumento = db.instrumentos.find((i) => i.id === Number(instrumentoId));
      if (!instrumento) throw new Error("Instrumento não encontrado.");
      const linhas = carrinhoBruto(c.id);
      const existente = linhas.find((l) => l.instrumentoId === instrumento.id);
      const quantidadeDesejada = (existente?.quantidade || 0) + Number(quantidade || 1);
      if (quantidadeDesejada > instrumento.quantidadeEstoque) {
        throw new Error(`Apenas ${instrumento.quantidadeEstoque} unidade(s) em estoque.`);
      }
      if (existente) existente.quantidade = quantidadeDesejada;
      else linhas.push({ itemId: proximoId("itemCarrinho"), instrumentoId: instrumento.id, quantidade: Number(quantidade || 1) });
      salvar();
      return montarCarrinho(c.id);
    }),

  atualizarQuantidadeCarrinho: (itemId, quantidade) =>
    atraso(() => {
      const c = exigirCliente();
      const linhas = carrinhoBruto(c.id);
      const linha = linhas.find((l) => l.itemId === Number(itemId));
      if (!linha) throw new Error("Item não encontrado no carrinho.");
      const qtd = Number(quantidade);
      if (qtd <= 0) {
        const idx = linhas.indexOf(linha);
        linhas.splice(idx, 1);
      } else {
        const instrumento = getDb().instrumentos.find((i) => i.id === linha.instrumentoId);
        linha.quantidade = Math.min(qtd, instrumento?.quantidadeEstoque ?? qtd);
      }
      salvar();
      return montarCarrinho(c.id);
    }),

  removerDoCarrinho: (itemId) =>
    atraso(() => {
      const c = exigirCliente();
      const linhas = carrinhoBruto(c.id);
      const idx = linhas.findIndex((l) => l.itemId === Number(itemId));
      if (idx >= 0) linhas.splice(idx, 1);
      salvar();
      return null;
    }),

  // ------------------------- Pedidos (cliente) -------------------------
  finalizarCompra: (payload) =>
    atraso(() => {
      const c = exigirCliente();
      const db = getDb();
      const carrinho = montarCarrinho(c.id);
      if (carrinho.itens.length === 0) throw new Error("Seu carrinho está vazio.");

      const endereco = c.enderecos.find((e) => e.id === Number(payload.enderecoEntregaId));
      if (!endereco) throw new Error("Selecione um endereço de entrega válido.");

      const subtotal = carrinho.valorTotal;

      const cupons = (payload.codigosCupom || [])
        .map((codigo) => c.cupons.find((cp) => cp.codigo === codigo && !cp.utilizado))
        .filter(Boolean);
      const descontoCupons = cupons.reduce((acc, cp) => acc + cp.valor, 0);

      const totalDevido = Math.max(0, subtotal - descontoCupons);
      const pagamentos = (payload.pagamentosCartao || []).filter((p) => p.cartaoCreditoId && Number(p.valor) > 0);
      const totalPago = pagamentos.reduce((acc, p) => acc + Number(p.valor), 0);

      if (totalPago + 0.01 < totalDevido) {
        throw new Error("A soma dos pagamentos e cupons não cobre o total do pedido.");
      }

      // baixa de estoque
      carrinho.itens.forEach((item) => ajustarEstoque(item.instrumentoId, -item.quantidade));

      // marca cupons como utilizados
      cupons.forEach((cp) => (cp.utilizado = true));

      const pagamentosCartao = pagamentos.map((p) => {
        const cartao = c.cartoes.find((ct) => ct.id === Number(p.cartaoCreditoId));
        return { cartaoApelido: cartao?.apelido || "Cartão", ultimosDigitos: cartao?.ultimosDigitos || "----", valor: Number(p.valor) };
      });

      const idPedido = proximoId("pedido");
      const pedido = {
        id: idPedido,
        numero: proximoNumeroPedido(),
        clienteId: c.id,
        status: "EM_ABERTO",
        criadoEm: new Date().toISOString(),
        itens: carrinho.itens.map((item) => ({
          itemPedidoId: proximoId("itemPedido"),
          instrumentoId: item.instrumentoId,
          instrumento: item.nomeInstrumento,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
          emTroca: false,
        })),
        pagamentosCartao,
        cuponsUtilizados: cupons.map((cp) => cp.codigo),
        valorTotal: totalDevido,
        enderecoEntrega: endereco,
      };
      db.pedidos.unshift(pedido);

      // atualiza histórico de vendas (para o gráfico de análise ficar "vivo")
      const { mesAno, mesChave } = formatarMes(new Date());
      pedido.itens.forEach((item) => {
        const instrumento = db.instrumentos.find((i) => i.id === item.instrumentoId);
        (instrumento?.categorias || []).forEach((categoria) => {
          let linha = db.vendaHistorico.find((v) => v.categoria === categoria && v.mesChave === mesChave);
          if (!linha) {
            linha = { categoria, mesAno, mesChave, total: 0 };
            db.vendaHistorico.push(linha);
          }
          linha.total += item.valorUnitario * item.quantidade;
        });
      });

      // esvazia o carrinho
      db.carrinhos[c.id] = [];
      salvar();

      return mapPedidoCliente(pedido);
    }),

  meusPedidos: () =>
    atraso(() => {
      const c = exigirCliente();
      return getDb()
        .pedidos.filter((p) => p.clienteId === c.id)
        .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
        .map(mapPedidoCliente);
    }),

  cancelarPedido: (id) =>
    atraso(() => {
      const c = exigirCliente();
      const pedido = getDb().pedidos.find((p) => p.id === Number(id) && p.clienteId === c.id);
      if (!pedido) throw new Error("Pedido não encontrado.");
      if (!["EM_ABERTO", "EM_PROCESSAMENTO"].includes(pedido.status)) {
        throw new Error("Este pedido não pode mais ser cancelado.");
      }
      pedido.itens.forEach((item) => ajustarEstoque(item.instrumentoId, item.quantidade));
      pedido.status = "CANCELADA";
      salvar();
      return null;
    }),

  confirmarRecebimentoPedido: (id) =>
    atraso(() => {
      const c = exigirCliente();
      const pedido = getDb().pedidos.find((p) => p.id === Number(id) && p.clienteId === c.id);
      if (!pedido) throw new Error("Pedido não encontrado.");
      if (pedido.status !== "EM_TRANSITO") throw new Error("Este pedido ainda não está em trânsito.");
      pedido.status = "ENTREGUE";
      salvar();
      return null;
    }),

  // ------------------------- Trocas (cliente) -------------------------
  solicitarTroca: (payload) =>
    atraso(() => {
      const c = exigirCliente();
      const db = getDb();
      const pedido = db.pedidos.find((p) => p.clienteId === c.id && p.itens.some((i) => i.itemPedidoId === Number(payload.itemPedidoId)));
      if (!pedido) throw new Error("Item de pedido não encontrado.");
      if (pedido.status !== "ENTREGUE") throw new Error("Só é possível solicitar troca de pedidos já entregues.");
      const item = pedido.itens.find((i) => i.itemPedidoId === Number(payload.itemPedidoId));
      if (item.emTroca) throw new Error("Este item já está em processo de troca.");

      const troca = {
        id: proximoId("troca"),
        clienteId: c.id,
        pedidoId: pedido.id,
        pedidoNumero: pedido.numero,
        itemPedidoId: item.itemPedidoId,
        instrumentoId: item.instrumentoId,
        instrumento: item.instrumento,
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
        status: "TROCA_SOLICITADA",
        justificativaCliente: payload.justificativa,
        motivoNegativa: null,
        cupomGeradoCodigo: null,
      };
      item.emTroca = true;
      db.trocas.unshift(troca);
      salvar();
      return mapTroca(troca);
    }),

  minhasTrocas: () =>
    atraso(() => {
      const c = exigirCliente();
      return getDb()
        .trocas.filter((t) => t.clienteId === c.id)
        .map(mapTroca);
    }),

  informarEnvioTroca: (id) =>
    atraso(() => {
      const c = exigirCliente();
      const troca = getDb().trocas.find((t) => t.id === Number(id) && t.clienteId === c.id);
      if (!troca) throw new Error("Troca não encontrada.");
      if (troca.status !== "TROCA_ACEITA") throw new Error("Esta troca ainda não foi aceita.");
      troca.status = "ITEM_ENVIADO";
      salvar();
      return null;
    }),

  // ------------------------- Admin — clientes -------------------------
  listarClientes: (params = {}) =>
    atraso(() => {
      let lista = getDb().clientes;
      if (params.nome) {
        const alvo = normalizar(params.nome);
        lista = lista.filter((c) => normalizar(c.nome).includes(alvo));
      }
      return paginar(
        lista.map((c) => ({ id: c.id, codigo: c.codigo, nome: c.nome, email: c.email, ativo: c.ativo })),
        params,
      );
    }),

  inativarCliente: (id) =>
    atraso(() => {
      const c = getDb().clientes.find((x) => x.id === Number(id));
      if (!c) throw new Error("Cliente não encontrado.");
      c.ativo = false;
      salvar();
      return null;
    }),

  ativarCliente: (id) =>
    atraso(() => {
      const c = getDb().clientes.find((x) => x.id === Number(id));
      if (!c) throw new Error("Cliente não encontrado.");
      c.ativo = true;
      salvar();
      return null;
    }),

  // ------------------------- Admin — pedidos -------------------------
  listarPedidosAdmin: (params = {}) =>
    atraso(() => {
      let lista = getDb().pedidos.slice().sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
      if (params.status) lista = lista.filter((p) => p.status === params.status);
      return paginar(lista.map(mapPedidoAdmin), params);
    }),

  avancarProcessamento: (id) => transicaoPedido(id, "EM_ABERTO", "EM_PROCESSAMENTO"),
  confirmarPagamentoPedido: (id) => transicaoPedido(id, "EM_PROCESSAMENTO", "PAGAMENTO_REALIZADO"),
  despacharPedido: (id) => transicaoPedido(id, "PAGAMENTO_REALIZADO", "EM_TRANSITO"),
  confirmarEntregaAdmin: (id) => transicaoPedido(id, "EM_TRANSITO", "ENTREGUE"),

  // ------------------------- Admin — trocas -------------------------
  listarTrocasAdmin: (status) =>
    atraso(() => {
      let lista = getDb().trocas;
      if (status) lista = lista.filter((t) => t.status === status);
      return lista.map(mapTroca);
    }),

  aceitarTroca: (id) => transicaoTroca(id, "TROCA_SOLICITADA", "TROCA_ACEITA"),

  negarTroca: (id, motivo) =>
    atraso(() => {
      const troca = getDb().trocas.find((t) => t.id === Number(id));
      if (!troca) throw new Error("Troca não encontrada.");
      if (troca.status !== "TROCA_SOLICITADA") throw new Error("Esta troca não está mais pendente de análise.");
      troca.status = "TROCA_NEGADA";
      troca.motivoNegativa = motivo;
      const pedido = getDb().pedidos.find((p) => p.id === troca.pedidoId);
      const item = pedido?.itens.find((i) => i.itemPedidoId === troca.itemPedidoId);
      if (item) item.emTroca = false;
      salvar();
      return null;
    }),

  confirmarRecebimentoTroca: (id, retornaEstoque) =>
    atraso(() => {
      const troca = getDb().trocas.find((t) => t.id === Number(id));
      if (!troca) throw new Error("Troca não encontrada.");
      if (troca.status !== "ITEM_ENVIADO") throw new Error("Ainda não foi informado o envio deste item.");
      troca.status = "ITEM_RECEBIDO";
      if (retornaEstoque && troca.instrumentoId) ajustarEstoque(troca.instrumentoId, troca.quantidade);
      salvar();
      return null;
    }),

  processarTroca: (id) =>
    atraso(() => {
      const db = getDb();
      const troca = db.trocas.find((t) => t.id === Number(id));
      if (!troca) throw new Error("Troca não encontrada.");
      if (troca.status !== "ITEM_RECEBIDO") throw new Error("O item desta troca ainda não foi recebido.");
      const cliente = db.clientes.find((c) => c.id === troca.clienteId);
      const codigo = `TROCA-${String(troca.id).padStart(3, "0")}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
      const cupom = {
        id: proximoId("cupom"),
        codigo,
        tipo: "TROCA",
        valor: troca.valorUnitario * troca.quantidade,
        validoAte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        utilizado: false,
      };
      cliente?.cupons.push(cupom);
      troca.status = "TROCA_PROCESSADA";
      troca.cupomGeradoCodigo = codigo;
      salvar();
      return null;
    }),

  // ------------------------- Análise de vendas -------------------------
  historicoVendas: (inicio, fim, categorias = []) =>
    atraso(() => {
      let linhas = getDb().vendaHistorico;
      if (categorias.length > 0) linhas = linhas.filter((v) => categorias.includes(v.categoria));
      // inicio/fim não filtram o mock (o seed já cobre os últimos meses) — mantidos na
      // assinatura para compatibilidade com a tela existente.
      return linhas
        .slice()
        .sort((a, b) => a.mesChave.localeCompare(b.mesChave))
        .map((v) => ({ categoria: v.categoria, mesAno: v.mesAno, mesChave: v.mesChave, totalVendas: v.total }));
    }),

  // ------------------------- IA / recomendações -------------------------
  recomendacoes: (topN = 5) =>
    atraso(() => {
      const db = getDb();
      return db.instrumentos
        .slice()
        .sort((a, b) => b.valorVenda - a.valorVenda)
        .slice(0, topN);
    }),

  chat: (mensagem) =>
    atraso(() => ({ resposta: gerarRespostaChatbot(mensagem) })),
};

function transicaoPedido(id, statusEsperado, novoStatus) {
  return atraso(() => {
    const pedido = getDb().pedidos.find((p) => p.id === Number(id));
    if (!pedido) throw new Error("Pedido não encontrado.");
    if (pedido.status !== statusEsperado) {
      throw new Error(`Este pedido está em "${pedido.status.replaceAll("_", " ")}" e não pode avançar para essa etapa.`);
    }
    pedido.status = novoStatus;
    salvar();
    return null;
  });
}

function transicaoTroca(id, statusEsperado, novoStatus) {
  return atraso(() => {
    const troca = getDb().trocas.find((t) => t.id === Number(id));
    if (!troca) throw new Error("Troca não encontrada.");
    if (troca.status !== statusEsperado) throw new Error("Esta troca não está mais nessa etapa.");
    troca.status = novoStatus;
    salvar();
    return null;
  });
}

// --------------------------- chatbot de recomendação (mock) ---------------------------

function gerarRespostaChatbot(mensagemBruta) {
  const db = getDb();
  const mensagem = normalizar(mensagemBruta);

  if (/\b(ola|oi|bom dia|boa tarde|boa noite)\b/.test(mensagem)) {
    return "Olá! Me conte o que você procura (ex.: \"guitarra para iniciante\", \"violão\", \"bateria\") que eu recomendo alguns instrumentos.";
  }
  if (/troca/.test(mensagem)) {
    return "Você pode solicitar a troca de qualquer item já entregue na página \"Meus pedidos\". Depois é só acompanhar o status em \"Trocas\".";
  }
  if (/cupom/.test(mensagem)) {
    return "Seus cupons promocionais e os gerados por trocas aparecem em \"Cupons\" — eles podem ser combinados com cartão no checkout.";
  }

  const categoriaEncontrada = db.categorias.find((c) => mensagem.includes(normalizar(c.nome).replace(/s$/, "")));
  const candidatos = categoriaEncontrada
    ? db.instrumentos.filter((i) => i.categoriaIds.includes(categoriaEncontrada.id))
    : db.instrumentos.filter((i) => normalizar(i.nome).split(" ").some((palavra) => mensagem.includes(palavra)));

  const recomendados = (candidatos.length > 0 ? candidatos : db.instrumentos)
    .slice()
    .sort((a, b) => b.quantidadeEstoque - a.quantidadeEstoque)
    .slice(0, 3);

  const lista = recomendados
    .map((i) => `• ${i.nome} — ${i.valorVenda.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`)
    .join("\n");

  return `Baseado no que você disse, algumas sugestões do nosso catálogo:\n${lista}\n\nQuer que eu detalhe algum desses?`;
}
