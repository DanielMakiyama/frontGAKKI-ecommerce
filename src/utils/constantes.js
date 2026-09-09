/**
 * Constantes de domínio compartilhadas entre telas.
 */

/**
 * Bandeiras aceitas (RN0025: todo cartão de crédito associado a um
 * cliente deve ser de alguma bandeira registrada no sistema).
 *
 * Vive aqui porque cadastro e perfil precisam da MESMA lista — se cada
 * tela tivesse a sua, uma aceitaria uma bandeira que a outra recusa.
 * Quando o backend expuser esse cadastro, isto vira
 * `api.listarBandeiras()` e as duas telas passam a consumir de lá.
 */
export const BANDEIRAS = ["Visa", "Mastercard", "Elo", "American Express", "Hipercard"];
