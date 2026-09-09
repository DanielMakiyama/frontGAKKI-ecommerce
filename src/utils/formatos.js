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
