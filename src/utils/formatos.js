/**
 * Formatadores de entrada compartilhados entre telas.
 *
 * Ficam aqui, e não dentro de um componente, porque cadastro e perfil
 * precisam exatamente da mesma máscara — duas cópias sempre acabam
 * divergindo (uma aceita 9 dígitos, a outra não).
 */

/** Aplica a máscara 00000-000 conforme se digita, ignorando não-dígitos. */
export function formatarCep(valor) {
  const digitos = String(valor).replace(/\D/g, "").slice(0, 8);
  return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
}

/** Aplica (00) 00000-0000 ou (00) 0000-0000 conforme o tamanho. */
export function formatarTelefone(valor) {
  const d = String(valor).replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Aplica 000.000.000-00 conforme se digita (RN0026). */
export function formatarCpf(valor) {
  const d = String(valor).replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** Mantém só os dígitos — o backend grava CPF, CEP e telefone sem máscara. */
export function somenteDigitos(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}
