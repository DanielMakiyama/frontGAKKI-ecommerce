import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Truck, RefreshCw, ShieldCheck } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import AdminDashboard from "../components/AdminDashboard";
import LogoGakki from "../components/LogoGakki";
import IconeInstrumento from "../components/IconeInstrumento";
import ProdutoCard from "../components/ProdutoCard";

const QTD_DESTAQUES = 4;

export default function Home() {
  const { usuario, isAdmin } = useAuth();

  const [categorias, setCategorias] = useState([]);
  const [destaques, setDestaques] = useState([]);

  useEffect(() => {
    // O admin cai no dashboard: nem chega a montar a vitrine.
    if (isAdmin) return;
    api.listarCategorias().then(setCategorias).catch(() => {});
    api
      .listarInstrumentos({ size: QTD_DESTAQUES })
      .then((page) => setDestaques(page.content || []))
      .catch(() => {});
  }, [isAdmin]);

  if (isAdmin) return <AdminDashboard />;

  return (
    <>
      <section className="hero container container-medio">
        <div className="hero-texto">
          <span className="hero-etiqueta">Instrumentos e áudio profissional</span>
          <h1>Do primeiro acorde ao palco.</h1>
          <p>
            Cordas, teclas, sopros, percussão e eletrônicos selecionados —
            para quem está começando e para quem já vive de música.
          </p>
          <div className="hero-acoes">
            <Link to="/catalogo" className="btn btn-primario">
              Ver catálogo <ArrowRight size={17} strokeWidth={2.2} />
            </Link>
            {!usuario && <Link to="/registrar" className="btn btn-secundario">Criar conta</Link>}
          </div>
        </div>

        {/* A marca ampliada substitui a roseta do tema antigo: o mesmo
            símbolo do header, agora como elemento gráfico. */}
        <div className="hero-visual" aria-hidden="true">
          <LogoGakki size={340} className="marca-ampliada" />
        </div>
      </section>

      <section className="faixa-garantias">
        <div className="container container-medio">
          <ul>
            <li><Truck size={19} strokeWidth={1.7} /> <span><strong>Frete para todo o Brasil</strong>calculado no checkout</span></li>
            <li><RefreshCw size={19} strokeWidth={1.7} /> <span><strong>Troca em 7 dias</strong>com cupom de crédito</span></li>
            <li><ShieldCheck size={19} strokeWidth={1.7} /> <span><strong>Garantia do fabricante</strong>em todos os itens</span></li>
          </ul>
        </div>
      </section>

      {categorias.length > 0 && (
        <section className="container container-medio secao-home">
          <header className="cabecalho-secao">
            <h2>Navegue por categoria</h2>
          </header>
          <div className="grade-categorias">
            {categorias.map((c) => (
              // O catálogo lê `?categoria=` da URL, então este link já
              // abre a vitrine com o filtro aplicado.
              <Link key={c.id} to={`/catalogo?categoria=${c.id}`} className="card cartao-categoria">
                <IconeInstrumento categoria={c.nome} />
                <span>{c.nome}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {destaques.length > 0 && (
        <section className="container container-medio secao-home">
          <header className="cabecalho-secao">
            <h2>Em destaque</h2>
            <Link to="/catalogo" className="link-secao">
              Ver tudo <ArrowRight size={15} strokeWidth={2.2} />
            </Link>
          </header>
          <div className="grade-produtos">
            {destaques.map((i) => <ProdutoCard key={i.id} produto={i} />)}
          </div>
        </section>
      )}
    </>
  );
}
