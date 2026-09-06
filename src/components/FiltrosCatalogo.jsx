import { Search, SlidersHorizontal } from "lucide-react";

/**
 * Faixas de preço como opções fixas em vez de dois campos numéricos:
 * menos digitação, e o cliente escolhe uma faixa em um clique. `min` e
 * `max` ficam aqui e não espalhados por ifs no componente de catálogo.
 */
export const FAIXAS_PRECO = [
  { id: "", rotulo: "Qualquer preço", min: 0, max: Infinity },
  { id: "ate-1000", rotulo: "Até R$ 1.000", min: 0, max: 1000 },
  { id: "1000-3000", rotulo: "R$ 1.000 a R$ 3.000", min: 1000, max: 3000 },
  { id: "3000-6000", rotulo: "R$ 3.000 a R$ 6.000", min: 3000, max: 6000 },
  { id: "acima-6000", rotulo: "Acima de R$ 6.000", min: 6000, max: Infinity },
];

/**
 * FiltrosCatalogo — componente 100% controlado ("burro"): não guarda
 * estado nenhum. Recebe `filtros` e devolve mudanças por `aoMudar`.
 *
 * Toda a verdade sobre o que está filtrado vive em Catalogo.jsx. Assim
 * a barra de resultados, os chips de filtro ativo e a URL futura leem
 * sempre a mesma fonte, sem risco de dessincronizar.
 */
export default function FiltrosCatalogo({ categorias, fabricantes, filtros, aoMudar, aoLimpar, temFiltroAtivo }) {
  // Helper: devolve uma cópia dos filtros com um campo trocado.
  const mudar = (campo, valor) => aoMudar({ ...filtros, [campo]: valor });

  return (
    <aside className="filtros-sidebar" aria-label="Filtros do catálogo">
      <div className="filtro-bloco">
        <label className="filtro-titulo" htmlFor="busca-catalogo">Buscar</label>
        <div className="campo-com-icone">
          <Search size={17} strokeWidth={1.8} />
          <input
            id="busca-catalogo"
            type="search"
            placeholder="guitarra, violão…"
            value={filtros.busca}
            onChange={(e) => mudar("busca", e.target.value)}
          />
        </div>
      </div>

      <div className="filtro-bloco">
        <span className="filtro-titulo">Categoria</span>
        <div className="chips-filtro" role="group" aria-label="Categoria">
          <button
            type="button"
            className={`chip${filtros.categoriaId === "" ? " ativo" : ""}`}
            aria-pressed={filtros.categoriaId === ""}
            onClick={() => mudar("categoriaId", "")}
          >
            Todas
          </button>
          {categorias.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`chip${filtros.categoriaId === String(c.id) ? " ativo" : ""}`}
              aria-pressed={filtros.categoriaId === String(c.id)}
              onClick={() => mudar("categoriaId", String(c.id))}
            >
              {c.nome}
            </button>
          ))}
        </div>
      </div>

      <div className="filtro-bloco">
        <span className="filtro-titulo">Preço</span>
        <div className="filtro-lista" role="group" aria-label="Faixa de preço">
          {FAIXAS_PRECO.map((f) => (
            <button
              key={f.id || "todos"}
              type="button"
              className={`filtro-opcao${filtros.faixaPreco === f.id ? " ativo" : ""}`}
              aria-pressed={filtros.faixaPreco === f.id}
              onClick={() => mudar("faixaPreco", f.id)}
            >
              {f.rotulo}
            </button>
          ))}
        </div>
      </div>

      <div className="filtro-bloco">
        <label className="filtro-titulo" htmlFor="filtro-fabricante">Marca</label>
        <select
          id="filtro-fabricante"
          className="select-filtro"
          value={filtros.fabricante}
          onChange={(e) => mudar("fabricante", e.target.value)}
        >
          <option value="">Todas as marcas</option>
          {fabricantes.map((f) => (
            <option key={f.id} value={f.nome}>{f.nome}</option>
          ))}
        </select>
      </div>

      <div className="filtro-bloco">
        <label className="filtro-checkbox">
          <input
            type="checkbox"
            checked={filtros.somenteEstoque}
            onChange={(e) => mudar("somenteEstoque", e.target.checked)}
          />
          <span>Somente em estoque</span>
        </label>
      </div>

      {temFiltroAtivo && (
        <button type="button" className="btn btn-secundario btn-sm btn-block" onClick={aoLimpar}>
          <SlidersHorizontal size={15} strokeWidth={1.8} />
          Limpar filtros
        </button>
      )}
    </aside>
  );
}
