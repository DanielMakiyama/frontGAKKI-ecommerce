import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import ProdutoCard from "./ProdutoCard";

/**
 * CarrosselProdutos — vitrine horizontal com setas.
 *
 * A rolagem é NATIVA: o trilho é um `overflow-x: auto` com scroll-snap
 * no CSS. Não há posição controlada por state, nem transform, nem
 * cálculo de "slide atual".
 *
 * Isso é de propósito. Herdamos de graça: arrastar no touch, shift+roda
 * do mouse, teclas de seta quando o trilho tem foco, e o navegador
 * levando o card para dentro da vista quando ele recebe foco pelo Tab.
 * Um carrossel com transform e índice manual precisa reimplementar cada
 * um desses comportamentos — e costuma esquecer os de teclado.
 *
 * O componente só observa a rolagem para saber se ainda há conteúdo de
 * cada lado e desabilitar as setas nas pontas.
 */
export default function CarrosselProdutos({ titulo, produtos = [], verTudoPara }) {
  const trilhoRef = useRef(null);
  const [podeVoltar, setPodeVoltar] = useState(false);
  const [podeAvancar, setPodeAvancar] = useState(false);

  // A folga de 4px absorve o arredondamento de subpixel: sem ela, a seta
  // pode continuar habilitada no fim do trilho por causa de um 0,5px.
  const medir = useCallback(() => {
    const el = trilhoRef.current;
    if (!el) return;
    setPodeVoltar(el.scrollLeft > 4);
    setPodeAvancar(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [medir, produtos]);

  function deslizar(direcao) {
    const el = trilhoRef.current;
    if (!el) return;
    const reduzirMovimento = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // 85% da largura visível: sobra uma "pista" do card anterior, que
    // sinaliza continuidade em vez de trocar a tela inteira de uma vez.
    el.scrollBy({
      left: direcao * el.clientWidth * 0.85,
      behavior: reduzirMovimento ? "auto" : "smooth",
    });
  }

  if (produtos.length === 0) return null;

  return (
    <section className="carrossel" aria-labelledby="titulo-carrossel">
      <header className="cabecalho-secao">
        <h2 id="titulo-carrossel">{titulo}</h2>

        <div className="carrossel-controles">
          {verTudoPara && (
            <Link to={verTudoPara} className="link-secao">
              Ver tudo <ArrowRight size={15} strokeWidth={2.2} />
            </Link>
          )}
          <div className="carrossel-nav">
            <button
              type="button" className="btn-carrossel"
              onClick={() => deslizar(-1)} disabled={!podeVoltar}
              aria-label="Produtos anteriores"
            >
              <ChevronLeft size={18} strokeWidth={2.2} />
            </button>
            <button
              type="button" className="btn-carrossel"
              onClick={() => deslizar(1)} disabled={!podeAvancar}
              aria-label="Próximos produtos"
            >
              <ChevronRight size={18} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </header>

      {/* tabIndex={0} torna o trilho focável: com o foco nele, as setas do
          teclado rolam a lista. Sem isso, quem não usa mouse fica preso. */}
      <div
        className="carrossel-trilho"
        ref={trilhoRef}
        onScroll={medir}
        tabIndex={0}
        role="group"
        aria-label={`${titulo} — role para o lado para ver mais`}
      >
        {produtos.map((p) => (
          <ProdutoCard key={p.id} produto={p} />
        ))}
      </div>
    </section>
  );
}
