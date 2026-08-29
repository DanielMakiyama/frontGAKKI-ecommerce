/**
 * Ícones monolineares por categoria de instrumento — substituem o
 * placeholder genérico de emoji nos cards de produto, dando uma
 * identidade visual mais consistente com a marca (traço fino, cor de
 * latão, sem preenchimento sólido).
 */

const props = {
  viewBox: "0 0 48 48",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function IconeViolao() {
  return (
    <svg {...props}>
      <path d="M20 10 L28 6" />
      <circle cx="30" cy="5" r="1.4" fill="currentColor" stroke="none" />
      <path d="M18 12c-6 2-9 8-8 14 1 7 6 11 11 11 6 0 10-5 9-11-1-6-6-8-6-13 0-4 2-7 6-8" />
      <circle cx="19" cy="27" r="6" />
      <path d="M13 10 L20 10 L20 16 L13 16 Z" />
    </svg>
  );
}

function IconeSax() {
  return (
    <svg {...props}>
      <path d="M16 8 L30 8 L30 20 C30 28 24 30 22 34 C20 38 24 40 27 38" />
      <circle cx="27.5" cy="38.5" r="2.2" />
      <path d="M16 8 L16 20" />
      <circle cx="19" cy="24" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="23" cy="26" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="27" cy="28" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconeBateria() {
  return (
    <svg {...props}>
      <ellipse cx="24" cy="16" rx="14" ry="5" />
      <path d="M10 16 L12 30 C12 33 17 35 24 35 C31 35 36 33 36 30 L38 16" />
      <ellipse cx="24" cy="30" rx="12" ry="4" opacity="0.5" />
    </svg>
  );
}

function IconePiano() {
  return (
    <svg {...props}>
      <rect x="8" y="16" width="32" height="18" rx="1.5" />
      <path d="M14 16 L14 34 M20 16 L20 34 M26 16 L26 34 M32 16 L32 34" opacity="0.6" />
      <rect x="11.5" y="16" width="3.5" height="11" fill="currentColor" stroke="none" />
      <rect x="18.5" y="16" width="3.5" height="11" fill="currentColor" stroke="none" />
      <rect x="27" y="16" width="3.5" height="11" fill="currentColor" stroke="none" />
      <rect x="33.5" y="16" width="3.5" height="11" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconeAmplificador() {
  return (
    <svg {...props}>
      <rect x="10" y="9" width="28" height="30" rx="2" />
      <circle cx="24" cy="24" r="9" />
      <circle cx="24" cy="24" r="3.5" />
      <circle cx="15" cy="14" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="33" cy="14" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconeAcessorio() {
  return (
    <svg {...props}>
      <path d="M28 8 L40 20 L24 36 C21 39 16 39 13 36 C10 33 10 28 13 25 L28 8Z" />
      <circle cx="31" cy="15" r="1.6" />
      <path d="M13 25 L23 35" opacity="0.6" />
    </svg>
  );
}

function IconeGenerico() {
  return (
    <svg {...props}>
      <circle cx="24" cy="24" r="15" />
      <circle cx="24" cy="24" r="9" />
      <circle cx="24" cy="24" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}

const ICONE_POR_CATEGORIA = {
  Cordas: IconeViolao,
  Sopros: IconeSax,
  Percussão: IconeBateria,
  Teclas: IconePiano,
  Eletrônicos: IconeAmplificador,
  Acessórios: IconeAcessorio,
};

export default function IconeInstrumento({ categoria }) {
  const Icone = ICONE_POR_CATEGORIA[categoria] || IconeGenerico;
  return <Icone />;
}
