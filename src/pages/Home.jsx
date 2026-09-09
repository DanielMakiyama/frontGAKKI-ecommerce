import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Truck, RefreshCw, ShieldCheck } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import AdminDashboard from "../components/AdminDashboard";
import IconeInstrumento from "../components/IconeInstrumento";
import DestaqueHero from "../components/DestaqueHero";
import CarrosselProdutos from "../components/CarrosselProdutos";

// A mesma lista alimenta o painel do hero e o carrossel do rodapé: uma
// requisição só, dois usos.
const QTD_VITRINE = 8;

export default function Home() {
  const { usuario, isAdmin } = useAuth();

  const [categorias, setCategorias] = useState([]);
  const [vitrine, setVitrine] = useState([]);

  useEffect(() => {
    // O admin cai no dashboard: nem chega a montar a vitrine.
    if (isAdmin) return;
    api.listarCategorias().then(setCategorias).catch(() => {});
    api
      .listarInstrumentos({ size: QTD_VITRINE })
      .then((page) => setVitrine(page.content || []))
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

        <DestaqueHero produtos={vitrine} />
      </section>

      <section className="faixa-garantias faixa-cheia">
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

      <div className="container container-largo secao-home">
        <CarrosselProdutos titulo="Em destaque" produtos={vitrine} verTudoPara="/catalogo" />
      </div>
    </>
  );
}
