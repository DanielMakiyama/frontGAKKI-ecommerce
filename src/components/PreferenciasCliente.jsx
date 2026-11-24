import { useEffect, useState } from "react";
import { Music } from "lucide-react";
import { api } from "../api/client";
import { ESTILOS_MUSICAIS, NIVEIS_MUSICAIS } from "../utils/constantes";

const FORM_VAZIO = {
  nivel: "INICIANTE",
  orcamentoMaximo: "",
  observacoes: "",
  categoriaIds: [],
  estilos: [],
};

// RNF0044 — preferências musicais; o chatbot usa junto com o histórico de compras.
export default function PreferenciasCliente() {
  const [form, setForm] = useState(FORM_VAZIO);
  const [categorias, setCategorias] = useState([]);
  const [atualizadoEm, setAtualizadoEm] = useState(null);

  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    api.listarCategorias().then(setCategorias).catch(() => setCategorias([]));
    // null (204) = cliente ainda não preencheu.
    api.minhasPreferencias()
      .then((p) => p && preencher(p))
      .catch((e) => setErro(e.message));
  }, []);

  function preencher(p) {
    setForm({
      nivel: p.nivel,
      orcamentoMaximo: p.orcamentoMaximo ?? "",
      observacoes: p.observacoes ?? "",
      categoriaIds: p.categorias.map((c) => c.id),
      estilos: p.estilos,
    });
    setAtualizadoEm(p.atualizadoEm);
  }

  function setCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function alternar(campo, valor) {
    setForm((f) => {
      const lista = f[campo];
      const nova = lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];
      return { ...f, [campo]: nova };
    });
  }

  // Limites (ao menos 1 categoria, até 5 estilos) são validados pelo backend.
  async function salvar(e) {
    e.preventDefault();
    setErro(""); setMensagem(""); setSalvando(true);

    try {
      const salvas = await api.salvarPreferencias({
        nivel: form.nivel,
        orcamentoMaximo: form.orcamentoMaximo === "" ? null : Number(form.orcamentoMaximo),
        observacoes: form.observacoes,
        categoriaIds: form.categoriaIds,
        estilos: form.estilos,
      });
      preencher(salvas);
      setMensagem("Preferências salvas. O assistente passa a usá-las nas recomendações.");
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form
      className="card card-pad"
      onSubmit={salvar}
      style={{ marginBottom: "1.5rem" }}
      data-testid="form-preferencias"
    >
      <h3 className="titulo-com-icone"><Music size={19} strokeWidth={1.9} /> Preferências musicais</h3>
      <p className="passo-ajuda" style={{ marginTop: 0 }}>
        O assistente de compras usa estas informações, junto com seu histórico de pedidos,
        para recomendar instrumentos.
        {atualizadoEm && <> Última atualização: {new Date(atualizadoEm).toLocaleString("pt-BR")}.</>}
      </p>

      {erro && <div className="erro-form" role="alert" data-testid="erro-preferencias">{erro}</div>}
      {mensagem && <p className="aviso-sucesso" role="status" data-testid="sucesso-preferencias">{mensagem}</p>}

      <div className="linha-campos">
        <div className="campo" style={{ flex: 1 }}>
          <label htmlFor="pref-nivel">Nível</label>
          <select
            id="pref-nivel" required
            value={form.nivel}
            onChange={(ev) => setCampo("nivel", ev.target.value)}
          >
            {NIVEIS_MUSICAIS.map((n) => <option key={n.valor} value={n.valor}>{n.rotulo}</option>)}
          </select>
        </div>
        <div className="campo" style={{ flex: 1 }}>
          <label htmlFor="pref-orcamento">Orçamento máximo (R$, opcional)</label>
          <input
            id="pref-orcamento" type="number" step="0.01" inputMode="decimal" placeholder="2500,00"
            value={form.orcamentoMaximo}
            onChange={(ev) => setCampo("orcamentoMaximo", ev.target.value)}
          />
        </div>
      </div>

      <div className="campo">
        <label>Categorias de interesse</label>
        <div className="chips-filtro" data-testid="pref-categorias">
          {categorias.map((c) => {
            const ativo = form.categoriaIds.includes(c.id);
            return (
              <button
                key={c.id} type="button"
                className={`chip${ativo ? " ativo" : ""}`}
                aria-pressed={ativo}
                onClick={() => alternar("categoriaIds", c.id)}
                data-testid={`pref-categoria-${c.id}`}
              >
                {c.nome}
              </button>
            );
          })}
        </div>
      </div>

      <div className="campo">
        <label>Estilos musicais (até 5)</label>
        <div className="chips-filtro" data-testid="pref-estilos">
          {ESTILOS_MUSICAIS.map((s) => {
            const ativo = form.estilos.includes(s.valor);
            return (
              <button
                key={s.valor} type="button"
                className={`chip${ativo ? " ativo" : ""}`}
                aria-pressed={ativo}
                onClick={() => alternar("estilos", s.valor)}
                data-testid={`pref-estilo-${s.valor}`}
              >
                {s.rotulo}
              </button>
            );
          })}
        </div>
      </div>

      <div className="campo">
        <label htmlFor="pref-observacoes">Observações (opcional)</label>
        <textarea
          id="pref-observacoes" rows={2} maxLength={300}
          placeholder="Ex.: toco em igreja aos domingos, quero algo leve para transportar"
          value={form.observacoes}
          onChange={(ev) => setCampo("observacoes", ev.target.value)}
        />
      </div>

      <button className="btn btn-primario" disabled={salvando} data-testid="btn-salvar-preferencias">
        {salvando ? "Salvando…" : "Salvar preferências"}
      </button>
    </form>
  );
}
