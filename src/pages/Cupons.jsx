import { Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function Cupons() {
  const [cupons, setCupons] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api.meusCupons().then(setCupons).finally(() => setCarregando(false));
  }, []);

  if (carregando) return <div className="container"><p>Carregando…</p></div>;

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <div className="pagina-titulo">
        <h1 className="titulo-com-icone"><Tag size={26} strokeWidth={1.6} /> Meus cupons</h1>
        <p>Cupons promocionais e gerados a partir de trocas.</p>
      </div>

      {cupons.length === 0 ? (
        <p data-testid="sem-cupons">Você ainda não tem nenhum cupom.</p>
      ) : (
        <table className="tabela-simples card card-pad" data-testid="tabela-cupons">
          <thead>
            <tr><th>Código</th><th>Tipo</th><th>Valor</th><th>Válido até</th><th>Status</th></tr>
          </thead>
          <tbody>
            {cupons.map((c) => (
              <tr key={c.id} data-testid="linha-cupom" data-codigo={c.codigo}>
                <td><strong data-testid="cupom-codigo">{c.codigo}</strong></td>
                <td data-testid="cupom-tipo">{c.tipo}</td>
                <td data-testid="cupom-valor">{c.valor?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                <td>{c.validoAte ? new Date(c.validoAte).toLocaleDateString("pt-BR") : "—"}</td>
                <td>
                  <span className={`status-tag ${c.utilizado ? "status-CANCELADA" : "status-ENTREGUE"}`} data-testid="cupom-status">
                    {c.utilizado ? "Utilizado" : "Disponível"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
