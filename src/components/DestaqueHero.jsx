import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import IconeInstrumento from "./IconeInstrumento";
import { formatarBRL } from "./ProdutoCard";

/**
 * DestaqueHero — painel do hero que mostra UM produto por vez, com setas
 * nas laterais para folhear.
 *
 * Diferente do <CarrosselProdutos />, aqui não há rolagem: é uma troca
 * de conteúdo por índice, porque só existe um card visível. Por isso a
 * navegação é circular — do último volta ao primeiro. Numa lista que
 * rola, parar na ponta faz sentido; folheando um por um, esbarrar num
 * botão morto só irrita.
 *
 * O painel inteiro é um <Link> para o produto exibido; as setas ficam
 * acima dele na pilha (z-index) para receberem o próprio clique.
 */
export default function DestaqueHero({ produtos = [] }) {
  const [indice, setIndice] = useState(0);

  // Se a lista chegar depois (ou encolher), um índice antigo apontaria
  // para um produto que não existe mais.
  useEffect(() => setIndice(0), [produtos]);

  if (produtos.length === 0) {
    return <div className="hero-visual" aria-hidden="true" />;
  }

  const produto = produtos[indice] ?? produtos[0];
  const categoria = [...produto.categorias][0] || "Instrumento";

  // O `+ produtos.length` antes do módulo evita índice negativo ao
  // voltar do primeiro: (0 - 1) % 8 é -1 em JavaScript, não 7.
  const mover = (passo) =>
    setIndice((i) => (i + passo + produtos.length) % produtos.length);

  return (
    <div
      className="hero-visual"
      role="group"
      aria-roledescription="carrossel"
      aria-label="Produtos em destaque"
    >
      <button
        type="button"
        className="seta-destaque esquerda"
        onClick={() => mover(-1)}
        aria-label="Produto anterior"
      >
        <ChevronLeft size={20} strokeWidth={2.2} />
      </button>

      {/* A `key` faz o React remontar o bloco a cada troca, o que
          reinicia a animação de entrada. Sem ela, o conteúdo mudaria
          sem transição nenhuma. */}
      <Link
        to={`/produtos/${produto.id}`}
        className="destaque-conteudo"
        key={produto.id}
        aria-live="polite"
      >
        <IconeInstrumento categoria={categoria} />
        <div className="destaque-info">
          <span className="destaque-categoria">{categoria}</span>
          <strong>{produto.nome}</strong>
          <span className="destaque-preco">{formatarBRL(produto.valorVenda)}</span>
        </div>
      </Link>

      <button
        type="button"
        className="seta-destaque direita"
        onClick={() => mover(1)}
        aria-label="Próximo produto"
      >
        <ChevronRight size={20} strokeWidth={2.2} />
      </button>

      <div className="destaque-pontos">
        {produtos.map((p, i) => (
          <button
            key={p.id}
            type="button"
            className={`ponto${i === indice ? " ativo" : ""}`}
            onClick={() => setIndice(i)}
            aria-label={`Ver ${p.nome}`}
            aria-current={i === indice}
          />
        ))}
      </div>
    </div>
  );
}
