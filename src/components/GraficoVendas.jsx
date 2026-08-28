import { useMemo, useState } from "react";

/**
 * Gráfico de linhas — vendas por categoria ao longo do tempo.
 *
 * Paleta categórica validada (ordem fixa, nunca ciclada): ver
 * node scripts/validate_palette.js da skill de dataviz. A ordem das cores
 * segue a ordem fixa de `categoriasTodas`, não a ordem dos filtros
 * selecionados — assim uma categoria sempre tem a mesma cor, mesmo que o
 * conjunto selecionado mude.
 */
const PALETA_CATEGORICA = [
  "#2a78d6", // 1 azul
  "#eb6834", // 2 laranja
  "#1baf7a", // 3 água
  "#eda100", // 4 amarelo
  "#e87ba4", // 5 magenta
  "#008300", // 6 verde
  "#4a3aa7", // 7 violeta
  "#e34948", // 8 vermelho
];

const INK_PRIMARIO = "#2c2216";
const INK_SECUNDARIO = "#6b5c48";
const INK_MUTED = "#a4937a";
const GRID = "#e7dcc6";
const SURFACE = "#fffdf9";

function corDaCategoria(nomeCategoria, categoriasTodas) {
  const indice = categoriasTodas.findIndex((c) => c.nome === nomeCategoria);
  return PALETA_CATEGORICA[indice >= 0 ? indice % PALETA_CATEGORICA.length : 0];
}

function formatarMoedaCompacta(valor) {
  if (valor >= 1000) return `R$ ${(valor / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export default function GraficoVendas({ dados, categoriasTodas }) {
  const [modoTabela, setModoTabela] = useState(false);
  const [hoverIndex, setHoverIndex] = useState(null);

  const { meses, series, maxValor } = useMemo(() => {
    const mesesMap = new Map();
    dados.forEach((d) => {
      if (!mesesMap.has(d.mesChave)) mesesMap.set(d.mesChave, d.mesAno);
    });
    const meses = Array.from(mesesMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([mesChave, mesAno]) => ({ mesChave, mesAno }));

    const categoriasPresentes = Array.from(new Set(dados.map((d) => d.categoria)));
    // ordena pela ordem fixa de categoriasTodas, para manter cor estável
    categoriasPresentes.sort(
      (a, b) => categoriasTodas.findIndex((c) => c.nome === a) - categoriasTodas.findIndex((c) => c.nome === b),
    );

    const series = categoriasPresentes.map((categoria) => ({
      categoria,
      cor: corDaCategoria(categoria, categoriasTodas),
      valores: meses.map((m) => {
        const linha = dados.find((d) => d.categoria === categoria && d.mesChave === m.mesChave);
        return linha ? linha.totalVendas : 0;
      }),
    }));

    const maxValor = Math.max(1, ...series.flatMap((s) => s.valores));
    return { meses, series, maxValor };
  }, [dados, categoriasTodas]);

  if (dados.length === 0) {
    return <p style={{ color: INK_SECUNDARIO }}>Nenhum dado de venda para os filtros selecionados.</p>;
  }

  // ---------- geometria do SVG ----------
  const largura = 720;
  const altura = 300;
  const margem = { topo: 16, direita: series.length <= 4 ? 96 : 16, baixo: 34, esquerda: 64 };
  const areaLargura = largura - margem.esquerda - margem.direita;
  const areaAltura = altura - margem.topo - margem.baixo;

  const passoX = meses.length > 1 ? areaLargura / (meses.length - 1) : 0;
  const xDe = (i) => margem.esquerda + passoX * i;
  const yDe = (v) => margem.topo + areaAltura - (v / maxValor) * areaAltura;

  const yTicks = 4;
  const linhasGrade = Array.from({ length: yTicks + 1 }, (_, i) => (maxValor / yTicks) * i);

  const mostrarLegenda = series.length >= 2;
  const mostrarRotulosDiretos = series.length <= 4;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: ".5rem" }}>
        <button className="btn btn-secundario btn-sm" onClick={() => setModoTabela((m) => !m)}>
          {modoTabela ? "Ver gráfico" : "Ver como tabela"}
        </button>
      </div>

      {modoTabela ? (
        <div style={{ overflowX: "auto" }}>
          <table className="tabela-simples">
            <thead>
              <tr>
                <th>Categoria</th>
                {meses.map((m) => (
                  <th key={m.mesChave}>{m.mesAno}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {series.map((s) => (
                <tr key={s.categoria}>
                  <td>
                    <span
                      aria-hidden
                      style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: s.cor, marginRight: ".4rem" }}
                    />
                    {s.categoria}
                  </td>
                  {s.valores.map((v, i) => (
                    <td key={i}>{v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          <svg
            viewBox={`0 0 ${largura} ${altura}`}
            style={{ width: "100%", height: "auto", maxWidth: "100%", background: SURFACE, borderRadius: 4 }}
            role="img"
            aria-label="Gráfico de linhas com o total de vendas por categoria ao longo dos últimos meses"
            onMouseLeave={() => setHoverIndex(null)}
          >
            {/* gridlines horizontais + rótulos do eixo Y */}
            {linhasGrade.map((valor, i) => (
              <g key={i}>
                <line
                  x1={margem.esquerda}
                  x2={largura - margem.direita}
                  y1={yDe(valor)}
                  y2={yDe(valor)}
                  stroke={GRID}
                  strokeWidth={1}
                />
                <text x={margem.esquerda - 8} y={yDe(valor) + 3} textAnchor="end" fontSize={10} fill={INK_MUTED}>
                  {formatarMoedaCompacta(valor)}
                </text>
              </g>
            ))}

            {/* eixo X */}
            {meses.map((m, i) => (
              <text key={m.mesChave} x={xDe(i)} y={altura - margem.baixo + 18} textAnchor="middle" fontSize={10} fill={INK_MUTED}>
                {m.mesAno}
              </text>
            ))}
            <line
              x1={margem.esquerda}
              x2={largura - margem.direita}
              y1={margem.topo + areaAltura}
              y2={margem.topo + areaAltura}
              stroke={INK_MUTED}
              strokeWidth={1}
            />

            {/* crosshair de hover */}
            {hoverIndex !== null && (
              <line
                x1={xDe(hoverIndex)}
                x2={xDe(hoverIndex)}
                y1={margem.topo}
                y2={margem.topo + areaAltura}
                stroke={INK_MUTED}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            )}

            {/* linhas de cada série */}
            {series.map((s) => (
              <g key={s.categoria}>
                <path
                  d={s.valores.map((v, i) => `${i === 0 ? "M" : "L"} ${xDe(i)} ${yDe(v)}`).join(" ")}
                  fill="none"
                  stroke={s.cor}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {s.valores.map((v, i) => (
                  <circle
                    key={i}
                    cx={xDe(i)}
                    cy={yDe(v)}
                    r={hoverIndex === i ? 4 : 3}
                    fill={SURFACE}
                    stroke={s.cor}
                    strokeWidth={2}
                  />
                ))}
                {mostrarRotulosDiretos && (
                  <text
                    x={xDe(meses.length - 1) + 8}
                    y={yDe(s.valores[s.valores.length - 1]) + 3}
                    fontSize={10}
                    fontWeight={700}
                    fill={s.cor}
                  >
                    {s.categoria.length > 16 ? `${s.categoria.slice(0, 15)}…` : s.categoria}
                  </text>
                )}
              </g>
            ))}

            {/* área sensível ao mouse, uma faixa por mês */}
            {meses.map((m, i) => (
              <rect
                key={m.mesChave}
                x={xDe(i) - passoX / 2}
                y={margem.topo}
                width={meses.length > 1 ? passoX : areaLargura}
                height={areaAltura}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(i)}
              />
            ))}
          </svg>

          {hoverIndex !== null && (
            <div
              style={{
                position: "absolute",
                top: 8,
                left: Math.min(Math.max((xDe(hoverIndex) / largura) * 100, 14), 78) + "%",
                transform: "translateX(-50%)",
                background: "#fff",
                border: "1px solid var(--cor-borda)",
                borderRadius: 4,
                boxShadow: "var(--sombra)",
                padding: ".5rem .65rem",
                fontSize: "0.78rem",
                pointerEvents: "none",
                minWidth: 150,
                zIndex: 5,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: ".25rem" }}>{meses[hoverIndex].mesAno}</div>
              {series
                .map((s) => ({ categoria: s.categoria, cor: s.cor, valor: s.valores[hoverIndex] }))
                .sort((a, b) => b.valor - a.valor)
                .map((s) => (
                  <div key={s.categoria} style={{ display: "flex", justifyContent: "space-between", gap: ".75rem" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: ".35rem", color: INK_SECUNDARIO }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: s.cor, display: "inline-block" }} />
                      {s.categoria}
                    </span>
                    <span style={{ fontWeight: 600, color: INK_PRIMARIO }}>
                      {s.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {mostrarLegenda && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: ".9rem", marginTop: ".75rem" }}>
          {series.map((s) => (
            <span key={s.categoria} style={{ display: "flex", alignItems: "center", gap: ".4rem", fontSize: "0.8rem", color: INK_SECUNDARIO }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: s.cor, display: "inline-block" }} />
              {s.categoria}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
