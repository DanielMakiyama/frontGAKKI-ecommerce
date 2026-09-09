import { useEffect, useState } from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { api } from "../api/client";
import { formatarCep } from "../utils/formatos";

const FORM_VAZIO = {
  apelido: "", logradouro: "", numero: "", complemento: "",
  cidade: "", estado: "", cep: "",
};

/**
 * EnderecosCliente — lista, cadastra, altera, remove e define o endereço
 * principal (RF0026).
 *
 * Espelha o CartoesCliente de propósito: mesma estrutura de estado,
 * mesmas classes de CSS, mesmo desenho de API. Duas telas que fazem a
 * mesma coisa devem parecer a mesma coisa — para o cliente e para quem
 * vai manter o código.
 */
export default function EnderecosCliente() {
  const [enderecos, setEnderecos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Id em edição, ou "novo" para o formulário de cadastro. Um state só
  // impede os dois formulários abertos ao mesmo tempo.
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);

  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function recarregar() {
    try {
      setEnderecos(await api.meusEnderecos());
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

  function abrirEdicao(endereco) {
    setForm({
      apelido: endereco.apelido || "",
      logradouro: endereco.logradouro || "",
      numero: endereco.numero || "",
      complemento: endereco.complemento || "",
      cidade: endereco.cidade || "",
      estado: endereco.estado || "",
      cep: endereco.cep || "",
    });
    setEditando(endereco.id);
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
        await api.adicionarEndereco(form);
        setMensagem("Endereço cadastrado.");
      } else {
        await api.atualizarEndereco(editando, form);
        setMensagem("Endereço atualizado.");
      }
      await recarregar();
      fechar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function tornarPrincipal(id) {
    setErro(""); setMensagem("");
    try {
      await api.definirEnderecoPrincipal(id);
      await recarregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function remover(endereco) {
    setErro(""); setMensagem("");
    try {
      await api.removerEndereco(endereco.id);
      await recarregar();
      setMensagem(`Endereço "${endereco.apelido}" removido.`);
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <section className="card card-pad" style={{ marginBottom: "1.5rem" }}>
      <h3 className="titulo-com-icone"><MapPin size={19} strokeWidth={1.9} /> Endereços de entrega</h3>

      {erro && <div className="erro-form">{erro}</div>}
      {mensagem && <p className="aviso-sucesso" role="status">{mensagem}</p>}

      {carregando ? (
        <p>Carregando…</p>
      ) : enderecos.length === 0 ? (
        <p className="passo-ajuda">Nenhum endereço cadastrado ainda.</p>
      ) : (
        <ul className="lista-salvos">
          {enderecos.map((e) => (
            <li key={e.id} className={`item-salvo${e.principal ? " destacado" : ""}`}>
              <div className="item-salvo-dados">
                <strong>
                  {e.apelido}
                  {e.principal && <span className="marcador-padrao">principal</span>}
                </strong>
                <span>{e.logradouro}, {e.numero}{e.complemento ? ` — ${e.complemento}` : ""}</span>
                <span>{e.cidade}/{e.estado} · CEP {e.cep}</span>
              </div>

              <div className="item-salvo-acoes">
                {!e.principal && (
                  <button
                    className="btn btn-secundario btn-sm"
                    onClick={() => tornarPrincipal(e.id)}
                    title="Usar como endereço principal"
                  >
                    <Star size={14} strokeWidth={2} /> Principal
                  </button>
                )}
                <button className="btn btn-secundario btn-sm" onClick={() => abrirEdicao(e)}>
                  <Pencil size={14} strokeWidth={2} /> Alterar
                </button>
                <button
                  className="btn-icone-perigo"
                  onClick={() => remover(e)}
                  aria-label={`Remover endereço ${e.apelido}`}
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
          <Plus size={15} strokeWidth={2.2} /> Novo endereço
        </button>
      ) : (
        <form onSubmit={salvar} className="form-embutido">
          <h4>{editando === "novo" ? "Novo endereço" : "Alterar endereço"}</h4>

          <div className="campo">
            <label htmlFor="end-apelido">Apelido</label>
            <input
              id="end-apelido" required maxLength={40} placeholder="ex.: Casa, Trabalho"
              value={form.apelido}
              onChange={(ev) => setForm({ ...form, apelido: ev.target.value })}
            />
          </div>

          <div className="campo">
            <label htmlFor="end-logradouro">Logradouro</label>
            <input
              id="end-logradouro" required
              value={form.logradouro}
              onChange={(ev) => setForm({ ...form, logradouro: ev.target.value })}
            />
          </div>

          <div className="linha-campos">
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="end-numero">Número</label>
              <input
                id="end-numero" required
                value={form.numero}
                onChange={(ev) => setForm({ ...form, numero: ev.target.value })}
              />
            </div>
            <div className="campo" style={{ flex: 2 }}>
              <label htmlFor="end-complemento">Complemento</label>
              <input
                id="end-complemento" placeholder="opcional"
                value={form.complemento}
                onChange={(ev) => setForm({ ...form, complemento: ev.target.value })}
              />
            </div>
          </div>

          <div className="linha-campos">
            <div className="campo" style={{ flex: 2 }}>
              <label htmlFor="end-cidade">Cidade</label>
              <input
                id="end-cidade" required
                value={form.cidade}
                onChange={(ev) => setForm({ ...form, cidade: ev.target.value })}
              />
            </div>
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="end-uf">UF</label>
              <input
                id="end-uf" required maxLength={2} pattern="[A-Z]{2}" title="Duas letras, ex.: SP"
                value={form.estado}
                onChange={(ev) => setForm({ ...form, estado: ev.target.value.toUpperCase() })}
              />
            </div>
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="end-cep">CEP</label>
              <input
                id="end-cep" required inputMode="numeric" placeholder="00000-000"
                pattern="[0-9]{5}-[0-9]{3}" title="Formato 00000-000"
                value={form.cep}
                // A máscara é aplicada na digitação: o valor no state já
                // sai no formato que o backend espera.
                onChange={(ev) => setForm({ ...form, cep: formatarCep(ev.target.value) })}
              />
            </div>
          </div>

          <div className="acoes-form">
            <button className="btn btn-primario btn-sm" disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar endereço"}
            </button>
            <button type="button" className="btn btn-secundario btn-sm" onClick={fechar}>Cancelar</button>
          </div>
        </form>
      )}
    </section>
  );
}
