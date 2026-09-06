import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PackageX, X } from "lucide-react";
import { api } from "../api/client";
import ProdutoCard from "../components/ProdutoCard";
import FiltrosCatalogo, { FAIXAS_PRECO } from "../components/FiltrosCatalogo";

const FILTROS_VAZIOS = {
  busca: "",
  categoriaId: "",
  fabricante: "",
  faixaPreco: "",
  somenteEstoque: false,
};

const ORDENACOES = [
  { id: "relevancia", rotulo: "Relevância" },
  { id: "menor-preco", rotulo: "Menor preço" },
  { id: "maior-preco", rotulo: "Maior preço" },
  { id: "nome", rotulo: "Nome (A–Z)" },
  { id: "lancamento", rotulo: "Mais recentes" },
];

export default function Catalogo() {
  const [instrumentos, setInstrumentos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [fabricantes, setFabricantes] = useState([]);

  // A categoria também vive na URL (`/catalogo?categoria=3`), para que os
  // atalhos da home abram a vitrine já filtrada e o link seja
  // compartilhável. Os demais filtros são refinamento de sessão e ficam
  // só no state — colocar tudo na URL deixaria o endereço ilegível.
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtros, setFiltros] = useState(() => ({
    ...FILTROS_VAZIOS,
    categoriaId: searchParams.get("categoria") || "",
  }));
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [ordenacao, setOrdenacao] = useState("relevancia");

  // Mão inversa: mexer nos chips reescreve a URL. `replace: true` evita
  // encher o histórico — o botão voltar não deve percorrer cada filtro.
  useEffect(() => {
    const naUrl = searchParams.get("categoria") || "";
    if (naUrl === filtros.categoriaId) return;
    const proximo = new URLSearchParams(searchParams);
    if (filtros.categoriaId) proximo.set("categoria", filtros.categoriaId);
    else proximo.delete("categoria");
    setSearchParams(proximo, { replace: true });
  }, [filtros.categoriaId, searchParams, setSearchParams]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.listarCategorias().then(setCategorias).catch(() => {});
    api.listarFabricantes().then(setFabricantes).catch(() => {});
  }, []);

  // Debounce: o filtro de nome só vai para a API 350ms depois que o
  // usuário para de digitar, em vez de uma requisição por tecla.
  useEffect(() => {
    const timer = setTimeout(() => setBuscaAplicada(filtros.busca), 350);
    return () => clearTimeout(timer);
  }, [filtros.busca]);

  /**
   * Divisão de trabalho entre servidor e navegador:
   *
   *   • nome e categoria → vão para a API, porque ela já sabe filtrar
   *     por eles (e um dia serão índices no banco);
   *   • preço, marca, estoque e ordenação → aplicados aqui, sobre a
   *     página já recebida.
   *
   * Isso só é honesto porque o catálogo cabe numa página (size: 50).
   * Quando passar disso, esses quatro precisam virar query params —
   * senão a paginação passa a ordenar/filtrar só o pedaço visível.
   */
  useEffect(() => {
    setCarregando(true);
    setErro("");
    const params = { size: 50 };
    if (buscaAplicada) params.nome = buscaAplicada;
    if (filtros.categoriaId) params.categoriaId = filtros.categoriaId;

    api
      .listarInstrumentos(params)
      .then((page) => setInstrumentos(page.content || []))
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [buscaAplicada, filtros.categoriaId]);

  const visiveis = useMemo(() => {
    const faixa = FAIXAS_PRECO.find((f) => f.id === filtros.faixaPreco) || FAIXAS_PRECO[0];

    const lista = instrumentos.filter((i) => {
      const preco = i.valorVenda ?? 0;
      if (preco < faixa.min || preco > faixa.max) return false;
      if (filtros.fabricante && i.fabricante !== filtros.fabricante) return false;
      if (filtros.somenteEstoque && !i.quantidadeEstoque) return false;
      return true;
    });

    // Cópia antes de ordenar: sort() altera o array no lugar, e mexer
    // no array do state direto é bug garantido.
    const ordenada = [...lista];
    if (ordenacao === "menor-preco") ordenada.sort((a, b) => a.valorVenda - b.valorVenda);
    if (ordenacao === "maior-preco") ordenada.sort((a, b) => b.valorVenda - a.valorVenda);
    if (ordenacao === "nome") ordenada.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    if (ordenacao === "lancamento") ordenada.sort((a, b) => (b.anoFabricacao || 0) - (a.anoFabricacao || 0));

    return ordenada;
  }, [instrumentos, filtros.faixaPreco, filtros.fabricante, filtros.somenteEstoque, ordenacao]);

  const temFiltroAtivo = useMemo(
    () => Object.keys(FILTROS_VAZIOS).some((k) => filtros[k] !== FILTROS_VAZIOS[k]),
    [filtros]
  );

  // Chips do que está filtrado, cada um com seu próprio "remover".
  const chipsAtivos = useMemo(() => {
    const chips = [];
    if (filtros.busca) chips.push({ campo: "busca", rotulo: `"${filtros.busca}"` });
    if (filtros.categoriaId) {
      const nome = categorias.find((c) => String(c.id) === filtros.categoriaId)?.nome;
      if (nome) chips.push({ campo: "categoriaId", rotulo: nome });
    }
    if (filtros.faixaPreco) {
      const faixa = FAIXAS_PRECO.find((f) => f.id === filtros.faixaPreco);
      if (faixa) chips.push({ campo: "faixaPreco", rotulo: faixa.rotulo });
    }
    if (filtros.fabricante) chips.push({ campo: "fabricante", rotulo: filtros.fabricante });
    if (filtros.somenteEstoque) chips.push({ campo: "somenteEstoque", rotulo: "Em estoque" });
    return chips;
  }, [filtros, categorias]);

  function removerChip(campo) {
    setFiltros((f) => ({ ...f, [campo]: FILTROS_VAZIOS[campo] }));
  }

  return (
    <div className="container">
      <div className="pagina-titulo">
        <h1>Catálogo</h1>
        <p>Instrumentos musicais selecionados para cada estilo e nível.</p>
      </div>

      <div className="catalogo-layout">
        <FiltrosCatalogo
          categorias={categorias}
          fabricantes={fabricantes}
          filtros={filtros}
          aoMudar={setFiltros}
          aoLimpar={() => setFiltros(FILTROS_VAZIOS)}
          temFiltroAtivo={temFiltroAtivo}
        />

        <section aria-label="Resultados">
          <div className="barra-resultados">
            <p className="contagem-resultados" aria-live="polite">
              {carregando ? "Buscando instrumentos…" : (
                <>
                  <strong>{visiveis.length}</strong>{" "}
                  {visiveis.length === 1 ? "instrumento encontrado" : "instrumentos encontrados"}
                </>
              )}
            </p>

            <div className="ordenacao">
              <label htmlFor="ordenacao-catalogo">Ordenar por</label>
              <select
                id="ordenacao-catalogo"
                className="select-filtro"
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value)}
              >
                {ORDENACOES.map((o) => (
                  <option key={o.id} value={o.id}>{o.rotulo}</option>
                ))}
              </select>
            </div>
          </div>

          {chipsAtivos.length > 0 && (
            <div className="filtros-ativos">
              {chipsAtivos.map((chip) => (
                <button
                  key={chip.campo}
                  type="button"
                  className="tag-filtro"
                  onClick={() => removerChip(chip.campo)}
                  aria-label={`Remover filtro ${chip.rotulo}`}
                >
                  {chip.rotulo}
                  <X size={13} strokeWidth={2.5} />
                </button>
              ))}
            </div>
          )}

          {erro && <div className="erro-form">{erro}</div>}

          {carregando ? (
            // Esqueleto no formato do card: a página não "pula" quando
            // os dados chegam, e a espera parece mais curta.
            <div className="grade-produtos" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card produto-card-esqueleto">
                  <div className="esqueleto esqueleto-midia" />
                  <div className="conteudo">
                    <div className="esqueleto esqueleto-linha curta" />
                    <div className="esqueleto esqueleto-linha" />
                    <div className="esqueleto esqueleto-linha media" />
                  </div>
                </div>
              ))}
            </div>
          ) : visiveis.length === 0 ? (
            <div className="estado-vazio">
              <PackageX size={40} strokeWidth={1.3} />
              <p>Nenhum instrumento encontrado com esses filtros.</p>
              {temFiltroAtivo && (
                <button className="btn btn-secundario btn-sm" onClick={() => setFiltros(FILTROS_VAZIOS)}>
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grade-produtos">
              {visiveis.map((i) => (
                <ProdutoCard key={i.id} produto={i} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
