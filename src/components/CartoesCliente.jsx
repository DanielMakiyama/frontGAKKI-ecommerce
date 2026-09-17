import { useEffect, useState } from "react";
import { CreditCard, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { api } from "../api/client";
import { somenteDigitos } from "../utils/formatos";

const FORM_VAZIO = {
  apelido: "",
  ultimosDigitos: "",
  bandeiraId: "",
  nomeTitular: "",
  validadeMes: "",
  validadeAno: "",
};

const ANO_ATUAL = new Date().getFullYear();
const ANOS_VALIDADE = Array.from({ length: 16 }, (_, i) => ANO_ATUAL + i);
const MESES = Array.from({ length: 12 }, (_, i) => i + 1);

/**
 * CartoesCliente — lista, cadastra, altera, remove e define o cartão
 * preferencial (RF0027).
 *
 * Guardamos apenas os QUATRO ÚLTIMOS dígitos, nunca o número completo
 * nem o código de segurança. Número cheio e CVV exigem certificação
 * PCI-DSS para armazenar — num fluxo real vão direto ao gateway, que
 * devolve um token.
 *
 * A bandeira é escolhida da lista do sistema (RN0025) e enviada como id,
 * não como texto: assim o banco recusa uma bandeira que não exista, em
 * vez de aceitar "VIZA" como se fosse uma bandeira nova.
 */
export default function CartoesCliente() {
  const [cartoes, setCartoes] = useState([]);
  const [bandeiras, setBandeiras] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // `editando` guarda o id em edição, ou "novo" para o formulário de
  // cadastro. Um state só evita os dois formulários abertos ao mesmo
  // tempo — que é o bug clássico de usar dois booleanos separados.
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);

  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function recarregar() {
    try {
      setCartoes(await api.meusCartoes());
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    recarregar();
    // RN0025 — a lista vem do cadastro do sistema, não de uma constante.
    api.listarBandeiras().then(setBandeiras).catch(() => setBandeiras([]));
  }, []);

  function abrirNovo() {
    setForm(FORM_VAZIO);
    setEditando("novo");
    setErro(""); setMensagem("");
  }

  function abrirEdicao(cartao) {
    setForm({
      apelido: cartao.apelido || "",
      ultimosDigitos: cartao.ultimosDigitos || "",
      // A resposta traz o NOME da bandeira, porque é o que a tela exibe.
      // Para editar é preciso o id de volta — daí o cruzamento com a lista.
      bandeiraId: bandeiras.find((b) => b.nome === cartao.bandeira)?.id ?? "",
      nomeTitular: cartao.nomeTitular || "",
      validadeMes: cartao.validadeMes ?? "",
      validadeAno: cartao.validadeAno ?? "",
    });
    setEditando(cartao.id);
    setErro(""); setMensagem("");
  }

  function fechar() {
    setEditando(null);
    setForm(FORM_VAZIO);
  }

  function setCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function salvar(e) {
    e.preventDefault();
    setErro(""); setMensagem(""); setSalvando(true);

    // Os selects devolvem string; o backend espera número.
    const payload = {
      ...form,
      bandeiraId: Number(form.bandeiraId),
      validadeMes: Number(form.validadeMes),
      validadeAno: Number(form.validadeAno),
    };

    try {
      if (editando === "novo") {
        await api.adicionarCartao(payload);
        setMensagem("Cartão cadastrado.");
      } else {
        await api.atualizarCartao(editando, payload);
        setMensagem("Cartão atualizado.");
      }
      await recarregar();
      fechar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function tornarPreferencial(id) {
    setErro(""); setMensagem("");
    try {
      await api.definirCartaoPreferencial(id);
      await recarregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function remover(cartao) {
    setErro(""); setMensagem("");
    try {
      await api.removerCartao(cartao.id);
      await recarregar();
      setMensagem(`Cartão "${cartao.apelido}" removido.`);
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <section className="card card-pad" style={{ marginBottom: "1.5rem" }} data-testid="secao-cartoes">
      <h3 className="titulo-com-icone"><CreditCard size={19} strokeWidth={1.9} /> Cartões de crédito</h3>

      {erro && <div className="erro-form" role="alert" data-testid="erro-cartao">{erro}</div>}
      {mensagem && <p className="aviso-sucesso" role="status">{mensagem}</p>}

      {carregando ? (
        <p>Carregando…</p>
      ) : cartoes.length === 0 ? (
        <p className="passo-ajuda">Nenhum cartão cadastrado ainda.</p>
      ) : (
        <ul className="lista-salvos">
          {cartoes.map((c) => (
            <li key={c.id} className={`item-salvo${c.preferencial ? " destacado" : ""}`} data-cartao={c.id}>
              <div className="item-salvo-dados">
                <strong>
                  {c.apelido}
                  {c.preferencial && <span className="marcador-padrao">preferencial</span>}
                </strong>
                <span>{c.bandeira} •••• {c.ultimosDigitos}</span>
                <span>
                  {c.nomeTitular} · validade {String(c.validadeMes).padStart(2, "0")}/{c.validadeAno}
                </span>
              </div>

              <div className="item-salvo-acoes">
                {!c.preferencial && (
                  <button
                    className="btn btn-secundario btn-sm"
                    onClick={() => tornarPreferencial(c.id)}
                    title="Usar como cartão preferencial"
                  >
                    <Star size={14} strokeWidth={2} /> Preferencial
                  </button>
                )}
                <button className="btn btn-secundario btn-sm" onClick={() => abrirEdicao(c)}>
                  <Pencil size={14} strokeWidth={2} /> Alterar
                </button>
                <button
                  className="btn-icone-perigo"
                  onClick={() => remover(c)}
                  aria-label={`Remover cartão ${c.apelido}`}
                >
                  <Trash2 size={16} strokeWidth={1.8} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editando === null ? (
        <button className="btn btn-secundario btn-sm" onClick={abrirNovo} data-testid="btn-novo-cartao">
          <Plus size={15} strokeWidth={2.2} /> Novo cartão
        </button>
      ) : (
        <form onSubmit={salvar} className="form-embutido">
          <h4>{editando === "novo" ? "Novo cartão" : "Alterar cartão"}</h4>

          <div className="campo">
            <label htmlFor="cartao-apelido">Apelido</label>
            <input
              id="cartao-apelido" required maxLength={40}
              placeholder="ex.: Cartão principal"
              value={form.apelido}
              onChange={(e) => setCampo("apelido", e.target.value)}
            />
          </div>

          <div className="linha-campos">
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="cartao-digitos">Últimos 4 dígitos</label>
              <input
                id="cartao-digitos" required inputMode="numeric" maxLength={4}
                value={form.ultimosDigitos}
                // Só dígitos: barra letras e símbolos já na digitação, em
                // vez de reclamar depois que o cliente clicou em salvar.
                onChange={(e) => setCampo("ultimosDigitos", somenteDigitos(e.target.value))}
              />
            </div>

            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="cartao-bandeira">Bandeira</label>
              <select
                id="cartao-bandeira" required
                value={form.bandeiraId}
                onChange={(e) => setCampo("bandeiraId", e.target.value)}
              >
                <option value="">Selecione…</option>
                {bandeiras.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
              </select>
            </div>
          </div>

          <div className="linha-campos">
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="cartao-mes">Mês de validade</label>
              <select
                id="cartao-mes" required
                value={form.validadeMes}
                onChange={(e) => setCampo("validadeMes", e.target.value)}
              >
                <option value="">Mês</option>
                {MESES.map((m) => <option key={m} value={m}>{String(m).padStart(2, "0")}</option>)}
              </select>
            </div>
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="cartao-ano">Ano de validade</label>
              <select
                id="cartao-ano" required
                value={form.validadeAno}
                onChange={(e) => setCampo("validadeAno", e.target.value)}
              >
                <option value="">Ano</option>
                {ANOS_VALIDADE.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div className="campo">
            <label htmlFor="cartao-titular">Nome impresso no cartão</label>
            <input
              id="cartao-titular" required maxLength={100}
              value={form.nomeTitular}
              onChange={(e) => setCampo("nomeTitular", e.target.value.toUpperCase())}
            />
          </div>

          <p className="passo-ajuda">
            Guardamos apenas os quatro últimos dígitos — o número completo e o
            código de segurança nunca são armazenados.
          </p>

          <div className="acoes-form">
            <button className="btn btn-primario btn-sm" disabled={salvando} data-testid="btn-salvar-cartao">
              {salvando ? "Salvando…" : "Salvar cartão"}
            </button>
            <button type="button" className="btn btn-secundario btn-sm" onClick={fechar}>Cancelar</button>
          </div>
        </form>
      )}
    </section>
  );
}
