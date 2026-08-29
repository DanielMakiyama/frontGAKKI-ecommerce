/**
 * "Banco de dados" fictício em memória, usado enquanto o protótipo roda
 * sem backend real. Todas as telas (cliente + admin) leem e escrevem
 * aqui através de mockApi.js — os dados mudam de verdade conforme o
 * usuário interage (adiciona ao carrinho, admin avança status, etc.),
 * simulando dinamismo real sem precisar de Java/PostgreSQL rodando.
 *
 * Quando o backend voltar a ser usado, essa pasta inteira pode ser
 * ignorada — client.js decide entre mock e real através de uma única
 * constante (MODO_MOCK).
 */

let proximoId = 1000;
export function gerarId() {
  return ++proximoId;
}

function diasAtras(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const CATEGORIAS = ["Cordas", "Sopros", "Percussão", "Teclas", "Eletrônicos", "Acessórios"];

const instrumentosSeed = [
  { id: 1, codigo: "INST-0001", nome: "Guitarra Stratocaster HSS", descricao: "Guitarra elétrica com captadores HSS, corpo em tília.", fabricante: "Fender", anoFabricacao: 2024, valorVenda: 3920.00, quantidadeEstoque: 8, ativo: true, categorias: ["Cordas", "Eletrônicos"] },
  { id: 2, codigo: "INST-0002", nome: "Violão Clássico Nylon", descricao: "Violão acústico de nylon, ideal para iniciantes.", fabricante: "Giannini", anoFabricacao: 2023, valorVenda: 890.00, quantidadeEstoque: 15, ativo: true, categorias: ["Cordas"] },
  { id: 3, codigo: "INST-0003", nome: "Piano Digital 88 Teclas", descricao: "Piano digital com teclas sensíveis ao toque e pedal.", fabricante: "Yamaha", anoFabricacao: 2024, valorVenda: 4960.00, quantidadeEstoque: 5, ativo: true, categorias: ["Teclas"] },
  { id: 4, codigo: "INST-0004", nome: "Bateria Acústica 5 Peças", descricao: "Kit completo com pratos e banco.", fabricante: "Pearl", anoFabricacao: 2023, valorVenda: 8200.00, quantidadeEstoque: 3, ativo: true, categorias: ["Percussão"] },
  { id: 5, codigo: "INST-0005", nome: "Saxofone Alto Eb", descricao: "Saxofone alto em latão laqueado, com estojo.", fabricante: "Yamaha", anoFabricacao: 2022, valorVenda: 6350.00, quantidadeEstoque: 4, ativo: true, categorias: ["Sopros"] },
  { id: 6, codigo: "INST-0006", nome: "Cajón Acústico", descricao: "Percussão em madeira compensada com esteira interna.", fabricante: "Meinl", anoFabricacao: 2024, valorVenda: 590.00, quantidadeEstoque: 12, ativo: true, categorias: ["Percussão"] },
  { id: 7, codigo: "INST-0007", nome: "Pedal Multiefeitos Guitarra", descricao: "Processador digital com 100+ efeitos e looper.", fabricante: "Roland", anoFabricacao: 2024, valorVenda: 2240.00, quantidadeEstoque: 9, ativo: true, categorias: ["Eletrônicos"] },
  { id: 8, codigo: "INST-0008", nome: "Baixo Jazz Bass 4 Cordas", descricao: "Contrabaixo elétrico 4 cordas, corpo em ácer.", fabricante: "Tagima", anoFabricacao: 2023, valorVenda: 1680.00, quantidadeEstoque: 6, ativo: true, categorias: ["Cordas"] },
];

function item(instrumentoId, quantidade) {
  const inst = instrumentosSeed.find((i) => i.id === instrumentoId);
  return {
    itemPedidoId: gerarId(),
    instrumentoId,
    instrumento: inst?.nome || "Instrumento",
    quantidade,
    valorUnitario: inst?.valorVenda || 0,
    emTroca: false,
  };
}

export const db = {
  categorias: CATEGORIAS.map((nome, i) => ({ id: i + 1, nome, descricao: "" })),

  fabricantes: [
    { id: 1, nome: "Fender" }, { id: 2, nome: "Yamaha" }, { id: 3, nome: "Giannini" },
    { id: 4, nome: "Pearl" }, { id: 5, nome: "Meinl" }, { id: 6, nome: "Roland" },
    { id: 7, nome: "Tagima" },
  ],

  instrumentos: instrumentosSeed,

  clientes: [
    { id: 1, codigo: "CLI-0001", nome: "Cliente Demonstração", email: "cliente@gakkistore.com", telefone: "11988887777", perfil: "CLIENTE", ativo: true },
    { id: 2, codigo: "CLI-0002", nome: "Administrador GAKKI", email: "admin@gakkistore.com", telefone: "11999990000", perfil: "ADMINISTRADOR", ativo: true },
    { id: 3, codigo: "CLI-0003", nome: "Maria Souza", email: "maria.souza@example.com", telefone: "11977776666", perfil: "CLIENTE", ativo: true },
    { id: 4, codigo: "CLI-0004", nome: "João Pereira", email: "joao.pereira@example.com", telefone: "11966665555", perfil: "CLIENTE", ativo: true },
    { id: 5, codigo: "CLI-0005", nome: "Beatriz Lima", email: "beatriz.lima@example.com", telefone: "11955554444", perfil: "CLIENTE", ativo: false },
  ],

  enderecos: [
    { id: 1, clienteId: 1, apelido: "Casa", logradouro: "Rua das Guitarras", numero: "123", complemento: "", cidade: "São Paulo", estado: "SP", cep: "01000-000", principal: true },
  ],

  cartoes: [
    { id: 1, clienteId: 1, apelido: "Cartão principal", ultimosDigitos: "4321", bandeira: "Visa", nomeTitular: "CLIENTE DEMONSTRACAO", validade: "12/2029", preferencial: true },
  ],

  cupons: [
    { id: 1, codigo: "CUP-PROMO10", tipo: "PROMOCIONAL", valor: 50.00, clienteId: 1, utilizado: false, validoAte: "2026-12-31T00:00:00Z" },
    { id: 2, codigo: "CUP-TROCA001", tipo: "TROCA", valor: 890.00, clienteId: 1, utilizado: true, validoAte: "2026-06-30T00:00:00Z" },
  ],

  carrinho: { clienteId: 1, itens: [] },

  pedidos: [
    { id: 1001, numero: "PED-1001", clienteId: 1, status: "EM_ABERTO", valorFrete: 32.00, valorTotal: 922.00, criadoEm: diasAtras(0), enderecoResumo: "Rua das Guitarras, 123 — São Paulo/SP", itens: [item(2, 1)], pagamentosCartao: [], cuponsUtilizados: [] },
    { id: 1002, numero: "PED-1002", clienteId: 1, status: "EM_PROCESSAMENTO", valorFrete: 22.00, valorTotal: 2262.00, criadoEm: diasAtras(1), enderecoResumo: "Rua das Guitarras, 123 — São Paulo/SP", itens: [item(7, 1)], pagamentosCartao: [{ cartaoApelido: "Cartão principal", ultimosDigitos: "4321", valor: 2262.00 }], cuponsUtilizados: [] },
    { id: 1003, numero: "PED-1003", clienteId: 1, status: "PAGAMENTO_REALIZADO", valorFrete: 25.00, valorTotal: 6375.00, criadoEm: diasAtras(2), enderecoResumo: "Rua das Guitarras, 123 — São Paulo/SP", itens: [item(5, 1)], pagamentosCartao: [{ cartaoApelido: "Cartão principal", ultimosDigitos: "4321", valor: 6375.00 }], cuponsUtilizados: [] },
    { id: 1004, numero: "PED-1004", clienteId: 1, status: "EM_TRANSITO", valorFrete: 18.00, valorTotal: 608.00, criadoEm: diasAtras(4), enderecoResumo: "Rua das Guitarras, 123 — São Paulo/SP", itens: [item(6, 1)], pagamentosCartao: [{ cartaoApelido: "Cartão principal", ultimosDigitos: "4321", valor: 608.00 }], cuponsUtilizados: [] },
    { id: 1005, numero: "PED-1005", clienteId: 1, status: "ENTREGUE", valorFrete: 30.00, valorTotal: 3950.00, criadoEm: diasAtras(10), enderecoResumo: "Rua das Guitarras, 123 — São Paulo/SP", itens: [item(1, 1)], pagamentosCartao: [{ cartaoApelido: "Cartão principal", ultimosDigitos: "4321", valor: 3950.00 }], cuponsUtilizados: [] },
    { id: 1006, numero: "PED-1006", clienteId: 3, status: "ENTREGUE", valorFrete: 20.00, valorTotal: 4980.00, criadoEm: diasAtras(6), clienteNome: "Maria Souza", clienteEmail: "maria.souza@example.com", enderecoResumo: "Av. Central, 500 — Campinas/SP", itens: [item(3, 1)], pagamentosCartao: [{ cartaoApelido: "Cartão de Maria", ultimosDigitos: "9911", valor: 4980.00 }], cuponsUtilizados: [] },
    { id: 1007, numero: "PED-1007", clienteId: 4, status: "CANCELADA", valorFrete: 15.00, valorTotal: 1695.00, criadoEm: diasAtras(8), clienteNome: "João Pereira", clienteEmail: "joao.pereira@example.com", enderecoResumo: "Rua das Palmeiras, 44 — Santos/SP", itens: [item(8, 1)], pagamentosCartao: [], cuponsUtilizados: [] },
  ],

  trocas: [
    { id: 1, itemPedidoId: 1005, instrumento: "Guitarra Stratocaster HSS", pedidoNumero: "PED-1005", clienteId: 1, status: "TROCA_SOLICITADA", justificativaCliente: "Veio com um arranhão na lataria.", motivoNegativa: null, cupomGeradoCodigo: null, criadoEm: diasAtras(1) },
    { id: 2, itemPedidoId: 1006, instrumento: "Piano Digital 88 Teclas", pedidoNumero: "PED-1006", clienteId: 3, status: "TROCA_ACEITA", justificativaCliente: "Pedal não funciona corretamente.", motivoNegativa: null, cupomGeradoCodigo: null, criadoEm: diasAtras(3) },
  ],
};
