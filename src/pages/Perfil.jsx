import { User } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Perfil() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ nome: "", email: "", telefone: "" });
  const [senhaForm, setSenhaForm] = useState({ senhaAtual: "", novaSenha: "", confirmacaoNovaSenha: "" });
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erroSenha, setErroSenha] = useState("");
  const [mensagemSenha, setMensagemSenha] = useState("");
  const [confirmandoInativacao, setConfirmandoInativacao] = useState(false);

  useEffect(() => {
    api.meuPerfil().then((c) => setForm({ nome: c.nome, email: c.email, telefone: c.telefone || "" }));
  }, []);

  async function salvarCadastro(e) {
    e.preventDefault();
    setErro(""); setMensagem("");
    try {
      await api.alterarCadastro(form);
      setMensagem("Dados atualizados com sucesso!");
    } catch (e) {
      setErro(e.message);
    }
  }

  async function salvarSenha(e) {
    e.preventDefault();
    setErroSenha(""); setMensagemSenha("");
    try {
      await api.alterarSenha(senhaForm);
      setMensagemSenha("Senha alterada com sucesso!");
      setSenhaForm({ senhaAtual: "", novaSenha: "", confirmacaoNovaSenha: "" });
    } catch (e) {
      setErroSenha(e.message);
    }
  }

  async function inativarConta() {
    try {
      await api.inativarPropriaConta();
      logout();
      navigate("/");
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <div className="pagina-titulo"><h1 className="titulo-com-icone"><User size={26} strokeWidth={1.6} /> Meu perfil</h1></div>

      <form className="card card-pad" onSubmit={salvarCadastro} style={{ marginBottom: "1.5rem" }}>
        <h3>Dados cadastrais</h3>
        {erro && <div className="erro-form">{erro}</div>}
        {mensagem && <p style={{ color: "var(--cor-sucesso)" }}>{mensagem}</p>}
        <div className="campo"><label>Nome</label><input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
        <div className="campo"><label>E-mail</label><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="campo"><label>Telefone</label><input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
        <button className="btn btn-primario">Salvar alterações</button>
      </form>

      <form className="card card-pad" onSubmit={salvarSenha} style={{ marginBottom: "1.5rem" }}>
        <h3>Alterar senha</h3>
        {erroSenha && <div className="erro-form">{erroSenha}</div>}
        {mensagemSenha && <p style={{ color: "var(--cor-sucesso)" }}>{mensagemSenha}</p>}
        <div className="campo"><label>Senha atual</label><input required type="password" value={senhaForm.senhaAtual} onChange={(e) => setSenhaForm({ ...senhaForm, senhaAtual: e.target.value })} /></div>
        <div className="campo"><label>Nova senha</label><input required type="password" value={senhaForm.novaSenha} onChange={(e) => setSenhaForm({ ...senhaForm, novaSenha: e.target.value })} /></div>
        <div className="campo"><label>Confirmar nova senha</label><input required type="password" value={senhaForm.confirmacaoNovaSenha} onChange={(e) => setSenhaForm({ ...senhaForm, confirmacaoNovaSenha: e.target.value })} /></div>
        <button className="btn btn-primario">Alterar senha</button>
      </form>

      <div className="card card-pad">
        <h3 style={{ color: "var(--cor-perigo)" }}>Encerrar conta</h3>
        <p style={{ fontSize: "0.88rem", color: "var(--cor-texto-suave)" }}>
          Sua conta será inativada. Fale com o suporte para reativação.
        </p>
        {!confirmandoInativacao ? (
          <button className="btn btn-perigo btn-sm" onClick={() => setConfirmandoInativacao(true)}>Inativar minha conta</button>
        ) : (
          <div style={{ display: "flex", gap: ".5rem" }}>
            <button className="btn btn-perigo btn-sm" onClick={inativarConta}>Confirmar inativação</button>
            <button className="btn btn-secundario btn-sm" onClick={() => setConfirmandoInativacao(false)}>Cancelar</button>
          </div>
        )}
      </div>
    </div>
  );
}
