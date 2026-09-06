import { useEffect, useState } from "react";
import IconeInstrumento from "./IconeInstrumento";

/**
 * GaleriaProduto — painel principal + tira de miniaturas.
 *
 * O catálogo ainda não tem fotos: `InstrumentoResponse` não traz campo
 * de imagem e o mock não gera nenhuma. Em vez de inventar imagens
 * falsas, a galeria trabalha com uma lista `imagens` que hoje chega
 * vazia — e nesse caso mostra o ícone da categoria em um painel único,
 * sem a tira de miniaturas (uma miniatura só não é uma galeria).
 *
 * Quando o backend passar a devolver `imagens: [{ url, alt }]`, esta
 * página não muda: é só o array deixar de vir vazio.
 */
export default function GaleriaProduto({ imagens = [], categoria, nome }) {
  const [ativa, setAtiva] = useState(0);

  // Trocar de produto sem resetar o índice deixaria a galeria abrindo na
  // 3ª foto de um produto que talvez só tenha 2.
  useEffect(() => setAtiva(0), [nome]);

  const temImagens = imagens.length > 0;
  const imagemAtual = temImagens ? imagens[Math.min(ativa, imagens.length - 1)] : null;

  return (
    <div className="galeria-produto">
      <div className="galeria-principal">
        {imagemAtual ? (
          <img src={imagemAtual.url} alt={imagemAtual.alt || nome} />
        ) : (
          <IconeInstrumento categoria={categoria} />
        )}
      </div>

      {imagens.length > 1 && (
        <div className="galeria-miniaturas" role="group" aria-label={`Imagens de ${nome}`}>
          {imagens.map((img, i) => (
            <button
              key={img.url}
              type="button"
              className={`miniatura${i === ativa ? " ativa" : ""}`}
              onClick={() => setAtiva(i)}
              aria-label={`Ver imagem ${i + 1} de ${imagens.length}`}
              aria-current={i === ativa}
            >
              <img src={img.url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
