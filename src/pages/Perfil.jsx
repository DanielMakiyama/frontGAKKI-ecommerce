import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, ShieldOff, User, UserRound } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatarCpf, somenteDigitos } from "../utils/formatos";
import { GENEROS, TIPOS_TELEFONE } from "../utils/constantes";
import EnderecosCliente from "../components/EnderecosCliente";
import CartoesCliente from "../components/CartoesCliente";

/**
 * Perfil do cliente — RF0022 (alterar cadastro), RF0028 (alterar senha)
 * e a inativação da própria conta (RF0023).
 *
 * Três formulários independentes, e não um só com um botão no fim. É o
 * que a RF0028 e a RNF0034 pedem: a senha se altera sem mexer no
 * cadastro, e o endereço sem mexer em nenhum dos dois. Um formulário
 * único obrigaria a reenviar tudo para trocar um telefone.
 */
const FORM_VAZIO = {
  nome: "",
  email: "",
  cpf: "",
  genero: "NAO_INFORMADO",
  dataNascimento: "",
  telefoneTipo: "CELULAR",
  telefoneDdd: "",
  telefoneNumero: "",
};

const SENHA_VAZIA = { senhaAtual: "", novaSenha: "", confirmacaoNovaSenha: "" };

export default function Perfil() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(FORM_VAZIO);

  // Código do cadastro (RNF0035): gerado pelo sistema, nunca editado.
  const [codigo, setCodigo] = useState("");

  const [senhaForm, setSenhaForm] = useState(SENHA_VAZIA);

  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [erroSenha, setErroSenha] = useState("");
  const [mensagemSenha, setMensagemSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const [confirmandoInativacao, setConfirmandoInativacao] = useState(false);

  async function carregar() {
    try {
      const cliente = await api.meuPerfil();
      setForm({
        nome: cliente.nome || "",
        email: cliente.email || "",
        // O /clientes/me devolve o CPF por inteiro (só o do próprio
        // dono); a máscara é aplicada aqui, como no cadastro.
        cpf: formatarCpf(cliente.cpf || ""),
        genero: cliente.genero || "NAO_INFORMADO",
        // O backend devolve ISO (2000-05-14), que é exatamente o que o
        // <input type="date"> espera. Nenhuma conversão no meio.
        dataNascimento: cliente.dataNascimento || "",
        telefoneTipo: cliente.telefone?.tipo || "CELULAR",
        telefoneDdd: cliente.telefone?.ddd || "",
        telefoneNumero: cliente.telefone?.numero || "",
      });
      setCodigo(cliente.codigo || "");
    } catch (e) {
      setErro(e.message);
    }
  }

  useEffect(() => { carregar(); }, []);

  function setCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  /** RF0022 — altera os dados cadastrais. */
  async function salvarCadastro(e) {
    e.preventDefault();
    setErro(""); setMensagem(""); setSalvando(true);

    try {
      const resposta = await api.alterarCadastro({
        nome: form.nome,
        email: form.email,
        // Máscaras são da tela; o banco guarda só dígitos.
        cpf: somenteDigitos(form.cpf),
        genero: form.genero,
        dataNascimento: form.dataNascimento,
        // RN0026 — telefone é composto, não uma string com máscara.
        telefone: {
          tipo: form.telefoneTipo,
          ddd: somenteDigitos(form.telefoneDdd),
          numero: somenteDigitos(form.telefoneNumero),
        },
      });

      // O e-mail é o subject do JWT: quando ele muda, o backend devolve
      // uma sessão nova e o token guardado aqui precisa ser trocado
      // ANTES da próxima requisição — senão o carregar() abaixo levaria
      // 401 logo depois de um salvamento que deu certo.
      if (resposta.token) {
        login(resposta.cliente.nome, resposta.cliente.perfil, resposta.token);
      }

      setMensagem("Dados atualizados.");
      await carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  /**
   * RF0028 — altera a senha isoladamente.
   *
   * Sem conferência de confirmação aqui de propósito. É o servidor que
   * precisa recusar (RNF0032): uma checagem na tela esconderia uma falha
   * do backend, e o teste automatizado passaria provando o JavaScript em
   * vez da regra.
   */
  async function salvarSenha(e) {
    e.preventDefault();
    setErroSenha(""); setMensagemSenha(""); setSalvandoSenha(true);

    try {
      await api.alterarSenha(senhaForm);
      setMensagemSenha("Senha alterada.");
      setSenhaForm(SENHA_VAZIA);
    } catch (e) {
      setErroSenha(e.message);
    } finally {
      setSalvandoSenha(false);
    }
  }

  /** RF0023 pelo lado do cliente — inativação, nunca exclusão. */
  async function inativarConta() {
    setErro("");
    try {
      await api.inativarPropriaConta();
      logout();
      navigate("/");
    } catch (e) {
      setErro(e.message);
      setConfirmandoInativacao(false);
    }
  }

  return (
    <div className="container container-estreito">
      <div className="pagina-titulo">
        <h1 className="titulo-com-icone"><User size={26} strokeWidth={1.6} /> Meu perfil</h1>
        {codigo && <p>Código do cadastro: <strong data-testid="codigo-cliente">{codigo}</strong></p>}
      </div>

      <form
        className="card card-pad"
        onSubmit={salvarCadastro}
        style={{ marginBottom: "1.5rem" }}
        data-testid="form-dados"
      >
        <h3 className="titulo-com-icone"><UserRound size={19} strokeWidth={1.9} /> Dados cadastrais</h3>

        {erro && <div className="erro-form" role="alert" data-testid="erro-dados">{erro}</div>}
        {mensagem && <p className="aviso-sucesso" role="status" data-testid="sucesso-dados">{mensagem}</p>}

        <div className="campo">
          <label htmlFor="perf-nome">Nome completo</label>
          <input
            id="perf-nome" required maxLength={150}
            value={form.nome}
            onChange={(ev) => setCampo("nome", ev.target.value)}
          />
        </div>

        <div className="linha-campos">
          <div className="campo" style={{ flex: 1 }}>
            <label htmlFor="perf-genero">Gênero</label>
            <select
              id="perf-genero" required
              value={form.genero}
              onChange={(ev) => setCampo("genero", ev.target.value)}
            >
              {GENEROS.map((g) => <option key={g.valor} value={g.valor}>{g.rotulo}</option>)}
            </select>
          </div>
          <div className="campo" style={{ flex: 1 }}>
            <label htmlFor="perf-nascimento">Data de nascimento</label>
            <input
              id="perf-nascimento" type="date" required
              value={form.dataNascimento}
              onChange={(ev) => setCampo("dataNascimento", ev.target.value)}
            />
          </div>
        </div>

        <div className="linha-campos">
          <div className="campo" style={{ flex: 1 }}>
            <label htmlFor="perf-tel-tipo">Tipo de telefone</label>
            <select
              id="perf-tel-tipo" required
              value={form.telefoneTipo}
              onChange={(ev) => setCampo("telefoneTipo", ev.target.value)}
            >
              {TIPOS_TELEFONE.map((t) => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}
            </select>
          </div>
          <div className="campo" style={{ flex: 1 }}>
            <label htmlFor="perf-tel-ddd">DDD</label>
            <input
              id="perf-tel-ddd" required inputMode="numeric" maxLength={2} placeholder="11"
              value={form.telefoneDdd}
              onChange={(ev) => setCampo("telefoneDdd", somenteDigitos(ev.target.value))}
            />
          </div>
          <div className="campo" style={{ flex: 2 }}>
            <label htmlFor="perf-tel-numero">Número</label>
            <input
              id="perf-tel-numero" required inputMode="numeric" maxLength={9} placeholder="988887777"
              value={form.telefoneNumero}
              onChange={(ev) => setCampo("telefoneNumero", somenteDigitos(ev.target.value))}
            />
          </div>
        </div>

        <div className="linha-campos">
          <div className="campo" style={{ flex: 2 }}>
            <label htmlFor="perf-email">E-mail</label>
            <input
              id="perf-email" required type="email" maxLength={150}
              value={form.email}
              onChange={(ev) => setCampo("email", ev.target.value)}
            />
          </div>
          <div className="campo" style={{ flex: 1 }}>
            <label htmlFor="perf-cpf">CPF</label>
            <input
              id="perf-cpf" required inputMode="numeric" placeholder="000.000.000-00"
              value={form.cpf}
              onChange={(ev) => setCampo("cpf", formatarCpf(ev.target.value))}
            />
          </div>
        </div>
        <p className="passo-ajuda">
          E-mail e CPF são únicos: se já houver outro cadastro com o valor informado,
          a alteração é recusada. Trocar o e-mail renova sua sessão automaticamente,
          porque ele também é a credencial de acesso.
        </p>

        <button className="btn btn-primario" disabled={salvando} data-testid="btn-salvar-dados">
          {salvando ? "Salvando…" : "Salvar alterações"}
        </button>
      </form>

      <EnderecosCliente />

      <CartoesCliente />

      <form
        className="card card-pad"
        onSubmit={salvarSenha}
        style={{ marginBottom: "1.5rem" }}
        data-testid="form-senha"
      >
        <h3 className="titulo-com-icone"><KeyRound size={19} strokeWidth={1.9} /> Alterar senha</h3>

        {erroSenha && <div className="erro-form" role="alert" data-testid="erro-senha">{erroSenha}</div>}
        {mensagemSenha && (
          <p className="aviso-sucesso" role="status" data-testid="sucesso-senha">{mensagemSenha}</p>
        )}

        <div className="campo">
          <label htmlFor="perf-senha-atual">Senha atual</label>
          <input
            id="perf-senha-atual" required type="password"
            value={senhaForm.senhaAtual}
            onChange={(ev) => setSenhaForm({ ...senhaForm, senhaAtual: ev.target.value })}
          />
        </div>
        <div className="campo">
          <label htmlFor="perf-senha-nova">Nova senha</label>
          <input
            id="perf-senha-nova" required type="password"
            value={senhaForm.novaSenha}
            onChange={(ev) => setSenhaForm({ ...senhaForm, novaSenha: ev.target.value })}
          />
        </div>
        <div className="campo">
          <label htmlFor="perf-senha-confirmacao">Confirmar nova senha</label>
          <input
            id="perf-senha-confirmacao" required type="password"
            value={senhaForm.confirmacaoNovaSenha}
            onChange={(ev) => setSenhaForm({ ...senhaForm, confirmacaoNovaSenha: ev.target.value })}
          />
        </div>

        <button className="btn btn-primario" disabled={salvandoSenha} data-testid="btn-salvar-senha">
          {salvandoSenha ? "Alterando…" : "Alterar senha"}
        </button>
      </form>

      <div className="card card-pad">
        <h3 className="titulo-com-icone" style={{ color: "var(--cor-perigo)" }}>
          <ShieldOff size={19} strokeWidth={1.9} /> Encerrar conta
        </h3>
        <p style={{ fontSize: "0.88rem", color: "var(--cor-texto-suave)" }}>
          Sua conta será <strong>inativada</strong>, e não excluída: seus pedidos e seu histórico
          continuam registrados. Fale com o suporte para reativar.
        </p>
        {!confirmandoInativacao ? (
          <button
            type="button"
            className="btn btn-perigo btn-sm"
            onClick={() => setConfirmandoInativacao(true)}
            data-testid="btn-inativar-conta"
          >
            Inativar minha conta
          </button>
        ) : (
          <div style={{ display: "flex", gap: ".5rem" }}>
            <button
              type="button"
              className="btn btn-perigo btn-sm"
              onClick={inativarConta}
              data-testid="btn-confirmar-inativacao"
            >
              Confirmar inativação
            </button>
            <button
              type="button"
              className="btn btn-secundario btn-sm"
              onClick={() => setConfirmandoInativacao(false)}
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
