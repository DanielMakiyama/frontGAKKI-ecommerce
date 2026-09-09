import { useEffect, useState } from "react";
import { CreditCard, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { api } from "../api/client";
import { BANDEIRAS } from "../utils/constantes";

const FORM_VAZIO = { apelido: "", ultimosDigitos: "", bandeira: "", nomeTitular: "", validade: "" };

/**
 * CartoesCliente — lista, cadastra, altera, remove e define o cartão
 * preferencial (RF0027).
 *
 * Um detalhe importante do modelo: guardamos apenas os QUATRO ÚLTIMOS
 * dígitos, nunca o número completo nem o código de segurança. Número
 * cheio e CVV são dados que exigem certificação PCI-DSS para armazenar —
 * num fluxo real eles vão direto para o gateway, que devolve um token.
 */
export default function CartoesCliente() {
  const [cartoes, setCartoes] = useState([]);
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

  useEffect(() => { recarregar(); }, []);

  function abrirNovo() {
    setForm(FORM_VAZIO);
    setEditando("novo");
    setErro(""); setMensagem("");
  }

  function abrirEdicao(cartao) {
    setForm({
      apelido: cartao.apelido || "",
      ultimosDigitos: cartao.ultimosDigitos || "",
      bandeira: cartao.bandeira || "",
      nomeTitular: cartao.nomeTitular || "",
      validade: cartao.validade || "",
    });
    setEditando(cartao.id);
    setErro(""); setMensagem("");
  }

  function fechar() {
    setEditando(null);
    setForm(FORM_VAZIO);
  }

  async function salvar(e) {
    e.preventDefault();
    setErro(""); setMensagem(""); setSalvando(true);
    try {
      if (editando === "novo") {
        await api.adicionarCartao(form);
        setMensagem("Cartão cadastrado.");
      } else {
        await api.atualizarCartao(editando, form);
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
    <section className="card card-pad" style={{ marginBottom: "1.5rem" }}>
      <h3 className="titulo-com-icone"><CreditCard size={19} strokeWidth={1.9} /> Cartões de crédito</h3>

      {erro && <div className="erro-form">{erro}</div>}
      {mensagem && <p className="aviso-sucesso" role="status">{mensagem}</p>}

      {carregando ? (
        <p>Carregando…</p>
      ) : cartoes.length === 0 ? (
        <p className="passo-ajuda">Nenhum cartão cadastrado ainda.</p>
      ) : (
        <ul className="lista-salvos">
          {cartoes.map((c) => (
            <li key={c.id} className={`item-salvo${c.preferencial ? " destacado" : ""}`}>
              <div className="item-salvo-dados">
                <strong>
                  {c.apelido}
                  {c.preferencial && <span className="marcador-padrao">preferencial</span>}
                </strong>
                <span>{c.bandeira} •••• {c.ultimosDigitos}</span>
                <span>{c.nomeTitular} · validade {c.validade}</span>
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
        <button className="btn btn-secundario btn-sm" onClick={abrirNovo}>
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
              onChange={(e) => setForm({ ...form, apelido: e.target.value })}
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
                onChange={(e) => setForm({ ...form, ultimosDigitos: e.target.value.replace(/\D/g, "") })}
              />
            </div>

            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="cartao-bandeira">Bandeira</label>
              <select
                id="cartao-bandeira" required
                value={form.bandeira}
                onChange={(e) => setForm({ ...form, bandeira: e.target.value })}
              >
                <option value="">Selecione…</option>
                {BANDEIRAS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="cartao-validade">Validade</label>
              <input
                id="cartao-validade" required placeholder="MM/AAAA"
                pattern="(0[1-9]|1[0-2])/20[0-9]{2}"
                title="Use o formato MM/AAAA"
                value={form.validade}
                onChange={(e) => setForm({ ...form, validade: e.target.value })}
              />
            </div>
          </div>

          <div className="campo">
            <label htmlFor="cartao-titular">Nome impresso no cartão</label>
            <input
              id="cartao-titular" required
              value={form.nomeTitular}
              onChange={(e) => setForm({ ...form, nomeTitular: e.target.value.toUpperCase() })}
            />
          </div>

          <p className="passo-ajuda">
            Guardamos apenas os quatro últimos dígitos — o número completo e o
            código de segurança nunca são armazenados.
          </p>

          <div className="acoes-form">
            <button className="btn btn-primario btn-sm" disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar cartão"}
            </button>
            <button type="button" className="btn btn-secundario btn-sm" onClick={fechar}>Cancelar</button>
          </div>
        </form>
      )}
    </section>
  );
}
