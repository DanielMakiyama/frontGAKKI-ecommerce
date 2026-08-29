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
        <p>Você ainda não tem nenhum cupom.</p>
      ) : (
        <table className="tabela-simples card card-pad">
          <thead>
            <tr><th>Código</th><th>Tipo</th><th>Valor</th><th>Válido até</th><th>Status</th></tr>
          </thead>
          <tbody>
            {cupons.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.codigo}</strong></td>
                <td>{c.tipo}</td>
                <td>{c.valor?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                <td>{c.validoAte ? new Date(c.validoAte).toLocaleDateString("pt-BR") : "—"}</td>
                <td>
                  <span className={`status-tag ${c.utilizado ? "status-CANCELADA" : "status-ENTREGUE"}`}>
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
