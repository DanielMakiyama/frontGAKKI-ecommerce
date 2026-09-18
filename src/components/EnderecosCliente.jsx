import { useEffect, useState } from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { api } from "../api/client";
import { formatarCep, somenteDigitos } from "../utils/formatos";
import { TIPOS_LOGRADOURO, TIPOS_RESIDENCIA } from "../utils/constantes";

const FORM_VAZIO = {
  apelido: "",
  tipoResidencia: "CASA",
  tipoLogradouro: "RUA",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
  pais: "Brasil",
  observacoes: "",
  entrega: true,
  cobranca: false,
};

/**
 * EnderecosCliente — lista, cadastra, altera, remove e define o endereço
 * principal (RF0026), com a composição exigida pela RN0023.
 *
 * As marcações de entrega e cobrança são editáveis porque a RN0021 e a
 * RN0022 exigem ao menos um endereço de cada tipo — e é o backend que
 * recusa, com 409, a operação que deixaria o cadastro sem um deles. A
 * tela só mostra a mensagem que vem de lá.
 *
 * Espelha o CartoesCliente de propósito: mesma estrutura de estado,
 * mesmas classes de CSS, mesmo desenho de API.
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
      tipoResidencia: endereco.tipoResidencia || "CASA",
      tipoLogradouro: endereco.tipoLogradouro || "RUA",
      logradouro: endereco.logradouro || "",
      numero: endereco.numero || "",
      complemento: endereco.complemento || "",
      bairro: endereco.bairro || "",
      cidade: endereco.cidade || "",
      estado: endereco.estado || "",
      // O backend devolve o CEP só com dígitos; a tela reaplica a máscara.
      cep: formatarCep(endereco.cep || ""),
      pais: endereco.pais || "Brasil",
      observacoes: endereco.observacoes || "",
      entrega: endereco.entrega,
      cobranca: endereco.cobranca,
    });
    setEditando(endereco.id);
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

    const payload = {
      ...form,
      cep: somenteDigitos(form.cep),
      complemento: form.complemento || null,
      observacoes: form.observacoes || null,
    };

    try {
      if (editando === "novo") {
        await api.adicionarEndereco(payload);
        setMensagem("Endereço cadastrado.");
      } else {
        await api.atualizarEndereco(editando, payload);
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
      // RN0021/RN0022 — o 409 do backend chega aqui como mensagem.
      setErro(e.message);
    }
  }

  return (
    <section className="card card-pad" style={{ marginBottom: "1.5rem" }} data-testid="secao-enderecos">
      <h3 className="titulo-com-icone"><MapPin size={19} strokeWidth={1.9} /> Endereços</h3>

      {erro && <div className="erro-form" role="alert" data-testid="erro-endereco">{erro}</div>}
      {mensagem && <p className="aviso-sucesso" role="status">{mensagem}</p>}

      {carregando ? (
        <p>Carregando…</p>
      ) : enderecos.length === 0 ? (
        <p className="passo-ajuda">Nenhum endereço cadastrado ainda.</p>
      ) : (
        <ul className="lista-salvos">
          {enderecos.map((e) => (
            // data-apelido e data-principal existem para o teste
            // automatizado: o apelido é o que o usuário reconhece na tela,
            // e o id só é conhecido depois de salvar. data-principal
            // evita depender do selo visual, que o CSS escreve em
            // maiúsculas.
            <li
              key={e.id}
              className={`item-salvo${e.principal ? " destacado" : ""}`}
              data-endereco={e.id}
              data-apelido={e.apelido}
              data-principal={e.principal}
            >
              <div className="item-salvo-dados">
                <strong>
                  {e.apelido}
                  {e.principal && <span className="marcador-padrao">principal</span>}
                </strong>
                <span>
                  {e.logradouro}, {e.numero}{e.complemento ? ` — ${e.complemento}` : ""}
                </span>
                <span>
                  {e.bairro} · {e.cidade}/{e.estado} · CEP {formatarCep(e.cep)} · {e.pais}
                </span>
                <span className="passo-ajuda">
                  {[e.entrega && "entrega", e.cobranca && "cobrança"].filter(Boolean).join(" e ")}
                </span>
              </div>

              <div className="item-salvo-acoes">
                {!e.principal && (
                  <button
                    className="btn btn-secundario btn-sm"
                    onClick={() => tornarPrincipal(e.id)}
                    title="Usar como endereço principal"
                    data-acao="principal"
                  >
                    <Star size={14} strokeWidth={2} /> Principal
                  </button>
                )}
                <button
                  className="btn btn-secundario btn-sm"
                  onClick={() => abrirEdicao(e)}
                  data-acao="alterar"
                >
                  <Pencil size={14} strokeWidth={2} /> Alterar
                </button>
                <button
                  className="btn-icone-perigo"
                  onClick={() => remover(e)}
                  aria-label={`Remover endereço ${e.apelido}`}
                  data-acao="remover"
                >
                  <Trash2 size={16} strokeWidth={1.8} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editando === null ? (
        <button className="btn btn-secundario btn-sm" onClick={abrirNovo} data-testid="btn-novo-endereco">
          <Plus size={15} strokeWidth={2.2} /> Novo endereço
        </button>
      ) : (
        <form onSubmit={salvar} className="form-embutido">
          <h4>{editando === "novo" ? "Novo endereço" : "Alterar endereço"}</h4>

          <div className="linha-campos">
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="end-apelido">Apelido</label>
              <input
                id="end-apelido" required maxLength={40} placeholder="ex.: Casa, Trabalho"
                value={form.apelido}
                onChange={(ev) => setCampo("apelido", ev.target.value)}
              />
            </div>
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="end-tipo-residencia">Tipo de residência</label>
              <select
                id="end-tipo-residencia" required
                value={form.tipoResidencia}
                onChange={(ev) => setCampo("tipoResidencia", ev.target.value)}
              >
                {TIPOS_RESIDENCIA.map((t) => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}
              </select>
            </div>
          </div>

          <div className="linha-campos">
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="end-tipo-logradouro">Tipo de logradouro</label>
              <select
                id="end-tipo-logradouro" required
                value={form.tipoLogradouro}
                onChange={(ev) => setCampo("tipoLogradouro", ev.target.value)}
              >
                {TIPOS_LOGRADOURO.map((t) => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}
              </select>
            </div>
            <div className="campo" style={{ flex: 2 }}>
              <label htmlFor="end-logradouro">Logradouro</label>
              <input
                id="end-logradouro" required maxLength={150}
                value={form.logradouro}
                onChange={(ev) => setCampo("logradouro", ev.target.value)}
              />
            </div>
          </div>

          <div className="linha-campos">
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="end-numero">Número</label>
              <input
                id="end-numero" required maxLength={10}
                value={form.numero}
                onChange={(ev) => setCampo("numero", ev.target.value)}
              />
            </div>
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="end-complemento">Complemento</label>
              <input
                id="end-complemento" maxLength={60} placeholder="opcional"
                value={form.complemento}
                onChange={(ev) => setCampo("complemento", ev.target.value)}
              />
            </div>
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="end-bairro">Bairro</label>
              <input
                id="end-bairro" required maxLength={80}
                value={form.bairro}
                onChange={(ev) => setCampo("bairro", ev.target.value)}
              />
            </div>
          </div>

          <div className="linha-campos">
            <div className="campo" style={{ flex: 2 }}>
              <label htmlFor="end-cidade">Cidade</label>
              <input
                id="end-cidade" required maxLength={80}
                value={form.cidade}
                onChange={(ev) => setCampo("cidade", ev.target.value)}
              />
            </div>
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="end-uf">UF</label>
              <input
                id="end-uf" required maxLength={2} pattern="[A-Za-z]{2}" title="Duas letras, ex.: SP"
                value={form.estado}
                onChange={(ev) => setCampo("estado", ev.target.value.toUpperCase())}
              />
            </div>
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="end-cep">CEP</label>
              <input
                id="end-cep" required inputMode="numeric" placeholder="00000-000"
                pattern="[0-9]{5}-[0-9]{3}" title="Formato 00000-000"
                value={form.cep}
                onChange={(ev) => setCampo("cep", formatarCep(ev.target.value))}
              />
            </div>
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="end-pais">País</label>
              <input
                id="end-pais" required maxLength={60}
                value={form.pais}
                onChange={(ev) => setCampo("pais", ev.target.value)}
              />
            </div>
          </div>

          <div className="campo">
            <label htmlFor="end-observacoes">Observações</label>
            <input
              id="end-observacoes" maxLength={255} placeholder="opcional"
              value={form.observacoes}
              onChange={(ev) => setCampo("observacoes", ev.target.value)}
            />
          </div>

          <div className="linha-campos">
            <label className="filtro-checkbox">
              <input
                id="end-entrega" type="checkbox"
                checked={form.entrega}
                onChange={(ev) => setCampo("entrega", ev.target.checked)}
              />
              <span>Usar para entrega</span>
            </label>
            <label className="filtro-checkbox">
              <input
                id="end-cobranca" type="checkbox"
                checked={form.cobranca}
                onChange={(ev) => setCampo("cobranca", ev.target.checked)}
              />
              <span>Usar para cobrança</span>
            </label>
          </div>

          <div className="acoes-form">
            <button className="btn btn-primario btn-sm" disabled={salvando} data-testid="btn-salvar-endereco">
              {salvando ? "Salvando…" : "Salvar endereço"}
            </button>
            <button type="button" className="btn btn-secundario btn-sm" onClick={fechar}>Cancelar</button>
          </div>
        </form>
      )}
    </section>
  );
}
