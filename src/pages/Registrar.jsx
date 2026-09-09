import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, UserRound } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatarCep, formatarTelefone } from "../utils/formatos";

const DADOS_VAZIOS = { nome: "", email: "", telefone: "", senha: "", confirmacaoSenha: "" };
const ENDERECO_VAZIO = {
  apelido: "Casa", logradouro: "", numero: "", complemento: "",
  cidade: "", estado: "", cep: "",
};

/**
 * Registrar — cadastro de cliente com endereço de entrega.
 *
 * O endereço vai no MESMO payload do cadastro, e não numa segunda
 * chamada depois. A RN0022 exige que todo cliente tenha ao menos um
 * endereço de entrega: se fossem duas requisições, uma falha na segunda
 * deixaria no banco exatamente o que a regra proíbe — um cliente sem
 * endereço. Juntos, os dois nascem na mesma transação.
 */
export default function Registrar() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [dados, setDados] = useState(DADOS_VAZIOS);
  const [endereco, setEndereco] = useState(ENDERECO_VAZIO);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const setDado = (campo, transformar) => (e) =>
    setDados((f) => ({ ...f, [campo]: transformar ? transformar(e.target.value) : e.target.value }));

  const setEnd = (campo, transformar) => (e) =>
    setEndereco((f) => ({ ...f, [campo]: transformar ? transformar(e.target.value) : e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    // Checagem no cliente antes de sair da tela: erro de digitação não
    // precisa de ida e volta ao servidor para virar mensagem.
    if (dados.senha !== dados.confirmacaoSenha) {
      setErro("A confirmação de senha não confere.");
      return;
    }

    setEnviando(true);
    try {
      await api.registrar({ ...dados, endereco });
      // Entra direto com a conta recém-criada: a tela de login só
      // oferece os perfis de demonstração.
      const sessao = await api.login(dados.email, dados.senha);
      login(sessao.nome, sessao.perfil, sessao.token);
      navigate("/catalogo");
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="container container-estreito">
      <div className="pagina-titulo">
        <h1>Criar conta</h1>
        <p>Cadastre-se para comprar na GAKKI STORE.</p>
      </div>

      <form className="card card-pad" onSubmit={handleSubmit}>
        {erro && <div className="erro-form">{erro}</div>}

        <fieldset className="grupo-campos">
          <legend><UserRound size={17} strokeWidth={1.9} /> Seus dados</legend>

          <div className="campo">
            <label htmlFor="cad-nome">Nome completo</label>
            <input id="cad-nome" required value={dados.nome} onChange={setDado("nome")} />
          </div>

          <div className="linha-campos">
            <div className="campo" style={{ flex: 2 }}>
              <label htmlFor="cad-email">E-mail</label>
              <input id="cad-email" type="email" required value={dados.email} onChange={setDado("email")} />
            </div>
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="cad-telefone">Telefone</label>
              <input
                id="cad-telefone" inputMode="tel" placeholder="(11) 90000-0000"
                value={dados.telefone} onChange={setDado("telefone", formatarTelefone)}
              />
            </div>
          </div>

          <div className="linha-campos">
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="cad-senha">Senha</label>
              <input id="cad-senha" type="password" required minLength={8} value={dados.senha} onChange={setDado("senha")} />
            </div>
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="cad-senha2">Confirmar senha</label>
              <input id="cad-senha2" type="password" required value={dados.confirmacaoSenha} onChange={setDado("confirmacaoSenha")} />
            </div>
          </div>
          <p className="passo-ajuda">
            Mínimo de 8 caracteres, com maiúscula, minúscula, número e símbolo.
          </p>
        </fieldset>

        <fieldset className="grupo-campos">
          <legend><MapPin size={17} strokeWidth={1.9} /> Endereço de entrega</legend>

          <div className="campo">
            <label htmlFor="cad-apelido">Apelido do endereço</label>
            <input
              id="cad-apelido" required maxLength={40} placeholder="ex.: Casa, Trabalho"
              value={endereco.apelido} onChange={setEnd("apelido")}
            />
          </div>

          <div className="campo">
            <label htmlFor="cad-logradouro">Logradouro</label>
            <input id="cad-logradouro" required value={endereco.logradouro} onChange={setEnd("logradouro")} />
          </div>

          <div className="linha-campos">
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="cad-numero">Número</label>
              <input id="cad-numero" required value={endereco.numero} onChange={setEnd("numero")} />
            </div>
            <div className="campo" style={{ flex: 2 }}>
              <label htmlFor="cad-complemento">Complemento</label>
              <input id="cad-complemento" placeholder="opcional" value={endereco.complemento} onChange={setEnd("complemento")} />
            </div>
          </div>

          <div className="linha-campos">
            <div className="campo" style={{ flex: 2 }}>
              <label htmlFor="cad-cidade">Cidade</label>
              <input id="cad-cidade" required value={endereco.cidade} onChange={setEnd("cidade")} />
            </div>
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="cad-uf">UF</label>
              <input
                id="cad-uf" required maxLength={2} pattern="[A-Z]{2}" title="Duas letras, ex.: SP"
                value={endereco.estado} onChange={setEnd("estado", (v) => v.toUpperCase())}
              />
            </div>
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="cad-cep">CEP</label>
              <input
                id="cad-cep" required inputMode="numeric" placeholder="00000-000"
                pattern="[0-9]{5}-[0-9]{3}" title="Formato 00000-000"
                value={endereco.cep} onChange={setEnd("cep", formatarCep)}
              />
            </div>
          </div>

          <p className="passo-ajuda">
            Este será seu endereço principal. Você pode cadastrar outros depois, no seu perfil.
          </p>
        </fieldset>

        <button type="submit" className="btn btn-primario btn-block" disabled={enviando}>
          {enviando ? "Criando…" : "Criar conta"}
        </button>

        <p className="rodape-login">
          Só quer dar uma olhada? <Link to="/login">Usar um perfil de demonstração</Link>
        </p>
      </form>
    </div>
  );
}
