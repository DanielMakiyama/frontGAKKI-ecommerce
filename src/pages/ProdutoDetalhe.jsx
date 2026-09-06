import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronRight, Heart, ShoppingCart, Check, Truck, ShieldCheck } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useFavoritos } from "../context/FavoritosContext";
import GaleriaProduto from "../components/GaleriaProduto";
import SeletorQuantidade from "../components/SeletorQuantidade";
import { formatarBRL } from "../components/ProdutoCard";

const PARCELAS = 10;

export default function ProdutoDetalhe() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const { adicionar } = useCart();
  const { ehFavorito, alternar } = useFavoritos();
  const navigate = useNavigate();

  const [produto, setProduto] = useState(null);
  const [quantidade, setQuantidade] = useState(1);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    setProduto(null);
    setQuantidade(1);
    setMensagem("");
    api.buscarInstrumento(id).then(setProduto).catch((e) => setErro(e.message));
  }, [id]);

  async function handleAdicionar() {
    if (!usuario) {
      // A chave precisa ser `from`: é o nome que Login.jsx lê em
      // `location.state?.from` para devolver o cliente de onde veio.
      navigate("/login", { state: { from: `/produtos/${id}` } });
      return;
    }
    setErro("");
    setMensagem("");
    setEnviando(true);
    try {
      await adicionar(Number(id), quantidade);
      setMensagem(`${quantidade} ${quantidade === 1 ? "item adicionado" : "itens adicionados"} ao carrinho.`);
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  if (erro && !produto) {
    return <div className="container container-medio"><div className="erro-form">{erro}</div></div>;
  }
  if (!produto) {
    // Esqueleto no mesmo formato da página: nada "pula" quando carrega.
    return (
      <div className="container container-medio">
        <div className="produto-detalhe">
          <div className="esqueleto" style={{ height: 420, borderRadius: "var(--raio-lg)" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: ".9rem" }}>
            <div className="esqueleto esqueleto-linha curta" />
            <div className="esqueleto" style={{ height: 34 }} />
            <div className="esqueleto esqueleto-linha" />
            <div className="esqueleto esqueleto-linha media" />
          </div>
        </div>
      </div>
    );
  }

  const categorias = [...produto.categorias];
  const favorito = ehFavorito(produto.id);
  const estoque = produto.quantidadeEstoque || 0;
  const semEstoque = estoque === 0;
  const poucasUnidades = !semEstoque && estoque <= 5;

  return (
    <div className="container container-medio">
      <nav className="trilha" aria-label="Você está aqui">
        <Link to="/">Início</Link>
        <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
        <Link to="/catalogo">Catálogo</Link>
        <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
        <span aria-current="page">{produto.nome}</span>
      </nav>

      <div className="produto-detalhe">
        <GaleriaProduto imagens={produto.imagens} categoria={categorias[0]} nome={produto.nome} />

        <div className="produto-compra">
          <span className="fabricante-destaque">{produto.fabricante}</span>
          <h1>{produto.nome}</h1>

          <div className="lista-categorias">
            {categorias.map((c) => (
              <span key={c} className="chip chip-estatico">{c}</span>
            ))}
          </div>

          <p className="descricao-produto">{produto.descricao}</p>

          <div className="bloco-valores">
            <span className="preco-grande">{formatarBRL(produto.valorVenda)}</span>
            <span className="parcelamento">
              ou {PARCELAS}x de {formatarBRL(produto.valorVenda / PARCELAS)} sem juros
            </span>
          </div>

          <p className={`aviso-estoque${semEstoque ? " indisponivel" : ""}`}>
            {semEstoque
              ? "Sem estoque no momento"
              : poucasUnidades
                ? `Apenas ${estoque} ${estoque === 1 ? "unidade disponível" : "unidades disponíveis"}`
                : `${estoque} unidades em estoque`}
          </p>

          {erro && <div className="erro-form">{erro}</div>}
          {mensagem && (
            <p className="aviso-sucesso" role="status">
              <Check size={16} strokeWidth={2.5} /> {mensagem}{" "}
              <Link to="/carrinho">Ver carrinho</Link>
            </p>
          )}

          <div className="acoes-compra">
            <SeletorQuantidade
              valor={quantidade}
              aoMudar={setQuantidade}
              max={Math.max(1, estoque)}
              desabilitado={semEstoque}
            />

            <button
              className="btn btn-primario btn-comprar"
              disabled={semEstoque || enviando}
              onClick={handleAdicionar}
            >
              <ShoppingCart size={18} strokeWidth={2} />
              {enviando ? "Adicionando…" : "Adicionar ao carrinho"}
            </button>

            <button
              type="button"
              className={`btn-favorito btn-favorito-grande${favorito ? " ativo" : ""}`}
              onClick={() => alternar(produto.id)}
              aria-pressed={favorito}
              aria-label={favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
              <Heart size={19} strokeWidth={2} />
            </button>
          </div>

          <ul className="garantias">
            <li><Truck size={17} strokeWidth={1.8} /> Frete calculado no checkout</li>
            <li><ShieldCheck size={17} strokeWidth={1.8} /> Troca em até 7 dias após o recebimento</li>
          </ul>

          <dl className="ficha-tecnica">
            <div><dt>Código</dt><dd>{produto.codigo}</dd></div>
            <div><dt>Fabricante</dt><dd>{produto.fabricante}</dd></div>
            {produto.anoFabricacao && <div><dt>Ano de fabricação</dt><dd>{produto.anoFabricacao}</dd></div>}
            <div><dt>Categorias</dt><dd>{categorias.join(", ")}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  );
}
