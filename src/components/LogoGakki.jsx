/**
 * LogoGakki — assinatura visual da GAKKI STORE.
 *
 * O desenho funde dois símbolos numa figura só:
 *
 *   • CABEÇA DA NOTA → a elipse inclinada (-22°) na base, preenchida com
 *     a cor da marca. É o corpo da figura;
 *   • BRAÇO E CRAVELHAS DO SHAMISEN (sao + itomaki) → a haste que sobe
 *     da nota e as duas travessas com botão na ponta, saindo do MESMO
 *     lado — é assim que o tenjin (a cabeça do shamisen) aparece visto
 *     de perfil.
 *
 * As cravelhas ficarem só à direita não é detalhe estético: com uma de
 * cada lado a figura vira um sustenido (♯). De um lado só, vira cabeça
 * de instrumento.
 *
 * Cores: haste e cravelhas usam `currentColor` (herdam a cor do texto do
 * container); cabeça e botões usam `--cor-primaria`. Por isso o mesmo
 * componente serve header claro, rodapé escuro e estado hover sem
 * precisar de nenhuma prop de cor.
 */
export default function LogoGakki({ size = 34, className = "", titulo }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role={titulo ? "img" : undefined}
      aria-label={titulo || undefined}
      aria-hidden={titulo ? undefined : true}
      focusable="false"
    >
      {titulo && <title>{titulo}</title>}

      {/* braço do shamisen (sao) — também é a haste da nota */}
      <path d="M16.3 21.6 L22.2 4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

      {/* cravelhas (itomaki), ambas para o mesmo lado */}
      <path d="M20 11.6 L26.2 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M21.2 7.9 L27 4.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />

      {/* botões das cravelhas */}
      <circle cx="26.4" cy="8.9" r="1.6" fill="var(--cor-primaria)" />
      <circle cx="27.2" cy="4.8" r="1.6" fill="var(--cor-primaria)" />

      {/* cabeça da nota — corpo da figura */}
      <ellipse
        cx="10.5"
        cy="23.5"
        rx="6.4"
        ry="4.8"
        transform="rotate(-22 10.5 23.5)"
        fill="var(--cor-primaria)"
      />
    </svg>
  );
}
