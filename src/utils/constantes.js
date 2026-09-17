/**
 * Constantes de domínio compartilhadas entre telas.
 *
 * Os valores precisam bater exatamente com os enums do backend — é o que
 * o Jackson usa para desserializar. O rótulo é só apresentação.
 */

/**
 * @deprecated O backend passou a expor o cadastro de bandeiras em
 * `GET /bandeiras`, como a RN0025 exige. Telas novas devem usar
 * `api.listarBandeiras()`, que devolve `{ id, nome }` — o cartão é
 * gravado pelo id, não pelo nome.
 *
 * Mantida enquanto o `CartoesCliente.jsx` não migra.
 */
export const BANDEIRAS = ["Visa", "Mastercard", "Elo", "American Express", "Hipercard"];

/** RN0026 — gênero do cliente. */
export const GENEROS = [
  { valor: "FEMININO", rotulo: "Feminino" },
  { valor: "MASCULINO", rotulo: "Masculino" },
  { valor: "OUTRO", rotulo: "Outro" },
  { valor: "NAO_INFORMADO", rotulo: "Prefiro não informar" },
];

/** RN0026 — o telefone é composto por tipo, DDD e número. */
export const TIPOS_TELEFONE = [
  { valor: "CELULAR", rotulo: "Celular" },
  { valor: "RESIDENCIAL", rotulo: "Residencial" },
  { valor: "COMERCIAL", rotulo: "Comercial" },
];

/** RN0023 — tipo de residência do endereço. */
export const TIPOS_RESIDENCIA = [
  { valor: "CASA", rotulo: "Casa" },
  { valor: "APARTAMENTO", rotulo: "Apartamento" },
  { valor: "CONDOMINIO", rotulo: "Condomínio" },
  { valor: "CHACARA", rotulo: "Chácara" },
  { valor: "OUTRO", rotulo: "Outro" },
];

/** RN0023 — tipo de logradouro do endereço. */
export const TIPOS_LOGRADOURO = [
  { valor: "RUA", rotulo: "Rua" },
  { valor: "AVENIDA", rotulo: "Avenida" },
  { valor: "TRAVESSA", rotulo: "Travessa" },
  { valor: "RODOVIA", rotulo: "Rodovia" },
  { valor: "ALAMEDA", rotulo: "Alameda" },
  { valor: "PRACA", rotulo: "Praça" },
  { valor: "ESTRADA", rotulo: "Estrada" },
  { valor: "OUTRO", rotulo: "Outro" },
];
