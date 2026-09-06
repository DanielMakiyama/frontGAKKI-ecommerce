import { Minus, Plus } from "lucide-react";

/**
 * SeletorQuantidade — stepper − / valor / +.
 *
 * Componente controlado: não guarda o número, só avisa o pai. Quem
 * decide os limites é o pai (normalmente `max = estoque`).
 *
 * O <input> continua existindo e é digitável: quem usa teclado ou
 * precisa pular de 1 para 12 não deve ser obrigado a clicar 11 vezes.
 * Os botões são conveniência, não a única porta de entrada.
 */
export default function SeletorQuantidade({ valor, aoMudar, min = 1, max = 99, desabilitado = false, id = "quantidade" }) {
  // Um único ponto de saneamento: tudo que sai daqui já está dentro dos
  // limites e é inteiro. O pai nunca recebe NaN nem valor fora da faixa.
  const aplicar = (bruto) => {
    const n = Math.trunc(Number(bruto));
    if (!Number.isFinite(n)) return;
    aoMudar(Math.min(max, Math.max(min, n)));
  };

  return (
    <div className="seletor-quantidade">
      <button
        type="button"
        onClick={() => aplicar(valor - 1)}
        disabled={desabilitado || valor <= min}
        aria-label="Diminuir quantidade"
      >
        <Minus size={16} strokeWidth={2.4} />
      </button>

      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={valor}
        disabled={desabilitado}
        onChange={(e) => aplicar(e.target.value)}
        aria-label="Quantidade"
      />

      <button
        type="button"
        onClick={() => aplicar(valor + 1)}
        disabled={desabilitado || valor >= max}
        aria-label="Aumentar quantidade"
      >
        <Plus size={16} strokeWidth={2.4} />
      </button>
    </div>
  );
}
