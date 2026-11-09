import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/*
 * RF0055 e RNF0043 — histórico de vendas por categoria em gráfico de linhas.
 *
 * Recebe a lista plana que a API devolve, uma linha por categoria e mês
 * ({ categoria, mesAno: "MM/AAAA", totalVendas }), e a reorganiza por
 * mês, que é o formato que o Recharts desenha: [{ mesAno, Guitarras:
 * 1400, Pedais: 0, ... }]. O backend já manda os meses sem venda com 0,
 * então toda linha tem um ponto em cada mês, sem buraco.
 *
 * Abaixo do gráfico vai a mesma informação em tabela. Ela não é
 * decoração: três das cores (verde-água, amarelo e rosa) têm contraste
 * baixo sobre o fundo branco, e a tabela é o jeito de ler o valor exato
 * sem depender de cor nem de passar o mouse. É também nela que os testes
 * automatizados conferem os números (data-categoria, data-mes,
 * data-valor), em vez de tentar ler coordenadas de um SVG.
 */

// Cores das séries, em ordem fixa. A ordem não é estética: ela foi
// conferida para que linhas vizinhas continuem distinguíveis para quem
// tem daltonismo.
const CORES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"];
// Da nona categoria em diante não se inventa cor nova: todas ficam neste
// cinza, e a legenda e a tabela é que dizem quem é quem.
const COR_EXCEDENTE = "#8a8178";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
// Eixo vertical compacto ("R$ 2,8 mil"), para os rótulos não comerem a
// largura do gráfico. O valor exato está no tooltip e na tabela.
const moedaCompacta = new Intl.NumberFormat("pt-BR", {
  style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1,
});

/*
 * A cor segue a categoria, e não a posição dela no resultado: "Pedais" é
 * sempre a mesma cor, esteja sozinha no gráfico ou ao lado de outras
 * quatro. Por isso o índice vem da lista completa de categorias (que a
 * API devolve em ordem alfabética), e não das categorias consultadas.
 */
function corDaCategoria(nome, todasAsCategorias) {
  const indice = todasAsCategorias.findIndex((c) => c.nome === nome);
  return indice >= 0 && indice < CORES.length ? CORES[indice] : COR_EXCEDENTE;
}

function agruparPorMes(dados) {
  const porMes = new Map();
  for (const { categoria, mesAno, totalVendas } of dados) {
    if (!porMes.has(mesAno)) porMes.set(mesAno, { mesAno });
    porMes.get(mesAno)[categoria] = Number(totalVendas);
  }
  // A API já devolve os meses em ordem; o Map preserva a ordem de chegada.
  return [...porMes.values()];
}

// Tooltip próprio, porque o padrão do Recharts pinta o texto com a cor de
// cada série, e texto amarelo sobre branco não se lê. Aqui a cor fica no
// traço ao lado do nome; o texto continua na cor de texto do site.
function DicaDoMes({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--cor-superficie)", border: "1px solid var(--cor-borda)", borderRadius: 4, padding: ".5rem .75rem", fontSize: ".85rem", boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}>
      <strong style={{ display: "block", marginBottom: ".3rem", color: "var(--cor-texto)" }}>{label}</strong>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ display: "flex", alignItems: "center", gap: ".45rem", color: "var(--cor-texto)" }}>
          <span aria-hidden="true" style={{ width: 12, height: 2, background: p.color, display: "inline-block" }} />
          <span style={{ color: "var(--cor-texto-suave)" }}>{p.name}</span>
          <span style={{ marginLeft: "auto", paddingLeft: "1.25rem", fontVariantNumeric: "tabular-nums" }}>{moeda.format(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function GraficoHistoricoVendas({ dados, categorias }) {
  const series = [...new Set(dados.map((d) => d.categoria))];
  const linhas = agruparPorMes(dados);
  const semVendas = dados.every((d) => Number(d.totalVendas) === 0);

  return (
    <div style={{ marginTop: "1.5rem" }}>
      {semVendas && (
        <p data-testid="analise-sem-vendas" style={{ color: "var(--cor-texto-suave)", marginBottom: ".75rem" }}>
          Nenhuma compra entregue nas categorias escolhidas neste período.
        </p>
      )}

      <div
        data-testid="grafico-historico-vendas"
        data-series={series.length}
        data-meses={linhas.length}
        role="img"
        aria-label={`Gráfico de linhas do total vendido por mês, de ${linhas[0]?.mesAno} a ${linhas.at(-1)?.mesAno}, para ${series.join(", ")}. Os valores estão na tabela abaixo.`}
      >
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={linhas} margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--cor-borda)" />
            <XAxis
              dataKey="mesAno"
              tickLine={false}
              axisLine={{ stroke: "var(--cor-borda)" }}
              tick={{ fill: "var(--cor-texto-suave)", fontSize: 12 }}
              // Todos os meses aparecem no eixo enquanto couberem; o
              // Recharts esconde rótulos sozinho quando o período é longo.
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v) => moedaCompacta.format(v)}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--cor-texto-suave)", fontSize: 12 }}
              width={84}
              domain={[0, "auto"]}
            />
            <Tooltip content={<DicaDoMes />} cursor={{ stroke: "var(--cor-texto-fraco)", strokeWidth: 1 }} />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(nome) => <span style={{ color: "var(--cor-texto)" }}>{nome}</span>}
            />
            {series.map((nome) => {
              const cor = corDaCategoria(nome, categorias);
              return (
                <Line
                  key={nome}
                  type="linear"
                  dataKey={nome}
                  name={nome}
                  stroke={cor}
                  strokeWidth={2}
                  // Anel branco em volta do ponto: quando duas linhas passam
                  // pelo mesmo valor (os zeros, por exemplo), um ponto não
                  // some debaixo do outro.
                  dot={{ r: 4, fill: cor, stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: cor, stroke: "#fff", strokeWidth: 2 }}
                  // Sem animação: o gráfico aparece pronto, e o teste não
                  // precisa esperar a linha "crescer" para ler a tela.
                  isAnimationActive={false}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ overflowX: "auto", marginTop: "1rem" }}>
        <table className="tabela-simples" data-testid="tabela-historico-vendas">
          <caption style={{ textAlign: "left", color: "var(--cor-texto-suave)", fontSize: ".85rem", padding: ".25rem 0 .5rem" }}>
            Total vendido por mês, em reais (somente compras entregues)
          </caption>
          <thead>
            <tr>
              <th scope="col">Mês/Ano</th>
              {series.map((nome) => (
                <th scope="col" key={nome} style={{ textAlign: "right" }}>
                  <span aria-hidden="true" style={{ display: "inline-block", width: 10, height: 2, background: corDaCategoria(nome, categorias), marginRight: ".35rem", verticalAlign: "middle" }} />
                  {nome}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha) => (
              <tr key={linha.mesAno}>
                <td>{linha.mesAno}</td>
                {series.map((nome) => (
                  <td
                    key={nome}
                    data-testid="valor-historico"
                    data-categoria={nome}
                    data-mes={linha.mesAno}
                    data-valor={linha[nome].toFixed(2)}
                    style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}
                  >
                    {moeda.format(linha[nome])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
