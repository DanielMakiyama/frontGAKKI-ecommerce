import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export default function Catalogo() {
  const [instrumentos, setInstrumentos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [buscaDigitada, setBuscaDigitada] = useState("");
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.listarCategorias().then(setCategorias).catch(() => {});
  }, []);

  // Debounce: só aplica o filtro de nome 350ms depois que o usuário para de
  // digitar, evitando uma chamada à API a cada tecla pressionada.
  useEffect(() => {
    const timer = setTimeout(() => setFiltroNome(buscaDigitada), 350);
    return () => clearTimeout(timer);
  }, [buscaDigitada]);

  useEffect(() => {
    setCarregando(true);
    const params = { size: 50 };
    if (filtroNome) params.nome = filtroNome;
    if (filtroCategoria) params.categoriaId = filtroCategoria;

    api.listarInstrumentos(params)
      .then((page) => setInstrumentos(page.content || []))
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [filtroNome, filtroCategoria]);

  return (
    <div className="container">
      <div className="pagina-titulo">
        <h1>Catálogo</h1>
        <p>Instrumentos musicais selecionados para cada estilo e nível.</p>
      </div>

      <div className="card card-pad" style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div className="campo" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
          <label>Buscar por nome</label>
          <input placeholder="ex.: guitarra, violão…" value={buscaDigitada} onChange={(e) => setBuscaDigitada(e.target.value)} />
        </div>
        <div className="campo" style={{ minWidth: 200, marginBottom: 0 }}>
          <label>Categoria</label>
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
            <option value="">Todas</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
      </div>

      {erro && <div className="erro-form">{erro}</div>}
      {carregando ? (
        <p>Carregando…</p>
      ) : instrumentos.length === 0 ? (
        <p>Nenhum instrumento encontrado com esse filtro.</p>
      ) : (
        <div className="grade-produtos">
          {instrumentos.map((i) => (
            <Link to={`/produtos/${i.id}`} key={i.id} className="card produto-card">
              <div className="imagem-placeholder">🎵</div>
              <div className="conteudo">
                <span className="categoria-tag">{[...i.categorias][0] || "Instrumento"}</span>
                <h3>{i.nome}</h3>
                <span className="fabricante">{i.fabricante}</span>
                <span className="preco">
                  {i.valorVenda?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
