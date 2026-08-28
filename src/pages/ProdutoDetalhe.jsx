import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function ProdutoDetalhe() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const { adicionar } = useCart();
  const navigate = useNavigate();

  const [produto, setProduto] = useState(null);
  const [quantidade, setQuantidade] = useState(1);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.buscarInstrumento(id).then(setProduto).catch((e) => setErro(e.message));
  }, [id]);

  async function handleAdicionar() {
    if (!usuario) {
      navigate("/login");
      return;
    }
    setErro("");
    setMensagem("");
    try {
      await adicionar(Number(id), quantidade);
      setMensagem("Adicionado ao carrinho!");
    } catch (e) {
      setErro(e.message);
    }
  }

  if (erro && !produto) return <div className="container"><div className="erro-form">{erro}</div></div>;
  if (!produto) return <div className="container"><p>Carregando…</p></div>;

  return (
    <div className="container" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem" }}>
      <div className="card" style={{ height: 340, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "4rem" }}>
        🎵
      </div>

      <div>
        <span className="categoria-tag">{[...produto.categorias].join(" · ")}</span>
        <h1>{produto.nome}</h1>
        <p style={{ color: "var(--cor-texto-suave)" }}>{produto.fabricante} {produto.anoFabricacao ? `· ${produto.anoFabricacao}` : ""}</p>
        <p>{produto.descricao}</p>

        <p style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--cor-madeira-escura)", margin: "1rem 0" }}>
          {produto.valorVenda?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </p>

        <p style={{ fontSize: "0.85rem", color: produto.quantidadeEstoque > 0 ? "var(--cor-sucesso)" : "var(--cor-perigo)" }}>
          {produto.quantidadeEstoque > 0 ? `${produto.quantidadeEstoque} em estoque` : "Sem estoque no momento"}
        </p>

        {erro && <div className="erro-form">{erro}</div>}
        {mensagem && <p style={{ color: "var(--cor-sucesso)", fontWeight: 600 }}>{mensagem}</p>}

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginTop: "1rem" }}>
          <input
            type="number"
            min={1}
            max={produto.quantidadeEstoque || 1}
            value={quantidade}
            onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value)))}
            style={{ width: 70, padding: "0.55rem", border: "1px solid var(--cor-borda)", borderRadius: 4 }}
          />
          <button className="btn btn-primario" disabled={!produto.quantidadeEstoque} onClick={handleAdicionar}>
            Adicionar ao carrinho
          </button>
        </div>
      </div>
    </div>
  );
}
