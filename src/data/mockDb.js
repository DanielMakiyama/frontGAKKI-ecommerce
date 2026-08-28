/**
 * "Banco de dados" mockado da GAKKI STORE.
 *
 * Este módulo substitui o backend real por um estado em memória, persistido
 * no localStorage do navegador — assim o protótipo funciona 100% no
 * front-end (sem Java/PostgreSQL) e sobrevive a um F5 durante a
 * apresentação. Para reiniciar os dados do zero, use resetDb() (exposta em
 * window.gakkiResetDemo no console do navegador) ou limpe o localStorage.
 */

const STORAGE_KEY = "gakki_mock_db_v2";
const STORAGE_VERSION = 2;

// --------------------------- catálogo base ---------------------------

export const CATEGORIAS = [
  { id: 1, nome: "Guitarras" },
  { id: 2, nome: "Baixos" },
  { id: 3, nome: "Violões" },
  { id: 4, nome: "Teclados e Pianos" },
  { id: 5, nome: "Baterias e Percussão" },
  { id: 6, nome: "Sopros" },
  { id: 7, nome: "Cordas e Acessórios" },
  { id: 8, nome: "Áudio e Amplificação" },
];

export const FABRICANTES = [
  { id: 1, nome: "Fender" },
  { id: 2, nome: "Gibson" },
  { id: 3, nome: "Yamaha" },
  { id: 4, nome: "Roland" },
  { id: 5, nome: "Tagima" },
  { id: 6, nome: "Ibanez" },
  { id: 7, nome: "Meinl" },
  { id: 8, nome: "Shure" },
  { id: 9, nome: "Behringer" },
  { id: 10, nome: "Taylor" },
];

function fab(nome) {
  return FABRICANTES.find((f) => f.nome === nome).id;
}

const INSTRUMENTOS_SEED = [
  { nome: "Stratocaster Player Series", descricao: "Guitarra elétrica com captadores single-coil, braço de bordo e ponte tremolo de 2 pontos.", fabricanteId: fab("Fender"), categorias: ["Guitarras"], anoFabricacao: 2024, valorVenda: 5890, quantidadeEstoque: 6, pesoKg: 3.6, isbnOuCodigoBarras: "7891000000011" },
  { nome: "Telecaster Standard", descricao: "Guitarra elétrica versátil, timbre brilhante clássico da Fender.", fabricanteId: fab("Fender"), categorias: ["Guitarras"], anoFabricacao: 2023, valorVenda: 6290, quantidadeEstoque: 4, pesoKg: 3.4, isbnOuCodigoBarras: "7891000000012" },
  { nome: "Les Paul Standard 50s", descricao: "Guitarra icônica com captadores humbucker e corpo em mogno/maple.", fabricanteId: fab("Gibson"), categorias: ["Guitarras"], anoFabricacao: 2023, valorVenda: 15990, quantidadeEstoque: 2, pesoKg: 4.2, isbnOuCodigoBarras: "7891000000013" },
  { nome: "SG Standard", descricao: "Guitarra leve, corpo em mogno, ótima para blues e rock.", fabricanteId: fab("Gibson"), categorias: ["Guitarras"], anoFabricacao: 2022, valorVenda: 13490, quantidadeEstoque: 3, pesoKg: 3.1, isbnOuCodigoBarras: "7891000000014" },
  { nome: "RG550 Genesis", descricao: "Guitarra superstrato para metal, braço fino e ponte Edge tremolo.", fabricanteId: fab("Ibanez"), categorias: ["Guitarras"], anoFabricacao: 2024, valorVenda: 7490, quantidadeEstoque: 5, pesoKg: 3.3, isbnOuCodigoBarras: "7891000000015" },
  { nome: "Woodstock TW-25", descricao: "Guitarra nacional custo-benefício, ideal para iniciantes.", fabricanteId: fab("Tagima"), categorias: ["Guitarras"], anoFabricacao: 2024, valorVenda: 1590, quantidadeEstoque: 12, pesoKg: 3.5, isbnOuCodigoBarras: "7891000000016" },

  { nome: "Precision Bass PJ", descricao: "Contrabaixo 4 cordas com captadores P+J, som encorpado.", fabricanteId: fab("Fender"), categorias: ["Baixos"], anoFabricacao: 2023, valorVenda: 6990, quantidadeEstoque: 4, pesoKg: 4.1, isbnOuCodigoBarras: "7891000000021" },
  { nome: "Jazz Bass 5 Cordas", descricao: "Contrabaixo 5 cordas, versátil para jazz, funk e pop.", fabricanteId: fab("Fender"), categorias: ["Baixos"], anoFabricacao: 2022, valorVenda: 8290, quantidadeEstoque: 3, pesoKg: 4.4, isbnOuCodigoBarras: "7891000000022" },
  { nome: "SR505E", descricao: "Contrabaixo com eletrônica ativa de 3 bandas e captadores Bartolini.", fabricanteId: fab("Ibanez"), categorias: ["Baixos"], anoFabricacao: 2024, valorVenda: 5390, quantidadeEstoque: 6, pesoKg: 3.9, isbnOuCodigoBarras: "7891000000023" },
  { nome: "Millenium MB-4", descricao: "Contrabaixo nacional 4 cordas, ótimo custo-benefício.", fabricanteId: fab("Tagima"), categorias: ["Baixos"], anoFabricacao: 2023, valorVenda: 1990, quantidadeEstoque: 9, pesoKg: 4.0, isbnOuCodigoBarras: "7891000000024" },

  { nome: "Violão Clássico CG-122", descricao: "Violão clássico de nylon, tampo em spruce maciço.", fabricanteId: fab("Yamaha"), categorias: ["Violões"], anoFabricacao: 2024, valorVenda: 990, quantidadeEstoque: 15, pesoKg: 1.8, isbnOuCodigoBarras: "7891000000031" },
  { nome: "Violão Folk FG-830", descricao: "Violão aço, tampo maciço em spruce, lateral e fundo em mogno.", fabricanteId: fab("Yamaha"), categorias: ["Violões"], anoFabricacao: 2023, valorVenda: 2190, quantidadeEstoque: 10, pesoKg: 2.0, isbnOuCodigoBarras: "7891000000032" },
  { nome: "Academy 12", descricao: "Violão eletroacústico com corpo em Grand Concert e captação ES2.", fabricanteId: fab("Taylor"), categorias: ["Violões"], anoFabricacao: 2023, valorVenda: 8990, quantidadeEstoque: 3, pesoKg: 1.9, isbnOuCodigoBarras: "7891000000033" },
  { nome: "Verona EQ", descricao: "Violão nylon eletrificado, cutaway e equalizador embutido.", fabricanteId: fab("Tagima"), categorias: ["Violões", "Cordas e Acessórios"], anoFabricacao: 2024, valorVenda: 890, quantidadeEstoque: 14, pesoKg: 1.7, isbnOuCodigoBarras: "7891000000034" },

  { nome: "Piano Digital P-225", descricao: "Piano digital 88 teclas com ação martelo graduada (GHS).", fabricanteId: fab("Yamaha"), categorias: ["Teclados e Pianos"], anoFabricacao: 2024, valorVenda: 4990, quantidadeEstoque: 5, pesoKg: 11.5, isbnOuCodigoBarras: "7891000000041" },
  { nome: "FP-30X", descricao: "Piano digital portátil com motor sonoro SuperNATURAL.", fabricanteId: fab("Roland"), categorias: ["Teclados e Pianos"], anoFabricacao: 2023, valorVenda: 6490, quantidadeEstoque: 4, pesoKg: 14.2, isbnOuCodigoBarras: "7891000000042" },
  { nome: "PSR-E373", descricao: "Teclado arranjador 61 teclas, ideal para estudo e apresentações.", fabricanteId: fab("Yamaha"), categorias: ["Teclados e Pianos"], anoFabricacao: 2024, valorVenda: 1690, quantidadeEstoque: 11, pesoKg: 4.8, isbnOuCodigoBarras: "7891000000043" },
  { nome: "JUNO-DS61", descricao: "Sintetizador com centenas de timbres e sequenciador integrado.", fabricanteId: fab("Roland"), categorias: ["Teclados e Pianos"], anoFabricacao: 2022, valorVenda: 7990, quantidadeEstoque: 2, pesoKg: 5.3, isbnOuCodigoBarras: "7891000000044" },

  { nome: "Bateria Acústica Stage Custom", descricao: "Bateria 5 peças com cascas em mogno/pau marfim.", fabricanteId: fab("Yamaha"), categorias: ["Baterias e Percussão"], anoFabricacao: 2023, valorVenda: 9990, quantidadeEstoque: 2, pesoKg: 32, isbnOuCodigoBarras: "7891000000051" },
  { nome: "Cajón Headliner", descricao: "Cajón em madeira de bétula com cordas internas ajustáveis.", fabricanteId: fab("Meinl"), categorias: ["Baterias e Percussão"], anoFabricacao: 2024, valorVenda: 890, quantidadeEstoque: 13, pesoKg: 5.4, isbnOuCodigoBarras: "7891000000052" },
  { nome: "Pandeiro Profissional", descricao: "Pandeiro com pele sintética e platinelas de metal.", fabricanteId: fab("Meinl"), categorias: ["Baterias e Percussão"], anoFabricacao: 2024, valorVenda: 450, quantidadeEstoque: 20, pesoKg: 1.1, isbnOuCodigoBarras: "7891000000053" },
  { nome: "Kit Bateria Eletrônica TD-07", descricao: "Bateria eletrônica compacta com módulo de som e treinador de ritmo.", fabricanteId: fab("Roland"), categorias: ["Baterias e Percussão"], anoFabricacao: 2023, valorVenda: 5990, quantidadeEstoque: 3, pesoKg: 18, isbnOuCodigoBarras: "7891000000054" },

  { nome: "Saxofone Alto YAS-280", descricao: "Saxofone alto estudante, acabamento laqueado dourado.", fabricanteId: fab("Yamaha"), categorias: ["Sopros"], anoFabricacao: 2023, valorVenda: 8990, quantidadeEstoque: 3, pesoKg: 3.2, isbnOuCodigoBarras: "7891000000061" },
  { nome: "Flauta Transversal YFL-222", descricao: "Flauta transversal em prata niquelada, mecanismo offset.", fabricanteId: fab("Yamaha"), categorias: ["Sopros"], anoFabricacao: 2024, valorVenda: 3490, quantidadeEstoque: 6, pesoKg: 0.5, isbnOuCodigoBarras: "7891000000062" },
  { nome: "Trompete YTR-2330", descricao: "Trompete Bb estudante, válvulas niqueladas de precisão.", fabricanteId: fab("Yamaha"), categorias: ["Sopros"], anoFabricacao: 2022, valorVenda: 4290, quantidadeEstoque: 4, pesoKg: 1.2, isbnOuCodigoBarras: "7891000000063" },

  { nome: "Microfone SM58", descricao: "Microfone dinâmico cardioide, padrão da indústria para vocais ao vivo.", fabricanteId: fab("Shure"), categorias: ["Áudio e Amplificação"], anoFabricacao: 2024, valorVenda: 1590, quantidadeEstoque: 18, pesoKg: 0.3, isbnOuCodigoBarras: "7891000000071" },
  { nome: "Amplificador Champion 40", descricao: "Amplificador combo 40W para guitarra com efeitos digitais.", fabricanteId: fab("Fender"), categorias: ["Áudio e Amplificação"], anoFabricacao: 2023, valorVenda: 2290, quantidadeEstoque: 7, pesoKg: 9.5, isbnOuCodigoBarras: "7891000000072" },
  { nome: "Interface de Áudio UMC202HD", descricao: "Interface de áudio USB 2 canais com preamps Midas.", fabricanteId: fab("Behringer"), categorias: ["Áudio e Amplificação"], anoFabricacao: 2024, valorVenda: 890, quantidadeEstoque: 10, pesoKg: 0.7, isbnOuCodigoBarras: "7891000000073" },
  { nome: "Caixa de Som Ativa Eurolive B208D", descricao: "Caixa de som ativa 150W, ideal para pequenos eventos.", fabricanteId: fab("Behringer"), categorias: ["Áudio e Amplificação"], anoFabricacao: 2023, valorVenda: 1290, quantidadeEstoque: 8, pesoKg: 6.8, isbnOuCodigoBarras: "7891000000074" },

  { nome: "Encordoamento 10-46", descricao: "Jogo de cordas para guitarra, aço com revestimento níquel.", fabricanteId: fab("Fender"), categorias: ["Cordas e Acessórios"], anoFabricacao: 2024, valorVenda: 79, quantidadeEstoque: 40, pesoKg: 0.1, isbnOuCodigoBarras: "7891000000081" },
  { nome: "Capa Acolchoada para Violão", descricao: "Bag acolchoada com alças reforçadas e bolso externo.", fabricanteId: fab("Tagima"), categorias: ["Cordas e Acessórios"], anoFabricacao: 2024, valorVenda: 259, quantidadeEstoque: 22, pesoKg: 1.4, isbnOuCodigoBarras: "7891000000082" },
  { nome: "Afinador Digital de Clipe", descricao: "Afinador cromático de clipe com visor giratório.", fabricanteId: fab("Yamaha"), categorias: ["Cordas e Acessórios"], anoFabricacao: 2024, valorVenda: 99, quantidadeEstoque: 35, pesoKg: 0.05, isbnOuCodigoBarras: "7891000000083" },
];

function construirInstrumentosSeed() {
  return INSTRUMENTOS_SEED.map((item, index) => ({
    id: index + 1,
    fabricante: FABRICANTES.find((f) => f.id === item.fabricanteId).nome,
    categoriaIds: item.categorias.map((nome) => CATEGORIAS.find((c) => c.nome === nome).id),
    ...item,
  }));
}

// --------------------------- clientes de demonstração ---------------------------

function construirClientesSeed() {
  return [
    {
      id: 1,
      codigo: "CLI-0001",
      nome: "Equipe GAKKI",
      email: "admin@gakkistore.com",
      senha: "Admin@123",
      telefone: "(11) 90000-0001",
      perfil: "ADMINISTRADOR",
      ativo: true,
      enderecos: [],
      cartoes: [],
      cupons: [],
    },
    {
      id: 2,
      codigo: "CLI-0002",
      nome: "Marina Souza",
      email: "cliente@gakkistore.com",
      senha: "Cliente@123",
      telefone: "(11) 98888-1234",
      perfil: "CLIENTE",
      ativo: true,
      enderecos: [
        { id: 1, apelido: "Casa", logradouro: "Rua das Flores", numero: "120", complemento: "Apto 42", cidade: "São Paulo", estado: "SP", cep: "01234-000", principal: true },
      ],
      cartoes: [
        { id: 1, apelido: "Nubank", ultimosDigitos: "4321", bandeira: "Mastercard", nomeTitular: "Marina Souza", validade: "08/2029" },
      ],
      cupons: [
        { id: 1, codigo: "BEMVINDO10", tipo: "PROMOCIONAL", valor: 50, validoAte: novaData(45), utilizado: false },
      ],
    },
    {
      id: 3,
      codigo: "CLI-0003",
      nome: "Carlos Andrade",
      email: "carlos.andrade@example.com",
      senha: "Carlos@123",
      telefone: "(21) 97777-5678",
      perfil: "CLIENTE",
      ativo: true,
      enderecos: [
        { id: 1, apelido: "Trabalho", logradouro: "Av. Atlântica", numero: "900", complemento: "", cidade: "Rio de Janeiro", estado: "RJ", cep: "22010-000", principal: true },
      ],
      cartoes: [],
      cupons: [],
    },
    {
      id: 4,
      codigo: "CLI-0004",
      nome: "Beatriz Lima",
      email: "beatriz.lima@example.com",
      senha: "Beatriz@123",
      telefone: "(31) 96666-4321",
      perfil: "CLIENTE",
      ativo: false,
      enderecos: [],
      cartoes: [],
      cupons: [],
    },
  ];
}

function novaData(diasNoFuturo) {
  const d = new Date();
  d.setDate(d.getDate() + diasNoFuturo);
  return d.toISOString();
}

function dataPassada(diasAtras) {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  return d.toISOString();
}

// --------------------------- pedidos e trocas de demonstração ---------------------------

function construirPedidosSeed(instrumentos) {
  const strat = instrumentos.find((i) => i.nome.includes("Stratocaster"));
  const sm58 = instrumentos.find((i) => i.nome.includes("SM58"));
  const cajon = instrumentos.find((i) => i.nome.includes("Cajón"));
  const violao = instrumentos.find((i) => i.nome.includes("Folk"));

  return [
    {
      id: 1,
      numero: "PED-000101",
      clienteId: 2,
      status: "ENTREGUE",
      criadoEm: dataPassada(20),
      itens: [
        { itemPedidoId: 1, instrumentoId: strat.id, instrumento: strat.nome, quantidade: 1, valorUnitario: strat.valorVenda, emTroca: false },
        { itemPedidoId: 2, instrumentoId: sm58.id, instrumento: sm58.nome, quantidade: 1, valorUnitario: sm58.valorVenda, emTroca: false },
      ],
      pagamentosCartao: [{ cartaoApelido: "Nubank", ultimosDigitos: "4321", valor: strat.valorVenda + sm58.valorVenda - 40 }],
      cuponsUtilizados: [],
      valorTotal: strat.valorVenda + sm58.valorVenda,
    },
    {
      id: 2,
      numero: "PED-000102",
      clienteId: 2,
      status: "EM_TRANSITO",
      criadoEm: dataPassada(4),
      itens: [
        { itemPedidoId: 3, instrumentoId: cajon.id, instrumento: cajon.nome, quantidade: 1, valorUnitario: cajon.valorVenda, emTroca: false },
      ],
      pagamentosCartao: [{ cartaoApelido: "Nubank", ultimosDigitos: "4321", valor: cajon.valorVenda }],
      cuponsUtilizados: [],
      valorTotal: cajon.valorVenda,
    },
    {
      id: 3,
      numero: "PED-000103",
      clienteId: 2,
      status: "EM_ABERTO",
      criadoEm: dataPassada(1),
      itens: [
        { itemPedidoId: 4, instrumentoId: violao.id, instrumento: violao.nome, quantidade: 1, valorUnitario: violao.valorVenda, emTroca: false },
      ],
      pagamentosCartao: [{ cartaoApelido: "Nubank", ultimosDigitos: "4321", valor: violao.valorVenda }],
      cuponsUtilizados: [],
      valorTotal: violao.valorVenda,
    },
  ];
}

function construirTrocasSeed(instrumentos) {
  const sm58 = instrumentos.find((i) => i.nome.includes("SM58"));
  return [
    {
      id: 1,
      clienteId: 2,
      pedidoId: 1,
      pedidoNumero: "PED-000101",
      itemPedidoId: 2,
      instrumentoId: sm58?.id ?? null,
      instrumento: "Microfone SM58",
      quantidade: 1,
      valorUnitario: 1590,
      status: "TROCA_SOLICITADA",
      justificativaCliente: "Veio com ruído no cabo, gostaria de trocar por uma unidade nova.",
      motivoNegativa: null,
      cupomGeradoCodigo: null,
    },
  ];
}

// --------------------------- histórico de vendas (para o gráfico) ---------------------------

/**
 * Formata uma data como {mesAno, mesChave}: mesAno é o rótulo exibido
 * ("ago 2026"), mesChave é uma string ordenável ("2026-08") usada para
 * ordenar as colunas do gráfico cronologicamente.
 */
export function formatarMes(data) {
  const mesAno = data.toLocaleDateString("pt-BR", { month: "short", year: "numeric" }).replace(".", "");
  const mesChave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
  return { mesAno, mesChave };
}

function mesInfoDe(offsetMeses) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - offsetMeses);
  return formatarMes(d);
}

// Gerador determinístico simples (sem dependências) só para variar os valores do seed.
function pseudoAleatorio(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function construirHistoricoVendasSeed() {
  const historico = [];
  const baseCategoria = {
    Guitarras: 18000,
    Baixos: 9000,
    Violões: 7000,
    "Teclados e Pianos": 12000,
    "Baterias e Percussão": 6000,
    Sopros: 5000,
    "Áudio e Amplificação": 8000,
    "Cordas e Acessórios": 2000,
  };
  let seed = 7;
  for (let offset = 5; offset >= 0; offset--) {
    const { mesAno, mesChave } = mesInfoDe(offset);
    for (const categoria of CATEGORIAS.map((c) => c.nome)) {
      seed += 1;
      const variacao = 0.7 + pseudoAleatorio(seed) * 0.6;
      const total = Math.round((baseCategoria[categoria] || 4000) * variacao);
      historico.push({ categoria, mesAno, mesChave, total });
    }
  }
  return historico;
}

// --------------------------- estado + persistência ---------------------------

function construirSeed() {
  const instrumentos = construirInstrumentosSeed();
  return {
    versao: STORAGE_VERSION,
    instrumentos,
    categorias: CATEGORIAS,
    fabricantes: FABRICANTES,
    clientes: construirClientesSeed(),
    pedidos: construirPedidosSeed(instrumentos),
    trocas: construirTrocasSeed(instrumentos),
    vendaHistorico: construirHistoricoVendasSeed(),
    carrinhos: {},
    contadores: { instrumento: instrumentos.length, cliente: 4, pedido: 3, troca: 1, endereco: 10, cartao: 10, cupom: 10 },
  };
}

function carregarDb() {
  try {
    const bruto = localStorage.getItem(STORAGE_KEY);
    if (bruto) {
      const salvo = JSON.parse(bruto);
      if (salvo && salvo.versao === STORAGE_VERSION) return salvo;
    }
  } catch {
    /* localStorage indisponível ou dado corrompido — recomeça do seed */
  }
  const seed = construirSeed();
  persistirDb(seed);
  return seed;
}

function persistirDb(estado) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  } catch {
    /* ambiente sem localStorage (ex.: modo privado) — segue só em memória */
  }
}

let db = carregarDb();

export function getDb() {
  return db;
}

export function salvar() {
  persistirDb(db);
}

export function resetarDb() {
  db = construirSeed();
  persistirDb(db);
  return db;
}

export function proximoId(colecao) {
  db.contadores[colecao] = (db.contadores[colecao] || 0) + 1;
  return db.contadores[colecao];
}

if (typeof window !== "undefined") {
  // Facilita reiniciar a demonstração pelo console do navegador, se necessário.
  window.gakkiResetDemo = () => {
    resetarDb();
    window.location.reload();
  };
}
