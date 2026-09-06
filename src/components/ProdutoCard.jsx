import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import IconeInstrumento from "./IconeInstrumento";
import { useFavoritos } from "../context/FavoritosContext";

const PARCELAS = 10;

export const formatarBRL = (valor) =>
  (valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * ProdutoCard — unidade da vitrine. Recebe o produto pronto e não sabe
 * de onde ele veio (catálogo, busca, "relacionados"), então serve em
 * qualquer listagem.
 *
 * Sobre a área clicável: o card inteiro leva ao produto, mas NÃO está
 * embrulhado num <a>. Botão dentro de link é HTML inválido e quebra o
 * favoritar. A solução é o "link de cobertura": o <Link> fica só no
 * título e um pseudo-elemento `::after` dele se estica por cima do card
 * (ver `.link-cobertura` no CSS). Resultado: um único link no leitor de
 * tela, o card todo clicável, e o coração fica acima na pilha (z-index)
 * para receber o próprio clique.
 */
export default function ProdutoCard({ produto }) {
  const { ehFavorito, alternar } = useFavoritos();

  const favorito = ehFavorito(produto.id);
  const categoriaPrincipal = [...produto.categorias][0] || "Instrumento";
  const semEstoque = !produto.quantidadeEstoque;
  const poucasUnidades = !semEstoque && produto.quantidadeEstoque <= 5;

  return (
    <article className={`card produto-card${semEstoque ? " esgotado" : ""}`}>
      <div className="produto-midia">
        <IconeInstrumento categoria={categoriaPrincipal} />

        {semEstoque && <span className="selo selo-esgotado">Esgotado</span>}
        {poucasUnidades && (
          <span className="selo selo-alerta">
            {produto.quantidadeEstoque === 1 ? "Última unidade" : `Restam ${produto.quantidadeEstoque}`}
          </span>
        )}

        <button
          type="button"
          className={`btn-favorito${favorito ? " ativo" : ""}`}
          onClick={() => alternar(produto.id)}
          aria-pressed={favorito}
          aria-label={favorito ? `Remover ${produto.nome} dos favoritos` : `Favoritar ${produto.nome}`}
        >
          <Heart size={17} strokeWidth={2} />
        </button>
      </div>

      <div className="conteudo">
        <span className="categoria-tag">{categoriaPrincipal}</span>

        <h3>
          <Link to={`/produtos/${produto.id}`} className="link-cobertura">
            {produto.nome}
          </Link>
        </h3>

        <span className="fabricante">{produto.fabricante}</span>

        <div className="bloco-preco">
          <span className="preco">{formatarBRL(produto.valorVenda)}</span>
          <span className="parcelamento">
            ou {PARCELAS}x de {formatarBRL(produto.valorVenda / PARCELAS)} sem juros
          </span>
        </div>
      </div>
    </article>
  );
}
